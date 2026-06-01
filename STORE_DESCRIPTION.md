# Store Description

Freetar Favorites Helper moves your saved Ultimate Guitar tabs into Freetar in a few clicks. Use it to download favorites from your logged-in Ultimate Guitar `My tabs` page, then import them into Freetar without re-entering anything by hand.

Install it if you already keep tabs saved in Ultimate Guitar and want them available inside Freetar. It keeps the workflow simple, uses only the personal `My tabs` page, and includes a clear-all option if you want to reset the favorites stored in Freetar.

## Suggested Chrome Web Store Text

**Short description**

Move saved Ultimate Guitar tabs into Freetar.

**Long description**

Freetar Favorites Helper helps you transfer your saved Ultimate Guitar tabs into Freetar quickly and reliably.

Download favorites from your logged-in Ultimate Guitar `My tabs` page, then upload the exported file into Freetar. The extension helps you avoid tediously searching for dozens of tabs, making it easy to move your collection into Freetar.

## Chrome Web Store Justifications

**activeTab**

Used to access the currently open tab only after you click the extension, so the popup can read from Ultimate Guitar or update the active Freetar tab.

**downloads**

Used to save the exported favorites JSON file locally so you can import it into Freetar later.

**scripting**

Used to inject a small script into the active Freetar tab so the extension can write favorites into the page's local storage and refresh it.

**Host permission**

Used only for `https://*.ultimate-guitar.com/*` so the extension can read your logged-in Ultimate Guitar `My tabs` page and fetch your personal favorites.

**Remote code**

No. The extension does not load JavaScript or Wasm from external sources, use `eval()`, or reference remote modules or scripts.
