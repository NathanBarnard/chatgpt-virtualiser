# ChatGPT Conversation Virtualiser

A Chrome extension that improves performance in long ChatGPT conversations by hiding older messages and revealing them progressively as you scroll.

## Why?

Long ChatGPT conversations with hundreds of messages can become sluggish. This extension "virtualises" the conversation by keeping only a few viewport-heights of content in the DOM at any time, hiding the rest. Scroll up to seamlessly reveal older messages.

## Features

- **Smart page-based hiding** — Calculates how many messages fit in ~3 screen heights rather than a fixed count
- **Progressive reveal** — Scroll up to reveal ~1 page of messages at a time
- **Per-conversation toggle** — Enable/disable via the header button next to "Share"
- **Persistent settings** — Remembers which conversations have virtualisation enabled
- **Native-looking UI** — Styled to match ChatGPT's design language

## Installation

1. Clone or download this repository
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `chatgpt-virtualiser` folder

## Usage

1. Open any ChatGPT conversation at `chatgpt.com/c/...`
2. Click the **Virtualise** button in the header (next to Share)
3. Older messages are hidden; a banner shows how many

To reveal hidden messages:
- **Scroll up** — Messages reveal automatically as you approach the placeholder
- **Click the placeholder** — Reveals the next batch immediately

To disable, click the **Reveal** button. A confirmation modal appears if there are hidden messages.

## Project Structure

```
chatgpt-virtualiser/
├── manifest.json              # Chrome extension manifest (v3)
├── styles.css                 # UI styles (placeholder, toast, modal, button)
├── src/
│   ├── main.js                # Entry point, initialization, URL change handling
│   ├── virtualiser-pages.js   # Core logic: page-based hide/reveal algorithm
│   ├── actions.js             # Enable/disable actions with UI feedback
│   ├── button-injector.js     # Header button injection & positioning
│   ├── storage.js             # Chrome storage for per-conversation settings
│   ├── ui.js                  # DOM utilities: toast, modal, placeholder
│   └── icons.js               # SVG icon definitions
└── icons/                     # Extension icons (PNG)
```

## Configuration

Edit constants in `src/virtualiser-pages.js`:

```javascript
VISIBLE_PAGES: 3,      // Viewport heights of content to keep visible
REVEAL_PAGES: 1,       // Viewport heights of content revealed per batch
REVEAL_MARGIN: 200,    // Pixels before viewport to trigger reveal
```

## How It Works

1. **Detection** — Finds all `article[data-turn-id]` elements (ChatGPT's message containers)
2. **Calculation** — Measures message heights from bottom until ~3 viewport heights are filled
3. **Hiding** — Sets `display: none` on older messages and marks them with a data attribute
4. **Placeholder** — Inserts a clickable banner showing the hidden count
5. **IntersectionObserver** — Watches the placeholder; when it approaches the viewport, reveals the next batch
6. **Scroll anchoring** — After revealing, scrolls to keep position stable
7. **Persistence** — Stores enabled conversation IDs in `chrome.storage.local`

## Technical Notes

- The button is injected as a fixed-position overlay outside React's DOM tree to avoid being removed by React's reconciliation
- Handles SPA navigation by observing URL changes and re-applying virtualisation
- Messages are measured temporarily (shown/hidden) to calculate accurate heights

## Permissions

- `storage` — Save per-conversation virtualisation settings
- Host access to `chatgpt.com` and `chat.openai.com` — Inject the content script

## License

MIT
