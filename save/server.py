"""Backup service for Lydia's Games: keeps a copy of the iPad's progress on this computer.

GET  /api/state                -> {"rev": n, "updated": ms, "data": {key: raw string}}
PUT  /api/state                <- {"baseRev": n, "data": {...}}   (409 + current state if someone saved first)
GET  /api/pictures             -> [{"id", "profile", "created"}]
GET/PUT/DELETE /api/pictures/<id>
GET  /api/health               -> {"ok": true, "https": bool}

On startup it also makes the certificates for the secure (https) address, see certs.py.
"""

import json
import os
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import certs

DATA = Path(os.environ.get("DATA_DIR", "/data"))
PORT = int(os.environ.get("PORT", "5001"))
MAX_BODY = 30 * 1024 * 1024
PICS = DATA / "pictures"
STATE = DATA / "state.json"
ID_RE = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")
LOCK = threading.Lock()

PICS.mkdir(parents=True, exist_ok=True)


def write_atomic(path, data):
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)


def read_state():
    try:
        return json.loads(STATE.read_text())
    except (OSError, ValueError):
        return {"rev": 0, "updated": 0, "data": {}}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY:
            raise ValueError("bad size")
        return json.loads(self.rfile.read(n))

    def pic_path(self):
        pid = self.path.split("?")[0].rsplit("/", 1)[-1]
        if not ID_RE.match(pid):
            return None
        return PICS / f"{pid}.json"

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/health":
            return self.send_json(200, {"ok": True, "https": certs.ready()})
        if path == "/api/state":
            with LOCK:
                return self.send_json(200, read_state())
        if path == "/api/pictures":
            out = []
            for f in PICS.glob("*.json"):
                try:
                    rec = json.loads(f.read_text())
                    out.append({"id": rec.get("id"), "profile": rec.get("profile", "main"), "created": rec.get("created", 0)})
                except (OSError, ValueError):
                    continue
            return self.send_json(200, out)
        if path.startswith("/api/pictures/"):
            p = self.pic_path()
            if not p or not p.exists():
                return self.send_json(404, {"error": "not found"})
            return self.send_json(200, json.loads(p.read_text()))
        self.send_json(404, {"error": "not found"})

    def do_PUT(self):
        path = self.path.split("?")[0]
        try:
            body = self.body()
        except (ValueError, TypeError):
            return self.send_json(400, {"error": "bad body"})
        if path == "/api/state":
            data = body.get("data")
            if not isinstance(data, dict) or not all(isinstance(k, str) and k.startswith("lg.") and isinstance(v, str) for k, v in data.items()):
                return self.send_json(400, {"error": "bad data"})
            with LOCK:
                cur = read_state()
                if body.get("baseRev") != cur["rev"]:
                    return self.send_json(409, cur)
                new = {"rev": cur["rev"] + 1, "updated": int(time.time() * 1000), "data": data}
                write_atomic(STATE, json.dumps(new).encode())
                # Keep a few dated copies, just in case.
                day = time.strftime("%Y-%m-%d")
                write_atomic(DATA / f"state-{day}.json", json.dumps(new).encode())
                for old in sorted(DATA.glob("state-*.json"))[:-14]:
                    old.unlink(missing_ok=True)
            return self.send_json(200, {"rev": new["rev"]})
        if path.startswith("/api/pictures/"):
            p = self.pic_path()
            if not p or not isinstance(body, dict) or not isinstance(body.get("image"), str):
                return self.send_json(400, {"error": "bad picture"})
            write_atomic(p, json.dumps(body).encode())
            return self.send_json(200, {"ok": True})
        self.send_json(404, {"error": "not found"})

    def do_DELETE(self):
        p = self.pic_path() if self.path.startswith("/api/pictures/") else None
        if not p:
            return self.send_json(404, {"error": "not found"})
        p.unlink(missing_ok=True)
        self.send_json(200, {"ok": True})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    certs.make()
    print(f"Save service on :{PORT}, data in {DATA}", flush=True)
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
