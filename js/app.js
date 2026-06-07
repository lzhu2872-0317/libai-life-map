(function () {
  "use strict";

  const state = {
    data: null,
    indexes: null,
    routePoints: [],
    mapController: null,
    modal: null,
    drawer: null,
    activeLocationId: "jiangyou",
    activeEventId: null,
    activeTypes: new Set(),
    activeStageId: "stage1",
    loaded: false,
    bootstrapped: false,
    usingFallbackMap: false,
    delegatesBound: false
  };

  function showGoogleMapsFailure(reason) {
    const loading = document.getElementById("mapLoading");
    const mapNode = document.getElementById("map");
    const reasonText = reason === "auth"
      ? "Google Maps API key authentication failed. Usually the API is disabled, billing is not enabled, or the current origin is not allowed."
      : "Google Maps failed to load. Usually the network cannot access Google Maps or a browser extension blocked it.";

    if (loading) loading.classList.add("hidden");
    if (mapNode && !state.usingFallbackMap) {
      mapNode.innerHTML = `
        <div class="map-error">
          <h3>Map Load Failed</h3>
          <p>${reasonText}</p>
          <p>Recommended local URL: <code>http://127.0.0.1:8765/index.html</code></p>
          <p>Open the browser developer Console to inspect the exact Google Maps error.</p>
        </div>
      `;
    }
  }

  async function prepareDataAndUi() {
    if (state.bootstrapped) {
      return;
    }

    state.data = await window.LiBaiDataLoader.loadAllData();
    state.indexes = window.LiBaiDataLoader.createIndexes(state.data);
    state.routePoints = window.LiBaiRoute.buildRoutePoints(state.data.locations, state.indexes.locationsById);
    state.modal = window.LiBaiUI.setupModal();
    state.drawer = window.LiBaiUI.setupDrawer();
    window.LiBaiUI.setupTabs();
    window.LiBaiUI.setupThemeToggle((theme) => {
      if (state.mapController) {
        state.mapController.setTheme(theme === "dark" ? "ink" : document.getElementById("mapTheme").value);
      }
    });
    state.bootstrapped = true;
  }

  function finishAppRender() {
    document.getElementById("mapLoading").classList.add("hidden");
    renderInitialUi();
    bindGlobalDelegates();
    if (!document.body.classList.contains("chronicle-mode")) {
      setupScrollLinkedMap();
    }
    window.LiBaiAnimation.revealOnScroll(".chapter-card, .timeline-item, .poem-card");
    state.mapController.fitAll();
    state.loaded = true;
  }

  async function initFallbackApp(reason) {
    if (state.loaded || state.usingFallbackMap) {
      return;
    }

    state.usingFallbackMap = true;
    await prepareDataAndUi();
    state.mapController = window.LiBaiMap.createFallbackMapController({
      data: state.data,
      indexes: state.indexes,
      routePoints: state.routePoints,
      onLocationSelect: (locationId, options) => selectLocation(locationId, options)
    });
    finishAppRender();
    const info = document.getElementById("fallbackInfo");
    if (info) {
      info.innerHTML = `<strong>Local fallback map enabled</strong><span>${reason === "auth" ? "Google Maps key authentication failed." : "Google Maps script did not load."}</span><p>Core interactions remain available: locations, route, timeline, and poem cards stay linked.</p>`;
    }
    selectStage(state.activeStageId);
  }

  function getLocationContext(locationId) {
    const location = state.indexes.locationsById.get(locationId);
    return {
      location,
      events: state.indexes.eventsByLocation.get(locationId) || [],
      poems: state.indexes.poemsByLocation.get(locationId) || []
    };
  }

  function selectLocation(locationId, options = {}) {
    const context = getLocationContext(locationId);
    if (!context.location) {
      return;
    }

    state.activeLocationId = locationId;
    if (options.eventId) {
      state.activeEventId = options.eventId;
    } else {
      const firstEvent = context.events[0];
      state.activeEventId = firstEvent ? firstEvent.id : null;
    }

    const selectedEvent = state.activeEventId ? state.indexes.eventsById.get(state.activeEventId) : null;
    const orderedEvents = selectedEvent
      ? [selectedEvent, ...context.events.filter((event) => event.id !== selectedEvent.id)]
      : context.events;

    window.LiBaiUI.renderPlaceDetail(context.location, orderedEvents, context.poems);
    window.LiBaiUI.renderPoems(state.data.poems.poems, locationId);
    window.LiBaiUI.renderBio(state.data.timeline.events, state.indexes.locationsById, locationId);
    window.LiBaiUI.renderDrawerLocations(state.data.locations.locations, locationId);
    window.LiBaiTimeline.updateActiveTimeline(state.activeEventId, locationId);

    if (state.mapController && options.source !== "map-silent") {
      state.mapController.focusLocation(locationId, { zoom: options.zoom || 7 });
      if (options.openInfo) {
        state.mapController.openInfo(locationId);
      }
      if (options.animateRoute) {
        state.mapController.animateRouteTo(locationId);
      }
    }
  }

  function selectEvent(eventId, locationId) {
    state.activeEventId = eventId;
    selectLocation(locationId, { eventId, openInfo: true, animateRoute: true, zoom: 7 });
  }

  function stageLocationIds(stageId) {
    const stage = state.data.tei?.stages?.find((item) => item.id === stageId);
    if (!stage) return state.data.locations.locations.map((location) => location.id);
    return Array.from(new Set(stage.poems.map((poem) => poem.locationId)));
  }

  function selectStage(stageId) {
    state.activeStageId = stageId;
    window.LiBaiUI.renderStageSwitcher(state.data.tei?.stages || [], state.activeStageId, selectStage);
    const visibleIds = stageLocationIds(stageId);
    state.mapController.filterMarkers(visibleIds);
    const stage = state.data.tei?.stages?.find((item) => item.id === stageId);
    const firstPoem = stage?.poems.find((poem) => visibleIds.includes(poem.locationId));
    if (firstPoem) {
      const stageLocation = {
        id: firstPoem.locationId,
        name: stage.label,
        ancientName: stage.title,
        province: "",
        years: [stage.years],
        period: `${stage.title} (${stage.years})`,
        category: "stage",
        importance: 5,
        poemCount: stage.poems.length,
        summary: `${stage.title}: ${stage.poems.length} poems. Click map points to view specific locations.`,
        image: ""
      };
      const stageEvent = {
        id: `${stage.id}-detail`,
        year: stage.years,
        title: stage.label,
        detail: `${stage.title}: ${stage.poems.length} poems. Major works and poem text are listed for this stage; the map only shows related locations.`
      };
      window.LiBaiUI.renderPlaceDetail(stageLocation, [stageEvent], stage.poems.slice(0, 12));
      state.mapController.focusLocation(firstPoem.locationId, { zoom: 6 });
      state.mapController.openInfo(firstPoem.locationId);
      document.getElementById("placeDetail").classList.remove("is-collapsed");
      document.getElementById("detailOpen").classList.remove("is-visible");
    }
  }

  function bindGlobalDelegates() {
    if (state.delegatesBound) {
      return;
    }
    state.delegatesBound = true;

    document.body.addEventListener("click", (event) => {
      const detailToggle = event.target.closest("[data-detail-toggle]");
      if (detailToggle) {
        const detail = document.getElementById("placeDetail");
        const open = document.getElementById("detailOpen");
        detail.classList.add("is-collapsed");
        open.classList.add("is-visible");
        return;
      }

      const locationTarget = event.target.closest("[data-location-id]");
      const poemTarget = event.target.closest("[data-poem-id]");

      if (poemTarget) {
        const poem = state.indexes.poemsById.get(poemTarget.dataset.poemId);
        if (poem) {
          const location = state.indexes.locationsById.get(poem.locationId);
          state.modal.open(poem, location);
          selectLocation(poem.locationId, { openInfo: true, animateRoute: true });
        }
        return;
      }

      if (locationTarget && !locationTarget.classList.contains("timeline-item")) {
        selectLocation(locationTarget.dataset.locationId, { openInfo: true, animateRoute: true });
        if (locationTarget.classList.contains("drawer-item")) {
          state.drawer.setOpen(false);
        }
      }
    });

    document.getElementById("detailOpen").addEventListener("click", () => {
      document.getElementById("placeDetail").classList.remove("is-collapsed");
      document.getElementById("detailOpen").classList.remove("is-visible");
    });

    document.getElementById("resetView").addEventListener("click", () => {
      state.mapController.fitAll();
      state.mapController.showAllMarkers();
      window.LiBaiUI.renderStageSwitcher(state.data.tei?.stages || [], state.activeStageId, selectStage);
    });

    document.getElementById("mapTheme").addEventListener("change", (event) => {
      state.mapController.setTheme(event.target.value);
    });

    document.getElementById("toggleRegions").addEventListener("click", (event) => {
      const next = !state.mapController.regionLayerVisible;
      state.mapController.setRegionVisible(next);
      event.currentTarget.setAttribute("aria-pressed", next ? "true" : "false");
      event.currentTarget.textContent = next ? "Regions" : "No Regions";
    });

    document.getElementById("drawerSearch").addEventListener("input", (event) => {
      const matches = window.LiBaiUI.filterLocations(state.data.locations.locations, event.target.value, state.indexes);
      window.LiBaiUI.renderDrawerLocations(matches, state.activeLocationId);
    });

    document.querySelectorAll(".rail-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".rail-button").forEach((item) => item.classList.toggle("active", item === button));
        const sectionMap = {
          overview: "map-panel",
          route: "timeline-panel",
          poem: "poem-panel",
          people: "biography-panel"
        };
        document.getElementById(sectionMap[button.dataset.section]).scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupTimeline() {
    window.__LiBaiTimelinePoems = state.indexes.poemsByLocation;
    window.LiBaiTimeline.renderTimeline({
      events: state.data.timeline.events,
      locationsById: state.indexes.locationsById,
      activeEventId: state.activeEventId,
      activeTypes: state.activeTypes
    });

    function toggleType(type) {
      if (state.activeTypes.has(type)) {
        state.activeTypes.delete(type);
      } else {
        state.activeTypes.add(type);
      }
      window.LiBaiTimeline.renderFilterChips(state.data.timeline.events, state.activeTypes, toggleType);
      window.LiBaiTimeline.renderTimeline({
        events: state.data.timeline.events,
        locationsById: state.indexes.locationsById,
        activeEventId: state.activeEventId,
        activeTypes: state.activeTypes
      });
    }

    window.LiBaiTimeline.renderFilterChips(state.data.timeline.events, state.activeTypes, toggleType);

    window.LiBaiTimeline.bindTimelineClick(selectEvent);
  }

  function setupScrollLinkedMap() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.58) {
          return;
        }
        const locationId = entry.target.dataset.locationId;
        if (locationId && locationId !== state.activeLocationId) {
          selectLocation(locationId, { source: "scroll", zoom: 6 });
        }
      });
    }, {
      threshold: [0.58],
      rootMargin: "-12% 0px -28% 0px"
    });

    document.querySelectorAll(".timeline-item").forEach((node) => observer.observe(node));
    document.querySelectorAll(".chapter-card").forEach((node) => observer.observe(node));
  }

  function renderInitialUi() {
    window.LiBaiUI.renderProfile(state.data.biography.profile, state.data.source);
    window.LiBaiUI.renderPoems(state.data.poems.poems, state.activeLocationId);
    window.LiBaiUI.renderBio(state.data.timeline.events, state.indexes.locationsById, state.activeLocationId);
    window.LiBaiUI.renderRelationships(state.data.biography.relationships, state.indexes.locationsById);
    window.LiBaiUI.renderChapters(state.data.biography.chapters, state.indexes.locationsById);
    window.LiBaiUI.renderDrawerLocations(state.data.locations.locations, state.activeLocationId);
    window.LiBaiUI.renderStageSwitcher(state.data.tei?.stages || [], state.activeStageId, selectStage);
    window.LiBaiUI.renderThemeStats(state.data.tei?.summaryRows || [], state.data.tei?.densityRows || [], state.data.tei?.voyant);
    setupTimeline();
    const context = getLocationContext(state.activeLocationId);
    window.LiBaiUI.renderPlaceDetail(context.location, context.events, context.poems);
    window.LiBaiTimeline.updateActiveTimeline(state.activeEventId, state.activeLocationId);
  }

  async function initLiBaiApp() {
    if (state.loaded) {
      return;
    }

    await prepareDataAndUi();

    state.mapController = window.LiBaiMap.createMapController({
      data: state.data,
      indexes: state.indexes,
      routePoints: state.routePoints,
      onLocationSelect: (locationId, options) => selectLocation(locationId, options)
    });

    finishAppRender();
    selectStage(state.activeStageId);
  }

  window.initLiBaiApp = initLiBaiApp;
  window.handleGoogleMapsError = (reason) => {
    showGoogleMapsFailure(reason);
    initFallbackApp(reason);
  };
  window.gm_authFailure = () => {
    showGoogleMapsFailure("auth");
    initFallbackApp("auth");
  };

  window.setTimeout(() => {
    if (!state.loaded && !window.google?.maps) {
      showGoogleMapsFailure("network");
      initFallbackApp("network");
    }
  }, 9000);
})();
