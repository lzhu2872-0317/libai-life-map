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
    if (type === 2) return "诗";
    if (type === 4) return "文";
    return "作品";
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
            activity.Subject ? ` 作品：${activity.Subject}` : "",
            activity.People ? ` 相关人物：${activity.People}` : ""
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
          excerpt: poem.Summary || "本地同构样本，未复制目标站原文。",
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
        period: marker.Summary || "李白行迹",
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
          title: cnkgraphLikeData.Title || "李白行迹地图",
          center: { lat: trace.CenterLatitude || 34.2, lng: trace.CenterLongitude || 104.8 },
          zoom: trace.ZoomLevel || 4,
          period: "701-762",
          description: "目标站字段结构的本地同构数据。"
        },
        routeOrder,
        locations,
        geojson: {
          type: "FeatureCollection",
          features: []
        }
      },
      timeline: {
        meta: { title: "李白生平时间线", range: [701, 762] },
        events: events.sort((a, b) => (a.year || 0) - (b.year || 0))
      },
      poems: {
        meta: { title: "李白诗词地理样本", note: "由同构数据转换。" },
        poems,
        themes: []
      },
      biography: {
        profile: {
          name: "李白",
          courtesyName: "太白",
          alias: "青莲居士",
          dynasty: "唐",
          years: "701-762",
          summary: "此页面使用目标站字段结构的本地自建同构数据，复刻布局、字段和交互，不复制目标站原始完整内容。",
          keywords: ["盛唐", "行迹", "编年", "诗作", "地图"],
          stats: {
            locations: locations.length,
            timelineEvents: events.length,
            poemSamples: poems.length,
            routeDistanceLabel: "本地样本"
          }
        },
        relationships: [],
        chapters: [
          {
            id: "cnk-like",
            title: "李白行迹同构数据",
            years: "701-762",
            locationIds: routeOrder,
            summary: trace.Detail || "目标站字段结构同构样本。"
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
