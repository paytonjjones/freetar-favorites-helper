(function attachShared(globalScope) {
  "use strict";

  const TYPE_MAP = {
    Chords: "Chords",
    chords: "Chords",
    Tabs: "Tabs",
    tab: "Tabs",
    "Bass Tabs": "Bass Tabs",
    bass: "Bass Tabs",
    "Ukulele Chords": "Ukulele Chords",
    ukulele: "Ukulele Chords",
    "Guitar Pro": "Pro",
    Pro: "Pro",
    Official: "Official"
  };

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value), "https://www.ultimate-guitar.com");
      url.hash = "";
      url.search = "";
      return url.href;
    } catch (_error) {
      return String(value).split("#")[0].split("?")[0];
    }
  }

  function tabPath(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value), "https://www.ultimate-guitar.com");
      return url.pathname.replace(/\/+$/, "");
    } catch (_error) {
      return String(value).split("#")[0].split("?")[0];
    }
  }

  function normalizeType(value) {
    const cleaned = cleanText(value);
    return TYPE_MAP[cleaned] || cleaned || "Chords";
  }

  function isUltimateGuitarTabUrl(value) {
    const url = canonicalUrl(value);
    return /^https:\/\/(?:tabs\.ultimate-guitar\.com|www\.ultimate-guitar\.com)\//.test(url)
      && /\/tab\//.test(url);
  }

  function inferNamesFromUrl(value) {
    const url = canonicalUrl(value);
    const match = url.match(/\/tab\/([^/]+)\/([^/?#]+)/);
    if (!match) return {};
    const toTitle = (part) => cleanText(
      decodeURIComponent(part)
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
    return {
      artist_name: toTitle(match[1]),
      song: toTitle(match[2])
    };
  }

  function normalizeFavorite(input) {
    if (!input || typeof input !== "object") return null;

    const url = canonicalUrl(
      input.tab_url
      || input.url
      || input.href
      || input.web_url
      || input.share_url
      || input.song_url
    );
    const path = tabPath(
      input.tab_url
      || input.url
      || input.href
      || input.web_url
      || input.share_url
      || input.song_url
    );
    if (!path || !/^\/tab\//.test(path)) return null;

    const inferred = inferNamesFromUrl(url);
    const artist = cleanText(
      input.artist_name
      || input.artist
      || input.artistName
      || input.artist_name_search
      || inferred.artist_name
    );
    const song = cleanText(
      input.song
      || input.song_name
      || input.songName
      || input.title
      || input.text
      || input.textContent
      || input.name
      || inferred.song
    );

    if (!artist || !song) return null;

    return {
      artist_name: artist,
      song,
      rating: cleanText(input.rating || input.votes || input.rate || "0"),
      type: normalizeType(input.type || input.tab_type || input.type_name || input.version || "Chords"),
      tab_url: path
    };
  }

  function normalizeFavorites(input) {
    const candidates = [];
    const seenObjects = new WeakSet();

    function visit(value) {
      if (value == null) return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value !== "object") return;
      if (seenObjects.has(value)) return;
      seenObjects.add(value);

      const normalized = normalizeFavorite(value);
      if (normalized) candidates.push(normalized);

      for (const child of Object.values(value)) {
        if (child && typeof child === "object") visit(child);
      }
    }

    visit(input);

    const byUrl = {};
    for (const favorite of candidates) {
      byUrl[tabPath(favorite.tab_url)] = favorite;
    }
    return byUrl;
  }

  function parseJsonMaybe(value) {
    if (value && typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try {
      return JSON.parse(value);
    } catch (_error) {
      return null;
    }
  }

  function htmlDecode(value) {
    return String(value || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, "\"")
      .replace(/&#034;/g, "\"")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }

  function extractStoreJson(html) {
    const divs = String(html || "").match(/<div\b[^>]*>/gi) || [];
    for (const div of divs) {
      const classMatch = div.match(/\bclass=["']([^"']*)["']/i);
      if (!classMatch || !classMatch[1].split(/\s+/).includes("js-store")) continue;
      const dataMatch = div.match(/\bdata-content=(["'])(.*?)\1/i);
      if (!dataMatch) continue;
      const parsed = parseJsonMaybe(htmlDecode(dataMatch[2]));
      if (parsed) return parsed;
    }
    return null;
  }

  function extractFavoritesFromHtml(html) {
    return normalizeFavorites(extractStoreJson(html));
  }

  function stringifyFavorites(favorites) {
    const normalized = normalizeFavorites(favorites);
    return JSON.stringify(normalized, null, 2);
  }

  globalScope.FreetarFavoritesHelper = {
    canonicalUrl,
    cleanText,
    extractFavoritesFromHtml,
    extractStoreJson,
    normalizeFavorite,
    normalizeFavorites,
    parseJsonMaybe,
    tabPath,
    stringifyFavorites
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
