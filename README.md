# Lydia's Games

Simple learning games for a kindergartner, made for an iPad. Plain HTML/CSS/JavaScript with no build step, served from a small nginx Docker container on your home network.

| Game | Activities |
| --- | --- |
| 🗺️ Today's Adventure | A short daily trip with Sparkle: a heart word, a letter, counting, one letter to trace, and a treasure chest |
| ❤️ Heart Words | Find the word you hear · Flash cards · Build the word from letters · Say It! (record herself reading, needs the secure address) |
| 🔤 Letters | Find the letter you hear · Big & little letters · First sounds (which picture starts with B?) |
| 🔢 Counting | How many? (tap to count out loud) · Which has more or fewer? · Add & take away within 10 · Ten frame · Bunny Hop (number line) |
| 🔺 Shapes & Colors | Find the shape or color · What comes next? (patterns) · Sort into baskets |
| 📖 Reading | Sound It Out (tap letters to hear their sounds, then find the picture) · Make a Sentence from heart words · Rhyme Time |
| ✏️ Tracing | Big letters · Little letters · Numbers · My Name, traced stroke by stroke in the right order |
| 💇 Hair Salon | Pick a friend (Mia, Leo, Zuzu the monster, Kiki the cat, Grandpa Bob, Bella), then cut, comb, grow, color (even rainbow), curl, straighten, shampoo, rinse and blow-dry their bendy hair. Dress them in 13 outfits (any of 12 colors), try on hats and glasses that fit their head, add stickers and take a photo for My Pictures |
| 🎨 Free Play | Drawing pad: 35 coloring pages in 5 groups, 28 named colors, paint bucket with magic patterns (rainbow, dots, stripes, glitter, hearts), brushes, stamps, undo, save · My Pictures · Bubble pop · Animal memory match · Music Maker (xylophone and a looping song grid) · Jigsaw puzzles (built-in pictures or her drawings) · Dot to dot · Mazes |
| 🐶 My Pet | Pick a puppy, kitty, bunny or dragon; feed, wash, play ball, put to bed and dress up. Needs go down slowly while she's away; a fully happy pet earns a star once a day |
| 📚 Story Time | Six short picture books read aloud; words light up as they're read, tap any word to hear it, heart words are underlined |

Every instruction is spoken, and 🔊 repeats it, so she doesn't need to read to play. There are no timers and no way to lose: a wrong tap wiggles and she tries again. Each round finishes with a cheer and a ⭐.

## Run it

```sh
docker compose up -d --build
```

Then on the iPad, open Safari and go to `http://<this-computer's-IP>:2021`. Tap **Share → Add to Home Screen** to get a full-screen app icon.

Three containers run: `lydias-games` (the web pages, nginx), `tts` (the natural voice) and `save` (backup and the https certificates).

- After changing code: `docker compose up -d --build`
- Without Docker: `python3 -m http.server 2021` in this folder

## Heart words

- **Starter list:** `data/heart-words.json`. Docker mounts the `data/` folder, so edits show up the next time the page loads, with no rebuild.
- **On the iPad:** tap **Grown-ups ⚙️** at the bottom of the home screen and answer the multiplication question. There you can add words (separate several with commas), remove words, mark words *Learned* (learned words come up less often), and see how many she has gotten right on the first try.
- **Export / import:** **Export words** saves the list as a file with the same shape as `data/heart-words.json`, so you can drop it in as the new starter list. **Import words** loads one.

## Natural voice

Safari only lets web pages use the iPad's basic built-in voices, which sound robotic. Voices you download in iPad Settings (like Ava Premium) are **not** available to websites. Instead, `docker compose` also runs a small **text-to-speech container** (`tts/`, using [Piper](https://github.com/OHF-Voice/piper1-gpl)) that makes natural-sounding speech on your computer, with no internet or account needed once it's built.

- Two voices are included: **Lessac** (clear, the default) and **Heather** (warmer). Choose one and the speed in **Grown-ups ⚙️ → Voice**, and tap **▶ Test** to hear it.
- Each phrase is created once (about 0.1–0.2 s) and saved in the `tts-cache` volume. After that it plays instantly.
- If the container isn't running, the games use the iPad's own voice automatically, and the Grown-ups screen shows a warning.
- The image is about 680 MB: Python, the speech engine, and two voices.

## Saving drawings

Tap 💾 while drawing to save to **Free Play → My Pictures**, which keeps the newest 50 for each player (and backs them up to the computer). Tap a picture there to **keep drawing** or **delete** it. To copy one into the Photos app, open the picture, then **press and hold it → Save to Photos**.

