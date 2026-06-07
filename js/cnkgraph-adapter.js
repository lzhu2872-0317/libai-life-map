(function () {
  "use strict";

  const categoryByTitle = [
    { pattern: /江油|昌明|平武|剑阁|三台|梓州|成都/, category: "home" },
    { pattern: /长安/, category: "court" },
    { pattern: /浔阳|夜郎/, category: "exile" },
    { pattern: /当涂/, category: "late" },
    { pattern: /金陵|宣州|峨眉|庐山|广陵/, category: "poem" }
  ];

  function normalizeId(value, fallback) {
    return String(value || fallback)
      .trim()
      .toLowerCase()
      .replace(/[（）()·\s]+/g, "-")
      .replace(/[^\w-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function getCategory(marker) {
    const matched = categoryByTitle.find((item) => item.pattern.test(marker.Title || ""));
    return matched ? matched.category : "travel";
  }

  function convertArticleType(type) {
    if (type === 2) return "Poem";
    if (type === 4) return "Prose";
    return "Work";
  }

  function adapt(cnkgraphLikeData) {
    const trace = cnkgraphLikeData.Traces[0];
    const markerMap = new Map();
    const routeOrder = [];
    const events = [];
    const poems = [];
    const poemIdSet = new Set();

    trace.Markers.forEach((marker, index) => {
      const id = normalizeId(marker.Id || marker.Title, `marker-${index}`);
      markerMap.set(id, marker);
      routeOrder.push(id);

      (marker.Activities || []).forEach((activity, activityIndex) => {
        events.push({
          id: `${id}-event-${activity.Year || "unknown"}-${activityIndex}`,
          year: activity.Year || null,
          month: activity.Month || null,
          title: activity.Title || marker.Title,
          locationId: id,
          type: getCategory(marker),
          summary: activity.Activity || marker.Summary || "",
          detail: [
            activity.OldYear ? `${activity.OldYear}。` : "",
            activity.Activity || "",
            activity.Subject ? ` Works: ${activity.Subject}` : "",
            activity.People ? ` Related people: ${activity.People}` : ""
          ].join("")
        });
      });

      (marker.Poems || []).forEach((poem, poemIndex) => {
        const poemId = normalizeId(`${id}-${poem.Title}-${poem.Year}`, `poem-${index}-${poemIndex}`);
        if (poemIdSet.has(poemId)) return;
        poemIdSet.add(poemId);
        poems.push({
          id: poemId,
          title: poem.Title,
          year: poem.Year || null,
          locationId: id,
          genre: convertArticleType(poem.ArticleType),
          excerpt: poem.Summary || "Local modeled sample; no source-site text copied.",
          theme: [marker.Title, convertArticleType(poem.ArticleType)],
          summary: poem.Summary || ""
        });
      });
    });

    const locations = Array.from(markerMap.entries()).map(([id, marker]) => {
      const locationEvents = events.filter((event) => event.locationId === id);
      const locationPoems = poems.filter((poem) => poem.locationId === id);
      const years = locationEvents.map((event) => event.year).filter(Boolean);
      return {
        id,
        name: marker.Title,
        ancientName: marker.Title,
        province: marker.Activities?.[0]?.Place?.Province || "",
        lat: marker.Latitude,
        lng: marker.Longitude,
        years: years.length ? Array.from(new Set(years)) : [],
        period: marker.Summary || "Li Bai Itinerary",
        category: getCategory(marker),
        importance: Math.min(5, Math.max(2, locationPoems.length + locationEvents.length)),
        poemCount: locationPoems.length,
        eventIds: locationEvents.map((event) => event.id),
        poemIds: locationPoems.map((poem) => poem.id),
        summary: marker.Detail || marker.Summary || "",
        image: `assets/images/location-${id}.svg`
      };
    });

    return {
      locations: {
        meta: {
          title: cnkgraphLikeData.Title || "Li Bai Life Map",
          center: { lat: trace.CenterLatitude || 34.2, lng: trace.CenterLongitude || 104.8 },
          zoom: trace.ZoomLevel || 4,
          period: "701-762",
          description: "Local data modeled on the target site's field structure."
        },
        routeOrder,
        locations,
        geojson: {
          type: "FeatureCollection",
          features: []
        }
      },
      timeline: {
        meta: { title: "Li Bai Life Timeline", range: [701, 762] },
        events: events.sort((a, b) => (a.year || 0) - (b.year || 0))
      },
      poems: {
        meta: { title: "Li Bai Poetry Geography Samples", note: "Converted from locally modeled data." },
        poems,
        themes: []
      },
      biography: {
        profile: {
          name: "Li Bai",
          courtesyName: "Taibai",
          alias: "Qinglian Jushi",
          dynasty: "Tang",
          years: "701-762",
          summary: "This page uses locally modeled data shaped like the target site's field structure to recreate layout, fields, and interactions without copying the complete original source content.",
          keywords: ["High Tang", "Itinerary", "Chronology", "Poems", "Map"],
          stats: {
            locations: locations.length,
            timelineEvents: events.length,
            poemSamples: poems.length,
            routeDistanceLabel: "Local sample"
          }
        },
        relationships: [],
        chapters: [
          {
            id: "cnk-like",
            title: "Li Bai Itinerary Data",
            years: "701-762",
            locationIds: routeOrder,
            summary: trace.Detail || "A local data sample modeled on the target site's field structure."
          }
        ]
      },
      source: "cnkgraph-like"
    };
  }

  window.LiBaiCnkgraphAdapter = {
    adapt
  };
})();
