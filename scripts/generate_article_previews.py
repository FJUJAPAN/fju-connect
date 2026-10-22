#!/usr/bin/env python3
"""Generate Facebook-readable Open Graph pages for published FJU articles."""
import json, os, pathlib, urllib.request, urllib.parse, html, re
BASE = "https://hmacroktklgwkofxsygv.supabase.co"
KEY = os.environ["SUPABASE_ANON_KEY"]
SITE = "https://fjujapan.github.io/fju-connect/"
HEAD = {"apikey": KEY, "Authorization": "Bearer " + KEY}
def request(url, data=None):
    headers = dict(HEAD)
    if data is not None: headers["Content-Type"] = "application/json"
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=35) as response:
        return response.read()
url = BASE + "/rest/v1/fju_materias?select=id,titulo_pt,titulo_ja,titulo_en,texto1_pt,texto1_ja,texto1_en,foto1,status&status=eq.publicada&limit=1000"
articles = json.loads(request(url))
out = pathlib.Path("share")
out.mkdir(exist_ok=True)
valid = set()
for a in articles:
    uid = a["id"]
    if not re.fullmatch(r"[0-9a-f-]{36}", uid): continue
    valid.add(uid)
    lang = next((l for l in ("pt", "ja", "en") if a.get("titulo_" + l)), "pt")
    title = a.get("titulo_" + lang) or "FJU Connect JAPAN"
    desc = (a.get("texto1_" + lang) or "Leia esta matéria da FJU JAPAN").strip()[:250]
    destination = SITE + "materia.html?" + urllib.parse.urlencode({"id": uid, "lang": lang})
    preview = SITE + "share/" + uid + ".html"
    image_tag = ""
    if a.get("foto1"):
        path = urllib.parse.quote(a["foto1"], safe="/")
        signed = json.loads(request(BASE + "/storage/v1/object/sign/fju-materias/" + path, json.dumps({"expiresIn": 3600}).encode()))
        signed_path = signed.get("signedURL") or signed.get("signedUrl")
        if signed_path:
            img = request(BASE + "/storage/v1" + signed_path)
            # Published article cover is copied into the public share directory for crawler previews.
            if len(img) <= 400000:
                ext = ".png" if img.startswith(bytes([137,80,78,71])) else ".webp" if img.startswith(b"RIFF") else ".jpg"
                image_name = uid + ext
                (out / image_name).write_bytes(img)
                image_tag = '<meta property="og:image" content="' + SITE + 'share/' + image_name + '"><meta name="twitter:card" content="summary_large_image">'
    esc = lambda value: html.escape(value, quote=True)
    page = ('<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">'
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
            '<meta http-equiv="refresh" content="0;url=' + esc(destination) + '">'
            '</head><body><p><a href="' + esc(destination) + '">Ler matéria completa</a></p>'
            '<script>location.replace(' + json.dumps(destination) + ')</script></body></html>')
    (out / (uid + ".html")).write_text(page, encoding="utf-8")
for file in out.iterdir():
    if file.name.split(".")[0] not in valid and re.fullmatch(r"[0-9a-f-]{36}[.](html|jpg|png|webp)", file.name):
        file.unlink()
print("Generated", len(valid), "share previews")