## Stars, stickers, and surprises

- Every finished round earns a star. Every **3 stars** unlock a new sticker (42 in all), and every **10 stars** unlock a surprise: an extra outfit, hat, or glasses in the Hair Salon, or an extra coloring page. Rewards only add things; nothing that's there today gets locked.
- Tap the ⭐ counter or the **📒 My Sticker Book** tile to see her collection and how many stars until the next sticker.
- Collected stickers also show up as stamps in Draw and as stickers in the Hair Salon.

## Progress for grown-ups

**Grown-ups ⚙️ → 📈 Progress** shows rounds played each day for the last week, how often she gets each game right on the first try, the heart words she knows and the ones to practice, and the letters she mixes up (for example, *wanted B, tapped D*). **Clear progress history** resets it.

## Music

Soft background music plays after her first tap. Each area has its own song, and the music gets quieter while the voice is talking. Turn it off in **Grown-ups ⚙️ → Background music**. All three songs are CC0 (free to use); see `music/CREDITS.md`.

## Players

**Grown-ups ⚙️ → 👧 Players** adds more players (a name and a picture). Each player has their own stars, stickers, heart words, pet, pictures and progress, and the games call them by name. With more than one player, the home screen shows "who's playing" buttons. Lydia is the first player and keeps everything she already has.

## Play time and bedtime

**Grown-ups ⚙️ → ⏰ Play time** sets a daily limit (15–90 minutes) and/or a bedtime. When time is up, Sparkle falls asleep and the games rest. A grown-up can add 15 minutes, or end the limit for today, by answering a times-table question. Two minutes before the limit, Sparkle says so.

## Backup

Stars, stickers, heart words, pets, settings, progress and pictures are copied to the computer running the games (the `save` container keeps them in the `save-data` volume, plus a dated copy for each of the last 14 days). On a new iPad, after clearing Safari, or after the computer's address changes, everything comes back by itself the first time the games open. If two iPads both play, their changes are merged (star counts keep the bigger number). **Grown-ups ⚙️ → ☁️ Backup** shows when it last backed up.

There's no password on the backup; it's meant for a home network.

## Secure address (for the microphone)

Safari only allows the microphone on an `https://` address, so **Heart Words → Say It!** needs a one-time setup. The `save` container makes a small "home" certificate authority and a certificate for your computer; the iPad trusts it once.

1. Create a file named `.env` next to `docker-compose.yml` with the computer's address as the iPad sees it (see `.env.example`), e.g. `HOST_NAMES=192.168.1.50` (several: comma-separated, like `192.168.1.50,my-pc.local`). Then `docker compose up -d --build`.
2. On the iPad, open `http://<computer>:2021/lydias-games-ca.crt` and tap **Allow**.
3. **Settings → Profile Downloaded → Install**.
4. **Settings → General → About → Certificate Trust Settings** → turn on **Lydia's Games Home CA**.
5. Open `https://<computer>:2022` and **Add to Home Screen** (you can remove the old icon). Her progress comes along through the backup.

If you change `HOST_NAMES` later, run `docker compose up -d` again and then `docker compose restart lydias-games`; the iPad doesn't need to trust anything new. **Grown-ups ⚙️ → 🎤 Microphone** repeats these steps with your address filled in.

## Good to know

- **Keep the host's address fixed if you can** (a DHCP reservation on your router, or the computer's hostname). If it does change, the backup brings her progress back.
- **No offline mode.** The iPad has to be on home Wi-Fi with the containers running.
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
js/storage.js               saved data per player (localStorage keys)
js/sync.js                  backup to the computer (the save container)
js/limits.js                play-time limit and bedtime
js/trace-paths.js           how to write each letter and number (strokes in order)
js/trace-pad.js             the tracing board (Tracing and Today's Adventure)
js/stories.js               Story Time books
save/                       backup service and https certificates (Python standard library)
music/                      background songs (CC0) and credits
fonts/                      Fredoka font (SIL Open Font License)
js/words-store.js           heart words: starter file + this iPad's changes
js/gallery-store.js         saved pictures (IndexedDB on the iPad, per player)
js/coloring-pages.js        coloring page line art (add a picture: one SVG entry, white-filled shapes)
tts/                        natural-voice container (Piper text-to-speech server)
js/games/*.js               each game's logic (salon.js: hair strands are simple physics chains;
                            salon-wardrobe.js: clothes, hats and glasses drawn to fit the friend)
css/style.css               shared styles (big tap targets, no zoom/selection)
nginx*.conf, wait-for-certs.sh  web server: http on 2021, https on 2022
data/heart-words.json       starter heart words
```
