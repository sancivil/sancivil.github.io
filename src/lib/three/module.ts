import {
  AddEquation,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CustomBlending,
  CylinderGeometry,
  DoubleSide,
  BufferGeometry,
  CircleGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Path,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { ColorSpace, Material, Object3D, Texture } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { FRAME_LIP, FRAME_WALL, cellLayout } from './layout.ts';
import { drawCellSheet, drawLabel } from './textures.ts';
import type { ModuleSpec } from './types.ts';

const MM = 0.001;

const FRAME_COLORS = { black: '#26272a', silver: '#cdd0d4', red: '#763c28', green: '#343b29' } as const;
const GLASS_TINTS = { red: '#8a402d', green: '#3b5639' } as const;

export const LAYERS = ['glass', 'encapsulant', 'cells', 'rearEncapsulant', 'back', 'frame', 'junction'] as const;

type Uniform = { value: number };

export interface PvModule {
  root: Group;
  layers: Group[];
  size: { w: number; h: number; d: number };
  /** Glass light sweep: band position (−0.3…1.3), strength, 1 = right to left. */
  sweep: Uniform;
  sweepStrength: Uniform;
  sweepFlip: Uniform;
  setExplode(t: number | readonly number[]): void;
  /** Corner points of every layer in module space for an explode state, for camera framing. */
  points(t: number | readonly number[]): Vector3[];
  /** Centre of the (exploded) stack along the module normal. */
  center(t: number | readonly number[]): number;
  /** Callout point on layer i in module space for an explode state; side picks the long edge (1 = +x). */
  anchor(i: number, t: number | readonly number[], side: number): Vector3;
  dispose(): void;
}

export interface BuildOptions {
  textureMax: number;
  anisotropy: number;
  /** Prefiltered environment (PMREM) used for reflections. */
  envMap: Texture;
  envIntensity: number;
  /** Rotation of the environment around the vertical axis, in radians. */
  envRotation: number;
  /** Hairline colour that outlines the clear layers while they are separated. */
  lineColor: string;
}

function clearGlass() {
  const m = new MeshPhysicalMaterial({
    color: 0x000000,
    roughness: 0.07,
    metalness: 0,
    ior: 1.52,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 0.7,
    iridescenceIOR: 1.32,
    iridescenceThicknessMinimum: 90,
    iridescenceThicknessMaximum: 125,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
  });
  m.blending = CustomBlending;
  m.blendEquation = AddEquation;
  m.blendSrc = OneFactor;
  m.blendDst = OneMinusSrcAlphaFactor;
  return m;
}

function tintedGlass(color: string) {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    metalness: 0,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    iridescence: 0.4,
    iridescenceIOR: 1.32,
    iridescenceThicknessMinimum: 90,
    iridescenceThicknessMaximum: 125,
  });
}

