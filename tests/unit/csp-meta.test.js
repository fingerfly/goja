// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function readCspContent() {
  const htmlPath = path.resolve(__dirname, '../../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  return match ? match[1] : '';
}

describe('index CSP policy', () => {
  it('allows known live-server inline script hash while keeping self script policy', () => {
    const csp = readCspContent();
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("'sha256-vvt4KWwuNr51XfE5m+hzeNEGhiOfZzG97ccfqGsPwvE='");
  });
});
