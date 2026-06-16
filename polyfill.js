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
