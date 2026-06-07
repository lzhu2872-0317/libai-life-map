(function () {
  "use strict";

  const styles = {
    literary: [
      { featureType: "all", elementType: "geometry", stylers: [{ color: "#ebe7dc" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#cad8d8" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }, { visibility: "simplified" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#6e766f" }] },
      { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e5dfcf" }] }
    ],
    ink: [
      { featureType: "all", elementType: "geometry", stylers: [{ color: "#1c2725" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1717" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b3835" }, { visibility: "simplified" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#abb7b1" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#141d1b" }] }
    ],
    terrain: [
      { featureType: "all", elementType: "geometry", stylers: [{ color: "#e6e0d1" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#b7ced1" }] },
      { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#d7dcc4" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#f6f1e4" }, { visibility: "simplified" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] }
    ]
  };

  const categoryColors = {
    birth: "#2e7d59",
    home: "#2e7d59",
    travel: "#6d8c6f",
    route: "#587c93",
    poem: "#b88746",
    court: "#225f70",
    friend: "#805d9a",
    exile: "#a6523f",
    late: "#766757"
  };

  function createInfoHtml(location, poems, events) {
    const typeLabel = window.LiBaiUI.categoryLabels[location.category] || location.category;
    const poemLine = poems.length ? poems.map((poem) => window.LiBaiUI.escapeHtml(poem.title)).join(" / ") : "No poem samples";
    const eventLine = events.length ? events.map((event) => `${event.year} ${window.LiBaiUI.escapeHtml(event.title)}`).join("; ") : "No events";
    return `
      <div class="info-window">
        <header>
          <small>${window.LiBaiUI.escapeHtml(typeLabel)} · ${window.LiBaiUI.escapeHtml(location.period)}</small>
          <h3>${window.LiBaiUI.escapeHtml(location.name)}</h3>
        </header>
        <div class="info-body">
          <p>${window.LiBaiUI.escapeHtml(location.summary)}</p>
          <p><strong>Events:</strong> ${eventLine}</p>
          <p><strong>Poems:</strong> ${poemLine}</p>
          <button type="button" data-focus-location="${window.LiBaiUI.escapeHtml(location.id)}">View Details</button>
        </div>
      </div>
    `;
  }

  function createMapController({ data, indexes, routePoints, onLocationSelect }) {
    class HtmlMarker extends google.maps.OverlayView {
      constructor({ position, location, onClick }) {
        super();
        this.position = position;
        this.location = location;
        this.onClick = onClick;
        this.div = null;
      }

      onAdd() {
        this.div = document.createElement("button");
        this.div.type = "button";
        this.div.className = "map-marker";
        this.div.dataset.locationId = this.location.id;
        this.div.dataset.category = this.location.category;
        this.div.innerHTML = `
          <span class="marker-pin"><span aria-hidden="true"></span></span>
          <span class="marker-label">${window.LiBaiUI.escapeHtml(this.location.name)}</span>
        `;
        this.div.addEventListener("click", () => this.onClick(this.location.id));
        this.getPanes().overlayMouseTarget.appendChild(this.div);
        requestAnimationFrame(() => {
          if (this.div) {
            this.div.style.animation = "fadeIn 360ms var(--ease) both";
          }
        });
      }

      draw() {
        if (!this.div) {
          return;
        }
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(this.position);
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
        this.div.style.position = "absolute";
      }

      onRemove() {
        if (this.div) {
          this.div.remove();
          this.div = null;
        }
      }

      setActive(value) {
        if (this.div) {
          this.div.classList.toggle("active", value);
        }
      }
    }

    class ClusterOverlay extends google.maps.OverlayView {
      constructor({ position, count, ids, onClick }) {
        super();
        this.position = position;
        this.count = count;
        this.ids = ids;
        this.onClick = onClick;
        this.div = null;
      }

      onAdd() {
        this.div = document.createElement("button");
        this.div.type = "button";
        this.div.className = "cluster-marker";
        this.div.textContent = this.count;
        this.div.addEventListener("click", () => this.onClick(this.ids));
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const point = this.getProjection().fromLatLngToDivPixel(this.position);
        this.div.style.position = "absolute";
        this.div.style.left = `${point.x - 22}px`;
        this.div.style.top = `${point.y - 22}px`;
      }

      onRemove() {
        if (this.div) {
          this.div.remove();
          this.div = null;
        }
      }
    }

    const mapNode = document.getElementById("map");
    const map = new google.maps.Map(mapNode, {
      center: { lat: 34.2, lng: 104.8 },
      zoom: 4,
      minZoom: 3,
      maxZoom: 12,
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: styles.literary
    });

    const infoWindow = new google.maps.InfoWindow();
    const markers = new Map();
    let clusters = [];
    let routePolyline = null;
    let animatedPolyline = null;
    let regionLayerVisible = true;
    let visibleLocationIds = new Set(data.locations.locations.map((location) => location.id));

    function clearClusters() {
      clusters.forEach((cluster) => cluster.setMap(null));
      clusters = [];
    }

    function createMarkers() {
      data.locations.locations.forEach((location) => {
        const marker = new HtmlMarker({
          position: new google.maps.LatLng(location.lat, location.lng),
          location,
          onClick: (id) => {
            openInfo(id);
            onLocationSelect(id, { source: "map" });
          }
        });
        marker.setMap(map);
        markers.set(location.id, marker);
      });
    }

    function createRoute() {
      const path = routePoints.map((point) => ({ lat: point.lat, lng: point.lng }));
      routePolyline = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#225f70",
        strokeOpacity: 0.5,
        strokeWeight: 3,
        geodesic: true
      });
      animatedPolyline = new google.maps.Polyline({
        map,
        path: [],
        strokeColor: "#b88746",
        strokeOpacity: 0.94,
        strokeWeight: 5,
        geodesic: true,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: "#b88746"
          },
          offset: "100%"
        }]
      });
    }

    function loadGeoJson() {
      map.data.addGeoJson(data.locations.geojson);
      map.data.setStyle((feature) => ({
        fillColor: feature.getProperty("id") === "jiangnan-poetry" ? "#b88746" : "#225f70",
        fillOpacity: 0.12,
        strokeColor: feature.getProperty("id") === "jiangnan-poetry" ? "#b88746" : "#225f70",
        strokeWeight: 1.4,
        strokeOpacity: 0.6
      }));
    }

    function setRegionVisible(value) {
      regionLayerVisible = value;
      map.data.setStyle((feature) => ({
        fillColor: feature.getProperty("id") === "jiangnan-poetry" ? "#b88746" : "#225f70",
        fillOpacity: value ? 0.12 : 0,
        strokeColor: feature.getProperty("id") === "jiangnan-poetry" ? "#b88746" : "#225f70",
        strokeWeight: value ? 1.4 : 0,
        strokeOpacity: value ? 0.6 : 0
      }));
    }

    function updateClusters() {
      clearClusters();
      const zoom = map.getZoom();
      if (zoom >= 7) {
        markers.forEach((marker, id) => marker.setMap(visibleLocationIds.has(id) ? map : null));
        return;
      }

      const buckets = new Map();
      data.locations.locations.filter((location) => visibleLocationIds.has(location.id)).forEach((location) => {
        const key = `${Math.round(location.lat / 2)}:${Math.round(location.lng / 2)}`;
        if (!buckets.has(key)) {
          buckets.set(key, []);
        }
        buckets.get(key).push(location);
      });

      buckets.forEach((items) => {
        if (items.length < 2) {
          markers.get(items[0].id).setMap(map);
          return;
        }
        items.forEach((item) => markers.get(item.id).setMap(null));
        const avg = items.reduce((acc, item) => {
          acc.lat += item.lat;
          acc.lng += item.lng;
          return acc;
        }, { lat: 0, lng: 0 });
        const cluster = new ClusterOverlay({
          position: new google.maps.LatLng(avg.lat / items.length, avg.lng / items.length),
          count: items.length,
          ids: items.map((item) => item.id),
          onClick: (ids) => {
            const bounds = new google.maps.LatLngBounds();
            ids.forEach((id) => {
              const location = indexes.locationsById.get(id);
              bounds.extend({ lat: location.lat, lng: location.lng });
            });
            map.fitBounds(bounds, 80);
          }
        });
        cluster.setMap(map);
        clusters.push(cluster);
      });
    }

    function fitAll() {
      const bounds = new google.maps.LatLngBounds();
      [
        { lat: 18.2, lng: 73.5 },
        { lat: 53.6, lng: 135.2 }
      ].forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 72);
    }

    function focusLocation(locationId, options = {}) {
      const location = indexes.locationsById.get(locationId);
      if (!location) {
        return;
      }

      markers.forEach((marker, id) => marker.setActive(id === locationId));
      const targetZoom = options.zoom || Math.max(map.getZoom(), 8);
      map.panTo({ lat: location.lat, lng: location.lng });
      window.LiBaiAnimation.animateNumber({
        from: map.getZoom(),
        to: targetZoom,
        duration: 520,
        onUpdate: (zoom) => map.setZoom(zoom)
      });
    }

    function openInfo(locationId) {
      const location = indexes.locationsById.get(locationId);
      if (!location) {
        return;
      }
      const poems = indexes.poemsByLocation.get(locationId) || [];
      const events = indexes.eventsByLocation.get(locationId) || [];
      infoWindow.setContent(createInfoHtml(location, poems, events));
      infoWindow.setPosition({ lat: location.lat, lng: location.lng });
      infoWindow.open({ map });
      google.maps.event.addListenerOnce(infoWindow, "domready", () => {
        document.querySelectorAll("[data-focus-location]").forEach((button) => {
          button.addEventListener("click", () => onLocationSelect(button.dataset.focusLocation, { source: "info" }));
        });
      });
    }

    function animateRoute(points = routePoints) {
      const normalized = points.map((point) => ({ lat: point.lat, lng: point.lng }));
      if (animatedPolyline) {
        animatedPolyline.setPath([]);
      }
      window.LiBaiAnimation.animatePath({
        points: normalized,
        duration: Math.max(1600, normalized.length * 160),
        onFrame: (visiblePath, currentPoint) => {
          animatedPolyline.setPath(visiblePath);
          if (currentPoint) {
            map.panTo({ lat: currentPoint.lat, lng: currentPoint.lng });
          }
        }
      });
    }

    function animateRouteTo(locationId) {
      const segment = window.LiBaiRoute.getRouteSegmentUntil(routePoints, locationId);
      animateRoute(segment);
    }

    function setTheme(themeName) {
      map.setOptions({ styles: styles[themeName] || styles.literary });
    }

    function filterMarkers(visibleIds) {
      visibleLocationIds = new Set(visibleIds);
      markers.forEach((marker, id) => {
        marker.setMap(visibleLocationIds.has(id) ? map : null);
      });
      clearClusters();
      updateClusters();
    }

    function showAllMarkers() {
      visibleLocationIds = new Set(data.locations.locations.map((location) => location.id));
      markers.forEach((marker) => marker.setMap(map));
      updateClusters();
    }

    createMarkers();
    createRoute();
    loadGeoJson();
    map.addListener("zoom_changed", updateClusters);
    map.addListener("idle", updateClusters);

    return {
      map,
      fitAll,
      focusLocation,
      openInfo,
      animateRoute,
      animateRouteTo,
      setTheme,
      setRegionVisible,
      filterMarkers,
      showAllMarkers,
      get regionLayerVisible() {
        return regionLayerVisible;
      }
    };
  }

  function projectPoint(point, bounds) {
    const x = ((point.lng - bounds.west) / (bounds.east - bounds.west)) * 100;
    const y = (1 - (point.lat - bounds.south) / (bounds.north - bounds.south)) * 100;
    return {
      x: Math.min(96, Math.max(4, x)),
      y: Math.min(94, Math.max(6, y))
    };
  }

  function createFallbackMapController({ data, indexes, routePoints, onLocationSelect }) {
    const mapNode = document.getElementById("map");
    const chinaBounds = {
      north: 53.6,
      south: 18.2,
      east: 135.2,
      west: 73.5
    };
    const minZoomRatio = 0.18;
    let currentBounds = chinaBounds;
    let activeLocationId = null;
    let regionLayerVisible = true;
    let visibleLocationIds = new Set(data.locations.locations.map((location) => location.id));
    let currentAnimatedPoints = routePoints;

    function boundsCenter(bounds) {
      return {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2
      };
    }

    function clampBounds(bounds) {
      const fullLatSpan = chinaBounds.north - chinaBounds.south;
      const fullLngSpan = chinaBounds.east - chinaBounds.west;
      const minLatSpan = fullLatSpan * minZoomRatio;
      const minLngSpan = fullLngSpan * minZoomRatio;
      const center = boundsCenter(bounds);
      const latSpan = Math.min(fullLatSpan, Math.max(minLatSpan, bounds.north - bounds.south));
      const lngSpan = Math.min(fullLngSpan, Math.max(minLngSpan, bounds.east - bounds.west));

      let north = center.lat + latSpan / 2;
      let south = center.lat - latSpan / 2;
      let east = center.lng + lngSpan / 2;
      let west = center.lng - lngSpan / 2;

      if (north > chinaBounds.north) {
        south -= north - chinaBounds.north;
        north = chinaBounds.north;
      }
      if (south < chinaBounds.south) {
        north += chinaBounds.south - south;
        south = chinaBounds.south;
      }
      if (east > chinaBounds.east) {
        west -= east - chinaBounds.east;
        east = chinaBounds.east;
      }
      if (west < chinaBounds.west) {
        east += chinaBounds.west - west;
        west = chinaBounds.west;
      }

      return { north, south, east, west };
    }

    function zoomFallback(factor) {
      const center = boundsCenter(currentBounds);
      const latSpan = (currentBounds.north - currentBounds.south) * factor;
      const lngSpan = (currentBounds.east - currentBounds.west) * factor;
      currentBounds = clampBounds({
        north: center.lat + latSpan / 2,
        south: center.lat - latSpan / 2,
        east: center.lng + lngSpan / 2,
        west: center.lng - lngSpan / 2
      });
      render(currentAnimatedPoints);
    }

    function routePath(points) {
      return points.map((point, index) => {
        const projected = projectPoint(point, currentBounds);
        return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
      }).join(" ");
    }

    function regionPolygon(feature) {
      const coordinates = feature.geometry.coordinates[0];
      return coordinates.map(([lng, lat]) => {
        const point = projectPoint({ lng, lat }, currentBounds);
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      }).join(" ");
    }

    function createInfoHtml(location) {
      const poems = indexes.poemsByLocation.get(location.id) || [];
      const events = indexes.eventsByLocation.get(location.id) || [];
      return `
        <strong>${window.LiBaiUI.escapeHtml(location.name)}</strong>
        <span>${window.LiBaiUI.escapeHtml(location.period)} · ${window.LiBaiUI.escapeHtml(location.years.join(" / "))}</span>
        <p>${window.LiBaiUI.escapeHtml(location.summary)}</p>
        <small>${events.length} events · ${poems.length} poem samples</small>
      `;
    }

    function render(animatedPoints = routePoints) {
      currentAnimatedPoints = animatedPoints;
      const regionSvg = data.locations.geojson.features.map((feature) => `
        <polygon class="fallback-region" points="${regionPolygon(feature)}" data-visible="${regionLayerVisible ? "true" : "false"}"></polygon>
      `).join("");
      const markerHtml = data.locations.locations
        .filter((location) => visibleLocationIds.has(location.id))
        .map((location) => {
          const projected = projectPoint(location, currentBounds);
          return `
            <button class="fallback-marker ${location.id === activeLocationId ? "active" : ""}" type="button" data-location-id="${window.LiBaiUI.escapeHtml(location.id)}" data-category="${window.LiBaiUI.escapeHtml(location.category)}" style="left:${projected.x}%;top:${projected.y}%">
              <span aria-hidden="true"></span>
              <em>${window.LiBaiUI.escapeHtml(location.name)}</em>
            </button>
          `;
        }).join("");

      mapNode.innerHTML = `
        <div class="fallback-map" aria-label="Local fallback itinerary map">
          <svg class="fallback-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="fallbackWater" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="rgba(34,95,112,.10)"></stop>
                <stop offset="1" stop-color="rgba(184,135,70,.14)"></stop>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#fallbackWater)"></rect>
            ${regionSvg}
            <path class="fallback-route-base" d="${routePath(routePoints)}"></path>
            <path class="fallback-route-active" d="${routePath(animatedPoints)}"></path>
          </svg>
          <div class="fallback-markers">${markerHtml}</div>
          <div class="fallback-zoom-controls" aria-label="Map zoom controls">
            <button type="button" data-fallback-zoom="in" aria-label="Zoom in">+</button>
            <button type="button" data-fallback-zoom="out" aria-label="Zoom out">-</button>
          </div>
          <aside class="fallback-info" id="fallbackInfo">Google Maps is unavailable. The local fallback map is active.</aside>
        </div>
      `;

      mapNode.querySelectorAll(".fallback-marker").forEach((button) => {
        button.addEventListener("click", () => {
          const locationId = button.dataset.locationId;
          openInfo(locationId);
          onLocationSelect(locationId, { source: "fallback-map" });
        });
      });

      const fallbackMap = mapNode.querySelector(".fallback-map");
      fallbackMap?.addEventListener("wheel", (event) => {
        event.preventDefault();
        zoomFallback(event.deltaY < 0 ? 0.72 : 1.28);
      }, { passive: false });

      mapNode.querySelectorAll("[data-fallback-zoom]").forEach((button) => {
        button.addEventListener("click", () => {
          zoomFallback(button.dataset.fallbackZoom === "in" ? 0.72 : 1.28);
        });
      });

      if (activeLocationId) {
        openInfo(activeLocationId, true);
      }
    }

    function openInfo(locationId, silent) {
      const location = indexes.locationsById.get(locationId);
      const info = document.getElementById("fallbackInfo");
      if (!location || !info) return;
      info.innerHTML = createInfoHtml(location);
      if (!silent) {
        info.classList.remove("pulse");
        requestAnimationFrame(() => info.classList.add("pulse"));
      }
    }

    function focusLocation(locationId) {
      activeLocationId = locationId;
      const location = indexes.locationsById.get(locationId);
      if (location) {
        currentBounds = {
          north: location.lat + 4.5,
          south: location.lat - 4.5,
          east: location.lng + 6.5,
          west: location.lng - 6.5
        };
        currentBounds = clampBounds(currentBounds);
      }
      render(window.LiBaiRoute.getRouteSegmentUntil(routePoints, locationId));
    }

    function animateRoute(points = routePoints) {
      window.LiBaiAnimation.animatePath({
        points,
        duration: Math.max(1400, points.length * 140),
        onFrame: (visiblePath) => render(visiblePath)
      });
    }

    function animateRouteTo(locationId) {
      animateRoute(window.LiBaiRoute.getRouteSegmentUntil(routePoints, locationId));
    }

    function filterMarkers(visibleIds) {
      visibleLocationIds = new Set(visibleIds);
      render();
    }

    function showAllMarkers() {
      visibleLocationIds = new Set(data.locations.locations.map((location) => location.id));
      render();
    }

    function setRegionVisible(value) {
      regionLayerVisible = value;
      render();
    }

    render();

    return {
      fitAll: () => {
        currentBounds = chinaBounds;
        render();
      },
      focusLocation,
      openInfo,
      animateRoute,
      animateRouteTo,
      setTheme: () => {},
      setRegionVisible,
      filterMarkers,
      showAllMarkers,
      get regionLayerVisible() {
        return regionLayerVisible;
      }
    };
  }

  window.LiBaiMap = {
    createMapController,
    createFallbackMapController,
    categoryColors
  };
})();
