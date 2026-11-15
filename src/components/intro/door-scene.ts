/**
 * Escena WebGL de la introducción: entrada de un apartamento con una puerta de
 * caoba que gira sobre sus bisagras y deja ver un interior cálido.
 *
 * Es una escena ilustrativa construida con geometría propia; no representa
 * ninguna propiedad real del catálogo. Este módulo solo se descarga cuando la
 * introducción va a reproducirse (import dinámico) y libera la GPU al terminar.
 */
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  Shape,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { introAssets, introFrame, introTiming } from "../../lib/intro";

export type DoorSceneOptions = {
  /** Densidad de píxeles ya limitada por quien llama. */
  pixelRatio: number;
  /** Reduce sombras y luces en equipos modestos. */
  quality: "high" | "low";
  /** Encuadre fijo para generar el póster; desactiva la adaptación al lienzo. */
  poster?: "landscape" | "portrait";
};

export type DoorScene = {
  /** Texturas cargadas y programas compilados: el primer cuadro ya es estable. */
  ready: Promise<void>;
  resize(): void;
  /** Dibuja el cuadro que corresponde a un instante de la secuencia. */
  renderAt(elapsedMs: number): void;
  /**
   * Reproduce la secuencia. `onExit` avisa del inicio de la disolución.
   * Devuelve `false` si se abandona porque el equipo no mantiene el ritmo.
   */
  play(onExit: () => void): Promise<boolean>;
  dispose(): void;
};

/** Tamaño físico que cubre una repetición de la textura de madera (m). */
const WOOD_TILE = 1.5;
/** Ángulo final de la hoja, algo más de noventa grados. */
const OPEN_ANGLE = 1.66;
/** Por encima de este tiempo por cuadro (ms) la animación deja de ser fluida. */
const SLOW_FRAME = 160;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/** Arranque lento (el resbalón cede), aceleración y frenado largo. */
const doorEase = (t: number) => {
  const x = clamp01(t);
  const start = x * x * (3 - 2 * x);
  return 1 - Math.pow(1 - start, 1.7);
};