/** Light band across the glass; `slope` weights uv.y so the band runs diagonally on the real module shape. */
function addSweep(m: MeshPhysicalMaterial, band: Uniform, strength: Uniform, flip: Uniform, slope: Uniform) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSweep = band;
    shader.uniforms.uSweepStrength = strength;
    shader.uniforms.uSweepFlip = flip;
    shader.uniforms.uSweepSlope = slope;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vSweepUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSweepUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vSweepUv;\nuniform float uSweep;\nuniform float uSweepStrength;\nuniform float uSweepFlip;\nuniform float uSweepSlope;',
      )
      .replace(
        '#include <opaque_fragment>',
        'float sweepX = mix(vSweepUv.x, 1.0 - vSweepUv.x, uSweepFlip);\n' +
          'float sweepD = (sweepX + vSweepUv.y * uSweepSlope) / (1.0 + uSweepSlope) - uSweep;\n' +
          'float sweepBand = exp(-sweepD * sweepD * 520.0) + 0.14 * exp(-sweepD * sweepD * 60.0);\n' +
          'outgoingLight += vec3(1.0, 0.96, 0.88) * uSweepStrength * sweepBand;\n' +
          '#include <opaque_fragment>',
      );
  };
}

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 5): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/** Hollow frame section with a rounded lip over the glass; u = inward from the outer face, v = back to front, in mm. */
function frameProfile(depth: number, lamT: number) {
  const flange = depth >= 35 ? 26 : 22;
  const box = 7.5;
  const slotTop = depth - FRAME_WALL;
  const slotBottom = slotTop - lamT - 0.6;
  const pts: [number, number][] = [
    [0, 0.4],
    [0.4, 0],
    [flange, 0],
    [flange, FRAME_WALL],
    [box, FRAME_WALL],
    [box, slotBottom - FRAME_WALL],
    [FRAME_LIP - 1, slotBottom - FRAME_WALL],
    [FRAME_LIP - 1, slotBottom],
    [FRAME_WALL, slotBottom],
    [FRAME_WALL, slotTop],
    [FRAME_LIP - 0.5, slotTop],
    [FRAME_LIP, slotTop + 0.5],
    ...arc(FRAME_LIP - 1, depth - 1, 1, 0, Math.PI / 2),
    ...arc(2, depth - 2, 2, Math.PI / 2, Math.PI),
  ];
  const shape = new Shape(pts.map(([u, v]) => new Vector2(u, v)));
  const chamberTop = slotBottom - 2 * FRAME_WALL;
  if (chamberTop - FRAME_WALL > 2) {
    const hole = new Path();
    hole.moveTo(FRAME_WALL, FRAME_WALL);
    hole.lineTo(FRAME_WALL, chamberTop);
    hole.lineTo(box - FRAME_WALL, chamberTop);
    hole.lineTo(box - FRAME_WALL, FRAME_WALL);
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

/** Cut both ends of an extruded frame member at 45°, leaving a hairline seam at each corner (mm). */
function miter(g: BufferGeometry, length: number) {
  const p = g.attributes.position;
  const seam = 0.12;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) < length / 2 ? p.getX(i) + seam : length - p.getX(i) - seam);
  p.needsUpdate = true;
}

