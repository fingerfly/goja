const version = { major: 3, minor: 1, patch: 2, build: 3 };

export const VERSION = `${version.major}.${version.minor}.${version.patch}`;
export const BUILD = version.build;
export const VERSION_STRING = `${VERSION} (${BUILD})`;
