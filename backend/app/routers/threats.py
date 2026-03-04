from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth
from firebase_admin import firestore
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.auth import verify_firebase_token
from app.middleware.rate_limit import limiter
import json, hashlib, logging, time

import aiohttp
import feedparser

# Ensure Firebase Admin SDK is initialized
import app.firebase_admin  # initializes firebase_admin with credentials.Certificate(...)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/threats", tags=["threats"])

# Use the Firestore client exposed by firebase_admin
db = firestore.client()

# ──────────────────────────────────────────────────────────
# OSINT Feed Configuration (all free, no API key required)
# ──────────────────────────────────────────────────────────
OSINT_FEEDS = [
    {
        "code": "cisa",
        "name": "CISA Advisories",
        "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        "type": "rss",
    },
    {
        "code": "sans_isc",
        "name": "SANS ISC",
        "url": "https://isc.sans.edu/rssfeed.xml",
        "type": "rss",
    },
    {
        "code": "abuse_urlhaus",
        "name": "Abuse.ch URLhaus",
        "url": "https://urlhaus-api.abuse.ch/v1/urls/recent/limit/25/",
        "type": "json",
    },
    {
        "code": "abuse_feodo",
        "name": "Abuse.ch Feodo Tracker",
        "url": "https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json",
        "type": "json",
    },
]

# Fallback mock data – used only when ALL real feeds fail
FALLBACK_THREATS = [
    {
        "type": "Malware",
        "indicators": ["hash_abc123", "192.168.1.100"],
        "severity": "High",
        "source": "fallback",
        "description": "Trojan.Win32.Generic detected in network (fallback data)",
    },
    {
        "type": "Phishing",
        "indicators": ["attacker@phishing.com"],
        "severity": "Medium",
        "source": "fallback",
        "description": "Phishing campaign targeting finance sector (fallback data)",
    },
    {
        "type": "Vulnerability",
        "indicators": ["CVE-2024-1234"],
        "severity": "High",
        "source": "fallback",
        "description": "Critical RCE vulnerability in popular framework (fallback data)",
    },
    {
        "type": "DDoS",
        "indicators": ["ASN12345"],
        "severity": "Low",
        "source": "fallback",
        "description": "DDoS attack originating from compromised botnet (fallback data)",
    },
]


# ──────────────────────────────────────────────────────────
# Feed parsers – each returns List[Dict] in unified schema
# ──────────────────────────────────────────────────────────

def _parse_rss_cisa(entries: list) -> List[Dict[str, Any]]:
    """Parse CISA advisory RSS entries into threat objects."""
    threats = []
    for entry in entries[:15]:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = entry.get("summary", entry.get("description", ""))[:300]

        # Determine severity from title keywords
        title_lower = title.lower()
        if any(kw in title_lower for kw in ["critical", "emergency", "exploit"]):
            severity = "High"
        elif any(kw in title_lower for kw in ["update", "advisory", "warning"]):
            severity = "Medium"
        else:
            severity = "Low"

        # Extract CVE identifiers
        import re
        cves = re.findall(r"CVE-\d{4}-\d{4,}", title + " " + summary)
        indicators = cves if cves else [link] if link else [title[:60]]

        threats.append({
            "type": "Vulnerability",
            "indicators": indicators,
            "severity": severity,
            "source": "CISA",
            "description": f"{title}. {summary}"[:400],
        })
    return threats


def _parse_rss_sans(entries: list) -> List[Dict[str, Any]]:
    """Parse SANS ISC diary RSS entries into threat objects."""
    threats = []
    for entry in entries[:10]:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = entry.get("summary", entry.get("description", ""))[:300]

        title_lower = title.lower()
        if any(kw in title_lower for kw in ["critical", "exploit", "zero-day", "0-day"]):
            severity = "High"
        elif any(kw in title_lower for kw in ["scan", "increase", "malware"]):
            severity = "Medium"
        else:
            severity = "Low"

        import re
        cves = re.findall(r"CVE-\d{4}-\d{4,}", title + " " + summary)
        indicators = cves if cves else [link] if link else [title[:60]]

        threats.append({
            "type": "Threat Intel",
            "indicators": indicators,
            "severity": severity,
            "source": "SANS ISC",
            "description": f"{title}. {summary}"[:400],
        })
    return threats


