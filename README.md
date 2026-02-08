# Remove Reels & Stories

A browser extension that hides Reels, Stories, and suggested content from your Facebook feed.

## Features

- **Hide Reels**: Removes all Reels from your feed
- **Hide Stories**: Removes the Stories section while keeping profile pictures visible
- **Hide Suggested Posts**: Removes posts with a "Follow" button (content from pages/people you don't follow)
- **Word Blacklist**: Hide any post containing specific keywords

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the extension folder
5. The extension is now active on Facebook

## Usage

Click the extension icon in your toolbar to open the settings popup. Toggle features on or off. For the word blacklist, enable it and type words to filter out.

## Project Structure

```
├── manifest.json   — Extension configuration
├── FBCleaner.js    — Content script (runs on Facebook)
├── popup.html      — Settings popup UI
├── popup.js        — Popup logic and settings management
└── icons/          — Extension icons (16, 48, 128px PNGs)
```

## Permissions

- **storage** To save your settings

## Notes

- Works on `facebook.com` and `fb.com`
- If Facebook changes their page structure, selectors may need updating
- Profile pictures are preserved even when hiding stories
- Not affiliated with Facebook/Meta

## License

Open source. Use and modify as you like.
