import type { ModuleSpec } from './types.ts';

export type CellTech = 'topcon' | 'perc' | 'poly' | 'mono';

/**
 * What the anatomy captions may say about a module. Every rule follows research/peimar-notes.md
 * and src/data/technical/series.json: MNDB = TOPCon bifacial double glass, …MN = N-type TOPCon,
 * SA/SF/OR10H without MN = PERC, SG…P = polycrystalline, OR10/SA = M10 cells, OR12 = M12.
 */
export interface ModuleFacts {
  model: string;
  cells: number;
  halfCut: boolean;
  depth: number;
  series: 'S' | 'OR' | 'other';
  doubleGlass: boolean;
  clearBack: boolean;
  tech: CellTech;
  bifacial: boolean;
  format: 'M10' | 'M12' | null;
  frame: ModuleSpec['frame'];
  back: ModuleSpec['back'];
  tint: ModuleSpec['tint'];
  protection: string | null;
  junctionBoxes: 1 | 3;
}

export function moduleFacts(spec: ModuleSpec): ModuleFacts {
  const m = spec.model.toUpperCase();
  const poly = spec.cellType === 'poly' || /^SG\d+P/.test(m);
  const topcon = !poly && m.includes('MN');
  const perc = !poly && !topcon && /^(SA|SF|OR10H)/.test(m);
  return {
    model: spec.model,
    cells: spec.cells,
    halfCut: spec.halfCut,
    depth: spec.depth,
    series: m.startsWith('S') ? 'S' : m.startsWith('OR') ? 'OR' : 'other',
    doubleGlass: spec.back === 'glass' && m.includes('DB'),
    clearBack: spec.back === 'glass' && !m.includes('DB'),
    tech: poly ? 'poly' : topcon ? 'topcon' : perc ? 'perc' : 'mono',
    bifacial: spec.bifacial,
    format: /^(OR10|SA)/.test(m) ? 'M10' : m.startsWith('OR12') ? 'M12' : null,
    frame: spec.frame,
    back: spec.back,
    tint: spec.tint,
    protection: spec.protection ?? null,
    junctionBoxes: spec.halfCut ? 3 : 1,
  };
}