def _parse_urlhaus_json(data: Any) -> List[Dict[str, Any]]:
    """Parse Abuse.ch URLhaus JSON response."""
    threats = []
    urls = data.get("urls", []) if isinstance(data, dict) else data if isinstance(data, list) else []

    for item in urls[:15]:
        url = item.get("url", "")
        threat_type = item.get("threat", item.get("url_status", "malware"))
        tags = item.get("tags") or []

        threats.append({
            "type": "Malware URL",
            "indicators": [url] + (tags[:2] if tags else []),
            "severity": "High",
            "source": "Abuse.ch URLhaus",
            "description": f"Malicious URL distributing {threat_type}: {url}"[:400],
        })
    return threats


def _parse_feodo_json(data: Any) -> List[Dict[str, Any]]:
    """Parse Abuse.ch Feodo Tracker IP blocklist."""
    threats = []
    items = data if isinstance(data, list) else []

    for item in items[:15]:
        ip = item.get("ip_address", item.get("dst_ip", ""))
        port = item.get("dst_port", item.get("port", ""))
        malware = item.get("malware", "Unknown")
        first_seen = item.get("first_seen", "")

        if not ip:
            continue

        indicators = [ip]
        if port:
            indicators.append(f"port:{port}")

        threats.append({
            "type": "C2 Server",
            "indicators": indicators,
            "severity": "High",
            "source": "Abuse.ch Feodo",
            "description": f"Command & Control server ({malware}) at {ip}:{port}. First seen: {first_seen}"[:400],
        })
    return threats


# ──────────────────────────────────────────────────────────
# Main feed fetcher with error isolation + fallback
# ──────────────────────────────────────────────────────────

async def fetch_osint_feeds() -> List[Dict[str, Any]]:
    """
    Fetch threat data from real OSINT feeds.
    Each feed is fetched independently – one failure does not block others.
    If ALL feeds fail, returns fallback mock data.
    """
    all_threats: List[Dict[str, Any]] = []
    feed_errors: List[str] = []
    timeout = aiohttp.ClientTimeout(total=15)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        for feed in OSINT_FEEDS:
            try:
                async with session.get(feed["url"]) as resp:
                    if resp.status != 200:
                        feed_errors.append(f"{feed['name']}: HTTP {resp.status}")
                        logger.warning(f"OSINT feed {feed['name']} returned HTTP {resp.status}")
                        continue

                    if feed["type"] == "rss":
                        text = await resp.text()
                        parsed = feedparser.parse(text)

                        if feed["code"] == "cisa":
                            threats = _parse_rss_cisa(parsed.entries)
                        elif feed["code"] == "sans_isc":
                            threats = _parse_rss_sans(parsed.entries)
                        else:
                            threats = []

                        all_threats.extend(threats)
                        logger.info(f"OSINT feed {feed['name']}: got {len(threats)} threats")

                    elif feed["type"] == "json":
                        data = await resp.json(content_type=None)

                        if feed["code"] == "abuse_urlhaus":
                            threats = _parse_urlhaus_json(data)
                        elif feed["code"] == "abuse_feodo":
                            threats = _parse_feodo_json(data)
                        else:
                            threats = []

                        all_threats.extend(threats)
                        logger.info(f"OSINT feed {feed['name']}: got {len(threats)} threats")

            except aiohttp.ClientError as e:
                feed_errors.append(f"{feed['name']}: {type(e).__name__}")
                logger.warning(f"OSINT feed {feed['name']} network error: {e}")
                continue
            except Exception as e:
                feed_errors.append(f"{feed['name']}: {type(e).__name__}")
                logger.warning(f"OSINT feed {feed['name']} parse error: {e}")
                continue

    if feed_errors:
        logger.warning(f"OSINT feed errors ({len(feed_errors)}/{len(OSINT_FEEDS)}): {feed_errors}")

    # Fallback: if ALL feeds failed, return mock data so dashboard is never empty
    if not all_threats:
        logger.warning("All OSINT feeds failed – using fallback mock data")
        return FALLBACK_THREATS

    return all_threats


