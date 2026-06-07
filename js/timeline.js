(function () {
  "use strict";

  function renderTimeline({ events, locationsById, activeEventId, activeTypes }) {
    const track = document.getElementById("timelineTrack");
    track.innerHTML = events.map((event) => {
      const location = locationsById.get(event.locationId);
      const typeLabel = window.LiBaiUI.categoryLabels[event.type] || event.type;
      const poems = window.__LiBaiTimelinePoems?.get(event.locationId) || [];
      const displayTitle = event.type === "stage" ? event.title : (location ? location.name : event.title);
      const metaText = `${displayTitle} (${event.year} AD${poems.length ? `, works: ${poems.length}` : ""})`;
      const typeTag = event.type === "stage" ? "" : `<span class="tag type-tag">${window.LiBaiUI.escapeHtml(typeLabel)}</span>`;
      const isHidden = activeTypes.size && !activeTypes.has(event.type);
      return `
        <article class="timeline-item ${event.id === activeEventId ? "active" : ""} ${isHidden ? "hidden" : ""}" data-event-id="${window.LiBaiUI.escapeHtml(event.id)}" data-location-id="${window.LiBaiUI.escapeHtml(event.locationId)}" data-type="${window.LiBaiUI.escapeHtml(event.type)}">
          <span class="timeline-dot"></span>
          <time class="timeline-year">${window.LiBaiUI.escapeHtml(event.year)}</time>
          <button class="timeline-card" type="button">
            <span class="timeline-meta">
              ${typeTag}
              <span class="tag">${window.LiBaiUI.escapeHtml(metaText)}</span>
            </span>
            <h3>${window.LiBaiUI.escapeHtml(displayTitle)}</h3>
            <p>${window.LiBaiUI.escapeHtml(event.year)} · ${window.LiBaiUI.escapeHtml(event.summary)}</p>
          </button>
        </article>
      `;
    }).join("");
  }

  function renderFilterChips(events, activeTypes, onToggle) {
    const container = document.getElementById("filterChips");
    const types = Array.from(new Set(events.map((event) => event.type))).filter((type) => type !== "stage");
    container.innerHTML = types.map((type) => `
      <button class="type-chip ${activeTypes.has(type) ? "active" : ""}" type="button" data-type="${window.LiBaiUI.escapeHtml(type)}">
        ${window.LiBaiUI.escapeHtml(window.LiBaiUI.categoryLabels[type] || type)}
      </button>
    `).join("");

    container.querySelectorAll("[data-type]").forEach((button) => {
      button.addEventListener("click", () => {
        onToggle(button.dataset.type);
      });
    });
  }

  function bindTimelineClick(onSelect) {
    document.getElementById("timelineTrack").addEventListener("click", (event) => {
      const item = event.target.closest(".timeline-item");
      if (!item) {
        return;
      }
      onSelect(item.dataset.eventId, item.dataset.locationId);
    });
  }

  function updateActiveTimeline(eventId, locationId) {
    document.querySelectorAll(".timeline-item").forEach((item) => {
      const active = item.dataset.eventId === eventId || (!eventId && item.dataset.locationId === locationId);
      item.classList.toggle("active", active);
      if (active) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  function applyTimelineSearch(query) {
    const normalized = query.trim().toLowerCase();
    document.querySelectorAll(".timeline-item").forEach((item) => {
      const text = item.textContent.toLowerCase();
      const matches = !normalized || text.includes(normalized);
      item.classList.toggle("search-hidden", !matches);
      item.style.display = matches ? "" : "none";
    });
  }

  window.LiBaiTimeline = {
    renderTimeline,
    renderFilterChips,
    bindTimelineClick,
    updateActiveTimeline,
    applyTimelineSearch
  };
})();
