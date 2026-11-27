export type Phase = 'single_phase' | 'three_phase';
export type InverterType = 'hybrid' | 'on-grid' | 'micro';

export type Panel = {
  id: string;
  model: string;
  series: string;
  finish: { code: string; label: string | null } | null;
  bifacial: boolean;
  power: number;
  vmp: number;
  imp: number;
  voc: number;
  isc: number;
  vdcMax: number;
  efficiency: number | null;
  ctPmax: number | null;
  ctVoc: number;
  ctIsc: number;
  width: number | null;
  height: number | null;
  custom?: boolean;
};

export type MpptConfig = { key: string; name: string; labels: string[] };

export type Inverter = {
  id: string;
  model: string;
  phase: Phase;
  type: InverterType;
  pnomAc: number;
  pnomDc: number;
  vmaxDc: number;
  vstart: number;
  vminMppt: number;
  vmaxMppt: number;
  numMppt: number;
  imaxPerMppt: number[];
  percPminCc: number;
  percPmaxCc: number;
  image: string | null;
  mpptConfigs: MpptConfig[];
};

export type Temps = { tmin: number; tnom: number; tmax: number };

export type City = {
  id: string;
  name: string;
  nameAr: string;
  nameKu: string;
  governorate: string;
  lat: number;
  optimalTilt: number;
  optimalAzimuth: number;
  yieldMonthly: number[];
  yieldAnnual: number;
  design: Temps;
};

export type Battery = {
  name: string;
  key: string;
  family: string;
  capacity: { totalKwh?: number | number[]; ratedKwh?: number; moduleKwh?: number; modules?: number[] } | null;
};

export type Catalog = { panels: Panel[]; inverters: Inverter[] };

export type SubArray = { id: string; name: string; panelId: string; count: number };

/** One MPPT group of an inverter block. series 0 = nothing selected. */
export type GroupSel = { subArrayId: string; series: number; strings: number };

export type InverterBlock = { id: string; inverterId: string; count: number; configKey: string; groups: GroupSel[] };

export type Currency = 'IQD' | 'USD';

/**
 * Payback inputs: project cost and electricity price in one currency (no conversion). useKwh is the yearly
 * consumption when the design came from the needs path; energy above it saves nothing. NaN = not entered.
 */
export type Finance = { currency: Currency; cost: number; pricePerKwh: number; useKwh: number };

export type Project = {
  name: string;
  number: string;
  client: string;
  address: string;
  notes: string;
  /** '' = custom temperatures, no city. */
  cityId: string;
  temps: Temps;
  subArrays: SubArray[];
  customPanels: Panel[];
  inverters: InverterBlock[];
  finance: Finance;
};
