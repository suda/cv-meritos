import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom no implementa structuredClone en algunas versiones.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}
