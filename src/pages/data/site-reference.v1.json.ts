/*
  /data/site-reference.v1.json (contract §8): the technical layer the ERP may point at, from the same builder
  the importer checks snapshots against. Only data the site and the Designer bundle already publish.
*/
import type { APIRoute } from 'astro';
import policy from '../../data/technical/policy.json';
import siteImages from '../../data/technical/site-images.json';
import solar from '../../data/iraq-solar.json';
import { formatJson, type SiteReferenceV1 } from '../../content/contract.ts';
import { buildInfo, curatedBatteries, curatedFamilies, curatedSeries } from '../../content/index.ts';
import { siteReference } from '../../content/reference.ts';
import { inverters, panels } from '../../lib/designer/data.ts';

export const GET: APIRoute = () => {
  const reference: SiteReferenceV1 = {
    ...siteReference({
      series: curatedSeries,
      families: curatedFamilies,
      batteries: curatedBatteries,
      panels,
      inverters,
      cities: solar.cities,
      policy,
      siteImages,
    }),
    builtAt: buildInfo.builtAt,
    codeCommit: buildInfo.codeCommit,
    contentCommit: buildInfo.contentCommit,
    publishId: buildInfo.publishId,
  };
  return new Response(formatJson(reference), { headers: { 'Content-Type': 'application/json' } });
};
