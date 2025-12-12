from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth
from firebase_admin import firestore
from datetime import datetime
from typing import List, Dict
from app.auth import verify_firebase_token
from app.middleware.rate_limit import limiter

# Ensure Firebase Admin SDK is initialized
import app.firebase_admin  # initializes firebase_admin with credentials.Certificate(...)

router = APIRouter(prefix="/threats", tags=["threats"])

# Use the Firestore client exposed by firebase_admin
db = firestore.client()

# Mock OSINT data structure (we'll fetch real data next)
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
        threats_ref = db.collection('threatIntelligence').order_by(
            'timestamp', direction=firestore.Query.DESCENDING
        ).limit(20)
        
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
        new_threats = await fetch_osint_feeds()
        
        # Store in Firestore
        for threat in new_threats:
            db.collection('threatIntelligence').add({
                "type": threat.get("type"),
                "indicators": threat.get("indicators"),
                "severity": threat.get("severity"),  # High/Medium/Low
                "source": threat.get("source"),
                "description": threat.get("description"),
                "timestamp": datetime.now(),
                "processed": False  # Mark for XAI processing later
            })
        
        return {
            "success": True,
            "message": f"Fetched and stored {len(new_threats)} threats",
            "count": len(new_threats)
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

