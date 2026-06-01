(function initPopup() {
  "use strict";

  const downloadButton = document.querySelector("#downloadFavorites");
  const uploadButton = document.querySelector("#uploadFavorites");
  const clearButton = document.querySelector("#clearFavorites");
  const fileInput = document.querySelector("#favoritesFile");
  const status = document.querySelector("#status");

  function setStatus(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  function setBusy(isBusy) {
    downloadButton.disabled = isBusy;
    uploadButton.disabled = isBusy;
    clearButton.disabled = isBusy;
  }

  async function currentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0] || !tabs[0].id) throw new Error("No active tab found.");
    return tabs[0];
  }

  function requireFreetarTab(tab) {
    const url = String(tab?.url || "");
    if (/^chrome:\/\//i.test(url)) {
      throw new Error("Switch to a Freetar tab first. Chrome blocks extensions from reading chrome:// pages, and this action only works on the active Freetar tab.");
    }
    const hasFreetarShape = Boolean(
      url.startsWith("https://freetar.de")
      || url.startsWith("https://www.freetar.de")
      || url.startsWith("http://freetar.de")
      || url.startsWith("http://www.freetar.de")
    );
    if (!hasFreetarShape) {
      throw new Error("Switch to the Freetar tab you want to update, keep it focused, and try again. This action only runs on the active Freetar page.");
    }
  }

  async function uploadToCurrentTab(favorites) {
    const tab = await currentTab();
    requireFreetarTab(tab);
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
          const tabUrl = FreetarFavoritesHelper.tabPath(value.tab_url || key);
          normalized[tabUrl] = {
            artist_name: String(value.artist_name || ""),
            song: String(value.song || ""),
            rating: String(value.rating || "0"),
            type: String(value.type || "Chords"),
            tab_url: tabUrl
          };
        }
        localStorage.setItem("favorites", JSON.stringify(normalized));
        setTimeout(() => location.reload(), 0);
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

  clearButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Clear all favorites from the active Freetar tab? This will delete the local favorites stored in that tab.");
    if (!confirmed) return;

    setBusy(true);
    setStatus("Clearing favorites from Freetar...", "");
    try {
      const tab = await currentTab();
      requireFreetarTab(tab);
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const hasFreetarShape = Boolean(
            document.querySelector("#results")
            || document.querySelector("input[name='search_term']")
            || document.querySelector("meta[name='description']")?.content?.includes("freetar")
            || document.title.toLowerCase().includes("freetar")
          );
          if (!hasFreetarShape) {
            throw new Error("The active tab does not look like a Freetar page.");
          }
          localStorage.removeItem("favorites");
          setTimeout(() => location.reload(), 0);
          return { count: 0 };
        }
      });
      setStatus("Cleared all favorites from Freetar.", "success");
      return result;
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  });
})();
