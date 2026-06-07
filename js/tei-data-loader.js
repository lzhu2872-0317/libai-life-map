(function () {
  "use strict";

  const STAGE_FILES = [
    {
      id: "stage1",
      key: "stage1-youth",
      label: "Stage 1",
      title: "Youth in Shu",
      years: "701-725",
      path: "docs/stage1-youth_tei.xml"
    },
    {
      id: "stage2",
      key: "stage2-travels",
      label: "Stage 2",
      title: "Leaving Shu and Wandering",
      years: "725-741",
      path: "docs/stage2-travels_tei.xml"
    },
    {
      id: "stage3",
      key: "stage3-changan",
      label: "Stage 3",
      title: "Chang'an Period",
      years: "742-744",
      path: "docs/stage3-changan_tei.xml"
    },
    {
      id: "stage4",
      key: "stage4-exile-late",
      label: "Stage 4",
      title: "Exile, Turmoil, and Late Years",
      years: "745-762",
      path: "docs/stage4-exile-late_tei.xml"
    }
  ];

  const SUMMARY_PATH = "docs/libai_4period_summary(1).csv";
  const THEME_DENSITY_PATH = "docs/libai_4period_theme_density.csv";

  function text(node, selector) {
    return node.querySelector(selector)?.textContent?.trim() || "";
  }

  function attr(node, selector, name) {
    return node.querySelector(selector)?.getAttribute(name) || "";
  }

  function firstByTag(node, tagName) {
    return node.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", tagName)[0]
      || node.getElementsByTagName(tagName)[0];
  }

  function allByTag(node, tagName) {
    const namespaced = Array.from(node.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", tagName));
    return namespaced.length ? namespaced : Array.from(node.getElementsByTagName(tagName));
  }

  function notesByType(node, type) {
    return allByTag(node, "note").find((note) => note.getAttribute("type") === type)?.textContent?.trim() || "";
  }

  function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  function parseCsv(csv) {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    const headers = parseCsvLine(lines.shift());
    return lines.map((line) => {
      const cells = parseCsvLine(line);
      return headers.reduce((row, header, index) => {
        row[header] = cells[index] || "";
        return row;
      }, {});
    });
  }

  function normalizeId(value) {
    if (window.LiBaiTranslations) {
      return window.LiBaiTranslations.placeId(value);
    }
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/stage\s*/i, "stage")
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function parseTeiStage(xmlText, stageConfig) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const teiNodes = Array.from(doc.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", "TEI"));

    const poems = teiNodes.map((tei, index) => {
      const title = firstByTag(tei, "title")?.textContent?.trim() || firstByTag(tei, "head")?.textContent?.trim() || `Untitled ${index + 1}`;
      const year = Number(firstByTag(tei, "date")?.getAttribute("when") || 0);
      const age = Number(notesByType(tei, "approxAge") || 0);
      const characterCount = Number(notesByType(tei, "characterCount") || 0);
      const lineCount = Number(notesByType(tei, "lineCount") || 0);
      const rawPlaceName = firstByTag(tei, "placeName")?.textContent?.trim() || "Unknown";
      const placeName = window.LiBaiTranslations ? window.LiBaiTranslations.placeName(rawPlaceName) : rawPlaceName;
      const geo = (firstByTag(tei, "geo")?.textContent?.trim() || "").split(/\s+/).map(Number);
      const lines = allByTag(tei, "l").map((line) => line.textContent.trim());
      const themes = allByTag(tei, "term").map((term) => {
        const value = term.textContent.trim();
        return window.LiBaiTranslations ? window.LiBaiTranslations.theme(value) : value;
      });

      return {
        id: tei.getAttribute("xml:id") || `${stageConfig.id}-${index + 1}`,
        title,
        year,
        age,
        characterCount,
        lineCount,
        locationId: normalizeId(rawPlaceName),
        locationName: placeName,
        lat: geo[0],
        lng: geo[1],
        genre: "Poem",
        excerpt: lines.slice(0, 2).join(" "),
        lines,
        theme: themes,
        summary: `${year || stageConfig.years}, ${placeName}, ${themes.slice(0, 4).join(" / ")}`,
        stageId: stageConfig.id
      };
    });

    return {
      ...stageConfig,
      poems
    };
  }

  function aggregateLocations(stages) {
    const byId = new Map();
    stages.forEach((stage) => {
      stage.poems.forEach((poem) => {
        if (!Number.isFinite(poem.lat) || !Number.isFinite(poem.lng)) return;
        if (!byId.has(poem.locationId)) {
          byId.set(poem.locationId, {
            id: poem.locationId,
            name: poem.locationName,
            ancientName: poem.locationName,
            province: "",
            lat: poem.lat,
            lng: poem.lng,
            years: [],
            period: "Poetic Composition Site",
            category: "poem",
            importance: 2,
            poemCount: 0,
            eventIds: [],
            poemIds: [],
            summary: "",
            image: window.LiBaiTranslations ? window.LiBaiTranslations.placeImage(poem.locationId) : `assets/images/location-${poem.locationId}.svg`,
            stageCounts: {}
          });
        }
        const location = byId.get(poem.locationId);
        location.years.push(poem.year);
        location.poemCount++;
        location.importance = Math.min(5, 1 + Math.ceil(location.poemCount / 8));
        location.poemIds.push(poem.id);
        location.stageCounts[poem.stageId] = (location.stageCounts[poem.stageId] || 0) + 1;
        location.summary = `${location.name}: ${location.poemCount} poems, mainly distributed in ${Object.keys(location.stageCounts).join(", ")}.`;
      });
    });

    return Array.from(byId.values()).map((location) => ({
      ...location,
      years: Array.from(new Set(location.years.filter(Boolean))).sort((a, b) => a - b)
    }));
  }

  function buildEvents(stages, summaryRows) {
    return stages.map((stage, index) => {
      const summary = summaryRows[index] || {};
      const rawTopPlaces = summary.main_places || stage.poems
        .slice(0, 8)
        .map((poem) => poem.locationName)
        .join("; ");
      const topPlaces = window.LiBaiTranslations ? window.LiBaiTranslations.mainPlaces(rawTopPlaces) : rawTopPlaces;
      const topThemes = summary.top_themes_per_100_chars
        ? (window.LiBaiTranslations ? window.LiBaiTranslations.themeDensity(summary.top_themes_per_100_chars) : summary.top_themes_per_100_chars)
        : "see the charts below";
      const firstPoemWithGeo = stage.poems.find((poem) => Number.isFinite(poem.lat) && Number.isFinite(poem.lng));
      return {
        id: `${stage.id}-overview`,
        year: Number(stage.years.match(/\d{3}/)?.[0] || 0),
        title: stage.label,
        locationId: firstPoemWithGeo ? firstPoemWithGeo.locationId : "",
        type: "stage",
        summary: `${stage.title}, ${summary.poems || stage.poems.length} poems, main places: ${topPlaces}`,
        detail: `Years: ${stage.years}; average age: ${summary.avg_age || "unknown"}; theme density: ${topThemes}.`,
        stageId: stage.id
      };
    });
  }

  function buildVoyantStats(stages) {
    const focusTerms = ["月", "酒", "山", "客", "愁", "云", "水", "风", "天", "人", "别", "君"];
    const stopChars = new Set("，。！？；：、（）《》〈〉“”‘’·—- \n\r\t之一不有无在我君人君兮其而以于与为来去中上下一何谁此相");
    const stageWordClouds = [];
    const trends = focusTerms.map((term) => ({ term, values: [] }));

    stages.forEach((stage) => {
      const text = stage.poems.flatMap((poem) => poem.lines || []).join("");
      const charCounts = new Map();
      Array.from(text).forEach((char) => {
        if (!/[\u4e00-\u9fa5]/.test(char) || stopChars.has(char)) return;
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      });

      const topWords = Array.from(charCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 36)
        .map(([word, count]) => ({ word, count }));

      stageWordClouds.push({
        stageId: stage.id,
        stageLabel: stage.label,
        stageTitle: stage.title,
        years: stage.years,
        totalChars: text.length,
        topWords
      });

      trends.forEach((trend) => {
        const count = Array.from(text.matchAll(new RegExp(trend.term, "g"))).length;
        trend.values.push({
          stageId: stage.id,
          stageLabel: stage.label,
          stageTitle: stage.title,
          count,
          per1000: text.length ? Number((count / text.length * 1000).toFixed(2)) : 0
        });
      });
    });

    return { focusTerms, stageWordClouds, trends };
  }

  function buildInternalData(stages, summaryRows, densityRows) {
    const locations = aggregateLocations(stages);
    const poems = stages.flatMap((stage) => stage.poems);
    const events = buildEvents(stages, summaryRows);
    const firstLocationIds = stages.map((stage) => {
      const first = stage.poems.find((poem) => Number.isFinite(poem.lat) && Number.isFinite(poem.lng));
      return first?.locationId;
    }).filter(Boolean);

    return {
      locations: {
        meta: {
          title: "Li Bai Four-Stage Poetry Map",
          center: { lat: 34.2, lng: 104.8 },
          zoom: 4,
          period: "701-762",
          description: "Generated from four-stage TEI and CSV files in docs."
        },
        routeOrder: firstLocationIds,
        locations,
        geojson: { type: "FeatureCollection", features: [] }
      },
      timeline: { meta: { title: "Li Bai Four Stages", range: [701, 762] }, events },
      poems: { meta: { title: "Li Bai Four-Stage Poems", note: "Parsed from TEI." }, poems, themes: [] },
      biography: {
        profile: {
          name: "Li Bai",
          courtesyName: "Taibai",
          alias: "Qinglian Jushi",
          dynasty: "Tang",
          years: "701-762",
          summary: "A geographic visualization generated from four-stage TEI texts, theme density data, and stage summaries.",
          keywords: ["TEI", "Four Stages", "Theme Density", "Poetry Map"],
          stats: {
            locations: locations.length,
            timelineEvents: events.length,
            poemSamples: poems.length,
            routeDistanceLabel: "Four-stage statistics"
          }
        },
        relationships: [],
        chapters: stages.map((stage) => ({
          id: stage.id,
          title: stage.title,
          years: stage.years,
          locationIds: stage.poems.map((poem) => poem.locationId),
          summary: `${stage.label}: ${stage.poems.length} poems.`
        }))
      },
      tei: { stages, summaryRows, densityRows, voyant: buildVoyantStats(stages) },
      source: "tei-docs"
    };
  }

  async function fetchText(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load: ${path}`);
    return response.text();
  }

  async function loadDocsData() {
    const [summaryCsv, densityCsv, ...stageXmls] = await Promise.all([
      fetchText(SUMMARY_PATH),
      fetchText(THEME_DENSITY_PATH),
      ...STAGE_FILES.map((stage) => fetchText(stage.path))
    ]);

    const summaryRows = parseCsv(summaryCsv);
    const densityRows = parseCsv(densityCsv);
    const stages = stageXmls.map((xml, index) => parseTeiStage(xml, STAGE_FILES[index]));
    return buildInternalData(stages, summaryRows, densityRows);
  }

  window.LiBaiTeiDataLoader = {
    loadDocsData,
    parseCsv
  };
})();
