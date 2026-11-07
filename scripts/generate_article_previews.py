#!/usr/bin/env python3
"""Generate Facebook-readable Open Graph pages for published FJU articles."""
import html
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://hmacroktklgwkofxsygv.supabase.co"
BUCKET = "fju-materias"
KEY = os.environ["SUPABASE_ANON_KEY"]
SITE = "https://fjujapan.github.io/fju-connect/"
HEAD = {"apikey": KEY, "Authorization": "Bearer " + KEY}


def request(url, data=None):
    headers = dict(HEAD)
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=35) as response:
        return response.read()


def storage_object_path(photo):
    """Accept a Storage object key or a Supabase public/signed object URL."""
    if not isinstance(photo, str) or not photo.strip():
        return None
    value = photo.strip()
    if value.startswith(("https://", "http://")):
        parsed = urllib.parse.urlsplit(value)
        marker = "/storage/v1/object/"
        if marker not in parsed.path:
            return None
        value = parsed.path.split(marker, 1)[1]
        parts = value.split("/", 1)
        if len(parts) != 2 or parts[0] not in ("public", "sign", "authenticated"):
            return None
        value = parts[1]
    value = urllib.parse.unquote(value).lstrip("/")
    if value.startswith(BUCKET + "/"):
        value = value[len(BUCKET) + 1:]
    if not value or value in (".", ".."):
        return None
    return urllib.parse.quote(value, safe="/")


def get_cover_image(photo, uid, out):
    """Return an OG image tag; a bad/missing cover must not abort other articles."""
    object_path = storage_object_path(photo)
    if not object_path:
        if photo:
            print("Skipping invalid cover path for article", uid)
        return ""
    try:
        payload = json.dumps({"expiresIn": 3600}).encode()
        signed = json.loads(request(
            BASE + "/storage/v1/object/sign/" + BUCKET + "/" + object_path,
            payload,
        ))
        signed_path = signed.get("signedURL") or signed.get("signedUrl")
        if not signed_path:
            print("No signed URL returned for article", uid)
            return ""
        image_url = (signed_path if signed_path.startswith(("https://", "http://"))
                     else BASE + "/storage/v1" + signed_path)
        img = request(image_url)
        if not img or len(img) > 400000:
            print("Cover image empty or over 400 KB for article", uid)
            return ""
        if img.startswith(bytes([137, 80, 78, 71])):
            ext = ".png"
        elif img.startswith(b"RIFF") and img[8:12] == b"WEBP":
            ext = ".webp"
        else:
            ext = ".jpg"
        image_name = uid + ext
        (out / image_name).write_bytes(img)
        return ('<meta property="og:image" content="' + SITE + 'share/' + image_name +
                '"><meta name="twitter:card" content="summary_large_image">')
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError,
            ValueError, KeyError, TypeError) as exc:
        detail = getattr(exc, "code", str(exc))
        print("Cover image failed for article", uid, ":", detail)
        return ""


url = (
    BASE + "/rest/v1/fju_materias?select=id,titulo_pt,titulo_ja,titulo_en,"
    "texto1_pt,texto1_ja,texto1_en,foto1,status&status=eq.publicada&limit=1000"
)
articles = json.loads(request(url))
out = pathlib.Path("share")
out.mkdir(exist_ok=True)
valid = set()
generated = 0
image_count = 0

for article in articles:
    uid = str(article.get("id", ""))
    if not re.fullmatch(r"[0-9a-f-]{36}", uid):
        print("Skipping article with invalid ID")
        continue
    valid.add(uid)
    lang = next((language for language in ("pt", "ja", "en")
                 if article.get("titulo_" + language)), "pt")
    title = article.get("titulo_" + lang) or "FJU Connect JAPAN"
    desc = (article.get("texto1_" + lang) or
            "Leia esta matéria da FJU JAPAN").strip()[:250]
    destination = SITE + "materia.html?" + urllib.parse.urlencode(
        {"id": uid, "lang": lang}
    )
    preview = SITE + "share/" + uid + ".html"
    image_tag = get_cover_image(article.get("foto1"), uid, out)
    if image_tag:
        image_count += 1
    esc = lambda value: html.escape(str(value), quote=True)
    page = (
        '<!doctype html><html lang="' + esc(lang) + '"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>' + esc(title) + ' | FJU Connect JAPAN</title>'
        '<meta name="description" content="' + esc(desc) + '">'
        '<meta property="og:type" content="article">'
        '<meta property="og:title" content="' + esc(title) + '">'
        '<meta property="og:description" content="' + esc(desc) + '">'
        '<meta property="og:url" content="' + esc(preview) + '">'
        '<meta property="og:site_name" content="FJU Connect JAPAN">'
        + image_tag +
        '<link rel="canonical" href="' + esc(destination) + '">'
        '<meta name="robots" content="index,follow">'
        '</head><body><p><a href="' + esc(destination) + '">Ler matéria completa</a></p>'
        '<script>location.replace(' + json.dumps(destination) + ')</script></body></html>'
    )
    (out / (uid + ".html")).write_text(page, encoding="utf-8")
    generated += 1

for file in out.iterdir():
    if (file.name.split(".")[0] not in valid and
            re.fullmatch(r"[0-9a-f-]{36}[.](html|jpg|png|webp)", file.name)):
        file.unlink()

print("Generated", generated, "share previews and", image_count, "cover images")
