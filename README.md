# Jay New Tab Dashboard (Manifest V3)

A plain HTML/CSS/JavaScript new tab browser extension for Chrome (MV3), with:

- Custom new tab dashboard UI
- Live clock and date
- Chinese New Year countdown with zodiac details
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

## Load in Firefox for testing

1. Open Firefox and go to `about:debugging`.
2. Click **This Firefox** in the left sidebar.
3. Click **Load Temporary Add-on...**.
4. Select `manifest.json` from this folder: `C:\Projects\Chome New Tab`.
5. Open a new tab to see the dashboard.

Temporary Firefox add-ons are removed when Firefox restarts. For a permanent install, package the extension as an `.xpi` and submit it to Mozilla for signing through Add-ons Developer Hub.

## Cross-browser notes

- The extension uses standard web APIs and should work in Chromium-based browsers that support MV3.
- `chrome_url_overrides.newtab` is supported in Firefox for replacing the new tab page.
- `browser_specific_settings` is included for Firefox metadata, but Firefox has partial MV3 differences. If needed, a separate Firefox packaging pass can be added later.
