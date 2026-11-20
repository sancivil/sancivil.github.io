# Iraq solar resource (PVGIS v5.3)

Fetched 2026-11-20 from https://re.jrc.ec.europa.eu/api/v5_3/ (PVcalc + tmy). Radiation database: PVGIS-SARAH3; meteo: ERA5 (2005-2023). 1 kWp, 14% system loss, free-standing, c-Si, optimal angles. Azimuth: 0 = south, + = west.

| City | Lat | Lon | Tilt | Az | E_y kWh/kWp | H(i)_y kWh/m² | Loss % | TMY min °C | TMY max °C | Summer day mean °C | tmin | tnom | tmax |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Zakho | 37.1436 | 42.6819 | 32 | 3 | 1525.6 | 2057.7 | -25.86 | -6.8 | 43.6 | 34.3 | -10 | 54 | 74 |
| Duhok | 36.8669 | 42.9503 | 32 | 3 | 1541.9 | 2089.3 | -26.2 | -7.5 | 43.5 | 36.6 | -11 | 57 | 74 |
| Mosul | 36.34 | 43.13 | 32 | 4 | 1554.2 | 2121.7 | -26.75 | -2.8 | 48.1 | 39.6 | -6 | 60 | 79 |
| Erbil | 36.1911 | 44.0092 | 32 | 3 | 1566.5 | 2122.4 | -26.19 | -5 | 46.5 | 37 | -8 | 57 | 77 |
| Sulaymaniyah | 35.5613 | 45.4373 | 31 | 2 | 1551.2 | 2086.1 | -25.64 | -11.7 | 43.8 | 33.8 | -15 | 54 | 74 |
| Kirkuk | 35.4681 | 44.3922 | 32 | 4 | 1593.1 | 2158.7 | -26.2 | -2.4 | 46.8 | 38.9 | -6 | 59 | 77 |
| Halabja | 35.1778 | 45.9861 | 31 | 3 | 1549.1 | 2092.5 | -25.97 | -7.9 | 43 | 33.6 | -11 | 54 | 73 |
| Tikrit | 34.6071 | 43.6782 | 32 | 4 | 1640.9 | 2206.3 | -25.63 | -4 | 47.7 | 38.9 | -8 | 59 | 78 |
| Samarra | 34.1959 | 43.8857 | 31 | 5 | 1647.2 | 2219.6 | -25.79 | -2 | 48.2 | 40 | -6 | 60 | 79 |
| Baqubah | 33.75 | 44.6333 | 31 | 7 | 1628.2 | 2215 | -26.49 | 0.1 | 49.9 | 40.7 | -3 | 61 | 80 |
| Ramadi | 33.4258 | 43.2992 | 31 | 6 | 1681.8 | 2246.5 | -25.13 | 0.9 | 47.5 | 39.4 | -3 | 59 | 78 |
| Fallujah | 33.35 | 43.7833 | 31 | 5 | 1672.8 | 2248.5 | -25.6 | 1.1 | 49.6 | 39.9 | -2 | 60 | 80 |
| Baghdad | 33.3152 | 44.3661 | 31 | 7 | 1644.4 | 2227.6 | -26.18 | 1.3 | 49.6 | 40.5 | -2 | 60 | 80 |
| Karbala | 32.616 | 44.0249 | 31 | 7 | 1661.3 | 2240.3 | -25.84 | 1.5 | 49.3 | 40.6 | -2 | 61 | 80 |
| Kut | 32.5056 | 45.8247 | 30 | 8 | 1645.3 | 2234.9 | -26.38 | 1 | 50.8 | 41.8 | -2 | 62 | 81 |
| Hillah | 32.4637 | 44.4196 | 31 | 7 | 1660.9 | 2258 | -26.44 | 0.6 | 50 | 40.9 | -3 | 61 | 80 |
| Najaf | 32.0259 | 44.3462 | 30 | 7 | 1679.8 | 2281.4 | -26.37 | 1.7 | 48 | 40.2 | -2 | 60 | 79 |
| Diwaniyah | 31.9929 | 44.9255 | 30 | 8 | 1674.8 | 2268.5 | -26.17 | -0.8 | 51.5 | 41.2 | -4 | 61 | 82 |
| Amarah | 31.8356 | 47.144 | 32 | 0 | 1624 | 2218.4 | -26.79 | 0.5 | 50.9 | 42.7 | -3 | 63 | 81 |
| Samawah | 31.3099 | 45.2803 | 30 | 7 | 1673.4 | 2263 | -26.05 | 0.1 | 50.5 | 40.8 | -3 | 61 | 81 |
| Nasiriyah | 31.0439 | 46.2575 | 30 | 8 | 1660 | 2252.9 | -26.32 | 0.4 | 49.5 | 41.3 | -3 | 61 | 80 |
| Basra | 30.5085 | 47.7804 | 29 | 8 | 1655.2 | 2251.3 | -26.48 | 0.8 | 51.1 | 42.6 | -3 | 63 | 82 |

## Method

PVcalc v5_3 with peakpower=1, loss=14, optimalangles=1, mountingplace=free gives optimal tilt/azimuth, monthly E_m and annual E_y (kWh/kWp), annual in-plane H(i)_y (kWh/m2) and l_total (PVGIS total loss %, incl. angle-of-incidence, spectral, temperature/irradiance and the 14% system loss). TMY v5_3 hourly T2m gives tmyMinC/tmyMaxC; summerDayMeanC = mean T2m over June-August hours with G(h) > 200 W/m2. Design cell temperatures for string sizing: tmin = floor(tmyMinC) - 3 (margin for cold nights under-represented in a TMY; used for max Voc); tmax = ceil(tmyMaxC + 30) (rack-mounted module ~30 °C above ambient at ~1000 W/m2; used for min Vmp); tnom = round(summerDayMeanC + 20) (typical operating cell temperature). Coordinates are city centres (4 decimals).

## Citation

PVGIS ©European Union, 2001-2026. Data from the Photovoltaic Geographical Information System (PVGIS), European Commission Joint Research Centre, https://re.jrc.ec.europa.eu/pvg_tools/en/. API v5_3 endpoints: PVcalc and tmy.

## API errors

None: all 44 requests (22 PVcalc + 22 tmy) returned HTTP 200 on v5_3; v5_2 fallback not needed.

Note: the task said 21 cities but listed 22; all 22 are included.
