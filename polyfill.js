// Polyfill for ES2023 Array methods to support older Node.js versions (like Node v18)
if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function(compareFn) {
      return [...this].sort(compareFn);
    },
    configurable: true,
    writable: true
  });
}

if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function() {
      return [...this].reverse();
    },
    configurable: true,
    writable: true
  });
}

if (!Array.prototype.toSpliced) {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value: function(start, deleteCount, ...items) {
      const clone = [...this];
      clone.splice(start, deleteCount, ...items);
      return clone;
    },
    configurable: true,
    writable: true
  });
}

if (!Array.prototype.with) {
  Object.defineProperty(Array.prototype, 'with', {
    value: function(index, value) {
      const clone = [...this];
      clone[index] = value;
      return clone;
    },
    configurable: true,
    writable: true
  });
}

// Silence non-fatal SWC native-to-WASM fallback warnings on RHEL/CentOS systems with GLIBC < 2.29
const originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Attempted to load @next/swc-linux-x64-gnu') ||
     args[0].includes('Attempted to load @next/swc-linux-x64-musl') ||
     args[0].includes('Skipping creating a lockfile'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

