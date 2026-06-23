/**
 * Purpose: Expose app version/build metadata for UI and cache naming.
 */
const version = { major: 10, minor: 2, patch: 11, build: 2 };

export const VERSION = `${version.major}.${version.minor}.${version.patch}`;
export const BUILD = version.build;
export const VERSION_STRING = `${VERSION} (${BUILD})`;
