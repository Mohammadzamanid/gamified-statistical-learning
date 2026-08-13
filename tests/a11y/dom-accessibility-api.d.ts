/**
 * Types for `dom-accessibility-api`, which ships them but does not expose them
 * through its `exports` map — so `moduleResolution: "bundler"` cannot find the
 * declaration file that is sitting right there in the package.
 *
 * Declared here rather than by loosening the project's module resolution: the
 * packaging gap belongs to one library, and the fix should be the same size.
 * Only the function the harness uses is declared, so this stays a shim rather
 * than a fork of the library's typings.
 */
declare module "dom-accessibility-api" {
  export function computeAccessibleName(element: Element): string;
  export function computeAccessibleDescription(element: Element): string;
}
