# Lydia's Games: plain static files served by nginx. No build step.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-https.conf /etc/nginx/conf.d/https.conf
COPY nginx-site.conf /etc/nginx/site.conf
COPY wait-for-certs.sh /docker-entrypoint.d/40-wait-for-certs.sh
COPY index.html grownups.html manifest.webmanifest /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY games /usr/share/nginx/html/games
COPY icons /usr/share/nginx/html/icons
COPY fonts /usr/share/nginx/html/fonts
COPY music /usr/share/nginx/html/music
# Default word list baked in; docker-compose mounts ./data over it so edits apply without a rebuild.
COPY data /usr/share/nginx/html/data

EXPOSE 80 443
