/**
 * Solar position from the NOAA solar calculator equations (Meeus, "Astronomical Algorithms"),
 * accurate to well under a degree for dates around now. Angles in degrees; azimuth is measured
 * clockwise from north; elevation includes atmospheric refraction.
 */

/** Faraday's office in Sulaymaniyah. Iraq keeps UTC+3 all year (no daylight saving). */
export const SULAYMANIYAH = { lat: 35.5613, lon: 45.4374, utcOffset: 3 };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Declination and equation of time (minutes) at an instant. */
function solar(ms: number) {
  const jc = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  const l0 = (((280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360) + 360) % 360;
  const m = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const c =
    Math.sin(rad(m)) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
    Math.sin(rad(2 * m)) * (0.019993 - 0.000101 * jc) +
    Math.sin(rad(3 * m)) * 0.000289;
  const omega = 125.04 - 1934.136 * jc;
  const lambda = l0 + c - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eot =
    4 *
    deg(
      y * Math.sin(2 * rad(l0)) -
        2 * e * Math.sin(rad(m)) +
        4 * e * y * Math.sin(rad(m)) * Math.cos(2 * rad(l0)) -
        0.5 * y * y * Math.sin(4 * rad(l0)) -
        1.25 * e * e * Math.sin(2 * rad(m)),
    );
  return { decl, eot };
}

/** Refraction near the horizon (NOAA approximation), in degrees. */
function refraction(h: number) {
  if (h > 85) return 0;
  const t = Math.tan(rad(h));
  if (h > 5) return (58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5) / 3600;
  if (h > -0.575) return (1735 + h * (-518.2 + h * (103.4 + h * (-12.79 + h * 0.711)))) / 3600;
  return -20.772 / t / 3600;
}

export interface SunPosition {
  azimuth: number;
  elevation: number;
}

export function sunPosition(ms: number, lat = SULAYMANIYAH.lat, lon = SULAYMANIYAH.lon): SunPosition {
  const { decl, eot } = solar(ms);
  const utcMinutes = (((ms / 60000) % 1440) + 1440) % 1440;
  const tst = (((utcMinutes + eot + 4 * lon) % 1440) + 1440) % 1440;
  const ha = tst / 4 - 180;
  const cosZ = Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(ha));
  const zenith = deg(Math.acos(Math.min(1, Math.max(-1, cosZ))));
  const h = 90 - zenith;
  const cosA = (Math.sin(rad(lat)) * Math.cos(rad(zenith)) - Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.sin(rad(zenith)) || 1e-9);
  const a = deg(Math.acos(Math.min(1, Math.max(-1, cosA))));
  return { azimuth: ha > 0 ? (a + 180) % 360 : (540 - a) % 360, elevation: h + refraction(h) };
}

/** Local clock minutes (0–1440) at an instant. */
export const localMinutes = (ms: number, utcOffset = SULAYMANIYAH.utcOffset) =>
  ((((ms / 60000 + utcOffset * 60) % 1440) + 1440) % 1440);

/** The instant of local midnight that starts the local day containing `ms`. */
export const localMidnight = (ms: number, utcOffset = SULAYMANIYAH.utcOffset) => ms - localMinutes(ms, utcOffset) * 60000;

/** Sunrise, solar noon and sunset of the local day containing `ms`, as local clock minutes. */
export function sunTimes(ms: number, lat = SULAYMANIYAH.lat, lon = SULAYMANIYAH.lon, utcOffset = SULAYMANIYAH.utcOffset) {
  const noonMs = localMidnight(ms, utcOffset) + 12 * 3600000;
  const { decl, eot } = solar(noonMs);
  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
  const ha = deg(Math.acos(Math.min(1, Math.max(-1, cosH))));
  const noon = 720 - 4 * lon - eot + utcOffset * 60;
  return { sunrise: noon - 4 * ha, noon, sunset: noon + 4 * ha };
}

/** "06:05" from local clock minutes. */
export const clock = (minutes: number) => {
  const m = Math.round(((minutes % 1440) + 1440) % 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
