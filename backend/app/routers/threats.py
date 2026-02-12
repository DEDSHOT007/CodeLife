from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth
from firebase_admin import firestore
from datetime import datetime
from typing import List, Dict
from app.auth import verify_firebase_token
from app.middleware.rate_limit import limiter
import json, hashlib

# Ensure Firebase Admin SDK is initialized
import app.firebase_admin  # initializes firebase_admin with credentials.Certificate(...)

router = APIRouter(prefix="/threats", tags=["threats"])

# Use the Firestore client exposed by firebase_admin
db = firestore.client()

# Mock OSINT data structure
THREAT_SOURCES = {
    "abuse.ch": "https://sslbl.abuse.ch/blacklist/",
    "otx": "https://otx.alienvault.com/api/v1/pulses/subscribed",
}


@router.get("/latest")
@limiter.limit("30/minute")
async def get_latest_threats(
    request: Request,
    user=Depends(verify_firebase_token)
):
    """
    Fetch latest threats from OSINT sources.
    Returns: List of threat objects with severity, source, indicators, timestamp
    """
    try:
        threats = []
        
        # Fetch from Firestore cache first (to avoid API rate limits)
        # Fetch more threats to allow for deduplication and older threats section
        threats_ref = db.collection('threatIntelligence').order_by(
            'timestamp', direction=firestore.Query.DESCENDING
        ).limit(100)
        
        docs = threats_ref.stream()
        for doc in docs:
            threat_data = doc.to_dict()
            # Add document ID to the threat data
            threat_data['id'] = doc.id
            # Convert Firestore Timestamp to ISO string for JSON serialization
            if 'timestamp' in threat_data and threat_data['timestamp']:
                timestamp = threat_data['timestamp']
                if hasattr(timestamp, 'isoformat'):
                    threat_data['timestamp'] = timestamp.isoformat()
                elif hasattr(timestamp, '_seconds'):
                    # Handle Firestore Timestamp object (if not converted by to_dict)
                    threat_data['timestamp'] = datetime.fromtimestamp(timestamp._seconds).isoformat()
            threats.append(threat_data)
        
        return {
            "success": True,
            "count": len(threats),
            "threats": threats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
@limiter.limit("5/minute")
async def refresh_threats(
    request: Request,
    user=Depends(verify_firebase_token)
):
    """
    Trigger a manual refresh of threats from live OSINT feeds.
    Fetches from public APIs, processes, stores in Firestore.
    """
    try:
        log_file = r'd:\PES\PROJECT\CodeLife\.cursor\debug.log'
        
        # #region agent log
        with open(log_file, 'a') as f:
            f.write(json.dumps({"location": "threats.py:refresh_threats:entry", "message": "Refresh threats called", "data": {}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        # #endregion
        
        new_threats = await fetch_osint_feeds()
        
        # #region agent log
        with open(log_file, 'a') as f:
            f.write(json.dumps({"location": "threats.py:refresh_threats:fetched", "message": "Fetched threats from feeds", "data": {"count": len(new_threats), "threats": [{"type": t.get("type"), "indicators": t.get("indicators")[:2] if t.get("indicators") else []} for t in new_threats]}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "B"}) + "\n")
        # #endregion
        
        # Check existing threats before adding
        existing_docs = db.collection('threatIntelligence').limit(100).stream()
        existing_indicators_set = set()
        for doc in existing_docs:
            data = doc.to_dict()
            indicators = data.get("indicators", [])
            # Create a unique key from sorted indicators
            key = tuple(sorted(indicators)) if indicators else ()
            existing_indicators_set.add(key)
        
        # #region agent log
        with open(log_file, 'a') as f:
            f.write(json.dumps({"location": "threats.py:refresh_threats:existing", "message": "Existing threats in DB", "data": {"existing_count": len(existing_indicators_set)}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "C"}) + "\n")
        # #endregion
        
        added_count = 0
        skipped_count = 0
        
        # Store in Firestore
        for threat in new_threats:
            indicators = threat.get("indicators", [])
            threat_key = tuple(sorted(indicators)) if indicators else ()
            
            # #region agent log
            with open(log_file, 'a') as f:
                f.write(json.dumps({"location": "threats.py:refresh_threats:checking", "message": "Checking if threat exists", "data": {"threat_type": threat.get("type"), "indicators": indicators[:2] if indicators else [], "threat_key_exists": threat_key in existing_indicators_set}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "D"}) + "\n")
            # #endregion
            
            if threat_key in existing_indicators_set:
                skipped_count += 1
                # #region agent log
                with open(log_file, 'a') as f:
                    f.write(json.dumps({"location": "threats.py:refresh_threats:skipped", "message": "Threat skipped (duplicate)", "data": {"threat_type": threat.get("type")}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "D"}) + "\n")
                # #endregion
                continue
            
            doc_id = make_indicator_hash(indicators, threat.get("source",""), threat.get("type",""))
            doc_ref = db.collection("threatIntelligence").document(doc_id)

            data = {
                "type": threat.get("type"),
                "indicators": threat.get("indicators"),
                "indicator_hash": doc_id,
                "severity": threat.get("severity"),
                "source": threat.get("source"),
                "description": threat.get("description"),
                "processed": False,
            }

            # Use merge to set fields without overwriting occurrences/first_seen
            doc_ref.set({
                **data,
                "first_seen": firestore.SERVER_TIMESTAMP,
                "last_seen": datetime.now()
            }, merge=True)

            # Increment occurrences and update last_seen atomically
            try:
                doc_ref.update({
                    "occurrences": firestore.Increment(1),
                    "last_seen": datetime.now()
                })
            except Exception:
                # If update fails because doc didn't exist, set occurrences = 1
                doc_ref.set({"occurrences": 1}, merge=True)
            
            existing_indicators_set.add(threat_key)  # Track what we just added
            added_count += 1
            
            # #region agent log
            with open(log_file, 'a') as f:
                f.write(json.dumps({"location": "threats.py:refresh_threats:added", "message": "Threat added to DB", "data": {"threat_type": threat.get("type")}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "D"}) + "\n")
            # #endregion
        
        # #region agent log
        with open(log_file, 'a') as f:
            f.write(json.dumps({"location": "threats.py:refresh_threats:exit", "message": "Refresh complete", "data": {"added": added_count, "skipped": skipped_count, "total_fetched": len(new_threats)}, "timestamp": datetime.now().isoformat(), "sessionId": "debug-session", "runId": "run1", "hypothesisId": "A"}) + "\n")
        # #endregion
        
        return {
            "success": True,
            "message": f"Fetched {len(new_threats)} threats, added {added_count} new, skipped {skipped_count} duplicates",
            "count": added_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
@limiter.limit("30/minute")
async def get_threat_stats(
    request: Request,
    user=Depends(verify_firebase_token)
):
    """
    Get aggregate threat statistics for dashboard.
    Returns: count by severity, count by source, trending indicators
    """
    try:
        threats_ref = db.collection('threatIntelligence')
        all_threats = list(threats_ref.stream())
        
        high_count = len([t for t in all_threats if t.to_dict().get("severity") == "High"])
        medium_count = len([t for t in all_threats if t.to_dict().get("severity") == "Medium"])
        low_count = len([t for t in all_threats if t.to_dict().get("severity") == "Low"])
        
        # Count by source
        source_counts: Dict[str, int] = {}
        for threat_doc in all_threats:
            threat = threat_doc.to_dict()
            source = threat.get("source", "unknown")
            source_counts[source] = source_counts.get(source, 0) + 1
        
        return {
            "total": len(all_threats),
            "by_severity": {
                "High": high_count,
                "Medium": medium_count,
                "Low": low_count
            },
            "by_source": source_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_osint_feeds():
    """
    Fetch threat data from public OSINT APIs.
    For MVP, we use mock data or simple public feeds.
    """
    threats = []
    
    # Mock threat data for MVP (replace with real API calls later)
    mock_threats = [
        {
            "type": "Malware",
            "indicators": ["hash_abc123", "192.168.1.100"],
            "severity": "High",
            "source": "abuse.ch",
            "description": "Trojan.Win32.Generic detected in network"
        },
        {
            "type": "Phishing",
            "indicators": ["attacker@phishing.com"],
            "severity": "Medium",
            "source": "otx",
            "description": "Phishing campaign targeting finance sector"
        },
        {
            "type": "Vulnerability",
            "indicators": ["CVE-2024-1234"],
            "severity": "High",
            "source": "nvd",
            "description": "Critical RCE vulnerability in popular framework"
        },
        {
            "type": "DDoS",
            "indicators": ["ASN12345"],
            "severity": "Low",
            "source": "shodan",
            "description": "DDoS attack originating from compromised botnet"
        },
    ]
    
    return mock_threats

def normalize_indicators(indicators):
    return [str(i).strip().lower() for i in indicators]

def make_indicator_hash(indicators, source, threat_type):
    norm = json.dumps(sorted(normalize_indicators(indicators)), separators=(",",":"))
    key = f"{source}|{threat_type}|{norm}"
    return hashlib.sha256(key.encode()).hexdigest()

