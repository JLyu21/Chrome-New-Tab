# Jay New Tab Dashboard

A Manifest V3 Chrome new tab extension built with plain HTML, CSS, and JavaScript.

## Features

- Full-screen animated anime wallpaper background
- Transparent glass dashboard UI
- Google search and URL launching from the new tab
- Live clock, date, selectable time zone, day progress, and year progress
- Editable app shortcuts saved in `localStorage`
- Calendar with month navigation
- Light/dark mode toggle and focus mode
- Now Playing panel for browser-tab audio
- Media controls for supported browser tabs: play/pause, previous, next, seek back, seek forward, mute, and open tab
- Browser media metadata when available: title, artist/source, playback time, favicon, cover art, or video thumbnail

## Media Player Notes

The Now Playing panel works with audio or video playing in Chrome tabs, such as YouTube, Spotify Web, and Netease Web. It uses Chrome tab access plus page scripting to read browser-page metadata and send playback commands.

It cannot read Spotify desktop, Netease desktop, or other system-wide audio by itself. That would require a separate native Windows helper outside the Chrome extension.

Some websites expose rich metadata through the Media Session API, while others only expose a page title or thumbnail. When full metadata is blocked or unavailable, the panel falls back to the tab title, site name, and favicon.

## Permissions

- `tabs`: finds the browser tab that is playing audio and supports opening or muting it.
- `scripting`: reads metadata from the playing tab and sends playback commands.
- `http://*/*` and `https://*/*`: allows the metadata/player script to run on normal web pages.

After updating permissions, reload the unpacked extension in `chrome://extensions`. If Chrome still shows an old error, remove the extension and load this folder again.

## Files

- `manifest.json` - Manifest V3 extension config and permissions
- `newtab.html` - New tab page markup
- `styles.css` - Dashboard layout, glass theme, responsive styling, and media player styling
- `script.js` - Clock, search, shortcuts, calendar, theme state, and media player logic
- `assets/anime-wallpaper.mp4` - Looping animated background video
- `assets/dragon-background.png` - Packaged background asset retained in the repo
- `assets/samurai-background.jpg` - Packaged background asset retained in the repo

## Load In Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `C:\Projects\Chome New Tab`.
5. Open a new tab.

When changing `manifest.json`, click the extension reload button in `chrome://extensions` before testing a new tab.

## Firefox Testing

The UI is mostly standard web code, and the manifest includes Firefox metadata, but the media player is primarily built for Chrome's MV3 `chrome.tabs` and `chrome.scripting` APIs.

For temporary Firefox testing:

1. Open Firefox and go to `about:debugging`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on...**.
4. Select `manifest.json` from this folder.

Temporary Firefox add-ons are removed when Firefox restarts. A permanent Firefox install would need packaging and signing through Mozilla.
