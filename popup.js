(function initPopup() {
  "use strict";

  const downloadButton = document.querySelector("#downloadFavorites");
  const uploadButton = document.querySelector("#uploadFavorites");
  const fileInput = document.querySelector("#favoritesFile");
  const status = document.querySelector("#status");

  function setStatus(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  function setBusy(isBusy) {
    downloadButton.disabled = isBusy;
    uploadButton.disabled = isBusy;
  }

  async function currentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0] || !tabs[0].id) throw new Error("No active tab found.");
    return tabs[0];
  }

  async function uploadToCurrentTab(favorites) {
    const tab = await currentTab();
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [favorites],
      func: (favoritesArg) => {
        const hasFreetarShape = Boolean(
          document.querySelector("#results")
          || document.querySelector("input[name='search_term']")
          || document.querySelector("meta[name='description']")?.content?.includes("freetar")
          || document.title.toLowerCase().includes("freetar")
        );
        if (!hasFreetarShape) {
          throw new Error("The active tab does not look like a Freetar page.");
        }
        const normalized = {};
        for (const [key, value] of Object.entries(favoritesArg || {})) {
          const url = String(value.tab_url || key).split("#")[0].split("?")[0];
          normalized[url] = {
            artist_name: String(value.artist_name || ""),
            song: String(value.song || ""),
            rating: String(value.rating || "0"),
            type: String(value.type || "Chords"),
            tab_url: url
          };
        }
        localStorage.setItem("favorites", JSON.stringify(normalized));
        location.reload();
        return { count: Object.keys(normalized).length };
      }
    });
    return result;
  }

  downloadButton.addEventListener("click", async () => {
    setBusy(true);
    setStatus("Reading Ultimate Guitar favorites...", "");
    try {
      const response = await chrome.runtime.sendMessage({ type: "downloadFavorites" });
      if (!response?.ok) throw new Error(response?.error || "Download failed.");
      setStatus(`Downloaded ${response.count} favorite${response.count === 1 ? "" : "s"}.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  });

  uploadButton.addEventListener("click", () => {
    fileInput.value = "";
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    if (!fileInput.files?.[0]) return;
    setBusy(true);
    setStatus("Uploading favorites into Freetar...", "");
    try {
      const text = await fileInput.files[0].text();
      const parsed = FreetarFavoritesHelper.parseJsonMaybe(text);
      const normalized = FreetarFavoritesHelper.normalizeFavorites(parsed);
      if (Object.keys(normalized).length === 0) {
        throw new Error("That file did not contain any recognizable Ultimate Guitar tab favorites.");
      }
      const result = await uploadToCurrentTab(normalized);
      setStatus(`Uploaded ${result.count} favorite${result.count === 1 ? "" : "s"}.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  });
})();