# ──────────────────────────────────────────────────────────
# Utility helpers
# ──────────────────────────────────────────────────────────

def normalize_indicators(indicators):
    return [str(i).strip().lower() for i in indicators]


def make_indicator_hash(indicators, source, threat_type):
    norm = json.dumps(sorted(normalize_indicators(indicators)), separators=(",", ":"))
    key = f"{source}|{threat_type}|{norm}"
    return hashlib.sha256(key.encode()).hexdigest()


# ──────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────

@router.get("/latest")
@limiter.limit("30/minute")
async def get_latest_threats(
    request: Request,
    user=Depends(verify_firebase_token)
):
    """
    Fetch latest threats from Firestore cache.
    """
    try:
        threats = []

        threats_ref = db.collection('threatIntelligence').order_by(
            'timestamp', direction=firestore.Query.DESCENDING
        ).limit(100)

        docs = threats_ref.stream()
        for doc in docs:
            threat_data = doc.to_dict()
            threat_data['id'] = doc.id
            # Serialize Firestore timestamps
            for ts_field in ('timestamp', 'first_seen', 'last_seen'):
                ts = threat_data.get(ts_field)
                if ts and hasattr(ts, 'isoformat'):
                    threat_data[ts_field] = ts.isoformat()
                elif ts and hasattr(ts, '_seconds'):
                    threat_data[ts_field] = datetime.fromtimestamp(ts._seconds).isoformat()
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
    """
    try:
        new_threats = await fetch_osint_feeds()

        # Build set of existing indicator hashes
        existing_docs = db.collection('threatIntelligence').limit(200).stream()
        existing_hashes = set()
        for doc in existing_docs:
            data = doc.to_dict()
            indicators = data.get("indicators", [])
            key = tuple(sorted(normalize_indicators(indicators)))
            existing_hashes.add(key)

        added_count = 0
        skipped_count = 0

        for threat in new_threats:
            indicators = threat.get("indicators", [])
            threat_key = tuple(sorted(normalize_indicators(indicators)))

            if threat_key in existing_hashes:
                skipped_count += 1
                continue

            doc_id = make_indicator_hash(indicators, threat.get("source", ""), threat.get("type", ""))
            doc_ref = db.collection("threatIntelligence").document(doc_id)

            data = {
                "type": threat.get("type"),
                "indicators": threat.get("indicators"),
                "indicator_hash": doc_id,
                "severity": threat.get("severity"),
                "source": threat.get("source"),
                "description": threat.get("description"),
                "processed": False,
                "timestamp": datetime.now(tz=timezone.utc),
            }

            # Use merge to avoid overwriting occurrence tracking
            doc_ref.set({
                **data,
                "first_seen": firestore.SERVER_TIMESTAMP,
                "last_seen": datetime.now(tz=timezone.utc),
            }, merge=True)

            try:
                doc_ref.update({
                    "occurrences": firestore.Increment(1),
                    "last_seen": datetime.now(tz=timezone.utc),
                })
            except Exception:
                doc_ref.set({"occurrences": 1}, merge=True)

            existing_hashes.add(threat_key)
            added_count += 1

        return {
            "success": True,
            "message": f"Fetched {len(new_threats)} threats, added {added_count} new, skipped {skipped_count} duplicates",
            "count": added_count
        }
    except Exception as e:
        logger.exception("Failed to refresh threats")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
@limiter.limit("30/minute")
async def get_threat_stats(
    request: Request,
    user=Depends(verify_firebase_token)
):
    """
    Get aggregate threat statistics for dashboard.
    """
    try:
        threats_ref = db.collection('threatIntelligence')
        all_threats = list(threats_ref.stream())

        high_count = len([t for t in all_threats if t.to_dict().get("severity") == "High"])
        medium_count = len([t for t in all_threats if t.to_dict().get("severity") == "Medium"])
        low_count = len([t for t in all_threats if t.to_dict().get("severity") == "Low"])

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
