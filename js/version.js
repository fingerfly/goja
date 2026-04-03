/**
 * Purpose: Expose app version/build metadata for UI and cache naming.
 */
const version = { major: 10, minor: 1, patch: 4, build: 1 };

export const VERSION = `${version.major}.${version.minor}.${version.patch}`;
export const BUILD = version.build;
export const VERSION_STRING = `${VERSION} (${BUILD})`;
