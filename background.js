importScripts("shared.js");

const FAVORITES_URL = "https://www.ultimate-guitar.com/user/mytabs";

function makeExportFile(favorites) {
  const payload = FreetarFavoritesHelper.stringifyFavorites(favorites);
  return {
    count: Object.keys(JSON.parse(payload)).length,
    url: `data:application/json;charset=utf-8,${encodeURIComponent(payload)}`
  };
}

async function fetchFavoritesPage(url) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.text();
}

async function readFavoritesFromUltimateGuitar() {
  const html = await fetchFavoritesPage(FAVORITES_URL);
  const favorites = FreetarFavoritesHelper.extractFavoritesFromHtml(html);

  if (Object.keys(favorites).length === 0) {
    throw new Error("No Ultimate Guitar favorites were found on /user/mytabs. Make sure you are logged in and have saved tabs there.");
  }

  return favorites;
}

async function downloadFavorites() {
  const favorites = await readFavoritesFromUltimateGuitar();
  const file = makeExportFile(favorites);
  await chrome.downloads.download({
    url: file.url,
    filename: "freetar-favorites.json",
    saveAs: false
  });
  return { count: file.count };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "downloadFavorites") return false;

  downloadFavorites()
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
