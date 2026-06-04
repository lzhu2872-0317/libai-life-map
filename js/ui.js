(function () {
  "use strict";

  const categoryLabels = {
    birth: "Birth",
    home: "Residence",
    travel: "Travel",
    route: "Route",
    poem: "Poem",
    court: "Court",
    friend: "Friendship",
    exile: "Exile",
    late: "Late Years",
    turning: "Turning Point",
    study: "Study",
    stage: "Stage"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderProfile(profile, source) {
    const el = document.getElementById("profileSummary");
    const stats = profile.stats;
    el.innerHTML = `
      <p class="eyebrow">${escapeHtml(profile.dynasty)} · ${escapeHtml(profile.years)}</p>
      <h2>${escapeHtml(profile.name)} <small>${escapeHtml(profile.courtesyName)} / ${escapeHtml(profile.alias)}</small></h2>
      <p>${escapeHtml(profile.summary)}</p>
      <div class="metric-row">
        <div class="metric"><strong>${stats.locations}</strong><span>Locations</span></div>
        <div class="metric"><strong>${stats.timelineEvents}</strong><span>Events</span></div>
        <div class="metric"><strong>${stats.poemSamples}</strong><span>Poems</span></div>
      </div>
      <div class="tag-row">${profile.keywords.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>
      <p class="data-source">Data source: ${source === "json" ? "local JSON" : "inline fallback data"}</p>
    `;
  }

  function renderPlaceDetail(location, events, poems) {
    const el = document.getElementById("placeDetail");
    if (!location) {
      el.innerHTML = "<div class='place-body'><p>Please select a location.</p></div>";
      return;
    }

    const firstEvent = events[0];
    const titleLine = firstEvent
      ? `${escapeHtml(firstEvent.year)} · ${escapeHtml(firstEvent.title)}`
      : `${escapeHtml(location.years.join("-"))} · ${escapeHtml(location.name)}`;
    const poemList = poems.length
      ? poems.map((poem) => `
        <div class="popup-poem-row">
          <div class="popup-poem-title">
            <a href="javascript:void(0)" data-poem-id="${escapeHtml(poem.id)}">${escapeHtml(poem.title)}</a>
            <span>(${escapeHtml(poem.year)})</span>
            <small>${escapeHtml(poem.genre)}</small>
          </div>
          <div class="popup-poem-content">
            ${(poem.lines && poem.lines.length ? poem.lines : [poem.excerpt || poem.summary]).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          </div>
        </div>
      `).join("")
      : "<p class='mini-line'>No matching work is available in the local sample.</p>";

    el.innerHTML = `
      <button class="detail-toggle detail-close" type="button" data-detail-toggle="close" aria-label="Close details">×</button>
      <div class="place-visual">
        <img src="${escapeHtml(location.image)}" alt="${escapeHtml(location.name)} image" loading="lazy">
        <h3>${titleLine}</h3>
        <small>${escapeHtml(location.period)} · ${escapeHtml(location.ancientName)} · ${escapeHtml(location.province)}</small>
      </div>
      <div class="place-body">
        <p>${escapeHtml(firstEvent ? firstEvent.detail : location.summary)}</p>
        <div class="metric-row">
          <div class="metric"><strong>${escapeHtml(location.years.join(" / "))}</strong><span>Years</span></div>
          <div class="metric"><strong>${location.poemCount}</strong><span>Related Poems</span></div>
          <div class="metric"><strong>${location.importance}</strong><span>Weight</span></div>
        </div>
        <div>
          <strong>Life Events</strong>
          ${events.length ? events.map((event) => `<p class="mini-line">${escapeHtml(event.year)} · ${escapeHtml(event.title)}</p>`).join("") : "<p class='mini-line'>No events</p>"}
        </div>
        <div>
          <strong>Major Works</strong>
          ${poemList}
        </div>
      </div>
    `;
    el.classList.remove("is-collapsed");
  }

  function renderPoems(poems, activeLocationId) {
    const panel = document.getElementById("panelPoems");
    panel.innerHTML = poems.map((poem) => `
      <article class="poem-card ${poem.locationId === activeLocationId ? "active" : ""}" data-location-id="${escapeHtml(poem.locationId)}" data-poem-id="${escapeHtml(poem.id)}">
        <h4>《${escapeHtml(poem.title)}》</h4>
        <div class="timeline-meta">
          <span class="tag">${escapeHtml(poem.year)}</span>
          <span class="tag">${escapeHtml(poem.genre)}</span>
        </div>
        <blockquote>${escapeHtml(poem.excerpt)}</blockquote>
        <p>${escapeHtml(poem.summary)}</p>
      </article>
    `).join("");
  }

  function renderBio(events, locationsById, activeLocationId) {
    const panel = document.getElementById("panelBio");
    panel.innerHTML = events.map((event) => {
      const location = locationsById.get(event.locationId);
      return `
        <article class="bio-card ${event.locationId === activeLocationId ? "active" : ""}" data-location-id="${escapeHtml(event.locationId)}" data-event-id="${escapeHtml(event.id)}">
          <h4>${escapeHtml(event.year)} · ${escapeHtml(event.title)}</h4>
          <p>${escapeHtml(location ? location.name : "")}｜${escapeHtml(event.summary)}</p>
        </article>
      `;
    }).join("");
  }

  function eventAge(eventYear) {
    return eventYear ? Math.max(1, eventYear - 700) : "";
  }

  function renderRelationships(relationships, locationsById) {
    const panel = document.getElementById("panelPeople");
    panel.innerHTML = relationships.map((relation) => {
      const location = locationsById.get(relation.locationId);
      return `
        <article class="relation-card" data-location-id="${escapeHtml(relation.locationId)}">
          <h4>${escapeHtml(relation.name)} <span class="tag">${escapeHtml(relation.relation)}</span></h4>
          <p>${escapeHtml(relation.summary)}</p>
          <small>${escapeHtml(location ? location.name : "")}</small>
        </article>
      `;
    }).join("");
  }

  function renderChapters(chapters, locationsById) {
    const grid = document.getElementById("chapterGrid");
    grid.innerHTML = chapters.map((chapter) => {
      const names = chapter.locationIds.map((id) => locationsById.get(id)?.name).filter(Boolean);
      return `
        <article class="chapter-card" data-chapter-id="${escapeHtml(chapter.id)}" data-location-id="${escapeHtml(chapter.locationIds[0])}">
          <p class="eyebrow">${escapeHtml(chapter.years)}</p>
          <h3>${escapeHtml(chapter.title)}</h3>
          <p>${escapeHtml(chapter.summary)}</p>
          <span class="chapter-locations">${escapeHtml(names.join(" · "))}</span>
        </article>
      `;
    }).join("");
  }

  function renderDrawerLocations(locations, activeLocationId) {
    const container = document.getElementById("drawerLocations");
    container.innerHTML = locations.map((location) => `
      <button class="drawer-item ${location.id === activeLocationId ? "active" : ""}" type="button" data-location-id="${escapeHtml(location.id)}">
        <strong>${escapeHtml(location.name)}</strong>
        <span>${escapeHtml(location.period)} · ${escapeHtml(location.years.join(" / "))}</span>
      </button>
    `).join("");
  }

  function setupTabs() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-selected", item === button ? "true" : "false");
        });
        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.toggle("active", panel.id === `panel${button.dataset.tab.charAt(0).toUpperCase()}${button.dataset.tab.slice(1)}`);
        });
      });
    });
  }

  function setupDrawer() {
    const drawer = document.getElementById("sideDrawer");
    const open = document.getElementById("drawerOpen");
    const close = document.getElementById("drawerClose");
    const backdrop = document.getElementById("drawerBackdrop");

    function setOpen(value) {
      drawer.classList.toggle("open", value);
      drawer.setAttribute("aria-hidden", value ? "false" : "true");
    }

    open.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));
    return { setOpen };
  }

  function setupThemeToggle(onChange) {
    const button = document.getElementById("themeToggle");
    button.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      button.textContent = next === "dark" ? "Light" : "Dark";
      button.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      if (onChange) onChange(next);
    });
  }

  function setupModal() {
    const modal = document.getElementById("poemModal");
    const title = document.getElementById("modalTitle");
    const meta = document.getElementById("modalMeta");
    const excerpt = document.getElementById("modalExcerpt");
    const summary = document.getElementById("modalSummary");

    function open(poem, location) {
      title.textContent = poem.title;
      meta.textContent = `${poem.year} · ${poem.genre} · ${location ? location.name : ""}`;
      excerpt.textContent = poem.excerpt;
      summary.textContent = poem.summary;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }

    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }

    modal.querySelectorAll("[data-close-modal]").forEach((node) => {
      node.addEventListener("click", close);
    });

    return { open, close };
  }

  function filterLocations(locations, query, indexes) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return locations;
    }

    return locations.filter((location) => {
      const events = indexes.eventsByLocation.get(location.id) || [];
      const poems = indexes.poemsByLocation.get(location.id) || [];
      const haystack = [
        location.name,
        location.ancientName,
        location.province,
        location.period,
        location.summary,
        location.years.join(" "),
        ...events.map((event) => `${event.year} ${event.title} ${event.summary}`),
        ...poems.map((poem) => `${poem.title} ${poem.theme.join(" ")} ${poem.excerpt}`)
      ].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }

  function renderStageSwitcher(stages, activeStageId, onSelect) {
    const container = document.getElementById("stageSwitcher");
    if (!container || !stages) return;
    container.innerHTML = stages.map((stage) => `
      <button class="stage-button ${stage.id === activeStageId ? "active" : ""}" type="button" data-stage-id="${escapeHtml(stage.id)}">
        <strong>${escapeHtml(stage.label)}</strong>
        <span>${escapeHtml(stage.title)}</span>
        <small>${escapeHtml(stage.years)} · ${stage.poems.length} poems</small>
      </button>
    `).join("");
    container.querySelectorAll("[data-stage-id]").forEach((button) => {
      button.addEventListener("click", () => onSelect(button.dataset.stageId));
    });
  }

  function renderThemeStats(summaryRows, densityRows, voyantStats) {
    const container = document.getElementById("themeStats");
    if (!container || !summaryRows || !densityRows) return;
    const maxValue = Math.max(...densityRows.map((row) => Number(row.per_100_chars) || 0), 1);
    const grouped = densityRows.reduce((dict, row) => {
      const stageName = row.stage || row.chinese_stage;
      if (!dict[stageName]) dict[stageName] = [];
      dict[stageName].push(row);
      return dict;
    }, {});

    const summaryHtml = `
      <div class="summary-table">
        <table>
          <thead><tr><th>Stage</th><th>Poems</th><th>Years</th><th>Main Places</th></tr></thead>
          <tbody>
            ${summaryRows.map((row) => `
              <tr>
                <td>${escapeHtml(row.stage || row.chinese_stage)}</td>
                <td>${escapeHtml(row.poems)}</td>
                <td>${escapeHtml(row.year_range)}</td>
                <td>${escapeHtml(row.main_places)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const voyant = voyantStats || { stageWordClouds: [], trends: [] };
    const selectedTrendTerms = ["月", "酒", "山", "客", "愁"];
    const visibleTrends = voyant.trends.filter((trend) => selectedTrendTerms.includes(trend.term));
    const maxTrend = Math.max(...visibleTrends.flatMap((trend) => trend.values.map((value) => value.per1000)), 1);
    const maxCloud = Math.max(...voyant.stageWordClouds.flatMap((stage) => stage.topWords.map((word) => word.count)), 1);

    const chartHtml = `
      <div class="bar-panel">
        <h3 class="stat-title">Theme Density Bar Chart (CSV)</h3>
        <div class="theme-chart">
          ${Object.entries(grouped).map(([stageName, rows], stageIndex) => `
            <article class="theme-stage-card">
              <h3>${escapeHtml(stageName)}</h3>
              ${rows.map((row, rowIndex) => {
                const value = Number(row.per_100_chars) || 0;
                return `
                  <div class="theme-bar-row">
                    <span>${escapeHtml(row.theme)}</span>
                    <i class="theme-bar-track"><b class="theme-bar bar-${(stageIndex + rowIndex) % 6}" style="width:${Math.max(5, value / maxValue * 100)}%"></b></i>
                    <em>${value.toFixed(2)}</em>
                  </div>
                `;
              }).join("")}
            </article>
          `).join("")}
        </div>
      </div>
      <div class="wordcloud-panel">
        <h3 class="stat-title">Voyant Cirrus Word Cloud (TEI)</h3>
        <div class="wordcloud-grid">
          ${voyant.stageWordClouds.map((stage, stageIndex) => `
            <article class="wordcloud-stage-card">
              <h3>${escapeHtml(stage.stageLabel)} · ${escapeHtml(stage.years)}</h3>
              <div class="wordcloud">
                ${stage.topWords.slice(0, 24).map((row, rowIndex) => {
                  const value = Number(row.count) || 0;
                  const size = 13 + Math.round((value / maxCloud) * 28);
                  const tone = (stageIndex + rowIndex) % 6;
                  return `<span class="cloud-word tone-${tone}" style="font-size:${size}px" title="${escapeHtml(row.word)}: ${value}">${escapeHtml(row.word)}</span>`;
                }).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="trends-panel">
        <h3 class="stat-title">Voyant Trends Imagery Frequency (per 1,000 chars)</h3>
        <div class="trend-chart">
          ${visibleTrends.map((trend, trendIndex) => `
            <article class="trend-row">
              <strong>${escapeHtml(trend.term)}</strong>
              <div class="trend-bars">
                ${trend.values.map((value, stageIndex) => `
                  <span class="trend-bar-wrap" title="${escapeHtml(value.stageLabel)}: ${value.count} hits / ${value.per1000}‰">
                    <i class="trend-bar tone-${(trendIndex + stageIndex) % 6}" style="height:${Math.max(4, value.per1000 / maxTrend * 100)}%"></i>
                    <em>${escapeHtml(value.stageLabel.replace('Stage ', 'S'))}</em>
                  </span>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    `;

    container.innerHTML = summaryHtml + chartHtml;
  }

  window.LiBaiUI = {
    categoryLabels,
    escapeHtml,
    renderProfile,
    renderPlaceDetail,
    renderPoems,
    renderBio,
    renderRelationships,
    renderChapters,
    renderDrawerLocations,
    setupTabs,
    setupDrawer,
    setupThemeToggle,
    setupModal,
    filterLocations,
    renderStageSwitcher,
    renderThemeStats
  };
})();
