import "@testing-library/jest-dom";

// Polyfill ResizeObserver for components using cmdk/radix that rely on it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error attach to global for jsdom
if (!global.ResizeObserver) {
  // @ts-expect-error jsdom global
  global.ResizeObserver = ResizeObserver;
}

// Polyfill scrollIntoView used by cmdk for option visibility
// @ts-expect-error jsdom Element prototype
if (!Element.prototype.scrollIntoView) {
  // @ts-expect-error jsdom Element prototype assignment
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
