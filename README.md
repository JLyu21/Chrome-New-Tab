# Jay New Tab Dashboard (Manifest V3)

A plain HTML/CSS/JavaScript new tab browser extension for Chrome (MV3), with:

- Custom new tab dashboard UI
- Live clock and date
- Calendar in the left dashboard column
- Google search and URL launching
- App shortcuts persisted in `localStorage`
- Sports scoreboard cards
- Day and year progress widget
- Packaged anime dragon background image at `assets/dragon-background.png`
- Light/dark mode toggle

## Files

- `manifest.json` - Extension manifest (MV3) with new tab override
- `newtab.html` - New tab page markup
- `styles.css` - Dashboard styling and theme variables
- `script.js` - App logic and persistence

## Load in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this folder: `C:\Projects\Chome New Tab`.
5. Open a new tab to see the dashboard.

## Cross-browser notes

- The extension uses standard web APIs and should work in Chromium-based browsers that support MV3.
- `browser_specific_settings` is included for Firefox metadata, but Firefox has partial MV3 differences. If needed, a separate Firefox packaging pass can be added later.
