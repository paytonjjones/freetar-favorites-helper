const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sharedSource = fs.readFileSync(path.join(__dirname, "..", "shared.js"), "utf8");
const context = { console, URL };
vm.createContext(context);
vm.runInContext(sharedSource, context);

const helper = context.FreetarFavoritesHelper;

const favorites = helper.normalizeFavorites({
  tabs: [
    {
      artist_name: "The Cure",
      song_name: "Just Like Heaven",
      rating: 4.8,
      type_name: "Chords",
      tab_url: "https://tabs.ultimate-guitar.com/tab/the-cure/just-like-heaven-chords-12345?app_utm=foo"
    },
    {
      artist: "Pixies",
      title: "Where Is My Mind",
      url: "https://tabs.ultimate-guitar.com/tab/pixies/where-is-my-mind-tabs-67890"
    }
  ]
});

assert.equal(Object.keys(favorites).length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(favorites["/tab/the-cure/just-like-heaven-chords-12345"])), {
  artist_name: "The Cure",
  song: "Just Like Heaven",
  rating: "4.8",
  type: "Chords",
  tab_url: "/tab/the-cure/just-like-heaven-chords-12345"
});

const html = `
  <div class="js-store" data-content="{&quot;store&quot;:{&quot;page&quot;:{&quot;data&quot;:{&quot;tabs&quot;:[{&quot;artist_name&quot;:&quot;Radiohead&quot;,&quot;song_name&quot;:&quot;No Surprises&quot;,&quot;tab_url&quot;:&quot;https://tabs.ultimate-guitar.com/tab/radiohead/no-surprises-chords-987&quot;,&quot;type_name&quot;:&quot;Chords&quot;}]}}}}"></div>
`;
const fromHtml = helper.extractFavoritesFromHtml(html);
assert.equal(Object.keys(fromHtml).length, 1);
assert.equal(fromHtml["/tab/radiohead/no-surprises-chords-987"].song, "No Surprises");

const reorderedAttributeHtml = `
  <div data-content="{&amp;quot;store&amp;quot;:{&amp;quot;tabs&amp;quot;:[{&amp;quot;artist&amp;quot;:&amp;quot;Bowie&amp;quot;,&amp;quot;title&amp;quot;:&amp;quot;Heroes&amp;quot;,&amp;quot;url&amp;quot;:&amp;quot;https://tabs.ultimate-guitar.com/tab/david-bowie/heroes-chords-222&amp;quot;}]}}" class="foo js-store bar"></div>
`;
const fromReorderedHtml = helper.extractFavoritesFromHtml(reorderedAttributeHtml);
assert.equal(Object.keys(fromReorderedHtml).length, 1);
assert.equal(fromReorderedHtml["/tab/david-bowie/heroes-chords-222"].artist_name, "Bowie");

const freetarJson = helper.stringifyFavorites(favorites);
assert.doesNotThrow(() => JSON.parse(freetarJson));

console.log("shared tests passed");
