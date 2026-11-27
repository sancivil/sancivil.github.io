/* /build.json (contract §8): which content and code this build is made of. Served without caching (public/.htaccess). */
import type { APIRoute } from 'astro';
import { ACCEPTS_MAX_MINOR, formatJson, type BuildInfoV1 } from '../content/contract.ts';
import { buildInfo } from '../content/index.ts';

export const GET: APIRoute = () => {
  const info: BuildInfoV1 = {
    schema: 'faraday.site-build',
    version: 1,
    channel: import.meta.env.SITE_PREVIEW === '1' ? 'preview' : 'live',
    publishId: buildInfo.publishId,
    contentHash: buildInfo.contentHash,
    contentCommit: buildInfo.contentCommit,
    codeCommit: buildInfo.codeCommit,
    builtAt: buildInfo.builtAt,
    accepts: { snapshotVersion: 1, maxMinor: ACCEPTS_MAX_MINOR },
  };
  return new Response(formatJson(info), { headers: { 'Content-Type': 'application/json' } });
};
