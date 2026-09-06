/**
 * The production entry: only what the federated remote exposes. The
 * development harness (`index.html` → `standalone.tsx`) is deliberately
 * NOT reachable from here — its stylesheet carries a full CSS reset that
 * must never ride into the host page.
 */
export { default as manifest } from "./manifest";
