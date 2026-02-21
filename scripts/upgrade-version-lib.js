export const BUMP_TYPES = Object.freeze({
  build: 'build',
  patch: 'patch',
  minor: 'minor',
  major: 'major',
});

const VALID_BUMP_TYPES = [BUMP_TYPES.build, BUMP_TYPES.patch, BUMP_TYPES.minor, BUMP_TYPES.major];

export function parseVersionFromCode(code) {
  if (typeof code !== 'string' || code.trim() === '') return null;
  const majorMatch = code.match(/major:\s*(\d+)/);
  const minorMatch = code.match(/minor:\s*(\d+)/);
  const patchMatch = code.match(/patch:\s*(\d+)/);
  const buildMatch = code.match(/build:\s*(\d+)/);
  if (!majorMatch || !minorMatch || !patchMatch) return null;
  return {
    major: parseInt(majorMatch[1], 10),
    minor: parseInt(minorMatch[1], 10),
    patch: parseInt(patchMatch[1], 10),
    build: buildMatch ? parseInt(buildMatch[1], 10) : 1,
  };
}

export function computeBumpedVersion(current, bumpType) {
  const { major, minor, patch, build } = current;
  if (bumpType === BUMP_TYPES.build) return { major, minor, patch, build: (build || 1) + 1 };
  if (bumpType === BUMP_TYPES.patch) return { major, minor, patch: patch + 1, build: 1 };
  if (bumpType === BUMP_TYPES.minor) return { major, minor: minor + 1, patch: 0, build: 1 };
  if (bumpType === BUMP_TYPES.major) return { major: major + 1, minor: 0, patch: 0, build: 1 };
  throw new Error(`Invalid bump type: ${bumpType}. Use ${VALID_BUMP_TYPES.join(', ')}.`);
}

export function applyVersionToCode(code, version) {
  let out = code.replace(/major:\s*\d+/, `major: ${version.major}`);
  out = out.replace(/minor:\s*\d+/, `minor: ${version.minor}`);
  out = out.replace(/patch:\s*\d+/, `patch: ${version.patch}`);
  if (version.build !== undefined) out = out.replace(/build:\s*\d+/, `build: ${version.build}`);
  return out;
}

export function normalizeBumpArg(arg) {
  if (!arg || arg.trim() === '') {
    throw new Error('Bump type is required. Use: ' + VALID_BUMP_TYPES.join(', '));
  }
  const bump = arg.replace(/^-+/, '').toLowerCase();
  if (VALID_BUMP_TYPES.includes(bump)) return bump;
  throw new Error(`Invalid bump type: "${arg}". Use: ${VALID_BUMP_TYPES.join(', ')}`);
}
