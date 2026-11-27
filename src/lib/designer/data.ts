import panelsData from '../../data/designer/panels.json';
import invertersData from '../../data/designer/inverters.json';
import solar from '../../data/iraq-solar.json';
import batteryData from '../../data/technical/batteries.json';
import seriesData from '../../data/technical/series.json';
import type { Battery, Catalog, City, Inverter, Panel } from './types.ts';
import { seriesRenders } from './visual.ts';

export const panels = panelsData as Panel[];
export const inverters = invertersData as Inverter[];
export const catalog: Catalog = { panels, inverters };
export const panelRender = seriesRenders(seriesData, panels);

/** North to south, as people in Iraq read the map. */
export const cities = [...(solar.cities as City[])].sort((a, b) => b.lat - a.lat);
export const batteries = batteryData as Battery[];

export const pvgis = { source: solar.source, database: solar.database, loss: solar.assumptions.loss };

const SERIES_ORDER = ['OR10H', 'OR12H', 'OR10E', 'OR10L', 'SA', 'SF', 'DR10H', 'SM', 'SG', 'OR6H', 'OR2H', 'OH', 'OL', 'OS', 'SP'];

export function seriesRank(series: string): number {
  const i = SERIES_ORDER.indexOf(series);
  return i === -1 ? SERIES_ORDER.length : i;
}
