"""Certificates for the secure address (https://<computer>:2022), needed for the microphone.

A tiny "home" certificate authority is made once and kept in /ca (private). The iPad trusts it
once (Grown-ups explains how). The server certificate it signs lists the names in HOST_NAMES,
and is remade whenever those names change or it gets close to expiring.
"""

import os
import subprocess
import time
from pathlib import Path

CA = Path(os.environ.get("CA_DIR", "/ca"))
OUT = Path(os.environ.get("CERTS_DIR", "/certs"))
NAMES = [n.strip() for n in os.environ.get("HOST_NAMES", "").split(",") if n.strip()]
# Apple devices refuse server certificates valid for more than 825 days.
DAYS = 800


def ready():
    return (OUT / "server.crt").exists()


def run(*args):
    subprocess.run(args, check=True, capture_output=True)


def is_ip(name):
    return all(p.isdigit() for p in name.split(".")) and name.count(".") == 3


def make():
    CA.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    names = sorted(set(NAMES + ["localhost", "127.0.0.1"]))
    ca_key, ca_crt = CA / "ca.key", CA / "ca.crt"
    if not ca_crt.exists():
        run("openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "3650",
            "-keyout", str(ca_key), "-out", str(ca_crt),
            "-subj", "/CN=Lydia's Games Home CA",
            "-addext", "basicConstraints=critical,CA:TRUE",
            "-addext", "keyUsage=critical,keyCertSign,cRLSign")
    (OUT / "ca.crt").write_bytes(ca_crt.read_bytes())

    stamp = OUT / "names.txt"
    crt = OUT / "server.crt"
    fresh = crt.exists() and stamp.exists() and stamp.read_text() == ",".join(names) \
        and time.time() - crt.stat().st_mtime < (DAYS - 30) * 86400
    if fresh:
        return
    san = ",".join(f"IP:{n}" if is_ip(n) else f"DNS:{n}" for n in names)
    ext = OUT / "ext.cnf"
    ext.write_text(
        "basicConstraints=CA:FALSE\n"
        "keyUsage=critical,digitalSignature,keyEncipherment\n"
        "extendedKeyUsage=serverAuth\n"
        f"subjectAltName={san}\n"
    )
    run("openssl", "req", "-newkey", "rsa:2048", "-nodes", "-sha256",
        "-keyout", str(OUT / "server.key"), "-out", str(OUT / "server.csr"), "-subj", "/CN=Lydia's Games")
    run("openssl", "x509", "-req", "-in", str(OUT / "server.csr"), "-CA", str(ca_crt), "-CAkey", str(ca_key),
        "-CAcreateserial", "-out", str(crt), "-days", str(DAYS), "-sha256", "-extfile", str(ext))
    (OUT / "server.csr").unlink(missing_ok=True)
    ext.unlink(missing_ok=True)
    os.chmod(OUT / "server.key", 0o644)  # nginx reads it from the shared volume
    stamp.write_text(",".join(names))
    print(f"Made certificate for: {', '.join(names)}", flush=True)
