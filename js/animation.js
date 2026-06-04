(function () {
  "use strict";

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateNumber({ from, to, duration = 500, onUpdate, onComplete }) {
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeInOutCubic(progress);
      onUpdate(from + (to - from) * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    }

    requestAnimationFrame(step);
  }

  function animatePath({ points, duration = 1800, onFrame, onComplete }) {
    if (!points || points.length < 2) {
      if (onComplete) onComplete();
      return;
    }

    const start = performance.now();

    function interpolatePoint(progress) {
      const maxIndex = points.length - 1;
      const scaled = progress * maxIndex;
      const index = Math.min(Math.floor(scaled), maxIndex - 1);
      const local = scaled - index;
      const a = points[index];
      const b = points[index + 1];
      return {
        lat: a.lat + (b.lat - a.lat) * local,
        lng: a.lng + (b.lng - a.lng) * local,
        index
      };
    }

    function step(now) {
      const raw = Math.min((now - start) / duration, 1);
      const progress = easeInOutCubic(raw);
      const currentPoint = interpolatePoint(progress);
      const visibleCount = Math.max(2, Math.ceil(progress * points.length));
      onFrame(points.slice(0, visibleCount), currentPoint, progress);

      if (raw < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    }

    requestAnimationFrame(step);
  }

  function revealOnScroll(selector) {
    const nodes = Array.from(document.querySelectorAll(selector));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("fade-in"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    nodes.forEach((node) => observer.observe(node));
  }

  window.LiBaiAnimation = {
    animateNumber,
    animatePath,
    revealOnScroll,
    easeInOutCubic
  };
})();
