import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clock, sunPosition, sunTimes } from '../src/lib/three/sun.ts';

const noonElevation = (iso: string) => {
  const day = Date.parse(iso);
  let best = -90;
  for (let m = 0; m < 1440; m += 1) best = Math.max(best, sunPosition(day + m * 60000).elevation);
  return best;
};

test('solar-noon elevation over Sulaymaniyah at the solstices', () => {
  assert.ok(Math.abs(noonElevation('2026-06-21T00:00:00Z') - 77.9) < 0.3);
  assert.ok(Math.abs(noonElevation('2026-12-21T00:00:00Z') - 31.0) < 0.3);
});

test('sunrise and sunset in Sulaymaniyah on 20 November 2026', () => {
  const { sunrise, sunset } = sunTimes(Date.parse('2026-11-20T09:00:00Z'));
  assert.equal(clock(sunrise), '06:39');
  assert.equal(clock(sunset), '16:49');
});

test('the sun is below the horizon at local midnight', () => {
  assert.ok(sunPosition(Date.parse('2026-11-20T21:00:00Z')).elevation < 0);
});
