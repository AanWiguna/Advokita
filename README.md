Advokita — Local Preview & Test Instructions

This workspace contains a small static front-end for the Advokita demo app. Changes include:
- Linked pages (auth, auth-only, home/chat, saved)
- Shared assets: assets/styles.css and assets/app.js
- Chat UI with dummy bot replies
- Animations and nicer button styles
- Saved items: view detail (alert) and delete

How to preview locally

Option A — Open HTML directly (quick):
- Double-click any file (e.g. advokita_home.html) in your file manager to open it in the browser.

Option B — Serve using a simple local HTTP server (recommended)
- From a shell in the Advokita folder run (PowerShell):

  python -m http.server 3000; Start-Process "http://localhost:3000/advokita_home.html"

- Or using Node (if installed):

  npx http-server -p 3000

Manual checks to try
- advokita_auth.html / advokita_auth_only.html:
  - Click Log In / Sign In / "Lanjutkan dengan Google" to go to home (dummy navigation)
- advokita_home.html:
  - Toggle sidebar with the menu button
  - Click "Buat percakapan baru" to clear chat and start over
  - Type a message in the input and press Enter or click the send button — the bot will reply with a dummy response
  - Click the "Keluar" link to return to the auth page (dummy)
- advokita_saved.html:
  - Click "Lihat Detail" to see the item content (alert)
  - Click "Hapus" to remove the saved item

If you'd like, I can:
- Add more realistic sample responses or a fake API endpoint
- Improve animations and add accessibility features
- Replace the JS with a local module bundler build for a more robust dev workflow

(If you want me to continue, tell me which improvements you'd prefer next.)
