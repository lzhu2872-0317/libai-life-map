(function () {
  "use strict";

  const DATA_FILES = {
    cnkgraphLike: "data/cnkgraph-like-libai.json",
    locations: "data/locations.json",
    poems: "data/poems.json",
    timeline: "data/timeline.json",
    biography: "data/biography.json"
  };

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load: ${path}`);
    }
    return response.json();
  }

  function readFallbackData() {
    const script = document.getElementById("fallback-data");
    if (!script) {
      throw new Error("Missing fallback-data");
    }
    return JSON.parse(script.textContent);
  }

  function localize(data) {
    return window.LiBaiTranslations ? window.LiBaiTranslations.localizeData(data) : data;
  }

  async function loadAllData() {
    try {
      if (window.LiBaiTeiDataLoader) {
        return localize(await window.LiBaiTeiDataLoader.loadDocsData());
      }
    } catch (error) {
      console.warn("TEI docs data load failed, fallback to local JSON.", error);
    }

    try {
      const cnkgraphLike = await fetchJson(DATA_FILES.cnkgraphLike);
      if (window.LiBaiCnkgraphAdapter && cnkgraphLike?.Traces?.length) {
        return localize(window.LiBaiCnkgraphAdapter.adapt(cnkgraphLike));
      }
    } catch (error) {
      // Continue to the original local JSON data if the modeled file is absent or fails to load.
    }

    try {
      const [locations, poems, timeline, biography] = await Promise.all([
        fetchJson(DATA_FILES.locations),
        fetchJson(DATA_FILES.poems),
        fetchJson(DATA_FILES.timeline),
        fetchJson(DATA_FILES.biography)
      ]);
      return localize({ locations, poems, timeline, biography, source: "json" });
    } catch (error) {
      const fallback = readFallbackData();
      return localize({
        locations: fallback.locations,
        poems: fallback.poems,
        timeline: fallback.timeline,
        biography: fallback.biography,
        source: "inline",
        warning: error.message
      });
    }
  }

  function createIndexes(data) {
    const locationsById = new Map(data.locations.locations.map((location) => [location.id, location]));
    const poemsById = new Map(data.poems.poems.map((poem) => [poem.id, poem]));
    const eventsById = new Map(data.timeline.events.map((event) => [event.id, event]));
    const poemsByLocation = new Map();
    const eventsByLocation = new Map();

    data.poems.poems.forEach((poem) => {
      if (!poemsByLocation.has(poem.locationId)) {
        poemsByLocation.set(poem.locationId, []);
      }
      poemsByLocation.get(poem.locationId).push(poem);
    });

    data.timeline.events.forEach((event) => {
      if (!eventsByLocation.has(event.locationId)) {
        eventsByLocation.set(event.locationId, []);
      }
      eventsByLocation.get(event.locationId).push(event);
    });

    return {
      locationsById,
      poemsById,
      eventsById,
      poemsByLocation,
      eventsByLocation
    };
  }

  window.LiBaiDataLoader = {
    loadAllData,
    createIndexes
  };
})();
