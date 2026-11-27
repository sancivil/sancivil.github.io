import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataset, faqPage, jsonLdText, PVGIS, product, productGroup, webPage, type JsonLdNode } from '../src/lib/seo/schema.ts';

const page = { brand: 'Peimar', description: 'd', image: '/a.png', url: 'https://faradayiq.com/products/modules/x/' };
const FORMAT = /(?![\u200c\u200d])\p{Cf}|\u00a0/u;

/* ---------- product pages ---------- */

test('a one-model product names its model as model and mpn; a product without a model code names neither', () => {
  const battery = product({ ...page, name: 'Peimar PSI-X-HS 2.5', model: 'PSI-X-HS 2.5' });
  assert.equal(battery['@type'], 'Product');
  assert.equal(battery.model, 'PSI-X-HS 2.5');
  assert.equal(battery.mpn, 'PSI-X-HS 2.5');
  const item = product({ ...page, brand: 'Faraday', name: 'Faraday Ground mount kit 2×6' });
  assert.equal('model' in item || 'mpn' in item, false);
});

test('a series is a ProductGroup with one variant per model it shows, in order, and no model number of its own', () => {
  const models = ['OR10E460MNDB (BF)', 'OR10E460MNDB (FB)', 'OR10E640MNDB'];
  const group = productGroup({ ...page, name: 'Peimar OR Series OR10E', id: 'or-series-or10e', models });
  const json = JSON.parse(jsonLdText(group));
  assert.equal(json['@type'], 'ProductGroup');
  assert.equal(json.productGroupID, 'or-series-or10e');
  assert.equal('model' in json || 'mpn' in json, false);
  assert.deepEqual(json.hasVariant, [
    { '@type': 'Product', name: 'Peimar OR10E460MNDB (BF)', model: 'OR10E460MNDB (BF)' },
    { '@type': 'Product', name: 'Peimar OR10E460MNDB (FB)', model: 'OR10E460MNDB (FB)' },
    { '@type': 'Product', name: 'Peimar OR10E640MNDB', model: 'OR10E640MNDB' },
  ]);
  assert.deepEqual(
    [json.name, json.description, json.image, json.url, json.brand, json.manufacturer?.name],
    ['Peimar OR Series OR10E', 'd', 'https://faradayiq.com/a.png', page.url, { '@type': 'Brand', name: 'Peimar' }, 'Peimar S.r.l.'],
  );
});

/* ---------- the text of a JSON-LD block ---------- */

test('JSON-LD text drops bidi controls, word joiners and other format characters but keeps ZWNJ and ZWJ', () => {
  const ar = '\u2066\u202bإنتاج\u202c 1\u00a0kWh/\u2060m²\u2069 \u200fمي\u200cخواهم\u200d\u00ad\ufeff\u200b\u2060–\u2060';
  const nodes: JsonLdNode[] = [
    faqPage([{ q: ar, a: ar }]),
    webPage({ url: 'https://faradayiq.com/ar/solar/', name: ar, description: ar, locale: 'ar' }),
    dataset({
      ...PVGIS,
      name: ar,
      description: ar,
      url: 'https://faradayiq.com/ar/solar/',
      locale: 'ar',
      spatialCoverage: [],
      variableMeasured: [{ name: ar, unitText: 'kWh' }],
      dateModified: '2026-01-01',
      keywords: [ar],
    }),
    productGroup({ ...page, name: ar, description: ar, category: ar, brand: ar, id: 'x', models: [ar] }),
    /* A node no builder made, like the organization in Base.astro, whose text comes from the owner content. */
    { '@type': 'LocalBusiness', description: ar, address: { '@type': 'PostalAddress', streetAddress: ar } },
  ];
  for (const node of nodes) {
    const text = jsonLdText(node);
    const strings = text.match(/"(?:[^"\\]|\\.)*"/g)!.map((s) => JSON.parse(s) as string);
    assert.equal(strings.filter((s) => FORMAT.test(s)).length, 0, text);
    assert.ok(strings.includes('إنتاج 1 kWh/m² مي\u200cخواهم\u200d–'), text);
  }
});

test('JSON-LD text never closes its script element', () => {
  const text = jsonLdText(faqPage([{ q: 'Is 1 < 2?', a: '</script><script>alert(1)</script>' }]));
  assert.equal(text.includes('<'), false);
  assert.equal(JSON.parse(text).mainEntity[0].acceptedAnswer.text, '</script><script>alert(1)</script>');
});
