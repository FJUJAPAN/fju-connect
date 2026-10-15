#!/usr/bin/env python3
"""Sync @fjujapan's 3 latest Instagram posts to static GitHub Pages assets.

Server-side only: never expose the Meta token through GitHub Pages.
Requires FJU_INSTAGRAM_TOKEN, a long-lived Instagram Login token for @fjujapan.
The refreshed token is Fernet-encrypted before being committed; the encryption
key is derived from the original GitHub Actions secret and never published.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from cryptography.fernet import Fernet, InvalidToken
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "instagram"
MEDIA = OUT / "media"
STATE = OUT / ".refresh-token.enc"
MANIFEST = OUT / "latest.json"
API = "https://graph.instagram.com"
VERSION = "v25.0"
POST_PATTERN = re.compile(r"^/(p|reel|tv)/[A-Za-z0-9_-]+/?$")
EXPECTED_USERNAME = "fjujapan"
REFRESH_DAYS = 30


def api_request(url: str, token: str) -> dict:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "graph.instagram.com":
        raise RuntimeError("Unexpected API endpoint")
    req = Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
    try:
        with urlopen(req, timeout=25) as response:
            body = response.read(3_000_000)
            result = json.loads(body.decode("utf-8"))
    except HTTPError as exc:
        # Meta may place access credentials inside error diagnostics: don't log the response.
        raise RuntimeError(f"Instagram API HTTP {exc.code}") from None
    except URLError as exc:
        raise RuntimeError(f"Instagram API network error ({type(exc.reason).__name__})") from None
    if not isinstance(result, dict) or "error" in result:
        raise RuntimeError("Instagram API returned an invalid or error response")
    return result


def api(path: str, fields: str, token: str, limit: int | None = None) -> dict:
    args = {"fields": fields}
    if limit is not None:
        args["limit"] = str(limit)
    return api_request(f"{API}/{VERSION}/{path}?{urlencode(args)}", token)


def get_cipher(master_token: str) -> Fernet:
    key = hashlib.sha256(b"FJU_CONNECT_IG_TOKEN_KEY_v1|" + master_token.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def load_token(secret: str) -> tuple[str, datetime, Fernet]:
    cipher = get_cipher(secret)
    if STATE.exists():
        try:
            payload = json.loads(cipher.decrypt(STATE.read_bytes()).decode("utf-8"))
            when = datetime.fromisoformat(payload["refreshed_at"])
            token = payload["token"]
            if not isinstance(token, str) or not token:
                raise ValueError("empty token")
            return token, when, cipher
        except (InvalidToken, ValueError, KeyError, TypeError, json.JSONDecodeError):
            # A deliberate new GitHub secret resets stale state.
            print("Encrypted token state unavailable; retrying initial GitHub secret.")
    return secret, datetime.now(timezone.utc), cipher


def store_token(token: str, when: datetime, cipher: Fernet) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    obj = {"token": token, "refreshed_at": when.isoformat()}
    STATE.write_bytes(cipher.encrypt(json.dumps(obj, separators=(",", ":")).encode("utf-8")) + b"\n")


def refresh_if_needed(token: str, refreshed: datetime) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    if now - refreshed < timedelta(days=REFRESH_DAYS):
        return token, refreshed
    url = API + "/refresh_access_token?" + urlencode({"grant_type": "ig_refresh_token"})
    # Instagram's refresh endpoint requires access_token as a parameter.
    # Avoid printing or persisting the URL because it contains a credential.
    token_url = url + "&" + urlencode({"access_token": token})
    result = api_request(token_url, token)
    updated = result.get("access_token")
    if not isinstance(updated, str) or not updated:
        raise RuntimeError("No token returned by Meta refresh endpoint")
    return updated, now


def valid_post_url(url: str) -> bool:
    try:
        p = urlparse(url)
        return p.scheme == "https" and p.hostname in ("instagram.com", "www.instagram.com") and bool(POST_PATTERN.fullmatch(p.path))
    except (TypeError, ValueError):
        return False


def photo_url(item: dict, token: str) -> str | None:
    media_type = item.get("media_type")
    if media_type == "CAROUSEL_ALBUM":
        # Request only the first slide of a carousel.
        child = api(f"{item['id']}/children", "id,media_type,media_url,thumbnail_url", token, 1).get("data", [])
        if not child:
            return None
        item = child[0]
        media_type = item.get("media_type")
    if media_type == "VIDEO":
        return item.get("thumbnail_url") or None
    return item.get("media_url") or item.get("thumbnail_url")


def webp_bytes(url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise RuntimeError("Media URL must be HTTPS")
    req = Request(url, headers={"User-Agent": "FJUConnectInstagramSync/1.0"})
    try:
        with urlopen(req, timeout=30) as stream:
            ctype = (stream.headers.get("content-type") or "").lower()
            if not ctype.startswith("image/"):
                raise RuntimeError("Instagram media is not an image")
            body = stream.read(12_000_001)
    except (HTTPError, URLError):
        raise RuntimeError("Instagram image download failed") from None
    if len(body) > 12_000_000:
        raise RuntimeError("Instagram image too large")
    try:
        with Image.open(io.BytesIO(body)) as original:
            img = ImageOps.exif_transpose(original).convert("RGB")
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            img.save(output, "WEBP", quality=83, method=5)
            return output.getvalue()
    except (OSError, UnidentifiedImageError):
        raise RuntimeError("Instagram image could not be decoded") from None


def main() -> int:
    secret = os.environ.get("FJU_INSTAGRAM_TOKEN", "").strip()
    if not secret:
        print("Instagram not connected: configure FJU_INSTAGRAM_TOKEN in GitHub Actions secrets.")
        return 0

    token, refreshed, cipher = load_token(secret)
    # Validate that the token belongs to @fjujapan. Never show a different account's feed.
    profile = api("me", "username", token)
    if str(profile.get("username", "")).lower() != EXPECTED_USERNAME:
        raise RuntimeError("The connected Instagram account is not @fjujapan")

    token, refreshed = refresh_if_needed(token, refreshed)

    result = api("me/media", "id,media_type,media_url,thumbnail_url,permalink,timestamp", token, 18)
    items = result.get("data", [])
    if not isinstance(items, list):
        raise RuntimeError("Invalid Instagram media list")
    items.sort(key=lambda p: p.get("timestamp", ""), reverse=True)
    picks: list[tuple[dict, bytes]] = []
    for item in items:
        if len(picks) == 3:
            break
        if not isinstance(item, dict) or not valid_post_url(item.get("permalink")):
            continue
        img = photo_url(item, token)
        if not img:
            continue
        try:
            picks.append((item, webp_bytes(img)))
        except RuntimeError as exc:
            # Continue to next recent post if this one has an inaccessible thumbnail.
            print(f"Skipped inaccessible media: {exc}")
    if len(picks) != 3:
        raise RuntimeError("Could not retrieve three Instagram posts; previous site images remain.")

    MEDIA.mkdir(parents=True, exist_ok=True)
    posts = []
    for number, (item, data) in enumerate(picks, 1):
        filename = f"{number:02d}.webp"
        target = MEDIA / filename
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
        posts.append({
            "image": f"instagram/media/{filename}",
            "permalink": item["permalink"],
            "timestamp": item.get("timestamp", ""),
            "media_type": item.get("media_type", ""),
        })

    previous = None
    if MANIFEST.exists():
        try:
            previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    # Keep the same updated_at if the post URLs and timestamps didn't change.
    old_posts = previous.get("posts") if isinstance(previous, dict) else None
    same_posts = old_posts == posts
    updated_at = (previous.get("updated_at") if isinstance(previous, dict) else None) if same_posts else None
    result_manifest = {
        "source": "@fjujapan",
        "updated_at": updated_at or datetime.now(timezone.utc).isoformat(),
        "posts": posts,
    }
    result_bytes = (json.dumps(result_manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if not MANIFEST.exists() or MANIFEST.read_bytes() != result_bytes:
        MANIFEST.write_bytes(result_bytes)

    # Store token privately with strong authenticated encryption, even in public repos.
    # Never commit the raw access token or place it in HTML/JSON.
    if not STATE.exists() or token != secret or refreshed < datetime.now(timezone.utc) - timedelta(seconds=10):
        # Avoid changing ciphertext on every run.
        existing_age = STATE.stat().st_mtime if STATE.exists() else None
        if not existing_age or not same_posts or datetime.fromtimestamp(existing_age, timezone.utc) < refreshed:
            store_token(token, refreshed, cipher)
    print("FJU Instagram sync complete: three posts staged for GitHub Pages.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        # Never expose access tokens in exception tracebacks or error response bodies.
        print(f"Instagram sync failed: {str(exc)[:180]}", file=sys.stderr)
        sys.exit(1)
