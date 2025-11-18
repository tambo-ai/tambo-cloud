import "@testing-library/jest-dom";

// Polyfill ResizeObserver for components using cmdk/radix that rely on it
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserver;
}

// Polyfill scrollIntoView used by cmdk for option visibility
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(""),
    read: jest.fn().mockResolvedValue([]),
    write: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
  configurable: true,
});

// Disable framer-motion animations in tests
import { MotionGlobalConfig } from "framer-motion";
MotionGlobalConfig.skipAnimations = true;

// Mock document.elementFromPoint for TipTap/ProseMirror
Document.prototype.elementFromPoint = function elementFromPoint() {
  return null;
};

// Mock document.caretRangeFromPoint for TipTap/ProseMirror
Document.prototype.caretRangeFromPoint = function caretRangeFromPoint() {
  const range = document.createRange();
  range.setStart(document.body, 0);
  range.setEnd(document.body, 0);
  return range;
};

// Mock getClientRects for TipTap/ProseMirror
if (!Element.prototype.getClientRects) {
  Element.prototype.getClientRects = function getClientRects() {
    return {
      length: 1,
      item: () => ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
      }),
      [0]: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
      },
    } as unknown as DOMRectList;
  };
}

// Mock getBoundingClientRect for TipTap/ProseMirror
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
}