export function buildModule(spec: ModuleSpec, opts: BuildOptions): PvModule {
  const W = spec.width * MM;
  const H = spec.height * MM;
  const D = spec.depth * MM;
  const L = cellLayout(spec);
  const lamW = L.lamW * MM;
  const lamH = L.lamH * MM;
  const doubleGlass = spec.back === 'glass' && spec.model.toUpperCase().includes('DB');
  const g1 = (doubleGlass ? 2 : 3.2) * MM;
  const backT = (spec.back === 'glass' ? (doubleGlass ? 2 : 0.5) : 0.35) * MM;
  const zTop = D / 2 - FRAME_WALL * MM;
  const zEncap1 = zTop - g1 - 0.25 * MM;
  const zCells = zTop - g1 - 0.6 * MM;
  const zEncap2 = zCells - 0.35 * MM;
  const zBackTop = zCells - 0.6 * MM;
  const zBack = zBackTop - backT;

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const geo = <T extends BufferGeometry>(g: T) => (geometries.push(g), g);
  /** Registers a material and gives it the environment at `reflect` × the scene's strength. */
  const mat = <T extends Material>(m: T, reflect = 1) => {
    if (m instanceof MeshStandardMaterial) {
      m.envMap = opts.envMap;
      m.envMapIntensity = reflect * opts.envIntensity;
      m.envMapRotation.set(0, opts.envRotation, 0);
    }
    materials.push(m);
    return m;
  };
  const tex = (t: Texture, colorSpace: ColorSpace) => {
    t.colorSpace = colorSpace;
    t.anisotropy = opts.anisotropy;
    textures.push(t);
    return t;
  };

  const lineMaterial = mat(new LineBasicMaterial({ color: opts.lineColor, transparent: true, opacity: 0, depthWrite: false }));
  const outline = geo(
    new BufferGeometry().setFromPoints(
      [
        [-1, -1, 1, -1],
        [1, -1, 1, 1],
        [1, 1, -1, 1],
        [-1, 1, -1, -1],
      ].flatMap(([x0, y0, x1, y1]) => [new Vector3((x0 * lamW) / 2, (y0 * lamH) / 2, 0), new Vector3((x1 * lamW) / 2, (y1 * lamH) / 2, 0)]),
    ),
  );
  const outlines: [Object3D, number][] = [];
  const addOutline = (layer: number, z: number) => {
    const line = new LineSegments(outline, lineMaterial.clone());
    materials.push(line.material);
    line.position.z = z;
    line.renderOrder = 6;
    layers[layer].add(line);
    outlines.push([line, layer]);
  };

  const root = new Group();
  const layers = LAYERS.map(() => {
    const g = new Group();
    root.add(g);
    return g;
  });

  // 01 front glass
  const sweep = { value: -1 };
  const sweepStrength = { value: 0 };
  const sweepFlip = { value: 0 };
  const glassFace = mat(spec.tint === 'standard' ? clearGlass() : tintedGlass(GLASS_TINTS[spec.tint]), 0.26);
  addSweep(glassFace, sweep, sweepStrength, sweepFlip, { value: (H / W) * 0.55 });
  const glassEdge = mat(
    new MeshPhysicalMaterial({ color: '#cfe3dc', roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false }),
    0.6,
  );
  const glass = new Mesh(geo(new BoxGeometry(lamW, lamH, g1)), [
    glassEdge,
    glassEdge,
    glassEdge,
    glassEdge,
    glassFace,
    glassFace,
  ]);
  glass.position.z = zTop - g1 / 2;
  glass.renderOrder = 4;
  layers[0].add(glass);
  addOutline(0, zTop);

  // 02 / 04 encapsulant films (only visible while exploded)
  const film = geo(new PlaneGeometry(lamW, lamH));
  const filmMaterial = () =>
    mat(
      new MeshPhysicalMaterial({
        color: '#e6ecee',
        roughness: 0.5,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
      0.5,
    );
  const encapFront = new Mesh(film, filmMaterial());
  encapFront.position.z = zEncap1;
  encapFront.renderOrder = 3;
  layers[1].add(encapFront);
  const encapRear = new Mesh(film, filmMaterial());
  encapRear.position.z = zEncap2;
  encapRear.renderOrder = 2;
  layers[3].add(encapRear);
  const films = [encapFront, encapRear];
  addOutline(1, zEncap1);
  addOutline(3, zEncap2);

  // 03 cells and ribbons (anti-reflective silicon: low specular, metal ribbons from the surface map)
  const sheet = drawCellSheet(spec, L, opts.textureMax);
  const cellMap = tex(new CanvasTexture(sheet.color), SRGBColorSpace);
  const cellSurface = tex(new CanvasTexture(sheet.surface), NoColorSpace);
  const cellMaterial = mat(
    new MeshPhysicalMaterial({
      map: cellMap,
      roughnessMap: cellSurface,
      metalnessMap: cellSurface,
      roughness: 1,
      metalness: 1,
      specularIntensity: 0.4,
      alphaToCoverage: true,
    }),
    0.18,
  );
  const cellPlane = geo(new PlaneGeometry(lamW, lamH));
  const cells = new Mesh(cellPlane, cellMaterial);
  cells.position.z = zCells;
  layers[2].add(cells);
  if (spec.back === 'glass') {
    const rearMaterial = mat(cellMaterial.clone(), 0.5);
    rearMaterial.color.set('#9298a2');
    const rear = new Mesh(cellPlane, rearMaterial);
    rear.position.z = zCells - 0.05 * MM;
    rear.rotation.y = Math.PI;
    layers[2].add(rear);
  }

  // 05 backsheet or rear glass, with the rating label
  let backMesh: Mesh;
  if (doubleGlass) {
    const rearFace = mat(clearGlass(), 0.32);
    backMesh = new Mesh(geo(new BoxGeometry(lamW, lamH, backT)), [
      glassEdge,
      glassEdge,
      glassEdge,
      glassEdge,
      rearFace,
      rearFace,
    ]);
    backMesh.renderOrder = 5;
  } else if (spec.back === 'glass') {
    backMesh = new Mesh(
      geo(new BoxGeometry(lamW, lamH, backT)),
      mat(
        new MeshPhysicalMaterial({ color: '#dce4e6', roughness: 0.35, transparent: true, opacity: 0.2, depthWrite: false }),
        0.6,
      ),
    );
    backMesh.renderOrder = 5;
  } else {
    const white = spec.back === 'white';
    backMesh = new Mesh(
      geo(new BoxGeometry(lamW, lamH, backT)),
      mat(
        new MeshStandardMaterial({
          color: white ? '#cfd0cb' : '#121315',
          roughness: white ? 0.78 : 0.55,
          bumpMap: tex(new CanvasTexture(sheet.relief), NoColorSpace),
          bumpScale: 1.2,
        }),
        0.6,
      ),
    );
  }
  backMesh.position.z = zBackTop - backT / 2;
  layers[4].add(backMesh);
  if (spec.back === 'glass') addOutline(4, zBack);

  const standards = /^(S|OR)/i.test(spec.model);
  const label = new Mesh(
    geo(new PlaneGeometry(0.24, 0.15)),
    mat(new MeshStandardMaterial({ map: tex(new CanvasTexture(drawLabel(spec, standards)), SRGBColorSpace), roughness: 0.55 }), 0.6),
  );
  label.position.set(0, spec.halfCut ? H * 0.22 : H * 0.06, zBack - 0.3 * MM);
  label.rotation.y = Math.PI;
  layers[4].add(label);

  // 06 frame: four mitred hollow members, anodised aluminium
  const silver = spec.frame === 'silver';
  const frameMaterial = mat(
    new MeshPhysicalMaterial({
      color: FRAME_COLORS[spec.frame],
      metalness: spec.frame === 'black' || silver ? 1 : 0.6,
      roughness: silver ? 0.26 : 0.34,
      anisotropy: 0.55,
      anisotropyRotation: Math.PI / 2,
      clearcoat: silver ? 0 : 0.3,
      clearcoatRoughness: 0.2,
    }),
    silver ? 1.15 : 1,
  );
  const profile = frameProfile(spec.depth, (zTop - zBack) / MM);
  const front = new Vector3(0, 0, 1);
  const sides: [Vector3, Vector3, Vector3, number][] = [
    [new Vector3(-W / 2, -H / 2, -D / 2), new Vector3(0, 1, 0), new Vector3(1, 0, 0), W],
    [new Vector3(W / 2, -H / 2, -D / 2), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), H],
    [new Vector3(W / 2, H / 2, -D / 2), new Vector3(0, -1, 0), new Vector3(-1, 0, 0), W],
    [new Vector3(-W / 2, H / 2, -D / 2), new Vector3(1, 0, 0), new Vector3(0, -1, 0), H],
  ];
  for (const [origin, inward, along, length] of sides) {
    const extruded = new ExtrudeGeometry(profile, { depth: length / MM, bevelEnabled: false, steps: 1 });
    miter(extruded, length / MM);
    const g = geo(toCreasedNormals(extruded, 0.6));
    if (g !== extruded) extruded.dispose();
    g.applyMatrix4(new Matrix4().makeBasis(inward, front, along).scale(new Vector3(MM, MM, MM)).setPosition(origin));
    layers[5].add(new Mesh(g, frameMaterial));
  }
  // Mounting slots and grounding holes on the long sides, drain slots near the corners.
  const holeMaterial = mat(new MeshStandardMaterial({ color: '#050506', roughness: 0.8 }), 0.3);
  const slot = geo(new PlaneGeometry(0.009, 0.014));
  const drain = geo(new PlaneGeometry(0.012, 0.004));
  const round = geo(new CircleGeometry(0.0021, 16));
  const flangeMid = (spec.depth >= 35 ? 13 : 11) * MM;
  const hole = (g: BufferGeometry, x: number, y: number) => {
    const m = new Mesh(g, holeMaterial);
    m.position.set(x, y, -D / 2 - 0.2 * MM);
    m.rotation.y = Math.PI;
    layers[5].add(m);
  };
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      hole(slot, sx * (W / 2 - flangeMid), sy * H * 0.3);
      hole(round, sx * (W / 2 - flangeMid), sy * (H * 0.3 + 0.035));
      hole(drain, sx * (W / 2 - 0.045), sy * (H / 2 - flangeMid));
    }
  }

  // 07 junction boxes with cables and plug connectors
  const plastic = mat(new MeshPhysicalMaterial({ color: '#131315', roughness: 0.46, clearcoat: 0.2, clearcoatRoughness: 0.4 }), 0.9);
  const lidPlastic = mat(new MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.34 }), 0.9);
  const rubber = mat(new MeshPhysicalMaterial({ color: '#0c0c0e', roughness: 0.55, sheen: 0.3, sheenRoughness: 0.6 }), 0.7);
  const place = (g: Object3D, at: Vector3, dir: Vector3) => {
    g.position.copy(at);
    g.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize()));
    layers[6].add(g);
  };
  const boxes: Vector3[] = [];
  const addBox = (x: number, y: number, bw: number, bh: number, bd: number) => {
    const body = new Mesh(geo(new RoundedBoxGeometry(bw, bh, bd, 3, 0.004)), plastic);
    body.position.set(x, y, zBack - bd / 2);
    const lid = new Mesh(geo(new RoundedBoxGeometry(bw * 0.86, bh * 0.8, 0.004, 3, 0.0016)), lidPlastic);
    lid.position.set(x, y, zBack - bd - 0.0012);
    const rib = geo(new RoundedBoxGeometry(bw * 0.62, 0.0022, 0.002, 1, 0.0008));
    for (const k of [-1, 0, 1]) {
      const m = new Mesh(rib, lidPlastic);
      m.position.set(x, y + k * bh * 0.2, zBack - bd - 0.0036);
      layers[6].add(m);
    }
    layers[6].add(body, lid);
    boxes.push(new Vector3(x, y, zBack - bd - 0.004));
  };
  const nut = geo(new CylinderGeometry(0.0062, 0.0062, 0.008, 6));
  const dome = geo(new CylinderGeometry(0.0034, 0.0052, 0.006, 16));
  const gland = (at: Vector3, dir: Vector3) => {
    const g = new Group();
    const n = new Mesh(nut, plastic);
    n.position.y = 0.004;
    const d = new Mesh(dome, plastic);
    d.position.y = 0.011;
    g.add(n, d);
    place(g, at, dir);
  };
  // MC4-style plug (slim sleeve with two latch arms) and socket (wide mouth under a latch hood).
  const lathe = (pts: [number, number][]) => geo(new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 28));
  const plugBody = lathe([
    [0.0035, 0],
    [0.0068, 0.001],
    [0.0074, 0.014],
    [0.0078, 0.04],
    [0.0058, 0.042],
    [0.0058, 0.066],
    [0.0046, 0.068],
    [0, 0.068],
  ]);
  const socketBody = lathe([
    [0.0035, 0],
    [0.0068, 0.001],
    [0.0074, 0.014],
    [0.0082, 0.018],
    [0.0092, 0.022],
    [0.0092, 0.062],
    [0.0062, 0.064],
    [0.0062, 0.058],
    [0, 0.058],
  ]);
  const arm = geo(new RoundedBoxGeometry(0.0026, 0.024, 0.0042, 1, 0.0008));
  const hood = geo(new RoundedBoxGeometry(0.0062, 0.028, 0.0044, 1, 0.0012));
  const capNut = geo(new CylinderGeometry(0.0079, 0.0079, 0.011, 6));
  const connector = (end: Vector3, dir: Vector3, female: boolean) => {
    const g = new Group();
    const cap = new Mesh(capNut, plastic);
    cap.position.y = 0.0055;
    g.add(cap, new Mesh(female ? socketBody : plugBody, plastic));
    if (female) {
      const h = new Mesh(hood, lidPlastic);
      h.position.set(0.0094, 0.04, 0);
      g.add(h);
    } else {
      for (const sx of [-1, 1]) {
        const a = new Mesh(arm, lidPlastic);
        a.position.set(sx * 0.0071, 0.052, 0);
        g.add(a);
      }
    }
    place(g, end, dir);
  };
  /** Cable from a gland: leaves the box, lifts off the back and hangs in a soft curve to its connector. */
  const cable = (start: Vector3, pts: [number, number, number][], female: boolean) => {
    const curve = new CatmullRomCurve3([start, ...pts.map(([x, y, z]) => new Vector3(x, y, zBack - z))], false, 'centripetal');
    layers[6].add(new Mesh(geo(new TubeGeometry(curve, 72, 0.003, 10, false)), rubber));
    gland(curve.getPoint(0), curve.getTangent(0).negate());
    connector(curve.getPoint(1), curve.getTangent(1), female);
  };

  if (spec.halfCut) {
    const xs = W * 0.3;
    for (const x of [-xs, 0, xs]) addBox(x, 0, 0.062, 0.05, 0.014);
    for (const sy of [1, -1]) {
      const x = -sy * xs;
      cable(
        new Vector3(x, sy * 0.026, zBack - 0.007),
        [
          [x - sy * 0.004, sy * 0.06, 0.012],
          [x - sy * 0.03, sy * 0.15, 0.02],
          [x - sy * 0.012, sy * 0.25, 0.016],
          [x + sy * 0.012, sy * 0.32, 0.011],
        ],
        sy < 0,
      );
    }
  } else {
    const y = H / 2 - 0.17;
    addBox(0, y, 0.11, 0.1, 0.018);
    for (const sx of [-1, 1]) {
      cable(
        new Vector3(sx * 0.056, y - 0.02, zBack - 0.008),
        [
          [sx * 0.085, y - 0.04, 0.014],
          [sx * 0.12, y - 0.13, 0.022],
          [sx * 0.135, y - 0.28, 0.018],
          [sx * 0.15, y - 0.42, 0.012],
        ],
        sx > 0,
      );
    }
  }

  const spread = 0.13 * (H / 2);
  const offsets = [2, 1, 0, -1, -2, -3.1, -4.2].map((k) => k * spread);
  const extents: [number, number][] = [
    [zTop - g1, zTop],
    [zEncap1, zEncap1],
    [zCells, zCells],
    [zEncap2, zEncap2],
    [zBack, zBackTop],
    [-D / 2, D / 2],
    [zBack - 0.026, zBack],
  ];
  const at = (t: number | readonly number[], i: number) => (typeof t === 'number' ? t : (t[i] ?? 0));

  return {
    root,
    layers,
    size: { w: W, h: H, d: D },
    sweep,
    sweepStrength,
    sweepFlip,
    setExplode(t) {
      layers.forEach((layer, i) => {
        layer.position.z = offsets[i] * at(t, i);
      });
      films.forEach((f, k) => {
        const v = at(t, k === 0 ? 1 : 3);
        (f.material as MeshPhysicalMaterial).opacity = 0.34 * v;
        f.visible = v > 0.01;
      });
      outlines.forEach(([line, i]) => {
        const v = at(t, i);
        ((line as LineSegments).material as LineBasicMaterial).opacity = 0.42 * v;
        line.visible = v > 0.01;
      });
    },
    points(t) {
      const pts: Vector3[] = [];
      extents.forEach(([z0, z1], i) => {
        const dz = offsets[i] * at(t, i);
        for (const z of [z0 + dz, z1 + dz])
          for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) pts.push(new Vector3(x, y, z));
      });
      return pts;
    },
    anchor(i, t, side) {
      const dz = offsets[i] * at(t, i);
      const heights = [0.78, 0.6, 0.42, 0.24, 0.06, -0.14];
      if (i === 6) {
        const b = boxes.reduce((best, p) => (side * p.x > side * best.x ? p : best), boxes[0]);
        return new Vector3(b.x, b.y, b.z + dz);
      }
      const x = i === 5 ? (side * W) / 2 : side * (lamW / 2) * 0.9;
      return new Vector3(x, (heights[i] * H) / 2, (i === 5 ? 0 : extents[i][1]) + dz);
    },
    center(t) {
      let lo = Infinity;
      let hi = -Infinity;
      extents.forEach(([z0, z1], i) => {
        const dz = offsets[i] * at(t, i);
        lo = Math.min(lo, z0 + dz);
        hi = Math.max(hi, z1 + dz);
      });
      return (lo + hi) / 2;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
