#!/bin/sh
# Wait a little for the save container to make the https certificates. Without them,
# skip the https server so the regular address (port 2021) still works.
for i in $(seq 1 20); do
  [ -s /certs/server.crt ] && [ -s /certs/server.key ] && exit 0
  sleep 1
done
echo "wait-for-certs: no certificates in /certs, https (port 2022) is off" >&2
rm -f /etc/nginx/conf.d/https.conf
