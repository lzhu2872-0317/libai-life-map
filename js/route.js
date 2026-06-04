(function () {
  "use strict";

  function buildRoutePoints(locationsData, locationsById) {
    return locationsData.routeOrder
      .map((id) => locationsById.get(id))
      .filter(Boolean)
      .map((location) => ({
        id: location.id,
        lat: Number(location.lat),
        lng: Number(location.lng),
        name: location.name
      }));
  }

  function getRouteSegmentUntil(routePoints, locationId) {
    const index = routePoints.findIndex((point) => point.id === locationId);
    if (index < 0) {
      return routePoints;
    }
    return routePoints.slice(0, index + 1);
  }

  function calculateBounds(points) {
    return points.reduce((bounds, point) => {
      bounds.north = Math.max(bounds.north, point.lat);
      bounds.south = Math.min(bounds.south, point.lat);
      bounds.east = Math.max(bounds.east, point.lng);
      bounds.west = Math.min(bounds.west, point.lng);
      return bounds;
    }, {
      north: -90,
      south: 90,
      east: -180,
      west: 180
    });
  }

  window.LiBaiRoute = {
    buildRoutePoints,
    getRouteSegmentUntil,
    calculateBounds
  };
})();
