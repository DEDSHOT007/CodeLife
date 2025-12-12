from datetime import datetime, timezone
import time
import logging
from typing import List, Dict, Any

import aiohttp
import feedparser
from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import firestore

from app.auth import verify_firebase_token
from app.middleware.rate_limit import limiter
import app.firebase_admin  # Initializes Firebase Admin SDK

router = APIRouter(prefix="/news", tags=["news"])

db = firestore.client()

FEEDS: List[Dict[str, str]] = [
    {"code": "thn", "name": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews"},
    {"code": "krebs", "name": "Krebs on Security", "url": "https://krebsonsecurity.com/feed/"},
    {"code": "bleepingcomputer", "name": "BleepingComputer", "url": "https://www.bleepingcomputer.com/feed/"},
    {"code": "darkreading", "name": "DarkReading", "url": "https://www.darkreading.com/rss.xml"},
    {"code": "securityweek", "name": "SecurityWeek", "url": "https://feeds.securityweek.com/securityweek"},
    {"code": "cybersecuritydive", "name": "Cybersecurity Dive", "url": "https://www.cybersecuritydive.com/feeds/news/"},
    {"code": "googleai", "name": "Google AI Blog", "url": "https://ai.googleblog.com/feeds/posts/default"},
    {"code": "openai", "name": "OpenAI Blog", "url": "https://openai.com/blog/rss/"},
    {"code": "nvidia", "name": "Nvidia Technical Blog", "url": "https://blogs.nvidia.com/feed/"},
    {"code": "aireport", "name": "The AI Report", "url": "https://theaibox.co/feed/"},
]


def _parse_date(entry: Dict[str, Any]) -> datetime:
    if entry.get("published_parsed"):
        return datetime.fromtimestamp(time.mktime(entry["published_parsed"]), tz=timezone.utc)
    if entry.get("updated_parsed"):
        return datetime.fromtimestamp(time.mktime(entry["updated_parsed"]), tz=timezone.utc)
    if entry.get("published"):
        try:
            return datetime.fromisoformat(entry["published"])
        except Exception:
            pass
    return datetime.now(tz=timezone.utc)


def _summarize(entry: Dict[str, Any]) -> str:
    summary_fields = [
        entry.get("summary"),
        entry.get("description"),
        entry.get("content")[0].get("value") if entry.get("content") else None,
    ]
    text = next((s for s in summary_fields if s), "")
    # TODO: Plug in Hugging Face summarization model for richer summaries.
    return (text or "").split(".")[0][:240].strip() or "No summary available."


def _extract_tags(title: str, summary: str) -> List[str]:
    words = (title + " " + summary).lower().split()
    tags = []
    for w in words:
        clean = "".join(ch for ch in w if ch.isalnum())
        if len(clean) > 4 and clean not in tags:
            tags.append(clean)
        if len(tags) >= 5:
            break
    return tags


async def fetch_feeds() -> List[Dict[str, Any]]:
    articles: List[Dict[str, Any]] = []
    timeout = aiohttp.ClientTimeout(total=15)

    async with aiohttp.ClientSession(timeout=timeout) as session:
        for feed in FEEDS:
            try:
                async with session.get(feed["url"]) as resp:
                    text = await resp.text()
                    parsed = feedparser.parse(text)

                    for entry in parsed.entries[:5]:
                        title = entry.get("title", "Untitled")
                        link = entry.get("link") or entry.get("id")
                        published_dt = _parse_date(entry)
                        summary = _summarize(entry)
                        tags = _extract_tags(title, summary)

                        articles.append(
                            {
                                "title": title,
                                "url": link,
                                "source": feed["name"],
                                "summary": summary,
                                "published_at": published_dt,
                                "created_at": datetime.now(tz=timezone.utc),
                                "tags": tags,
                                "feed": feed["code"],
                            }
                        )
            except Exception as e:
                logging.error("Error fetching feed %s: %s", feed["name"], e)
                continue

    return articles


@router.post("/refresh")
@limiter.limit("5/minute")
async def refresh_news(request: Request, user=Depends(verify_firebase_token)):
    try:
        fetched_articles = await fetch_feeds()
        processed = 0

        for article in fetched_articles:
            if not article.get("url"):
                continue

            existing = (
                db.collection("commandPost")
                .where("url", "==", article["url"])
                .limit(1)
                .stream()
            )
            if any(True for _ in existing):
                continue

            db.collection("commandPost").add(article)
            processed += 1

        return {"success": True, "count": processed}
    except Exception as e:
        logging.exception("Failed to refresh news")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest")
@limiter.limit("30/minute")
async def get_latest_news(request: Request, user=Depends(verify_firebase_token)):
    try:
        docs = (
            db.collection("commandPost")
            .order_by("published_at", direction=firestore.Query.DESCENDING)
            .limit(30)
            .stream()
        )

        articles = []
        for doc in docs:
            data = doc.to_dict()

            published_at = data.get("published_at")
            if published_at and hasattr(published_at, "isoformat"):
                data["published_at"] = published_at.isoformat()

            created_at = data.get("created_at")
            if created_at and hasattr(created_at, "isoformat"):
                data["created_at"] = created_at.isoformat()

            data["id"] = doc.id
            articles.append(data)

        return {"success": True, "count": len(articles), "articles": articles}
    except Exception as e:
        logging.exception("Failed to fetch latest news")
        raise HTTPException(status_code=500, detail=str(e))

