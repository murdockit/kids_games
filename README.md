# Lydia's Games

Simple learning games for a kindergartner, made for an iPad. Plain HTML/CSS/JavaScript with no build step, served from a small nginx Docker container on your home network.

| Game | Activities |
| --- | --- |
| ❤️ Heart Words | Find the word you hear · Flash cards · Build the word from letters |
| 🔤 Letters | Find the letter you hear · Big & little letters · First sounds (which picture starts with B?) |
| 🔢 Counting | How many? (tap to count out loud) · Which has more or fewer? · Add & take away within 10 |
| 🔺 Shapes & Colors | Find the shape or color · What comes next? (patterns) · Sort into baskets |
| 🎨 Free Play | Drawing pad with stamps · Bubble pop · Animal memory match |

Every instruction is spoken, and 🔊 repeats it, so she doesn't need to read to play. There are no timers and no way to lose: a wrong tap wiggles and she tries again. Each round finishes with a cheer and a ⭐.

## Run it

```sh
docker compose up -d --build
```

Then on the iPad, open Safari and go to `http://<this-computer's-IP>:2021`. Tap **Share → Add to Home Screen** to get a full-screen app icon.

- After changing code: `docker compose up -d --build`
- Without Docker: `python3 -m http.server 2021` in this folder

## Heart words

- **Starter list:** `data/heart-words.json`. Docker mounts the `data/` folder, so edits show up the next time the page loads, with no rebuild.
- **On the iPad:** tap **Grown-ups ⚙️** at the bottom of the home screen and answer the multiplication question. There you can add words (separate several with commas), remove words, mark words *Learned* (learned words come up less often), and see how many she has gotten right on the first try.
- **Backup:** iPad changes are saved in Safari on that iPad. Use **Export words** to save a copy. The exported file has the same shape as `data/heart-words.json`, so you can drop it in as the new starter list. **Import words** restores a backup.

## Good to know

- **Keep the host's address fixed.** Safari saves her stars and word edits for each address. If the computer's IP changes, they will seem to be gone (they come back if the old address returns). Set up a DHCP reservation on your router, or use the computer's hostname.
- **No offline mode.** Offline mode would need HTTPS, so the iPad has to be on home Wi-Fi with the container running.
- **No sound?** Check that the iPad's side switch or Control Center mute is off. The Grown-ups screen can also turn spoken words and sound effects on or off.
- **Lock her in:** iPad **Settings → Accessibility → Guided Access** keeps her inside the app. Triple-click the side button to start it.

## Layout

```
index.html, grownups.html   home screen and grown-ups screen
games/*.html                one page per game
js/common.js                speech, sounds, cheers, stars, top bar, mode picker
js/quiz.js                  shared multiple-choice round runner
js/words-store.js           heart words: starter file + this iPad's changes
js/games/*.js               each game's logic
css/style.css               shared styles (big tap targets, no zoom/selection)
data/heart-words.json       starter heart words
```