/** Generador determinista: el póster y el primer cuadro deben coincidir. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createDoorScene(
  canvas: HTMLCanvasElement,
  options: DoorSceneOptions,
): DoorScene {
  const random = seeded(20261113);
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const high = options.quality === "high";

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: Boolean(options.poster),
  });
  renderer.setPixelRatio(options.pixelRatio);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.background = new Color("#131211");
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.22;

  const camera = new PerspectiveCamera(30, 1, 0.3, 40);
  camera.position.set(0, introFrame.centerY, introFrame.cameraDistance);
  camera.lookAt(0, introFrame.centerY, 0);

  // ───────────────────────── Materiales ─────────────────────────
  const loader = new TextureLoader();
  const pending: Promise<void>[] = [];
  const loadTexture = (url: string, color: boolean) => {
    let settle: { resolve: () => void; reject: (error: Error) => void };
    pending.push(
      new Promise<void>((resolve, reject) => {
        settle = { resolve, reject };
      }),
    );
    const texture = loader.load(
      url,
      () => settle.resolve(),
      undefined,
      () => settle.reject(new Error(`No se pudo cargar ${url}`)),
    );
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.colorSpace = color ? SRGBColorSpace : NoColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    textures.push(texture);
    return texture;
  };
  const woodColor = loadTexture(introAssets.woodColor, true);
  const woodRoughness = loadTexture(introAssets.woodRoughness, false);

  const track = <T extends Material>(material: T) => {
    materials.push(material);
    return material;
  };
  /** Caoba barnizada: veta real, brillo satinado y poro apenas perceptible. */
  const mahogany = track(
    new MeshPhysicalMaterial({
      map: woodColor,
      roughnessMap: woodRoughness,
      bumpMap: woodRoughness,
      bumpScale: 0.35,
      color: "#f2d9cf",
      roughness: 1.55,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1,
    }),
  );
  const mahoganyFrame = track(
    new MeshPhysicalMaterial({
      map: woodColor,
      roughnessMap: woodRoughness,
      bumpMap: woodRoughness,
      bumpScale: 0.08,
      color: "#a8715c",
      roughness: 2.6,
      metalness: 0,
      clearcoat: 0,
      envMapIntensity: 0.35,
    }),
  );
  const brass = track(
    new MeshStandardMaterial({
      color: "#b48d52",
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 2.4,
    }),
  );
  const darkMetal = track(
    new MeshStandardMaterial({
      color: "#1d1b19",
      metalness: 0.9,
      roughness: 0.45,
      envMapIntensity: 1.4,
    }),
  );

  const noiseCanvas = (size: number, base: number, spread: number) => {
    const element = document.createElement("canvas");
    element.width = element.height = size;
    const context = element.getContext("2d");
    if (context) {
      const image = context.createImageData(size, size);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = base + (random() - 0.5) * spread;
        image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
      context.putImageData(image, 0, 0);
    }
    const texture = new CanvasTexture(element);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.colorSpace = NoColorSpace;
    textures.push(texture);
    return texture;
  };
  const plasterGrain = noiseCanvas(128, 128, 70);
  plasterGrain.repeat.set(9, 4);
  const wallMaterial = track(
    new MeshStandardMaterial({
      color: "#3a3835",
      roughness: 0.94,
      metalness: 0,
      bumpMap: plasterGrain,
      bumpScale: 0.6,
    }),
  );
  const stoneGrain = noiseCanvas(128, 150, 46);
  stoneGrain.repeat.set(10, 6);
  const corridorFloor = track(
    new MeshStandardMaterial({
      color: "#161514",
      roughness: 0.3,
      roughnessMap: stoneGrain,
      metalness: 0,
      envMapIntensity: 0.9,
    }),
  );
  const ceilingMaterial = track(
    new MeshStandardMaterial({ color: "#262422", roughness: 1 }),
  );
  const baseboardMaterial = track(
    new MeshStandardMaterial({ color: "#151413", roughness: 0.55 }),
  );
  const interiorWall = track(
    new MeshStandardMaterial({ color: "#b9ad9b", roughness: 0.92 }),
  );
  const interiorFloor = track(
    new MeshStandardMaterial({
      color: "#5e432d",
      roughness: 0.6,
      roughnessMap: woodRoughness,
      envMapIntensity: 0.8,
    }),
  );
  const fabric = track(
    new MeshStandardMaterial({ color: "#b3a898", roughness: 1 }),
  );
  const fabricDark = track(
    new MeshStandardMaterial({ color: "#6f675d", roughness: 1 }),
  );
  const rugMaterial = track(
    new MeshStandardMaterial({ color: "#857c6d", roughness: 1 }),
  );
  const warmGlow = track(new MeshBasicMaterial({ color: "#ffd9a6" }));
  const lampGlow = track(new MeshBasicMaterial({ color: "#ffe2b8" }));

  // ───────────────────────── Geometría ─────────────────────────
  const keep = <T extends BufferGeometry>(geometry: T) => {
    geometries.push(geometry);
    return geometry;
  };
  /**
   * Caja con UV en metros: la veta conserva su escala real en todas las piezas.
   * `grain` indica si la fibra corre en vertical (largueros) u horizontal
   * (peinazos), como en una puerta de carpintería.
   */
  const woodBox = (
    width: number,
    height: number,
    depth: number,
    grain: "v" | "h",
  ) => {
    const geometry = keep(new BoxGeometry(width, height, depth));
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    const offsetU = random();
    const offsetV = random();
    for (let index = 0; index < position.count; index += 1) {
      const nx = Math.abs(normal.getX(index));
      const ny = Math.abs(normal.getY(index));
      const nz = Math.abs(normal.getZ(index));
      let across: number;
      let along: number;
      if (nz >= nx && nz >= ny) {
        across = position.getX(index);
        along = position.getY(index);
      } else if (nx >= ny) {
        across = position.getZ(index);
        along = position.getY(index);
      } else {
        across = position.getX(index);
        along = position.getZ(index);
      }
      if (grain === "h") [across, along] = [along, across];
      uv.setXY(
        index,
        across / WOOD_TILE + offsetU,
        along / WOOD_TILE + offsetV,
      );
    }
    uv.needsUpdate = true;
    return geometry;
  };
  const mesh = (
    geometry: BufferGeometry,
    material: Material,
    x: number,
    y: number,
    z: number,
    shadow: "cast" | "receive" | "both" | "none" = "both",
  ) => {
    const object = new Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = shadow === "cast" || shadow === "both";
    object.receiveShadow = shadow === "receive" || shadow === "both";
    return object;
  };
  const box = (width: number, height: number, depth: number) =>
    keep(new BoxGeometry(width, height, depth));

  // Vano: 1,20 × 2,65 m. El muro mide 22 cm; su cara de pasillo está en z = 0.
  const OPENING_W = 1.2;
  const OPENING_H = 2.65;
  const WALL_T = 0.22;
  const CEILING = 3;

  // Pasillo
  const corridor = new Group();
  scene.add(corridor);
  const wallSide = box(6.35, CEILING, WALL_T);
  corridor.add(mesh(wallSide, wallMaterial, -3.825, CEILING / 2, -WALL_T / 2));
  corridor.add(mesh(wallSide, wallMaterial, 3.825, CEILING / 2, -WALL_T / 2));
  corridor.add(
    mesh(
      box(1.3, CEILING - 2.7, WALL_T),
      wallMaterial,
      0,
      (CEILING + 2.7) / 2,
      -WALL_T / 2,
    ),
  );
  const floorPlane = keep(new PlaneGeometry(14, 9));
  const corridorFloorMesh = mesh(floorPlane, corridorFloor, 0, 0, 4.5, "receive");
  corridorFloorMesh.rotation.x = -Math.PI / 2;
  corridor.add(corridorFloorMesh);
  const corridorCeiling = mesh(floorPlane, ceilingMaterial, 0, CEILING, 4.5, "none");
  corridorCeiling.rotation.x = Math.PI / 2;
  corridor.add(corridorCeiling);
  const baseboard = box(6.265, 0.1, 0.014);
  corridor.add(mesh(baseboard, baseboardMaterial, -3.8675, 0.05, 0.007, "none"));
  corridor.add(mesh(baseboard, baseboardMaterial, 3.8675, 0.05, 0.007, "none"));

  // Marco: jambas, dintel, batientes y tapajuntas en caoba más oscura.
  const frame = new Group();
  scene.add(frame);
  const jamb = woodBox(0.05, 2.7, WALL_T, "v");
  frame.add(mesh(jamb, mahoganyFrame, -0.625, 1.35, -WALL_T / 2));
  frame.add(mesh(jamb, mahoganyFrame, 0.625, 1.35, -WALL_T / 2));
  frame.add(
    mesh(woodBox(1.3, 0.05, WALL_T, "h"), mahoganyFrame, 0, 2.675, -WALL_T / 2),
  );
  const stop = woodBox(0.014, OPENING_H, 0.026, "v");
  frame.add(mesh(stop, mahoganyFrame, -0.593, OPENING_H / 2, -0.017));
  frame.add(mesh(stop, mahoganyFrame, 0.593, OPENING_H / 2, -0.017));
  frame.add(
    mesh(woodBox(1.172, 0.014, 0.026, "h"), mahoganyFrame, 0, 2.643, -0.017),
  );
  const casingLeg = woodBox(0.115, 2.775, 0.022, "v");
  frame.add(mesh(casingLeg, mahoganyFrame, -0.6675, 1.3875, 0.011));
  frame.add(mesh(casingLeg, mahoganyFrame, 0.6675, 1.3875, 0.011));
  frame.add(mesh(woodBox(1.45, 0.115, 0.022, "h"), mahoganyFrame, 0, 2.7175, 0.011));
  const bandLeg = woodBox(0.024, 2.799, 0.038, "v");
  frame.add(mesh(bandLeg, mahoganyFrame, -0.737, 1.3995, 0.019));
  frame.add(mesh(bandLeg, mahoganyFrame, 0.737, 1.3995, 0.019));
  frame.add(mesh(woodBox(1.498, 0.024, 0.038, "h"), mahoganyFrame, 0, 2.787, 0.019));
  // Umbral de bronce oscuro.
  frame.add(mesh(box(OPENING_W, 0.012, WALL_T), darkMetal, 0, 0.006, -WALL_T / 2, "receive"));

  // Hoja: bastidor de largueros y peinazos con tres tableros de plafón.
  const LEAF_W = 1.192;
  const LEAF_H = 2.636;
  const LEAF_T = 0.058;
  const LEAF_BOTTOM = 0.01;
  const PIVOT_X = -OPENING_W / 2;
  const PIVOT_Z = -0.094;
  const door = new Group();
  door.position.set(PIVOT_X, 0, PIVOT_Z);
  scene.add(door);
  /** Sitúa una pieza con coordenadas centradas en la hoja cerrada. */
  const onLeaf = (object: Mesh, x: number, y: number, zFromFront: number) => {
    object.position.set(
      x + LEAF_W / 2 + 0.004,
      LEAF_BOTTOM + y,
      0.006 + LEAF_T - zFromFront,
    );
    door.add(object);
    return object;
  };
  const RECESS = 0.014;
  const core = mesh(woodBox(LEAF_W, LEAF_H, LEAF_T - RECESS * 2, "v"), mahogany, 0, 0, 0);
  onLeaf(core, 0, LEAF_H / 2, LEAF_T / 2);
  const STILE = 0.15;
  const stile = woodBox(STILE, LEAF_H, LEAF_T, "v");
  onLeaf(mesh(stile, mahogany, 0, 0, 0), -(LEAF_W - STILE) / 2, LEAF_H / 2, LEAF_T / 2);
  onLeaf(mesh(stile, mahogany, 0, 0, 0), (LEAF_W - STILE) / 2, LEAF_H / 2, LEAF_T / 2);
  const RAIL_W = LEAF_W - STILE * 2;
  const rails = [
    { height: 0.23, center: 0.115 },
    { height: 0.11, center: 0.23 + 0.518 + 0.055 },
    { height: 0.11, center: 0.23 + 0.518 + 0.11 + 1 + 0.055 },
    { height: 0.15, center: LEAF_H - 0.075 },
  ];
  for (const rail of rails)
    onLeaf(
      mesh(woodBox(RAIL_W, rail.height, LEAF_T, "h"), mahogany, 0, 0, 0),
      0,
      rail.center,
      LEAF_T / 2,
    );
  const panels = [
    { height: 0.518, center: 0.23 + 0.259 },
    { height: 1, center: 0.23 + 0.518 + 0.11 + 0.5 },
    { height: 0.518, center: 0.23 + 0.518 + 0.11 + 1 + 0.11 + 0.259 },
  ];
  const BEVEL = 0.034;
  for (const panel of panels) {
    const margin = 0.03;
    const width = RAIL_W - margin * 2 - BEVEL * 2;
    const height = panel.height - margin * 2 - BEVEL * 2;
    const shape = new Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.closePath();
    const field = keep(
      new ExtrudeGeometry(shape, {
        depth: 0.001,
        bevelEnabled: true,
        bevelThickness: 0.009,
        bevelSize: BEVEL,
        bevelSegments: 3,
        steps: 1,
      }),
    );
    const uv = field.attributes.uv;
    const offsetU = random();
    const offsetV = random();
    for (let index = 0; index < uv.count; index += 1)
      uv.setXY(
        index,
        uv.getX(index) / WOOD_TILE + offsetU,
        uv.getY(index) / WOOD_TILE + offsetV,
      );
    // El frente del plafón queda 2 mm por debajo del bastidor.
    onLeaf(mesh(field, mahogany, 0, 0, 0), 0, panel.center, RECESS + 0.005);
  }

  // Tirador vertical de latón con dos soportes, sobre el larguero de cierre.
  const HANDLE_X = (LEAF_W - STILE) / 2;
  const handleBar = keep(new CylinderGeometry(0.0155, 0.0155, 1.02, 28));
  onLeaf(mesh(handleBar, brass, 0, 0, 0), HANDLE_X, 1.46, -0.058);
  const handleCap = keep(new SphereGeometry(0.0155, 20, 12));
  onLeaf(mesh(handleCap, brass, 0, 0, 0, "none"), HANDLE_X, 1.97, -0.058);
  onLeaf(mesh(handleCap, brass, 0, 0, 0, "none"), HANDLE_X, 0.95, -0.058);
  const standoff = keep(new CylinderGeometry(0.0105, 0.0105, 0.058, 20));
  for (const y of [1.12, 1.8]) {
    const post = onLeaf(mesh(standoff, brass, 0, 0, 0), HANDLE_X, y, -0.029);
    post.rotation.x = Math.PI / 2;
    const rose = onLeaf(
      mesh(keep(new CylinderGeometry(0.021, 0.021, 0.004, 24)), brass, 0, 0, 0, "none"),
      HANDLE_X,
      y,
      -0.002,
    );
    rose.rotation.x = Math.PI / 2;
  }
  // Cerradura: roseta de latón, bombín oscuro y ranura de la llave.
  const lockRose = onLeaf(
    mesh(keep(new CylinderGeometry(0.03, 0.03, 0.007, 32)), brass, 0, 0, 0),
    HANDLE_X,
    0.78,
    -0.0035,
  );
  lockRose.rotation.x = Math.PI / 2;
  const lockCore = onLeaf(
    mesh(keep(new CylinderGeometry(0.0125, 0.0125, 0.012, 24)), darkMetal, 0, 0, 0, "none"),
    HANDLE_X,
    0.78,
    -0.006,
  );
  lockCore.rotation.x = Math.PI / 2;
  onLeaf(
    mesh(box(0.0022, 0.012, 0.002), baseboardMaterial, 0, 0, 0, "none"),
    HANDLE_X,
    0.778,
    -0.0125,
  );

  // Bisagras: nudo fijo en la jamba y una pala en cada canto.
  const knuckle = keep(new CylinderGeometry(0.0085, 0.0085, 0.12, 16));
  const finial = keep(new SphereGeometry(0.0105, 14, 10));
  const hingePlate = box(0.0025, 0.12, 0.036);
  for (const y of [0.27, 1.33, 2.39]) {
    scene.add(mesh(knuckle, brass, PIVOT_X, y, PIVOT_Z, "none"));
    scene.add(mesh(finial, brass, PIVOT_X, y + 0.066, PIVOT_Z, "none"));
    scene.add(mesh(finial, brass, PIVOT_X, y - 0.066, PIVOT_Z, "none"));
    scene.add(mesh(hingePlate, brass, PIVOT_X + 0.0013, y, PIVOT_Z + 0.02, "none"));
    const leafPlate = mesh(hingePlate, brass, 0.0035, y, 0.024, "none");
    door.add(leafPlate);
  }

  // Apliques del pasillo: placa de latón y difusor cálido.
  const sconcePlate = keep(new RoundedBoxGeometry(0.07, 0.36, 0.02, 3, 0.008));
  const sconceShade = keep(new CylinderGeometry(0.028, 0.028, 0.27, 24));
  const sconceLights: PointLight[] = [];
  for (const x of [-1.55, 1.55]) {
    corridor.add(mesh(sconcePlate, brass, x, 1.78, 0.012, "none"));
    corridor.add(mesh(sconceShade, warmGlow, x, 1.78, 0.062, "none"));
    const light = new PointLight("#ffd3a0", 1.1, 5.5, 2);
    light.position.set(x, 1.78, 0.2);
    corridor.add(light);
    sconceLights.push(light);
  }
  // Foco empotrado sobre la puerta.
  const downlightTrim = mesh(
    keep(new CylinderGeometry(0.06, 0.06, 0.004, 28)),
    lampGlow,
    0,
    CEILING - 0.003,
    1.15,
    "none",
  );
  corridor.add(downlightTrim);
  const doorWash = new SpotLight("#ffe7c9", 70, 9, 0.6, 0.95, 2);
  doorWash.position.set(0, CEILING - 0.03, 1.25);
  doorWash.target.position.set(0, 1.05, -0.03);
  doorWash.castShadow = true;
  doorWash.shadow.mapSize.set(high ? 1024 : 512, high ? 1024 : 512);
  doorWash.shadow.camera.near = 0.4;
  doorWash.shadow.camera.far = 7;
  doorWash.shadow.bias = -0.0006;
  doorWash.shadow.normalBias = 0.012;
  doorWash.shadow.radius = 3;
  scene.add(doorWash, doorWash.target);

  // Interior: sala contemporánea vista a través del vano.
  const interior = new Group();
  scene.add(interior);
  const ROOM = { left: -3.4, right: 3.8, back: -7.6 };
  const roomWidth = ROOM.right - ROOM.left;
  const roomDepth = -ROOM.back - WALL_T;
  const roomCenterX = (ROOM.left + ROOM.right) / 2;
  const roomCenterZ = -WALL_T - roomDepth / 2;
  const roomFloorGeometry = keep(new PlaneGeometry(roomWidth, roomDepth));
  const roomFloorUv = roomFloorGeometry.attributes.uv;
  for (let index = 0; index < roomFloorUv.count; index += 1)
    roomFloorUv.setXY(
      index,
      roomFloorUv.getX(index) * 9,
      roomFloorUv.getY(index) * 3,
    );
  const roomFloor = mesh(roomFloorGeometry, interiorFloor, roomCenterX, 0.001, roomCenterZ, "receive");
  roomFloor.rotation.x = -Math.PI / 2;
  interior.add(roomFloor);
  const roomCeiling = mesh(
    keep(new PlaneGeometry(roomWidth, roomDepth)),
    interiorWall,
    roomCenterX,
    CEILING,
    roomCenterZ,
    "none",
  );
  roomCeiling.rotation.x = Math.PI / 2;
  interior.add(roomCeiling);
  interior.add(
    mesh(box(roomWidth, CEILING, 0.1), interiorWall, roomCenterX, CEILING / 2, ROOM.back - 0.05, "receive"),
  );
  const sideWall = box(0.1, CEILING, roomDepth);
  interior.add(mesh(sideWall, interiorWall, ROOM.left - 0.05, CEILING / 2, roomCenterZ, "receive"));
  interior.add(mesh(sideWall, interiorWall, ROOM.right + 0.05, CEILING / 2, roomCenterZ, "receive"));

  // Ventanal con luz de atardecer.
  const duskCanvas = document.createElement("canvas");
  duskCanvas.width = 8;
  duskCanvas.height = 256;
  const duskContext = duskCanvas.getContext("2d");
  if (duskContext) {
    const gradient = duskContext.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#27407e");
    gradient.addColorStop(0.5, "#5d79b4");
    gradient.addColorStop(0.82, "#d8b79a");
    gradient.addColorStop(1, "#f1cfa2");
    duskContext.fillStyle = gradient;
    duskContext.fillRect(0, 0, 8, 256);
  }
  const duskTexture = new CanvasTexture(duskCanvas);
  duskTexture.colorSpace = SRGBColorSpace;
  textures.push(duskTexture);
  const duskMaterial = track(new MeshBasicMaterial({ map: duskTexture }));
  const WINDOW = { x: 0.15, y: 1.5, width: 3.6, height: 2.3 };
  interior.add(
    mesh(
      keep(new PlaneGeometry(WINDOW.width, WINDOW.height)),
      duskMaterial,
      WINDOW.x,
      WINDOW.y,
      ROOM.back + 0.002,
      "none",
    ),
  );
  const mullion = box(0.035, WINDOW.height, 0.05);
  for (const offset of [-WINDOW.width / 2, -WINDOW.width / 6, WINDOW.width / 6, WINDOW.width / 2])
    interior.add(mesh(mullion, darkMetal, WINDOW.x + offset, WINDOW.y, ROOM.back + 0.03, "none"));
  const transom = box(WINDOW.width + 0.035, 0.035, 0.05);
  for (const offset of [-WINDOW.height / 2, WINDOW.height / 2])
    interior.add(mesh(transom, darkMetal, WINDOW.x, WINDOW.y + offset, ROOM.back + 0.03, "none"));
  const curtain = keep(new RoundedBoxGeometry(0.46, 2.72, 0.12, 2, 0.05));
  interior.add(mesh(curtain, fabric, WINDOW.x - WINDOW.width / 2 - 0.2, 1.4, ROOM.back + 0.16, "none"));
  interior.add(mesh(curtain, fabric, WINDOW.x + WINDOW.width / 2 + 0.2, 1.4, ROOM.back + 0.16, "none"));

  // Mobiliario discreto: alfombra, sofá, mesa baja y lámpara de pie.
  const rug = mesh(keep(new PlaneGeometry(2.7, 3.3)), rugMaterial, 0.35, 0.006, -4.9, "receive");
  rug.rotation.x = -Math.PI / 2;
  interior.add(rug);
  const sofa = new Group();
  sofa.position.set(0.92, 0, -4.15);
  interior.add(sofa);
  sofa.add(mesh(keep(new RoundedBoxGeometry(1.95, 0.3, 0.88, 3, 0.07)), fabric, 0, 0.3, 0));
  sofa.add(mesh(keep(new RoundedBoxGeometry(1.95, 0.5, 0.2, 3, 0.07)), fabric, 0, 0.58, 0.34));
  const sofaArm = keep(new RoundedBoxGeometry(0.2, 0.42, 0.88, 3, 0.07));
  sofa.add(mesh(sofaArm, fabric, -0.975, 0.42, 0));
  sofa.add(mesh(sofaArm, fabric, 0.975, 0.42, 0));
  sofa.add(mesh(box(1.8, 0.1, 0.74), darkMetal, 0, 0.08, 0, "none"));
  const coffeeTable = new Group();
  coffeeTable.position.set(0.2, 0, -5.5);
  interior.add(coffeeTable);
  coffeeTable.add(mesh(keep(new CylinderGeometry(0.46, 0.46, 0.035, 40)), mahoganyFrame, 0, 0.36, 0));
  coffeeTable.add(mesh(keep(new CylinderGeometry(0.045, 0.2, 0.34, 20)), brass, 0, 0.17, 0, "none"));
  coffeeTable.add(mesh(keep(new SphereGeometry(0.075, 20, 14)), brass, 0.12, 0.45, 0.05, "none"));
  const armchair = new Group();
  armchair.position.set(-0.95, 0, -6.2);
  armchair.rotation.y = 0.5;
  interior.add(armchair);
  armchair.add(mesh(keep(new RoundedBoxGeometry(0.78, 0.3, 0.78, 3, 0.07)), fabricDark, 0, 0.3, 0));
  armchair.add(mesh(keep(new RoundedBoxGeometry(0.78, 0.52, 0.18, 3, 0.07)), fabricDark, 0, 0.6, -0.3));
  const floorLamp = new Group();
  floorLamp.position.set(-0.72, 0, -5.15);
  interior.add(floorLamp);
  floorLamp.add(mesh(keep(new CylinderGeometry(0.012, 0.012, 1.5, 12)), brass, 0, 0.75, 0, "none"));
  floorLamp.add(mesh(keep(new CylinderGeometry(0.15, 0.15, 0.02, 24)), brass, 0, 0.01, 0, "none"));
  floorLamp.add(mesh(keep(new CylinderGeometry(0.16, 0.2, 0.3, 28, 1, true)), lampGlow, 0, 1.6, 0, "none"));
  const lampLight = new PointLight("#ffcf99", 5, 9, 2);
  lampLight.position.set(-0.72, 1.62, -5.15);
  interior.add(lampLight);
  // Foseado de techo junto al ventanal.
  interior.add(mesh(box(3.9, 0.02, 0.07), warmGlow, WINDOW.x, CEILING - 0.02, ROOM.back + 0.5, "none"));

  // Luz cálida que sale por el vano y proyecta la sombra de la hoja.
  const spill = new SpotLight("#ffc78a", 400, 18, 0.5, 0.75, 2);
  spill.position.set(0.25, 2.55, -3.6);
  spill.target.position.set(0, 0.2, 2.2);
  spill.castShadow = true;
  spill.shadow.mapSize.set(high ? 1024 : 512, high ? 1024 : 512);
  spill.shadow.camera.near = 0.8;
  spill.shadow.camera.far = 14;
  spill.shadow.bias = -0.0008;
  spill.shadow.normalBias = 0.02;
  spill.shadow.radius = 4;
  scene.add(spill, spill.target);
  const roomFill = new PointLight("#ffe0bd", 7, 12, 2);
  roomFill.position.set(0.6, 2.5, -4.6);
  interior.add(roomFill);

  // ───────────────────────── Encuadre y secuencia ─────────────────────────
  let disposed = false;
  let frameRequest = 0;
  let finish: ((completed: boolean) => void) | null = null;

  const applyFraming = () => {
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    if (options.poster) {
      const cover =
        options.poster === "landscape"
          ? introFrame.posterLandscape
          : introFrame.posterPortrait;
      camera.aspect = cover.width / cover.height;
      camera.fov =
        (2 * Math.atan(cover.height / 2 / introFrame.cameraDistance) * 180) /
        Math.PI;
      renderer.setSize(canvas.width, canvas.height, false);
    } else {
      const aspect = width / Math.max(1, height);
      const visibleHeight = Math.max(
        introFrame.height,
        introFrame.width / aspect,
      );
      camera.aspect = aspect;
      camera.fov =
        (2 * Math.atan(visibleHeight / 2 / introFrame.cameraDistance) * 180) /
        Math.PI;
      renderer.setSize(width, height, false);
    }
    camera.updateProjectionMatrix();
  };

  const renderAt = (elapsedMs: number) => {
    if (disposed) return;
    const openT = clamp01((elapsedMs - introTiming.hold) / introTiming.open);
    door.rotation.y = doorEase(openT) * OPEN_ANGLE;
    const dollyT = easeInOut(
      clamp01(
        (elapsedMs - introTiming.hold - introTiming.dollyDelay) /
          introTiming.dolly,
      ),
    );
    // El campo de visión se fijó para la distancia inicial: al avanzar, la
    // puerta crece en pantalla sin alterar la perspectiva del póster.
    camera.position.z = introFrame.cameraDistance - dollyT * 1.55;
    camera.position.y = introFrame.centerY - dollyT * 0.05;
    const exitT = clamp01(
      (elapsedMs - (introTiming.total - introTiming.exit)) / introTiming.exit,
    );
    renderer.toneMappingExposure = 1 + exitT * 0.5;
    renderer.render(scene, camera);
  };

  applyFraming();

  const ready = Promise.all(pending).then(async () => {
    if (disposed) return;
    await renderer.compileAsync(scene, camera);
    if (disposed) return;
    // Guarda de rendimiento: un primer cuadro lento anuncia una secuencia a
    // trompicones; en ese caso se prefiere la salida con la imagen fija.
    const before = performance.now();
    renderAt(0);
    renderer.getContext().finish();
    if (!options.poster && performance.now() - before > SLOW_FRAME)
      throw new Error("GPU demasiado lenta para la introducción");
  });

  return {
    ready,
    resize() {
      if (disposed) return;
      applyFraming();
    },
    renderAt,
    play(onExit) {
      return new Promise<boolean>((resolve) => {
        if (disposed) return resolve(false);
        const startedAt = performance.now();
        let exitSignalled = false;
        let previous = startedAt;
        let slowFrames = 0;
        finish = resolve;
        const tick = (now: number) => {
          if (disposed) return;
          const elapsed = now - startedAt;
          slowFrames = now - previous > SLOW_FRAME ? slowFrames + 1 : 0;
          previous = now;
          if (slowFrames >= 3 && !exitSignalled) {
            finish = null;
            return resolve(false);
          }
          renderAt(elapsed);
          if (
            !exitSignalled &&
            elapsed >= introTiming.total - introTiming.exit
          ) {
            exitSignalled = true;
            onExit();
          }
          if (elapsed >= introTiming.total) {
            finish = null;
            return resolve(true);
          }
          frameRequest = requestAnimationFrame(tick);
        };
        frameRequest = requestAnimationFrame(tick);
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameRequest);
      finish?.(false);
      finish = null;
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      for (const light of [doorWash, spill]) light.shadow.map?.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      // Devuelve el contexto al navegador: no queda consumo de GPU posterior.
      renderer.forceContextLoss();
    },
  };
}
