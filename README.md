# Lydia's Games

Simple learning games for a kindergartner, made for an iPad. Plain HTML/CSS/JavaScript with no build step, served from a small nginx Docker container on your home network.

| Game | Activities |
| --- | --- |
| ❤️ Heart Words | Find the word you hear · Flash cards · Build the word from letters |
| 🔤 Letters | Find the letter you hear · Big & little letters · First sounds (which picture starts with B?) |
| 🔢 Counting | How many? (tap to count out loud) · Which has more or fewer? · Add & take away within 10 |
| 🔺 Shapes & Colors | Find the shape or color · What comes next? (patterns) · Sort into baskets |
| 💇 Hair Salon | Pick a friend (Mia, Leo, Zuzu the monster, Kiki the cat, Grandpa Bob, Bella), then cut, comb, grow, color (even rainbow), curl, straighten, shampoo, rinse and blow-dry their bendy hair. Dress them in 13 outfits (any of 12 colors), try on hats and glasses that fit their head, add stickers and take a photo for My Pictures |
| 🎨 Free Play | Drawing pad: 35 coloring pages in 5 groups, 28 named colors, paint bucket with magic patterns (rainbow, dots, stripes, glitter, hearts), brushes, stamps, undo, save · My Pictures · Bubble pop · Animal memory match |

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

## Natural voice

Safari only lets web pages use the iPad's basic built-in voices, which sound robotic. Voices you download in iPad Settings (like Ava Premium) are **not** available to websites. Instead, `docker compose` also runs a small **text-to-speech container** (`tts/`, using [Piper](https://github.com/OHF-Voice/piper1-gpl)) that makes natural-sounding speech on your computer, with no internet or account needed once it's built.

- Two voices are included: **Lessac** (clear, the default) and **Heather** (warmer). Choose one and the speed in **Grown-ups ⚙️ → Voice**, and tap **▶ Test** to hear it.
- Each phrase is created once (about 0.1–0.2 s) and saved in the `tts-cache` volume. After that it plays instantly.
- If the container isn't running, the games use the iPad's own voice automatically, and the Grown-ups screen shows a warning.
- The image is about 680 MB: Python, the speech engine, and two voices.

## Saving drawings

Tap 💾 while drawing to save to **Free Play → My Pictures**, which keeps the newest 50 on that iPad. Tap a picture there to **keep drawing** or **delete** it. To copy one into the Photos app, open the picture, then **press and hold it → Save to Photos**.

## Stars, stickers, and surprises

- Every finished round earns a star. Every **3 stars** unlock a new sticker (42 in all), and every **10 stars** unlock a surprise: an extra outfit, hat, or glasses in the Hair Salon, or an extra coloring page. Rewards only add things; nothing that's there today gets locked.
- Tap the ⭐ counter or the **📒 My Sticker Book** tile to see her collection and how many stars until the next sticker.
- Collected stickers also show up as stamps in Draw and as stickers in the Hair Salon.

## Progress for grown-ups

**Grown-ups ⚙️ → 📈 Progress** shows rounds played each day for the last week, how often she gets each game right on the first try, the heart words she knows and the ones to practice, and the letters she mixes up (for example, *wanted B, tapped D*). Everything stays on the iPad. **Clear progress history** resets it.

## Music

Soft background music plays after her first tap. Each area has its own song, and the music gets quieter while the voice is talking. Turn it off in **Grown-ups ⚙️ → Background music**. All three songs are CC0 (free to use); see `music/CREDITS.md`.

## Good to know

- **Keep the host's address fixed.** Safari saves her stars, word edits, and saved pictures for each address. If the computer's IP changes, they will seem to be gone (they come back if the old address returns). Set up a DHCP reservation on your router, or use the computer's hostname.
- **No offline mode.** Offline mode would need HTTPS, so the iPad has to be on home Wi-Fi with the container running.
- **No sound?** Check that the iPad's side switch or Control Center mute is off. The Grown-ups screen can also turn spoken words and sound effects on or off.
- **Lock her in:** iPad **Settings → Accessibility → Guided Access** keeps her inside the app. Triple-click the side button to start it.

## Layout

```
index.html, grownups.html   home screen and grown-ups screen
games/*.html                one page per game
js/common.js                speech, sounds, cheers, stars, top bar, mode picker
js/quiz.js                  shared multiple-choice round runner (with the treasure jar)
js/mascot.js                Sparkle the unicorn
js/music.js                 background music (looping, quieter during speech)
js/rewards.js               stickers every 3 stars, surprises every 10
js/activity.js              progress log for the Grown-ups screen
music/                      background songs (CC0) and credits
fonts/                      Fredoka font (SIL Open Font License)
js/words-store.js           heart words: starter file + this iPad's changes
js/gallery-store.js         saved pictures (IndexedDB on the iPad)
js/coloring-pages.js        coloring page line art (add a picture: one SVG entry, white-filled shapes)
tts/                        natural-voice container (Piper text-to-speech server)
js/games/*.js               each game's logic (salon.js: hair strands are simple physics chains;
                            salon-wardrobe.js: clothes, hats and glasses drawn to fit the friend)
css/style.css               shared styles (big tap targets, no zoom/selection)
data/heart-words.json       starter heart words
```
