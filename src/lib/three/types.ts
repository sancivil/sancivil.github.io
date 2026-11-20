/** Anodised frame colour. red = RAL 8015 (Red Line, FR), green = RAL 6007 (Green Line, FG). */
export type FrameColor = 'black' | 'silver' | 'red' | 'green';
/** What sits behind the cells: a white or black backsheet, or a clear rear (rear glass or transparent backsheet). */
export type BackColor = 'black' | 'white' | 'glass';
/** Coloured front glass: red (FR, RAL 8015) or green (FG, RAL 6007). */
export type CellTint = 'standard' | 'red' | 'green';

/** Geometry and look of a PV module, in datasheet units (mm). */
export interface ModuleSpec {
  model: string;
  width: number;
  height: number;
  depth: number;
  /** Cell pieces as printed on the datasheet (a 144 half-cut module = 144). */
  cells: number;
  halfCut: boolean;
  frame: FrameColor;
  back: BackColor;
  tint: CellTint;
  bifacial: boolean;
  power?: number;
  cellType?: 'mono' | 'poly';
  /** Junction box protection class from the datasheet, e.g. IP68. */
  protection?: string;
  /** Electrical ratings at STC from the datasheet, printed on the rear label. */
  rating?: Rating;
}

export interface Rating {
  vmp: number;
  imp: number;
  voc: number;
  isc: number;
  vdcMax: number;
  fuse: number | null;
}

/** Shape of an entry in src/data/designer/panels.json (fields used here). */
export interface PanelRecord {
  id: string;
  model: string;
  power: number;
  width: number;
  height: number;
  depth: number;
  cellQuantity: number;
  cellFullness: string;
  bifacial: boolean;
  finish: { code: string; label: string | null } | null;
  cellType?: string;
  protectionClass?: string;
  vmp?: number | null;
  imp?: number | null;
  voc?: number | null;
  isc?: number | null;
  vdcMax?: number | null;
  imaxFuse?: number | null;
}

/*
  Finish suffixes as Peimar's datasheets show them (research/peimar-notes.md, "Model suffixes"):
  FB black frame + black backsheet, BF black frame + white backsheet, SF silver frame,
  B silver frame + transparent backsheet (PERC bifacial), FR Red Line (RAL 8015 frame, red glass),
  FG Green Line (RAL 6007, coloured glass), no suffix silver frame. Double-glass (MNDB) models
  keep the frame colour of their suffix and have a glass rear.
*/
export function specFromPanel(p: PanelRecord): ModuleSpec {
  const code = p.finish?.code ?? '';
  const bifacial = p.bifacial || code === 'B';
  const frame: FrameColor =
    code === 'FB' || code === 'BF' ? 'black' : code === 'FR' ? 'red' : code === 'FG' ? 'green' : 'silver';
  return {
    model: p.model,
    width: p.width,
    height: p.height,
    depth: p.depth,
    cells: p.cellQuantity,
    halfCut: p.cellFullness === 'half',
    frame,
    back: bifacial ? 'glass' : code === 'FB' ? 'black' : 'white',
    tint: code === 'FR' ? 'red' : code === 'FG' ? 'green' : 'standard',
    bifacial,
    power: p.power,
    cellType: p.cellType === 'poly' ? 'poly' : 'mono',
    protection: p.protectionClass,
    rating:
      p.vmp && p.imp && p.voc && p.isc && p.vdcMax
        ? { vmp: p.vmp, imp: p.imp, voc: p.voc, isc: p.isc, vdcMax: p.vdcMax, fuse: p.imaxFuse ?? null }
        : undefined,
  };
}
