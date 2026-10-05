/// <reference path="./chapters.ts" />
/// <reference path="./progression.ts" />
/// <reference path="./progression-ui.ts" />
/// <reference path="./audio.ts" />
/// <reference path="./scene-render.ts" />
/// <reference path="./gameplay.ts" />
/// <reference path="./scenery.ts" />
/// <reference path="./target-render.ts" />
/// <reference path="./character-render.ts" />
/// <reference path="./hud-render.ts" />

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
const menuOverlay = document.querySelector<HTMLElement>('#menu-overlay');
const boardOverlay = document.querySelector<HTMLElement>('#board-overlay');

type BellKind = 'bronze' | 'silver' | 'crystal';
type Bell = { id: number; x: number; y: number; w: number; h: number; touched: boolean; scored: boolean; lastHit: number; phase: number; value: number; kind: BellKind; boost: number };
type Moth = { x: number; prevX: number; y: number; vx: number; phase: number; alive: boolean; warned: boolean; kind: BellKind; flightWorldY?: number };
type Snow = { x: number; y: number; r: number; speed: number; drift: number; phase: number; alpha: number };
type Star = { x: number; y: number; r: number; twinkle: number; alpha: number };
type SpriteFrame = { sx: number; sy: number; sw: number; sh: number; ax: number; ay: number };
type AnimState = 'idle' | 'walk' | 'crouch' | 'launch' | 'rise' | 'apex' | 'fall' | 'land' | 'groundLand' | 'undersideContact' | 'boostContact';
type SparkKind = 'spark' | 'snow' | 'petal' | 'droplet' | 'pollen' | 'leaf';
type Spark = { x: number; y: number; vx: number; vy: number; ttl: number; life: number; size: number; color: string; kind: SparkKind; spin: number };
type GroundMark = { x: number; age: number; life: number; side: number; theme: ThemeName };

type GameState = 'title' | 'ready' | 'playing' | 'falling' | 'zenGrounded' | 'expeditionCheckpoint' | 'expeditionComplete' | 'gameover';
type ThemeName = 'winter' | 'spring' | 'summer' | 'autumn';
type GameMode = 'classic' | 'zen' | 'expedition';
type CharacterId = 'zima' | 'earl-grey' | 'betty-davis' | 'gracie-bell';
type CompanionId = Exclude<CharacterId, 'zima'>;
type CompanionPose = 'idle' | 'walk' | 'rise' | 'fall' | 'contact' | 'land';
type Rect = { x: number; y: number; w: number; h: number };
type ScoreRecord = { score: bigint; approximate?: boolean; equipped?: boolean; bounces: number; multiplier: number; retries?: number; theme: ThemeName; mode: GameMode; cat: CharacterId; at: number };

const TAU = Math.PI * 2;
const DPR_MAX = 2;
const GROUND_Y = 0;
const EXPEDITION_GOALS = [14000, 28000, 42000] as const;
function expeditionGoals(): readonly number[] {
  return EXPEDITION_GOALS;
}
const PHYS = {
  gravity: -2050,
  bounce: 1120,
  firstBounce: 1180,
  steer: 4200,
  maxSpeed: 620,
  drag: 13,
};

const SPRITE_SCALE = 0.34;
const CAT_EDGE_MARGIN = 55;
const TURN_DURATION = 0.11;
const ATLAS_CELL_W = 360;
const ATLAS_CELL_H = 300;
const ATLAS_COLS = 8;
const spriteImage = new Image();
spriteImage.src = 'assets/characters/zima/animation-clean-atlas.webp';
const zimaIdleKeysImage = new Image();
zimaIdleKeysImage.src = 'assets/characters/zima/idle-four-keys.webp';
const zimaIdleSixteenImage = new Image();
zimaIdleSixteenImage.src = 'assets/characters/zima/idle-sixteen.webp';
const zimaWalkSixteenImage = new Image();
zimaWalkSixteenImage.src = 'assets/characters/zima/walk-sixteen.webp';
const zimaMotionImages = {
  crouch: new Image(), launch: new Image(), rise: new Image(), apex: new Image(),
  fall: new Image(), contact: new Image(), sideContact: new Image(), land: new Image(),
};
for (const [family, image] of Object.entries(zimaMotionImages)) {
  const asset = family === 'sideContact' ? 'side-contact' : family;
  image.src = `assets/characters/zima/${asset}-sixteen.webp`;
}
const turnPoseImage = new Image();
turnPoseImage.src = 'assets/characters/zima/turn-pose.webp';
const zimaTurnFrontImage = new Image();
zimaTurnFrontImage.src = 'assets/characters/zima/turn-front.webp';
const zimaTurnMiddleImage = new Image();
zimaTurnMiddleImage.src = 'assets/characters/zima/turn-middle.webp';
const topContactImage = new Image();
topContactImage.src = 'assets/characters/zima/top-contact.webp';
const undersideContactImage = new Image();
undersideContactImage.src = 'assets/characters/zima/underside-contact.webp';
const airborneBoostImage = new Image();
airborneBoostImage.src = 'assets/characters/zima/airborne-boost.webp';
const fallPoseImage = new Image();
fallPoseImage.src = 'assets/characters/zima/fall-pose.png';
const fallTuckImage = new Image();
fallTuckImage.src = 'assets/characters/zima/fall-tuck.png';

// Preserve the scarf's painted highlights and folds while changing only its
// blue cloth pixels. Keep one season's derived canvases in memory at a time.
const SCARF_COLORS: Record<Exclude<ThemeName, 'winter'>, [number, number, number]> = {
  spring: [218, 126, 164],
  summer: [65, 165, 153],
  autumn: [151, 68, 112],
};
const scarfArtCache = new Map<string, HTMLCanvasElement>();
const MAX_SCARF_TINT_CELLS = 72;
function seasonalScarfArt(image: HTMLImageElement, key: string, frame?: SpriteFrame): CanvasImageSource {
  if (selectedTheme === 'winter' || !image.naturalWidth) return image;
  const cached = scarfArtCache.get(key);
  if (cached) {
    scarfArtCache.delete(key);
    scarfArtCache.set(key, cached);
    return cached;
  }
  const result = document.createElement('canvas');
  const sourceWidth = frame?.sw ?? image.naturalWidth;
  const sourceHeight = frame?.sh ?? image.naturalHeight;
  const scale = Math.min(1, 480 / sourceWidth, 400 / sourceHeight);
  result.width = Math.round(sourceWidth * scale);
  result.height = Math.round(sourceHeight * scale);
  const paint = result.getContext('2d', { willReadFrequently: true })!;
  if (frame) paint.drawImage(image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, result.width, result.height);
  else paint.drawImage(image, 0, 0, result.width, result.height);
  const pixels = paint.getImageData(0, 0, result.width, result.height);
  const data = pixels.data;
  const color = SCARF_COLORS[selectedTheme];
  const limit = key.startsWith('fall') ? 0.73 : frame ? 0.78 : 0.80;
  const rowStride = result.width * 4;
  for (let y = 0; y < result.height; y++) {
    for (let x = 0; x < result.width; x++) {
      const localX = x / result.width;
      if (localX > limit) continue; // leave Zima's blue eyes alone
      const i = y * rowStride + x * 4;
      const red = data[i], green = data[i + 1], blue = data[i + 2];
      if (data[i + 3] < 8 || blue - red < 20 || blue - green < 4) continue;
      const cloth = Math.min(1, (blue - red - 16) / 28, (blue - green) / 18);
      if (cloth <= 0) continue;
      const shade = Math.min(1.45, Math.max(0.28, (red * 0.21 + green * 0.72 + blue * 0.07) / 104));
      for (let channel = 0; channel < 3; channel++) {
        const tinted = Math.min(255, color[channel] * shade);
        data[i + channel] = Math.round(data[i + channel] * (1 - cloth) + tinted * cloth);
      }
    }
  }
  paint.putImageData(pixels, 0, 0);
  scarfArtCache.set(key, result);
  if (scarfArtCache.size > MAX_SCARF_TINT_CELLS) {
    const oldest = scarfArtCache.keys().next();
    if (!oldest.done) scarfArtCache.delete(oldest.value);
  }
  return result;
}

const THEME_ORDER: ThemeName[] = ['winter', 'spring', 'summer', 'autumn'];
const THEME_META: Record<ThemeName, { label: string; subtitle: string; normal: string; medium: string; strong: string; airborne: string; accent: string; card: string; }> = {
  winter: { label: 'Winter', subtitle: 'Moonlit snow and ringing bells', normal: 'Bell', medium: 'Silver Bell', strong: 'Crystal Bell', airborne: 'Aurora Bird', accent: '#9fe8da', card: '#173c56' },
  spring: { label: 'Spring', subtitle: 'Rain, blossoms, and dragonflies', normal: 'Raindrop', medium: 'Blossom', strong: 'Glow Bloom', airborne: 'Dragonfly', accent: '#ff96cf', card: '#2b5f60' },
  summer: { label: 'Summer', subtitle: 'Sunflowers, swallows, and warm fields', normal: 'Sunflower', medium: 'Golden Bloom', strong: 'Radiant Flower', airborne: 'Swallow', accent: '#ffd36d', card: '#5c7c2f' },
  autumn: { label: 'Autumn', subtitle: 'Pumpkins, crows, and harvest fields', normal: 'Pumpkin', medium: 'Harvest Gourd', strong: "Jack-o'-Lantern", airborne: 'Crow', accent: '#ffb062', card: '#75411c' },
};
const CHARACTER_ORDER: CharacterId[] = ['zima', 'earl-grey', 'betty-davis', 'gracie-bell'];
const CHARACTER_META: Record<CharacterId, { name: string; hint: string; portrait: string; }> = {
  zima: { name: 'Zima', hint: 'Bright adventurer', portrait: 'assets/characters/zima/turn-pose.webp' },
  'earl-grey': { name: 'Earl Grey', hint: 'Sturdy explorer', portrait: 'assets/characters/earl-grey/idle.png' },
  'betty-davis': { name: 'Betty Davis', hint: 'Petite wanderer', portrait: 'assets/characters/betty-davis/idle.png' },
  'gracie-bell': { name: 'Gracie Bell', hint: 'Graceful climber', portrait: 'assets/characters/gracie-bell/idle.png' },
};
const COMPANION_IDS: CompanionId[] = ['earl-grey', 'betty-davis', 'gracie-bell'];
const COMPANION_POSES: CompanionPose[] = ['idle', 'walk', 'rise', 'fall', 'contact', 'land'];
const companionArt = {} as Record<CompanionId, Record<CompanionPose, HTMLImageElement>>;
const earlWalkKeysImage = new Image();
earlWalkKeysImage.src = 'assets/characters/earl-grey/walk-keys.webp';
const bettyWalkKeysImage = new Image();
bettyWalkKeysImage.src = 'assets/characters/betty-davis/walk-keys.webp';
const gracieWalkKeysImage = new Image();
gracieWalkKeysImage.src = 'assets/characters/gracie-bell/walk-keys.webp';
const companionWalkKeys: Record<CompanionId, HTMLImageElement> = {
  'earl-grey': earlWalkKeysImage, 'betty-davis': bettyWalkKeysImage, 'gracie-bell': gracieWalkKeysImage,
};
const companionWalkSixteen = {} as Record<CompanionId, HTMLImageElement>;
const companionIdleSixteen = {} as Record<CompanionId, HTMLImageElement>;
for (const character of COMPANION_IDS) {
  companionWalkSixteen[character] = new Image();
  companionWalkSixteen[character].src = `assets/characters/${character}/walk-sixteen.webp`;
  companionIdleSixteen[character] = new Image();
  companionIdleSixteen[character].src = `assets/characters/${character}/idle-sixteen.webp`;
}
type CompanionMotionFamily = 'crouch' | 'launch' | 'rise' | 'apex' | 'fall';
const companionMotionKeys = {} as Record<CompanionId, Record<CompanionMotionFamily, HTMLImageElement>>;
for (const character of COMPANION_IDS) {
  const images = {} as Record<CompanionMotionFamily, HTMLImageElement>;
  for (const family of ['crouch', 'launch', 'rise', 'apex', 'fall'] as CompanionMotionFamily[]) {
    images[family] = new Image();
    images[family].src = `assets/characters/${character}/${family}-keys.webp`;
  }
  companionMotionKeys[character] = images;
}
const earlEventArt = {
  launch: new Image(), apex: new Image(), fallTuck: new Image(), recover: new Image(),
  sideContact: new Image(), topContact: new Image(), undersideContact: new Image(),
  boostContact: new Image(), turn: new Image(),
};
earlEventArt.launch.src = 'assets/characters/earl-grey/launch.webp';
earlEventArt.apex.src = 'assets/characters/earl-grey/apex.webp';
earlEventArt.fallTuck.src = 'assets/characters/earl-grey/fall-tuck.webp';
earlEventArt.recover.src = 'assets/characters/earl-grey/recover.webp';
earlEventArt.sideContact.src = 'assets/characters/earl-grey/side-contact.webp';
earlEventArt.topContact.src = 'assets/characters/earl-grey/top-contact.webp';
earlEventArt.undersideContact.src = 'assets/characters/earl-grey/underside-contact.webp';
earlEventArt.boostContact.src = 'assets/characters/earl-grey/boost-contact.webp';
earlEventArt.turn.src = 'assets/characters/earl-grey/turn.webp';
type CompanionEventKey = keyof typeof earlEventArt;
function companionEventImages(character: CompanionId): typeof earlEventArt {
  const names: Record<CompanionEventKey, string> = {
    launch: 'launch', apex: 'apex', fallTuck: 'fall-tuck', recover: 'recover',
    sideContact: 'side-contact', topContact: 'top-contact',
    undersideContact: 'underside-contact', boostContact: 'boost-contact', turn: 'turn',
  };
  const images = {} as typeof earlEventArt;
  for (const key of Object.keys(names) as CompanionEventKey[]) {
    images[key] = new Image();
    images[key].src = `assets/characters/${character}/${names[key]}.webp`;
  }
  return images;
}
const companionEventArt: Record<CompanionId, typeof earlEventArt> = {
  'earl-grey': earlEventArt,
  'betty-davis': companionEventImages('betty-davis'),
  'gracie-bell': companionEventImages('gracie-bell'),
};
const companionArtState = { 'earl-grey': 'loading', 'betty-davis': 'loading', 'gracie-bell': 'loading' } as Record<CompanionId, AssetState>;
const companionTintCache = new Map<string, HTMLCanvasElement>();
const COMPANION_CLOTH: Record<CompanionId, Record<ThemeName, [number, number, number]>> = {
  'earl-grey': { winter: [106, 132, 178], spring: [181, 119, 153], summer: [104, 152, 113], autumn: [163, 94, 69] },
  'betty-davis': { winter: [138, 169, 193], spring: [177, 118, 168], summer: [203, 165, 104], autumn: [167, 104, 132] },
  'gracie-bell': { winter: [111, 151, 183], spring: [185, 139, 171], summer: [81, 164, 157], autumn: [193, 147, 83] },
};
const GRACIE_RIBBON_BOUNDS: Record<CompanionPose, [number, number, number, number]> = {
  idle: [420, 145, 580, 260], walk: [425, 145, 585, 265],
  rise: [375, 115, 510, 205], fall: [390, 185, 495, 340],
  contact: [410, 120, 565, 255], land: [410, 145, 580, 275],
};
function seasonalCompanionArt(character: CompanionId, pose: CompanionPose, sourceOverride?: HTMLImageElement): CanvasImageSource {
  const source = sourceOverride ?? companionArt[character][pose];
  if ((selectedTheme === 'autumn' && character === 'gracie-bell') || (selectedTheme === 'spring' && character === 'betty-davis')) return source;
  const key = `${character}:${pose}:${selectedTheme}:${sourceOverride?.src ?? 'base'}`;
  const cached = companionTintCache.get(key);
  if (cached) return cached;
  const result = document.createElement('canvas');
  result.width = source.naturalWidth; result.height = source.naturalHeight;
  const paint = result.getContext('2d', { willReadFrequently: true })!;
  paint.drawImage(source, 0, 0);
  const pixels = paint.getImageData(0, 0, result.width, result.height);
  const data = pixels.data;
  const target = COMPANION_CLOTH[character][selectedTheme];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 16) continue;
    if (character === 'gracie-bell') {
      const x = (i / 4) % result.width, y = Math.floor(i / 4 / result.width);
      const motionAtlas = sourceOverride && result.height === 356 && result.width % 500 === 0;
      const [left, top, right, bottom] = motionAtlas
        ? [220, 85, 430, 270] : GRACIE_RIBBON_BOUNDS[pose];
      const localX = motionAtlas ? x % 500 : x;
      if (localX < left || localX > right || y < top || y > bottom) continue;
    }
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const high = Math.max(r, g, b), low = Math.min(r, g, b), span = high - low;
    if (high < 28 || span < 10) continue;
    const saturation = span / high;
    let hue = high === r ? 60 * ((g - b) / span % 6) : high === g ? 60 * ((b - r) / span + 2) : 60 * ((r - g) / span + 4);
    if (hue < 0) hue += 360;
    const cloth = character === 'earl-grey' ? hue >= 45 && hue <= 100 && saturation > 0.16
      : character === 'betty-davis' ? hue >= 275 && hue <= 345 && saturation > 0.10
        : hue >= 25 && hue <= 50 && saturation > 0.48 && high > 75;
    if (!cloth) continue;
    const shade = Math.max(0.30, Math.min(1.4, (r * 0.21 + g * 0.72 + b * 0.07) / 120));
    for (let channel = 0; channel < 3; channel++) data[i + channel] = Math.min(255, Math.round(target[channel] * shade));
  }
  paint.putImageData(pixels, 0, 0);
  companionTintCache.set(key, result);
  return result;
}
for (const character of COMPANION_IDS) {
  const poses = {} as Record<CompanionPose, HTMLImageElement>;
  companionArt[character] = poses;
  let loaded = 0;
  for (const pose of COMPANION_POSES) {
    const image = new Image();
    image.onload = () => { if (++loaded === COMPANION_POSES.length) companionArtState[character] = 'ready'; };
    image.onerror = () => { companionArtState[character] = 'failed'; console.error(`${character} ${pose} art failed to load.`); };
    image.src = `assets/characters/${character}/${pose}.png`;
    poses[pose] = image;
  }
}


type ThemeArt = { bg: HTMLImageElement; ground: HTMLImageElement };
type SceneLayer = { image: HTMLImageElement | HTMLCanvasElement; depth: number; top: number; height: number };
type SceneAssets = { sky: HTMLCanvasElement; far: SceneLayer; mid: SceneLayer; near: SceneLayer; ground: HTMLImageElement; prop: HTMLImageElement | null; groundSurface: number; groundHeight: number };
type AssetState = 'idle' | 'loading' | 'ready' | 'failed';
const SCENE_ASSET_PATHS: Record<ThemeName, { sky: string; far: string; mid: string; near: string; ground: string; prop?: string }> = {
  winter: { sky: 'assets/themes/winter/sky.webp', far: 'assets/themes/winter/far-mountains.webp', mid: 'assets/themes/winter/mid-village.webp', near: 'assets/themes/winter/mid-pines.webp', ground: 'assets/themes/winter/ground-front.webp' },
  spring: { sky: 'assets/themes/spring/sky.webp', far: 'assets/themes/spring/far.webp', mid: 'assets/themes/spring/mid.webp', near: 'assets/themes/spring/near.webp', ground: 'assets/themes/spring/ground.webp' },
  summer: { sky: 'assets/themes/summer/sky.webp', far: 'assets/themes/summer/far.webp', mid: 'assets/themes/summer/mid.webp', near: 'assets/themes/summer/near.webp', ground: 'assets/themes/summer/ground.webp', prop: 'assets/themes/summer/windmill-prop.webp' },
  autumn: { sky: 'assets/themes/autumn/sky.webp', far: 'assets/themes/autumn/far.webp', mid: 'assets/themes/autumn/mid.webp', near: 'assets/themes/autumn/near.webp', ground: 'assets/themes/autumn/ground.webp', prop: 'assets/themes/autumn/scarecrow-prop.webp' },
};
const SCENE_LAYOUT: Record<ThemeName, { far: [number, number]; mid: [number, number]; near: [number, number]; groundSurface: number }> = {
  winter: { far: [0.15, 0.76], mid: [0.36, 0.62], near: [0.18, 0.70], groundSurface: 0.75 },
  spring: { far: [0.15, 0.75], mid: [0.32, 0.65], near: [0.00, 0.90], groundSurface: 0.70 },
  summer: { far: [0.15, 0.75], mid: [0.34, 0.64], near: [0.10, 0.80], groundSurface: 0.69 },
  autumn: { far: [0.15, 0.75], mid: [0.18, 0.78], near: [0.00, 0.90], groundSurface: 0.70 },
};
const sceneAssets: Partial<Record<ThemeName, SceneAssets>> = {};
const sceneAssetState: Record<ThemeName, AssetState> = { winter: 'idle', spring: 'idle', summer: 'idle', autumn: 'idle' };
let groundFrontCache: { key: string; image: HTMLCanvasElement } | null = null;
const winterReeds = new Image();
winterReeds.src = 'assets/themes/winter/winter-snow-reeds.webp';
const springFlowerBank = new Image();
springFlowerBank.src = 'assets/themes/spring/spring-flower-bank.webp';

function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function softenLayerEdges(image: HTMLImageElement, fadeTop: boolean, clearLowAlpha = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const layerCtx = canvas.getContext('2d')!;
  layerCtx.drawImage(image, 0, 0);
  if (clearLowAlpha) {
    // Spring's near painting carries a low-alpha wash through the play lane.
    // Remove that wash while retaining the painted silhouettes and their soft edges.
    const pixels = layerCtx.getImageData(0, 0, canvas.width, canvas.height);
    for (let offset = 3; offset < pixels.data.length; offset += 4) {
      const alpha = pixels.data[offset];
      if (alpha <= 24) pixels.data[offset] = 0;
      else if (alpha < 64) pixels.data[offset] = Math.round(alpha * (alpha - 24) / 40);
    }
    layerCtx.putImageData(pixels, 0, 0);
  }
  layerCtx.globalCompositeOperation = 'destination-in';
  const fade = layerCtx.createLinearGradient(0, 0, 0, image.naturalHeight);
  fade.addColorStop(0, fadeTop ? 'rgba(255,255,255,0)' : '#fff');
  if (fadeTop) fade.addColorStop(0.10, '#fff');
  fade.addColorStop(0.73, '#fff');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  layerCtx.fillStyle = fade;
  layerCtx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function softenSkyTop(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const paint = canvas.getContext('2d')!;
  paint.drawImage(image, 0, 0);
  paint.globalCompositeOperation = 'destination-in';
  const edge = paint.createLinearGradient(0, 0, 0, image.naturalHeight * 0.10);
  edge.addColorStop(0, 'rgba(255,255,255,0)');
  edge.addColorStop(1, '#fff');
  paint.fillStyle = edge;
  paint.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadSceneAssets(theme: ThemeName): void {
  if (sceneAssetState[theme] !== 'idle') return;
  sceneAssetState[theme] = 'loading';
  const paths = SCENE_ASSET_PATHS[theme];
  const layout = SCENE_LAYOUT[theme];
  const layers = Promise.all([paths.sky, paths.far, paths.mid, paths.near, paths.ground].map(preloadImage));
  const propAsset = paths.prop ? preloadImage(paths.prop).catch(error => { console.warn(`${theme} landmark art unavailable.`, error); return null; }) : Promise.resolve(null);
  void Promise.all([layers, propAsset]).then(([[sky, far, mid, near, ground], prop]) => {
    sceneAssets[theme] = {
      sky: softenSkyTop(sky),
      far: { image: far, depth: 0.05, top: layout.far[0], height: layout.far[1] },
      mid: { image: mid, depth: 0.12, top: layout.mid[0], height: layout.mid[1] },
      near: { image: softenLayerEdges(near, theme === 'spring' || theme === 'autumn', theme === 'spring'), depth: 0.38, top: layout.near[0], height: layout.near[1] },
      ground,
      prop,
      groundSurface: layout.groundSurface,
      groundHeight: 0.46,
    };
    sceneAssetState[theme] = 'ready';
  }).catch(error => {
    console.error(`${theme} scene art preload failed; using existing scenery fallback.`, error);
    sceneAssetState[theme] = 'failed';
    ensureLegacyArt(theme);
  });
}

function loadThemeImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

const THEME_ART: Partial<Record<ThemeName, ThemeArt>> = {};

function ensureLegacyArt(theme: ThemeName): void {
  if (THEME_ART[theme]) return;
  THEME_ART[theme] = {
    bg: loadThemeImage(`assets/seasonal/${theme}-painted-bg.png`),
    ground: loadThemeImage(`assets/seasonal/${theme}-painted-ground.png`),
  };
}

type InteractionAssets = { objects: HTMLImageElement; airborne: HTMLImageElement };
type SpriteBounds = { x: number; y: number; w: number; h: number };
const OBJECT_BOUNDS: Record<ThemeName, [SpriteBounds, SpriteBounds, SpriteBounds]> = {
  winter: [{ x: 95, y: 88, w: 513, h: 577 }, { x: 704, y: 88, w: 629, h: 580 }, { x: 1437, y: 76, w: 570, h: 616 }],
  spring: [{ x: 138, y: 74, w: 391, h: 601 }, { x: 693, y: 87, w: 605, h: 584 }, { x: 1368, y: 63, w: 645, h: 606 }],
  summer: [{ x: 25, y: 60, w: 630, h: 625 }, { x: 698, y: 77, w: 667, h: 609 }, { x: 1365, y: 40, w: 670, h: 680 }],
  autumn: [{ x: 59, y: 74, w: 623, h: 603 }, { x: 682, y: 27, w: 582, h: 677 }, { x: 1376, y: 72, w: 618, h: 614 }],
};
const INTERACTION_ASSET_PATHS: Record<ThemeName, { objects: string; airborne: string }> = {
  winter: { objects: 'assets/themes/winter/objects-atlas.webp', airborne: 'assets/themes/winter/airborne-atlas.webp' },
  spring: { objects: 'assets/themes/spring/objects-atlas.webp', airborne: 'assets/themes/spring/airborne-atlas.webp' },
  summer: { objects: 'assets/themes/summer/objects-atlas.webp', airborne: 'assets/themes/summer/airborne-atlas.webp' },
  autumn: { objects: 'assets/themes/autumn/objects-atlas.webp', airborne: 'assets/themes/autumn/airborne-atlas.webp' },
};
const interactionAssets: Partial<Record<ThemeName, InteractionAssets>> = {};
const interactionAssetState: Record<ThemeName, AssetState> = { winter: 'idle', spring: 'idle', summer: 'idle', autumn: 'idle' };
function loadInteractionAssets(theme: ThemeName): void {
  if (interactionAssetState[theme] !== 'idle') return;
  interactionAssetState[theme] = 'loading';
  const paths = INTERACTION_ASSET_PATHS[theme];
  void Promise.all([preloadImage(paths.objects), preloadImage(paths.airborne)]).then(([objects, airborne]) => {
    interactionAssets[theme] = { objects, airborne };
    interactionAssetState[theme] = 'ready';
  }).catch(error => {
    console.error(`${theme} object art preload failed; using vector fallbacks.`, error);
    interactionAssetState[theme] = 'failed';
  });
}
function loadSelectedThemeArt(theme: ThemeName): void {
  loadSceneAssets(theme);
  loadInteractionAssets(theme);
  loadContinuousSeason(theme);
  loadUpperRealm(theme);
}

function selectedArtLoading(): boolean {
  return interactionAssetState[selectedTheme] === 'loading' || sceneAssetState[selectedTheme] === 'loading'
    || continuousState[selectedTheme] === 'loading'
    || upperRealmArt[selectedTheme].state === 'loading'
    || (selectedCharacter !== 'zima' && companionArtState[selectedCharacter] === 'loading');
}

function atlasFrame(index: number): SpriteFrame {
  const packed = CLEAN_FRAME_INDEX.get(index);
  if (packed === undefined) throw new Error(`Missing Zima pose ${index} from the clean atlas`);
  return {
    sx: (packed % ATLAS_COLS) * ATLAS_CELL_W,
    sy: Math.floor(packed / ATLAS_COLS) * ATLAS_CELL_H,
    sw: ATLAS_CELL_W,
    sh: ATLAS_CELL_H,
    ax: 0.50,
    ay: (GROUND_CONTACT_Y[index] ?? 282) / ATLAS_CELL_H,
  };
}

// These are the intact source poses in the 256-cell atlas. The intervening
// interpolated cells have semi-transparent doubled limbs and are not played.
const animRanges: Record<AnimState, { frames: readonly number[]; fps: number; loop: boolean }> = {
  idle:   { frames: [0], fps: 1, loop: true },
  walk:   { frames: [32, 38, 45, 51, 58, 64, 70, 77, 83, 90], fps: 16, loop: true },
  crouch: { frames: [96, 100, 104, 108], fps: 12, loop: true },
  launch: { frames: [112, 115, 118, 121, 124], fps: 18, loop: false },
  rise:   { frames: [128, 136, 144, 152], fps: 12, loop: true },
  apex:   { frames: [160, 164, 168, 172], fps: 10, loop: true },
  fall:   { frames: [176, 184, 192, 200], fps: 12, loop: true },
  land:   { frames: [208, 224, 239], fps: 24, loop: false },
  groundLand: { frames: [229, 250, 255], fps: 12, loop: false },
  undersideContact: { frames: [112, 115, 118], fps: 18, loop: false },
  boostContact: { frames: [118, 121, 124], fps: 18, loop: false },
};
const CLEAN_FRAME_IDS = Array.from(new Set(Object.values(animRanges).flatMap(spec => spec.frames))).sort((a, b) => a - b);
const CLEAN_FRAME_INDEX = new Map(CLEAN_FRAME_IDS.map((id, packed) => [id, packed]));
// Alpha-measured lowest solid paw pixel for each selected grounded pose.
const GROUND_CONTACT_Y: Record<number, number> = {
  0: 280, 32: 278, 38: 281, 45: 277, 51: 281, 58: 274,
  64: 276, 70: 274, 77: 281, 83: 277, 90: 281,
  96: 287, 100: 287, 104: 286, 108: 287,
  208: 287, 224: 280, 239: 287, 229: 283, 250: 280, 255: 280,
};


let width = 1280;
let height = 720;
let dpr = 1;
let state: GameState = 'title';
let last = performance.now();
let elapsed = 0;
let cameraY = 0;
// All painted backdrop planes share this height. A short camera reversal on a
// bell arc does not make a mountain travel back toward its previous chapter.
let backdropCameraY = 0;
let score = 0n;
let bellCount = 0;
let mothCount = 0;
let highestY = 0;
let descentPeakY = GROUND_Y;
let descentBlend = 0;
let message = '';
let messageTimer = 0;
let mouseX = width / 2;
let pointerActive = false;
let inputMode: 'keyboard' | 'mouse' | 'none' = 'none';
let gameSeed = 0;
let launchBuffer = 0;
let sparks: Spark[] = [];
let groundMarks: GroundMark[] = [];
let groundTravel = 0;
let nextGroundStep = 38;
let groundStepSide = 1;
let multiplier = 1;
let expeditionStage = 0;
let expeditionCheckpointY = 0;
let expeditionFootholdY = 0;
let expeditionFootholdX = 0;
let expeditionRetries = 0;
let expeditionEndingAt = 0;
let animState: AnimState = 'idle';
let animStateTime = 0;
let contactAnimHold = 0;
let turnTime = TURN_DURATION;
let turnFrom = 1;
let lastBellContactDirection: 'top' | 'underside' | 'side' = 'top';
let cameraShake = 0;
let nextBonusBell = 50;
let bounceHold = 0;
let fieldDrop = 0;
let bounceChain = 0;
let pendingBounce = 0;
let paused = false;
const savedTheme = localStorage.getItem('zima-skybells-theme') as ThemeName;
const savedMode = localStorage.getItem('zima-skybells-mode');
const savedCharacter = localStorage.getItem('zima-skybells-character') as CharacterId;
let selectedTheme: ThemeName = THEME_ORDER.includes(savedTheme) ? savedTheme : 'winter';
let selectedMode: GameMode = savedMode === 'zen' || savedMode === 'expedition' ? savedMode : 'classic';
let selectedCharacter: CharacterId = CHARACTER_ORDER.includes(savedCharacter) ? savedCharacter : 'zima';
loadSelectedThemeArt(selectedTheme);
let themeCardRects: { theme: ThemeName; rect: Rect }[] = [];
let modeCardRects: { mode: GameMode; rect: Rect }[] = [];
let titleStartRect: Rect | null = null;
let menuRect: Rect | null = null;
let scoreboardOpen = false;
let scoreboardMode: GameMode = selectedMode;
let scoreboardPage = 0;
let scoreboardPageCount = 1;
let scoreboardPrevRect: Rect | null = null;
let scoreboardNextRect: Rect | null = null;
let scoreboardModeRects: { mode: GameMode; rect: Rect }[] = [];

function parseStoredScore(value: unknown): { score: bigint; approximate: boolean } | null {
  if (typeof value === 'string' && /^\d+$/.test(value)) return { score: BigInt(value), approximate: false };
  if (typeof value === 'string' && /^\d+(?:\.\d+)?e\+?\d+$/i.test(value)) {
    const parsed = parseStoredScore(Number(value));
    return parsed ? { score: parsed.score, approximate: true } : null;
  }
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    const decimal = value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
    return { score: BigInt(decimal), approximate: !Number.isSafeInteger(value) };
  }
  return null;
}

let scoreHistory: ScoreRecord[] = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('zima-skybells-scores') || '[]');
    return Array.isArray(saved) ? saved.flatMap(r => {
      const parsed = parseStoredScore(r?.score);
      if (!parsed || !Number.isSafeInteger(r.bounces) || !Number.isSafeInteger(r.multiplier) ||
          !THEME_ORDER.includes(r.theme) || (r.mode !== 'classic' && r.mode !== 'zen' && r.mode !== 'expedition')) return [];
      return [{ score: parsed.score, approximate: Boolean(r.approximate) || parsed.approximate,
        equipped: r.equipped === true,
        bounces: r.bounces, multiplier: r.multiplier,
        retries: Number.isSafeInteger(r.retries) ? r.retries : undefined, theme: r.theme, mode: r.mode,
        cat: CHARACTER_ORDER.includes(r.cat) ? r.cat : 'zima',
        at: Number.isFinite(r.at) ? r.at : 0 } as ScoreRecord];
    }) : [];
  } catch { return []; }
})();
const legacyBest = parseStoredScore(localStorage.getItem('zima-skybells-legacy-best') || localStorage.getItem('zima-skybells-best'));
if (legacyBest) {
  legacyBest.approximate ||= localStorage.getItem('zima-skybells-legacy-best-approx') === '1';
  localStorage.setItem('zima-skybells-legacy-best', legacyBest.score.toString());
  localStorage.setItem('zima-skybells-legacy-best-approx', legacyBest.approximate ? '1' : '0');
}
const GAME_MODES: GameMode[] = ['classic', 'zen', 'expedition'];

function openScoreboard(): void {
  scoreboardMode = selectedMode;
  scoreboardPage = 0;
  scoreboardOpen = true;
  document.querySelector<HTMLButtonElement>('#close-scores')?.focus();
}

function closeScoreboard(): void {
  scoreboardOpen = false;
  if (state === 'title') document.querySelector<HTMLButtonElement>('#open-scores')?.focus();
  else canvas.focus();
}

let lastMenuUi = '';
let lastBoardUi = '';
let lastHotbarContext = '';
function syncDomUi(): void {
  const inventory = document.querySelector<HTMLElement>('#powerup-bar');
  if (inventory) inventory.hidden = state === 'title';
  const inventoryStatus = document.querySelector<HTMLElement>('#powerup-status');
  if (inventoryStatus) inventoryStatus.hidden = state === 'title';
  const hotbarContext = `${state}|${selectedMode}`;
  if (hotbarContext !== lastHotbarContext) { lastHotbarContext = hotbarContext; refreshProgressUi(); }
  if (menuOverlay) {
    menuOverlay.hidden = state !== 'title' || scoreboardOpen;
    const signature = `${selectedTheme}|${selectedMode}|${selectedCharacter}|${bestForMode()}|${selectedArtLoading()}`;
    if (signature !== lastMenuUi) {
      lastMenuUi = signature;
      menuOverlay.style.setProperty('--accent', themeMeta().accent);
      menuOverlay.querySelectorAll<HTMLButtonElement>('[data-season]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.season === selectedTheme)));
      menuOverlay.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.mode === selectedMode)));
      menuOverlay.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.character === selectedCharacter)));
      const desc = menuOverlay.querySelector<HTMLElement>('#menu-description');
      if (desc) desc.textContent = `${CHARACTER_META[selectedCharacter].name} explores ${themeMeta().subtitle.toLowerCase()}. ${selectedMode === 'expedition' ? 'Reach the summit through two base camps.' : selectedMode === 'zen' ? 'Land safely and launch again with your score.' : 'Keep the chain alive for your best climb.'}`;
      const best = menuOverlay.querySelector<HTMLElement>('#menu-best');
      if (best) best.textContent = `${selectedMode.toUpperCase()} best: ${formatScore(bestForMode())}`;
      const start = menuOverlay.querySelector<HTMLButtonElement>('#start-game');
      if (start) {
        const unavailable = selectedCharacter !== 'zima' && companionArtState[selectedCharacter] === 'failed';
        start.disabled = selectedArtLoading() || unavailable;
        start.textContent = unavailable ? 'Cat art unavailable' : selectedArtLoading() ? 'Loading art…' : 'Start climb';
      }
    }
  }
  if (boardOverlay) {
    boardOverlay.hidden = !scoreboardOpen;
    const signature = `${scoreboardOpen}|${scoreboardMode}|${score}|${scoreHistory.length}|${bestForMode(scoreboardMode)}`;
    if (scoreboardOpen && signature !== lastBoardUi) {
      lastBoardUi = signature;
      boardOverlay.style.setProperty('--accent', themeMeta().accent);
      boardOverlay.querySelectorAll<HTMLButtonElement>('[data-board-mode]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.boardMode === scoreboardMode)));
      const summary = boardOverlay.querySelector<HTMLElement>('#board-summary');
      if (summary) {
        summary.replaceChildren();
        const line = (label: string, value: string): void => {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.textContent = `${label}: `;
          p.append(strong, document.createTextNode(value));
          summary.append(p);
        };
        line('Standard best', `${formatScore(bestForMode(scoreboardMode))}${bestIsApproximate(scoreboardMode) ? ' (approximate legacy value)' : ''}`);
        line('Equipped best', formatScore(bestEquippedForMode(scoreboardMode)));
        if (scoreboardMode === selectedMode) line('Current', formatScore(score));
        if (legacyBest?.score) line('Legacy best, mode unknown', `${formatScore(legacyBest.score)}${legacyBest.approximate ? ' (approximate)' : ''}`);
      }
      const list = boardOverlay.querySelector<HTMLOListElement>('#board-records');
      if (list) {
        list.replaceChildren();
        const rows = scoreHistory.filter(run => run.mode === scoreboardMode);
        if (!rows.length) {
          const empty = document.createElement('li');
          empty.textContent = 'Finish a run to add a score for this mode.';
          list.append(empty);
        }
        rows.forEach((run, index) => {
          const item = document.createElement('li');
          const meta = document.createElement('span');
          meta.className = 'record-meta';
          meta.textContent = `#${index + 1} · ${run.equipped ? 'EQUIPPED' : 'STANDARD'} · ${CHARACTER_META[run.cat].name} · ${run.theme.toUpperCase()} · ${run.bounces} bounces · x${run.multiplier}${run.retries !== undefined ? ` · ${run.retries} retries` : ''}${run.approximate ? ' · approximate' : ''}`;
          const value = document.createElement('span');
          value.className = 'record-score';
          value.textContent = formatScore(run.score);
          item.append(meta, value);
          list.append(item);
        });
      }
    }
  }
}

if (menuOverlay) {
  const musicSlider = menuOverlay.querySelector<HTMLInputElement>('#music-level');
  const effectsSlider = menuOverlay.querySelector<HTMLInputElement>('#effects-level');
  if (musicSlider) {
    musicSlider.value = String(Math.round(musicLevel * 100));
    musicSlider.addEventListener('input', () => {
      setMusicLevel(Number(musicSlider.value) / 100);
    });
  }
  if (effectsSlider) {
    effectsSlider.value = String(Math.round(effectsLevel * 100));
    effectsSlider.addEventListener('input', () => {
      setEffectsLevel(Number(effectsSlider.value) / 100);
    });
  }
  const characterOptions = menuOverlay.querySelector<HTMLElement>('#character-options');
  for (const character of CHARACTER_ORDER) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.character = character;
    button.setAttribute('aria-pressed', String(character === selectedCharacter));
    button.setAttribute('aria-label', `Play as ${CHARACTER_META[character].name}`);
    const portrait = document.createElement('img');
    portrait.src = CHARACTER_META[character].portrait;
    portrait.alt = '';
    const name = document.createElement('span'); name.textContent = CHARACTER_META[character].name;
    const hint = document.createElement('small'); hint.textContent = CHARACTER_META[character].hint;
    button.append(portrait, name, hint);
    button.addEventListener('click', () => setCharacter(character));
    characterOptions?.append(button);
  }
  const seasonOptions = menuOverlay.querySelector<HTMLElement>('#season-options');
  for (const theme of THEME_ORDER) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.season = theme;
    button.setAttribute('aria-pressed', String(theme === selectedTheme));
    const name = document.createElement('span'); name.textContent = THEME_META[theme].label;
    const hint = document.createElement('small'); hint.textContent = `${THEME_META[theme].normal} · ${THEME_META[theme].airborne}`;
    button.append(name, hint);
    button.addEventListener('click', () => setTheme(theme));
    seasonOptions?.append(button);
  }
  const modeOptions = menuOverlay.querySelector<HTMLElement>('#mode-options');
  const modeHints: Record<GameMode, string> = { classic: 'Endless climb', zen: 'Safe landings', expedition: 'Summit quest' };
  for (const mode of GAME_MODES) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.mode = mode;
    button.setAttribute('aria-pressed', String(mode === selectedMode));
    const name = document.createElement('span'); name.textContent = mode.toUpperCase();
    const hint = document.createElement('small'); hint.textContent = modeHints[mode];
    button.append(name, hint);
    button.addEventListener('click', () => setGameMode(mode));
    modeOptions?.append(button);
  }
  menuOverlay.querySelector('#start-game')?.addEventListener('click', activate);
  menuOverlay.querySelector('#open-scores')?.addEventListener('click', openScoreboard);
}
if (boardOverlay) {
  const tabs = boardOverlay.querySelector<HTMLElement>('#board-modes');
  for (const mode of GAME_MODES) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.boardMode = mode;
    button.textContent = mode.toUpperCase();
    button.addEventListener('click', () => { scoreboardMode = mode; scoreboardPage = 0; });
    tabs?.append(button);
  }
  boardOverlay.querySelector('#close-scores')?.addEventListener('click', closeScoreboard);
}
const bestByMode: Record<GameMode, bigint> = { classic: 0n, zen: 0n, expedition: 0n };
for (const mode of GAME_MODES) {
  const saved = parseStoredScore(localStorage.getItem(`zima-skybells-best-${mode}`));
  if (saved) bestByMode[mode] = saved.score;
}
for (const run of scoreHistory) if (!run.equipped && run.score > bestByMode[run.mode]) bestByMode[run.mode] = run.score;
for (const mode of GAME_MODES) localStorage.setItem(`zima-skybells-best-${mode}`, bestByMode[mode].toString());

function bestForMode(mode: GameMode = selectedMode): bigint { return bestByMode[mode]; }
function bestEquippedForMode(mode: GameMode = selectedMode): bigint {
  return scoreHistory.filter(run => run.mode === mode && run.equipped)
    .reduce((best, run) => run.score > best ? run.score : best, 0n);
}

function bestIsApproximate(mode: GameMode = selectedMode): boolean {
  if (mode === selectedMode && !runEquipped && score === bestByMode[mode] && score > 0n) return false;
  return scoreHistory.some(run => run.mode === mode && !run.equipped && run.score === bestByMode[mode] && run.approximate);
}

function formatScore(value: bigint): string { return value.toLocaleString('en-US'); }

function tierPoints(kind: BellKind): number { return kind === 'crystal' ? 30 : kind === 'silver' ? 20 : 10; }

function awardPoints(base: number): void {
  score += BigInt(base) * BigInt(multiplier);
  if (selectedMode !== 'expedition' && score > bestByMode[selectedMode]) bestByMode[selectedMode] = score;
}

const cat = {
  x: width / 2,
  y: GROUND_Y,
  prevX: width / 2,
  prevY: GROUND_Y,
  vx: 0,
  vy: 0,
  w: 74,
  h: 70,
  facing: 1,
  landedFlash: 0,
};

let bells: Bell[] = [];
let moths: Moth[] = [];
let snow: Snow[] = [];
let stars: Star[] = [];
const keys = new Set<string>();

function rand(min = 0, max = 1): number {
  gameSeed = (gameSeed * 1664525 + 1013904223) >>> 0;
  return min + (gameSeed / 4294967296) * (max - min);
}

function themeMeta(): (typeof THEME_META)[ThemeName] {
  return THEME_META[selectedTheme];
}

function setTheme(theme: ThemeName): void {
  if (selectedTheme !== theme) releasePreparedSeason(selectedTheme);
  selectedTheme = theme;
  loadSelectedThemeArt(theme);
  refreshProgressUi();
  scarfArtCache.clear();
  companionTintCache.clear();
  localStorage.setItem('zima-skybells-theme', theme);
  rebuildBackdrop();
  prepareUpperTerrain(theme);
  resetMusicForTheme();
}

function setGameMode(mode: GameMode): void {
  selectedMode = mode;
  localStorage.setItem('zima-skybells-mode', mode);
}

function setCharacter(character: CharacterId): void {
  if (selectedCharacter !== character) {
    scarfArtCache.clear();
    companionTintCache.clear();
  }
  selectedCharacter = character;
  localStorage.setItem('zima-skybells-character', character);
}

function recordScore(): void {
  if (score <= 0n || bellCount <= 0) return;
  if (selectedMode === 'expedition' && state !== 'expeditionComplete') return;
  if (!runEquipped) {
    if (score > bestByMode[selectedMode]) bestByMode[selectedMode] = score;
    localStorage.setItem(`zima-skybells-best-${selectedMode}`, bestByMode[selectedMode].toString());
  }
  scoreHistory.push({ score, equipped: runEquipped, bounces: bellCount, multiplier,
    retries: selectedMode === 'expedition' ? expeditionRetries : undefined,
    theme: selectedTheme, mode: selectedMode, cat: selectedCharacter, at: Date.now() });
  scoreHistory.sort((a, b) => a.score === b.score ? b.at - a.at : a.score > b.score ? -1 : 1);
  const recordCounts = new Map<string, number>();
  scoreHistory = scoreHistory.filter(run => {
    const track = `${run.mode}:${run.equipped ? 'equipped' : 'standard'}`;
    const count = recordCounts.get(track) ?? 0;
    recordCounts.set(track, count + 1);
    return count < 40;
  });
  localStorage.setItem('zima-skybells-scores', JSON.stringify(scoreHistory.map(run => ({ ...run, score: run.score.toString() }))));
}

function returnToTitle(): void {
  if (state === 'playing' || state === 'falling' || state === 'zenGrounded') recordScore();
  state = 'title';
  paused = false;
  syncMasterAudio(paused);
  scoreboardOpen = false;
  keys.clear();
  inputMode = 'none';
  launchBuffer = 0;
  bounceHold = 0;
  pendingBounce = 0;
  contactAnimHold = 0;
  cameraY = 0;
  backdropCameraY = 0;
  descentBlend = 0;
  score = 0n;
  bellCount = 0;
  mothCount = 0;
  multiplier = 1;
  expeditionStage = 0;
  expeditionCheckpointY = 0;
  expeditionFootholdY = 0;
  expeditionFootholdX = 0;
  expeditionRetries = 0;
  expeditionEndingAt = 0;
  message = '';
  messageTimer = 0;
  cat.x = width / 2;
  cat.prevX = cat.x;
  cat.y = GROUND_Y;
  cat.prevY = GROUND_Y;
  cat.vx = 0;
  cat.vy = 0;
  groundMarks = [];
  groundTravel = 0;
  nextGroundStep = 38;
  setAnimState('idle');
}

function pointInRect(x: number, y: number, r: Rect | null): boolean {
  return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function seasonStroke(): string {
  return selectedTheme === 'winter' ? '#eff9ff' : selectedTheme === 'spring' ? '#ffffff' : selectedTheme === 'summer' ? '#fff6cc' : '#fff0cf';
}

function seasonPanelFill(alpha = 0.50): string {
  const a = alpha.toFixed(2);
  if (selectedTheme === 'winter') return `rgba(5,19,32,${a})`;
  if (selectedTheme === 'spring') return `rgba(29,67,73,${a})`;
  if (selectedTheme === 'summer') return `rgba(58,72,22,${a})`;
  return `rgba(64,35,18,${a})`;
}


function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  width = Math.max(640, window.innerWidth);
  height = Math.max(480, window.innerHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundFrontCache = null;
  if (!pointerActive) mouseX = width / 2;
  rebuildBackdrop();
  if (state === 'title') {
    cat.x = width / 2;
    cat.y = GROUND_Y;
  }
}

function rebuildBackdrop(): void {
  const starCount = selectedTheme === 'winter' ? Math.floor((width * height) / 7500) : selectedTheme === 'summer' ? Math.floor((width * height) / 22000) : Math.floor((width * height) / 18000);
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.65,
    r: Math.random() * 1.7 + 0.35,
    twinkle: Math.random() * TAU,
    alpha: Math.random() * 0.5 + 0.2,
  }));
  const particleCount = Math.floor((width * height) / (selectedTheme === 'spring' ? 5200 : selectedTheme === 'autumn' ? 5600 : selectedTheme === 'summer' ? 7200 : 6800));
  snow = Array.from({ length: particleCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 0.8,
    speed: selectedTheme === 'winter' ? Math.random() * 26 + 14 : selectedTheme === 'spring' ? Math.random() * 120 + 90 : selectedTheme === 'summer' ? Math.random() * 18 + 8 : Math.random() * 60 + 34,
    drift: selectedTheme === 'winter' ? Math.random() * 20 + 8 : selectedTheme === 'spring' ? Math.random() * 10 + 3 : selectedTheme === 'summer' ? Math.random() * 30 + 12 : Math.random() * 38 + 16,
    phase: Math.random() * TAU,
    alpha: Math.random() * 0.45 + 0.18,
  }));
}

function setReadyState(): void {
  state = 'ready';
  score = 0n;
  bellCount = 0;
  mothCount = 0;
  multiplier = 1;
  expeditionStage = 0;
  expeditionCheckpointY = 0;
  expeditionFootholdY = 0;
  expeditionFootholdX = 0;
  expeditionRetries = 0;
  expeditionEndingAt = 0;
  animState = 'idle';
  animStateTime = 0;
  contactAnimHold = 0;
  cameraShake = 0;
  nextBonusBell = 18;
  bounceHold = 0;
  fieldDrop = 0;
  bounceChain = 0;
  pendingBounce = 0;
  paused = false;
  syncMasterAudio(paused);
  highestY = 0;
  descentPeakY = GROUND_Y;
  descentBlend = 0;
  cameraY = 0;
  backdropCameraY = 0;
  message = '';
  messageTimer = 0;
  launchBuffer = 0;
  cat.x = width / 2;
  cat.prevX = cat.x;
  cat.y = GROUND_Y;
  cat.prevY = cat.y;
  cat.vx = 0;
  cat.vy = 0;
  cat.facing = 1;
  turnFrom = 1;
  turnTime = TURN_DURATION;
  cat.landedFlash = 0;
  bells = [];
  moths = [];
  sparks = [];
  groundMarks = [];
  groundTravel = 0;
  nextGroundStep = 38;
  groundStepSide = 1;
  generateInitialPath();
}

function resetGame(): void {
  gameSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  startProgressRun();
  setReadyState();
}

function launchRun(): void {
  if (state !== 'ready' && state !== 'zenGrounded' && state !== 'expeditionCheckpoint') return;
  beginLaunchProgress();
  state = 'playing';
  const firstBell = bells.find(b => !b.touched && bellTop(b) > cat.y + 70);
  cat.vy = firstBell ? jumpVelocityFor(cat.y, cat.x, firstBell) : PHYS.firstBounce;
  if (runCampBoost) cat.vy = Math.min(1600, cat.vy + 80);
  cat.prevY = cat.y;
  descentPeakY = cat.y;
  setAnimState('launch');
  ensureAudio();
  resumeAudioContext();
  ping(523.25, 0.05, 0.10, 'sine');
}

function worldToScreenY(worldY: number): number {
  return height - 84 - (worldY - cameraY);
}

function addSparkBurst(x: number, y: number, count: number, color: string): void {
  for (let i = 0; i < count; i++) {
    const ang = rand(0, TAU);
    const speed = rand(40, 150);
    sparks.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed + rand(10, 40),
      ttl: rand(0.35, 0.6),
      life: 0,
      size: rand(2, 5),
      color,
      kind: 'spark',
      spin: rand(-4, 4),
    });
  }
}

function addSeasonBurst(x: number, y: number, intensity = 1): void {
  const count = Math.round(8 * intensity);
  for (let i = 0; i < count; i++) {
    const ang = rand(-0.15 * Math.PI, 1.15 * Math.PI);
    const speed = rand(55, 170) * intensity;
    let kind: SparkKind = 'spark';
    let color = '#ffffff';
    if (selectedTheme === 'winter') { kind = 'snow'; color = i % 3 === 0 ? '#d8f5ff' : '#ffffff'; }
    else if (selectedTheme === 'spring') { kind = i % 3 === 0 ? 'droplet' : 'petal'; color = kind === 'droplet' ? '#8ddcff' : (i % 2 ? '#ffd0e8' : '#ffffff'); }
    else if (selectedTheme === 'summer') { kind = 'pollen'; color = i % 3 === 0 ? '#fff7b8' : '#ffd75c'; }
    else { kind = 'leaf'; color = ['#d94f2e','#ef8b35','#f1b548','#9d5b2b'][i % 4]; }
    sparks.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed + rand(25, 75),
      ttl: rand(0.45, 0.95),
      life: 0,
      size: rand(2.5, 6.5),
      color,
      kind,
      spin: rand(-6, 6),
    });
  }
}

function emitGroundStep(): void {
  const side = groundStepSide;
  groundStepSide *= -1;
  const x = cat.x + side * 17;
  groundMarks.push({ x, age: 0, life: selectedTheme === 'winter' ? 4 : 2.6, side, theme: selectedTheme });
  if (groundMarks.length > 40) groundMarks.shift();
  const kind: SparkKind = selectedTheme === 'winter' ? 'snow' : selectedTheme === 'spring' ? 'droplet' : selectedTheme === 'summer' ? 'pollen' : 'leaf';
  const color = selectedTheme === 'winter' ? '#eaf7ff' : selectedTheme === 'spring' ? '#a9e6bb' : selectedTheme === 'summer' ? '#ffe39a' : '#eaa151';
  for (let i = 0; i < 3; i++) sparks.push({
    x, y: GROUND_Y + 3, vx: rand(-36, 36), vy: rand(15, 58),
    ttl: rand(0.35, 0.7), life: 0, size: rand(1.3, 3), color, kind, spin: rand(-3, 3),
  });
}

function updateGroundTravel(distance: number): void {
  if (distance < 0.25) return;
  groundTravel += distance;
  while (groundTravel >= nextGroundStep) {
    emitGroundStep();
    nextGroundStep += 38;
  }
}

function updateEffects(dt: number): void {
  for (const mark of groundMarks) mark.age += dt;
  groundMarks = groundMarks.filter(mark => mark.age < mark.life);
  for (const s of sparks) {
    s.ttl -= dt;
    s.life += dt;
    s.x += s.vx * dt;
    s.y -= s.vy * dt;
    const gravity = s.kind === 'snow' || s.kind === 'pollen' ? 70 : s.kind === 'leaf' || s.kind === 'petal' ? 120 : 200;
    s.vy -= gravity * dt;
    if (s.kind === 'leaf' || s.kind === 'petal' || s.kind === 'snow') s.vx += Math.sin((s.life * 8) + s.spin) * 14 * dt;
  }
  sparks = sparks.filter(s => s.ttl > 0);
}

function setAnimState(next: AnimState): void {
  if (animState === next) return;
  animState = next;
  animStateTime = 0;
}

function updateAnimState(dt: number): void {
  animStateTime += dt;
  if (state === 'title') { setAnimState('idle'); return; }
  if (state === 'gameover' || state === 'zenGrounded' || state === 'expeditionCheckpoint' || state === 'expeditionComplete') {
    if ((state === 'zenGrounded' || state === 'expeditionCheckpoint') && launchBuffer > 0) {
      setAnimState('crouch');
      return;
    }
    if (animState === 'groundLand' && animStateTime < 0.25) return;
    if ((state === 'zenGrounded' || state === 'expeditionCheckpoint') && Math.abs(cat.vx) > 38) setAnimState('walk');
    else setAnimState('idle');
    return;
  }
  if (contactAnimHold > 0) {
    contactAnimHold = Math.max(0, contactAnimHold - dt);
    return;
  }
  if (state === 'ready') {
    if (launchBuffer > 0) setAnimState('crouch');
    else if (animState === 'walk' ? Math.abs(cat.vx) > 14 : Math.abs(cat.vx) > 38) setAnimState('walk');
    else setAnimState('idle');
    return;
  }
  if (cat.landedFlash > 0.01) { setAnimState('land'); return; }
  if (cat.vy > 620) setAnimState('launch');
  else if (cat.vy > 170) setAnimState('rise');
  else if (cat.vy > -120) setAnimState('apex');
  else setAnimState('fall');
}

function togglePause(): void {
  if (state !== 'playing' && state !== 'ready') return;
  paused = !paused;
  syncMasterAudio(paused);
  if (!paused) resumeMusicClock();
}

function currentMusicContext(): MusicContext {
  return {
    theme: selectedTheme,
    altitude: cameraY,
    verticalVelocity: cat.vy,
    state,
    descentDistance: descentPeakY - cat.y,
    viewportHeight: height,
    chapter: chapterBandAt(cameraY),
  };
}

function update(dt: number): void {
  if (scoreboardOpen) { if (!paused) updateMusic(currentMusicContext()); return; }
  if (!paused) updateProgressEffects(dt);
  elapsed += dt;
  updateSnow(dt);
  if (!paused) updateMusic(currentMusicContext());
  if (messageTimer > 0) messageTimer -= dt;
  if (cat.landedFlash > 0) cat.landedFlash -= dt;
  updateEffects(dt);
  if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - dt);
  if (state === 'playing' && !paused) {
    const fallSpeed = 86 + Math.min(110, bellCount * 0.65);
    fieldDrop += fallSpeed * dt;
  }

  if (paused) return;
  if (launchBuffer > 0) {
    launchBuffer = Math.max(0, launchBuffer - dt);
    if (launchBuffer === 0) launchRun();
  }
  updateAnimState(dt);
  if (state === 'title' || state === 'gameover' || state === 'expeditionComplete') return;

  cat.prevX = cat.x;
  cat.prevY = cat.y;

  let desired = 0;
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  if (left || right) inputMode = 'keyboard';
  if (left !== right) {
    desired = left ? -PHYS.maxSpeed : PHYS.maxSpeed;
  } else if (inputMode === 'mouse' && pointerActive) {
    const dx = mouseX - cat.x;
    desired = Math.max(-PHYS.maxSpeed, Math.min(PHYS.maxSpeed, dx * 6.5));
    if (Math.abs(dx) < 18) desired = 0;
  }

  if (progress.movement === 'windstep') desired *= 1.08;
  if (progress.movement === 'softstep' && (keys.has('ShiftLeft') || keys.has('ShiftRight'))) desired *= 0.45;
  if (runEchoTime > 0) desired *= 1.14;
  cat.vx = desired;
  if (Math.abs(cat.vx) > 42) {
    const nextFacing = cat.vx >= 0 ? 1 : -1;
    if (nextFacing !== cat.facing) {
      turnFrom = turnTime < TURN_DURATION / 2 ? turnFrom : cat.facing;
      cat.facing = nextFacing;
      turnTime = turnFrom === nextFacing ? TURN_DURATION : 0;
    }
  }
  turnTime = Math.min(TURN_DURATION, turnTime + dt);

  if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') {
    cat.y = state === 'expeditionCheckpoint' ? expeditionCheckpointY : GROUND_Y;
    cat.x += cat.vx * dt;
    const halfW = CAT_EDGE_MARGIN;
    if (cat.x < halfW) cat.x = halfW;
    if (cat.x > width - halfW) cat.x = width - halfW;
    if (cat.y === GROUND_Y) updateGroundTravel(Math.abs(cat.x - cat.prevX));
    return;
  }

  highestY = Math.max(highestY, cat.y);
  if (state === 'playing') updateAltitudeRewards();
  if (state === 'playing' && cat.vy >= 0) descentPeakY = cat.y;

  if (bounceHold > 0) {
    bounceHold = Math.max(0, bounceHold - dt);
    cat.vy = 0;
    cat.x += cat.vx * dt * 0.25;
    if (bounceHold <= 0 && pendingBounce > 0) {
      cat.vy = pendingBounce;
      pendingBounce = 0;
      cat.landedFlash = 0;
      if (contactAnimHold <= 0) setAnimState('launch');
    } else {
      const holdCamera = Math.max(0, cat.y - height * 0.43);
      cameraY += (holdCamera - cameraY) * Math.min(1, dt * 7.0);
      extendPath();
      return;
    }
  }

  const sustainedDescent = (state === 'falling' || state === 'playing'
    && cat.vy < 0 && cat.y < descentPeakY - height * 0.43 - 150);
  descentBlend = sustainedDescent ? Math.min(1, descentBlend + dt / 0.65)
    : Math.max(0, descentBlend - dt * 4);
  const fallCap = 1900 + (descentSpeedLimit(cat.y) - 1900) * chapterEase(descentBlend);
  cat.vy = Math.max(-fallCap * (runSoftfallTime > 0 ? 0.92 : 1), cat.vy + PHYS.gravity * dt);
  cat.x += cat.vx * dt;
  cat.y += cat.vy * dt;
  highestY = Math.max(highestY, cat.y);

  const halfW = CAT_EDGE_MARGIN;
  if (cat.x < halfW) { cat.x = halfW; cat.vx = 0; }
  if (cat.x > width - halfW) { cat.x = width - halfW; cat.vx = 0; }

  if (state === 'playing') {
    checkBellContacts();
    checkMoths();
    updateCrates();
    if (selectedMode === 'expedition') {
      advanceExpedition();
      if ((state as GameState) === 'expeditionComplete') return;
    }

    const targetCamera = Math.max(0, cat.y - height * 0.43);
    cameraY += (targetCamera - cameraY) * Math.min(1, dt * (sustainedDescent ? 7.5 : 7.0));
    keepRisingCatVisible();
    extendPath();

    if (selectedMode === 'classic' && cat.y <= GROUND_Y) {
      cat.y = GROUND_Y;
      cat.vy = 0;
      cameraY = 0;
      if (!tryCatBedRescue()) finishGame();
      return;
    }
    if (selectedMode === 'expedition' && cat.y <= expeditionCheckpointY) {
      settleExpeditionCheckpoint();
      return;
    }
    if (selectedMode !== 'zen' && cat.y < descentPeakY - height * 0.43 - 150 && cat.vy < 0) beginLongFall();
    if (cat.vy < 0) keepFallingCatVisible();
    if (selectedMode === 'zen' && cat.y <= GROUND_Y) {
      settleZenGround();
    }
  } else if (state === 'falling') {
    const previousContacts = bellCount + mothCount;
    checkBellContacts();
    checkMoths();
    updateCrates();
    if (bellCount + mothCount > previousContacts) {
      state = 'playing';
      descentPeakY = cat.y;
      message = '';
      messageTimer = 0;
      extendPath();
      return;
    }
    const targetCamera = Math.max(0, cat.y - height * 0.43);
    cameraY += (targetCamera - cameraY) * Math.min(1, dt * 7.5);
    keepFallingCatVisible();
    if (selectedMode === 'expedition' && cat.y <= expeditionCheckpointY) {
      settleExpeditionCheckpoint();
      return;
    }
    if (cat.y <= GROUND_Y) {
      cat.y = GROUND_Y;
      cat.vy = 0;
      cameraY = 0;
      if (!tryCatBedRescue()) finishGame();
    }
  }
}

function updateSnow(dt: number): void {
  for (const s of snow) {
    s.phase += dt * (selectedTheme === 'summer' ? 1.3 : 0.6);
    s.y += s.speed * dt;
    s.x += Math.sin(s.phase) * s.drift * dt;
    if (selectedTheme === 'spring') s.x -= 20 * dt;
    if (selectedTheme === 'autumn') s.x += Math.sin(s.phase * 1.6) * 18 * dt;
    if (s.y > height + 12 || s.x < -20 || s.x > width + 20) { s.y = -12; s.x = Math.random() * width; }
  }
  if (state === 'playing' || state === 'falling') {
    for (const m of moths) {
      if (!m.alive) continue;
      const sy = worldToScreenY(mothWorldY(m));
      // Choose an intercept altitude once, before the bird enters. Keeping it
      // fixed in world space lets a falling cat meet it by steering; a lane
      // tied to cameraY follows the cat and appears to dodge contact.
      if (m.flightWorldY === undefined) {
        if (sy < height * 0.10 || sy > height * 0.90) continue;
        // Enter from the closer edge, giving the player time to steer toward
        // a visible crossing instead of watching the target pass far away.
        const direction = cat.x <= width * 0.5 ? 1 : -1;
        const speed = Math.abs(m.vx);
        m.vx = speed * direction;
        m.x = direction > 0 ? -speed * 0.25 - 70 : width + speed * 0.25 + 70;
        m.prevX = m.x;
        const timeToCatX = Math.min(1.1, Math.abs(cat.x - m.x) / speed);
        const fallEndVelocity = Math.max(-descentSpeedLimit(cat.y),
          cat.vy + PHYS.gravity * timeToCatX);
        const projectedTravel = cat.vy >= 0
          ? Math.min(900, cat.vy) * timeToCatX * 0.7
          : (cat.vy + fallEndVelocity) * 0.5 * timeToCatX;
        m.flightWorldY = Math.max(GROUND_Y + 80,
          cat.y + cat.h * 0.48 + projectedTravel);
      }
      m.y = m.flightWorldY + fieldDrop;
      m.prevX = m.x;
      m.phase += dt * 7;
      m.x += m.vx * dt;
      const warningDistance = Math.abs(m.vx) * 0.45;
      const entering = m.vx > 0 ? m.x >= -warningDistance : m.x <= width + warningDistance;
      if (!m.warned && entering) {
        m.warned = true;
        const cueScreenY = Math.max(148, Math.min(height - 80, worldToScreenY(mothWorldY(m))));
        const cueWorldY = cameraY + height - 84 - cueScreenY;
        addSparkBurst(m.vx > 0 ? 85 : width - 85, cueWorldY, 10, themeMeta().accent);
        ping(620, 0.014, 0.11, 'sine');
      }
      if ((m.vx > 0 && m.x > width + 110) || (m.vx < 0 && m.x < -110)) m.alive = false;
    }
  }
}


function draw(): void {
  // Ascending scenery advances with the camera. On a reversal it holds until
  // the camera has moved far enough to represent a real descent, then follows
  // continuously. The allowed gap tapers to zero at ground level.
  // Bell arcs can retreat by more than one screen before the next contact.
  // Keep the landscape steady through those arcs; a real downward traversal
  // eventually exceeds this gap and then moves the whole backdrop together.
  const descentGap = Math.min(height * 2.0, cameraY * 0.50);
  backdropCameraY = Math.max(cameraY, Math.min(backdropCameraY, cameraY + descentGap));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (cameraShake > 0) {
    const mag = cameraShake * 22;
    ctx.translate(Math.sin(elapsed * 73) * mag, Math.cos(elapsed * 91) * mag * 0.55);
  }
  const scene = sceneAssets[selectedTheme];
  if (scene) {
    if (continuousSeasonReady(selectedTheme)) {
      ctx.fillStyle = SEASON_SKY_COLOR[selectedTheme];
      ctx.fillRect(0, 0, width, height);
      if (selectedTheme === 'winter') drawWinterContinuousWorld();
      else drawSeasonContinuousWorld(selectedTheme);
      drawSceneGround(scene);
      drawSceneProp(scene);
    } else {
      drawSceneBackdrop(scene);
      drawClimbChapters();
      // Keep the previous painted planes available if an extended asset fails.
      drawSceneLayer(scene.far, 1 - chapterEase((backdropCameraY - 2450) / 1200));
      drawSceneLayer(scene.mid);
      drawNearSceneLayer(scene.near);
      drawSceneGround(scene);
      drawSceneProp(scene);
    }
  } else {
    // Failed scenery loads keep a painted local fallback, not a different
    // geometric landscape that breaks the game's visual language.
    ctx.fillStyle = selectedTheme === 'winter' ? '#071b35' : selectedTheme === 'spring' ? '#a6c9e4' : selectedTheme === 'summer' ? '#75bce8' : '#5c3043';
    ctx.fillRect(0, 0, width, height);
    drawPaintedBackdrop();
    drawPaintedGround(worldToScreenY(GROUND_Y));
    drawClimbChapters();
  }
  if (state === 'title') {
    drawGroundCatScene();
    if (scene) drawSceneFront(scene);
    if (!menuOverlay) drawTitle();
  } else {
    drawGroundMarks();
    if (selectedMode === 'expedition') {
      if (expeditionFootholdY > GROUND_Y) drawUpperFoothold(expeditionFootholdX, worldToScreenY(expeditionFootholdY));
      if (state === 'expeditionComplete') drawUpperFoothold(cat.x, worldToScreenY(cat.y));
    }
    drawWorld();
    if (scene) drawSceneFront(scene);
    if (state !== 'gameover' && state !== 'expeditionComplete') drawHUD();
    if (state === 'ready') drawReady();
    if (state === 'zenGrounded') drawZenGrounded();
    if (state === 'expeditionCheckpoint') drawExpeditionCheckpoint();
    if (paused) drawPaused();
    if (state === 'gameover') drawGameOver();
    if (state === 'expeditionComplete') drawExpeditionComplete();
  }
  drawSnow();
  if (scoreboardOpen && !boardOverlay) drawScoreboard();
}

function drawWorld(): void {
  for (let index = firstBellAtOrAbove(cameraY - 200); index < bells.length; index++) {
    const bell = bells[index];
    if (bellWorldY(bell) > cameraY + height + 100) break;
    const y = worldToScreenY(bellWorldY(bell));
    if (y < -80 || y > height + 100) continue;
    drawBell(bell.x, y, bell, elapsed);
  }
  for (const moth of moths) {
    if (!moth.alive) continue;
    const y = worldToScreenY(mothWorldY(moth));
    const outside = moth.vx > 0 ? -moth.x : moth.x - width;
    const warningDistance = Math.abs(moth.vx) * 0.45;
    const art = interactionAssets[selectedTheme];
    if (art && moth.warned && outside > 0 && outside < warningDistance && y < height + 80) {
      ctx.save();
      ctx.globalAlpha = 0.42 * outside / warningDistance;
      drawAirborneSprite(moth.vx > 0 ? 85 : width - 85, Math.max(148, y), moth.phase, moth.vx, moth.kind, art.airborne, 66);
      ctx.restore();
    }
    if (y < -80 || y > height + 80) continue;
    drawMoth(moth.x, y + Math.sin(moth.phase) * 6, moth.phase, moth.vx, moth.kind);
  }
  drawCrates();
  drawEffects();
  if (cameraY < 90 && !sceneAssets[selectedTheme]) drawLaunchPad(cat.x, worldToScreenY(GROUND_Y) + 2);
  drawProgressEffects();
  drawCat(cat.x, worldToScreenY(cat.y), cat.vx, cat.vy);
}

function drawGroundCatScene(): void {
  if (!sceneAssets[selectedTheme]) drawLaunchPad(width / 2, worldToScreenY(GROUND_Y) + 2);
  drawCat(width / 2, worldToScreenY(GROUND_Y), 0, 0);
}

function drawLaunchPad(x: number, y: number): void {
  ctx.save();
  const gx = x;
  const gy = y + 2;
  if (selectedTheme === 'winter') {
    const g = ctx.createRadialGradient(gx, gy + 2, 10, gx, gy + 2, 90);
    g.addColorStop(0, 'rgba(252,254,255,.98)');
    g.addColorStop(0.62, 'rgba(215,233,244,.92)');
    g.addColorStop(1, 'rgba(150,188,208,.68)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(gx, gy + 12, 94, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(gx - 24, gy + 9, 24, 6, -0.18, 0, TAU); ctx.ellipse(gx + 24, gy + 13, 22, 5, 0.14, 0, TAU); ctx.fill();
  } else if (selectedTheme === 'spring') {
    ctx.fillStyle = 'rgba(139,207,119,.95)';
    ctx.beginPath(); ctx.ellipse(gx, gy + 12, 94, 23, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(171,225,246,.52)'; ctx.beginPath(); ctx.ellipse(gx - 18, gy + 12, 32, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd1ea';
    for (let i = 0; i < 8; i++) { const px = gx - 48 + i * 13; const py = gy + 2 + (i % 3) * 3; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill(); }
  } else if (selectedTheme === 'summer') {
    ctx.fillStyle = 'rgba(145,200,86,.96)';
    ctx.beginPath(); ctx.ellipse(gx, gy + 14, 96, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4d56d';
    for (let i = 0; i < 6; i++) { const px = gx - 42 + i * 17; const py = gy + 5 + Math.sin(i) * 2; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(245,239,192,.30)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy + 11, 72, Math.PI * 0.15, Math.PI * 0.9); ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(207,127,55,.94)';
    ctx.beginPath(); ctx.ellipse(gx, gy + 14, 96, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d58b41';
    for (let i = 0; i < 8; i++) { const px = gx - 44 + i * 13; const py = gy + 7 + (i % 2) * 2; ctx.beginPath(); ctx.ellipse(px, py, 8, 3, Math.sin(i), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7b5624'; ctx.beginPath(); ctx.arc(gx + 24, gy + 2, 7, 0, TAU); ctx.fill();
  }
  ctx.restore();
}



function drawEffects(): void {
  ctx.save();
  for (const s of sparks) {
    const alpha = Math.max(0, Math.min(1, s.ttl / 0.35));
    const sy = worldToScreenY(s.y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.strokeStyle = s.color;
    ctx.translate(s.x, sy);
    ctx.rotate(s.life * s.spin);
    if (s.kind === 'snow') {
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-s.size, 0); ctx.lineTo(s.size, 0); ctx.stroke(); }
    } else if (s.kind === 'petal') {
      ctx.beginPath(); ctx.ellipse(0, 0, s.size * 1.25, s.size * 0.62, 0.25, 0, TAU); ctx.fill();
    } else if (s.kind === 'droplet') {
      ctx.beginPath(); ctx.moveTo(0, -s.size * 1.4); ctx.bezierCurveTo(s.size, -s.size * 0.3, s.size, s.size, 0, s.size * 1.25); ctx.bezierCurveTo(-s.size, s.size, -s.size, -s.size * 0.3, 0, -s.size * 1.4); ctx.fill();
    } else if (s.kind === 'pollen') {
      ctx.beginPath(); ctx.arc(0, 0, s.size * 0.72, 0, TAU); ctx.fill();
      ctx.globalAlpha *= 0.35; ctx.beginPath(); ctx.arc(0, 0, s.size * 1.8, 0, TAU); ctx.fill();
    } else if (s.kind === 'leaf') {
      ctx.beginPath(); ctx.moveTo(0, -s.size * 1.4); ctx.quadraticCurveTo(s.size * 1.1, -s.size * 0.2, 0, s.size * 1.4); ctx.quadraticCurveTo(-s.size * 1.1, -s.size * 0.2, 0, -s.size * 1.4); ctx.fill();
      ctx.strokeStyle = 'rgba(100,55,22,.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s.size); ctx.lineTo(0, s.size); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, s.size, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawSnow(): void {
  ctx.save();
  for (const s of snow) {
    ctx.globalAlpha = s.alpha;
    if (selectedTheme === 'winter') {
      ctx.fillStyle = '#effbff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    } else if (selectedTheme === 'spring') {
      ctx.strokeStyle = 'rgba(205,232,255,.70)';
      ctx.lineWidth = Math.max(1, s.r * 0.8);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.drift * 0.16, s.y + s.speed * 0.12); ctx.stroke();
      if ((s.phase * 10) % 9 < 1.8) { ctx.fillStyle = 'rgba(255,221,238,.55)'; ctx.beginPath(); ctx.arc(s.x + 2, s.y + 1, Math.max(1.5, s.r*0.7), 0, TAU); ctx.fill(); }
    } else if (selectedTheme === 'summer') {
      ctx.fillStyle = 'rgba(255,245,165,.72)';
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 1.3, s.r * 0.7, s.phase, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = ['#f5b14c','#c84d2d','#d8a53e','#9f6b2e'][Math.floor((s.phase / TAU) * 4) % 4];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.r * 1.6);
      ctx.quadraticCurveTo(s.x + s.r * 1.6, s.y - s.r * 0.4, s.x + s.r, s.y + s.r * 1.5);
      ctx.quadraticCurveTo(s.x, s.y + s.r * 0.9, s.x - s.r, s.y + s.r * 1.5);
      ctx.quadraticCurveTo(s.x - s.r * 1.6, s.y - s.r * 0.4, s.x, s.y - s.r * 1.6);
      ctx.fill();
    }
  }
  ctx.restore();
}


function queueLaunch(): void {
  if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') {
    launchBuffer = 0.12;
  }
}

function activate(): void {
  if (state === 'title' || state === 'gameover' || state === 'expeditionComplete') {
    if (selectedArtLoading()) return;
    resetGame();
    return;
  }
  if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') {
    queueLaunch();
    return;
  }
  ensureAudio();
  resumeAudioContext();
}

window.addEventListener('resize', resize);
canvas.addEventListener('pointermove', e => { mouseX = e.clientX; pointerActive = true; inputMode = 'mouse'; });
canvas.addEventListener('pointerleave', () => { pointerActive = false; if (inputMode === 'mouse') inputMode = 'none'; });
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (scoreboardOpen) {
    const tab = scoreboardModeRects.find(item => pointInRect(e.clientX, e.clientY, item.rect));
    if (tab) { scoreboardMode = tab.mode; scoreboardPage = 0; return; }
    if (pointInRect(e.clientX, e.clientY, scoreboardPrevRect)) { scoreboardPage = Math.max(0, scoreboardPage - 1); return; }
    if (pointInRect(e.clientX, e.clientY, scoreboardNextRect)) { scoreboardPage = Math.min(scoreboardPageCount - 1, scoreboardPage + 1); return; }
    scoreboardOpen = false;
    return;
  }
  mouseX = e.clientX;
  if (state !== 'title' && pointInRect(e.clientX, e.clientY, menuRect)) {
    if (state === 'gameover' || state === 'expeditionComplete') returnToTitle();
    else openProgressDialog('settings-overlay');
    return;
  }
  if (state === 'title') {
    const x = e.clientX;
    const y = e.clientY;
    for (const card of themeCardRects) {
      if (pointInRect(x, y, card.rect)) { setTheme(card.theme); return; }
    }
    for (const card of modeCardRects) {
      if (pointInRect(x, y, card.rect)) { setGameMode(card.mode); return; }
    }
    if (pointInRect(x, y, titleStartRect)) { activate(); return; }
  }
  if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') queueLaunch();
  else activate();
});
window.addEventListener('keydown', e => {
  const inUi = (e.target as Element | null)?.closest?.('.ui-overlay');
  if (e.code === 'Escape') { e.preventDefault(); if (scoreboardOpen) closeScoreboard(); else returnToTitle(); return; }
  if (scoreboardOpen && e.code === 'Tab' && boardOverlay) {
    const controls = Array.from(boardOverlay.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
    if (controls.length) {
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); return; }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); return; }
    }
  }
  if (inUi && e.code !== 'KeyL') return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyL') {
    if (scoreboardOpen) closeScoreboard(); else openScoreboard();
    return;
  }
  if (scoreboardOpen) {
    if (e.code === 'ArrowDown' || e.code === 'PageDown') scoreboardPage = Math.min(scoreboardPageCount - 1, scoreboardPage + 1);
    if (e.code === 'ArrowUp' || e.code === 'PageUp') scoreboardPage = Math.max(0, scoreboardPage - 1);
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      const index = GAME_MODES.indexOf(scoreboardMode);
      scoreboardMode = GAME_MODES[(index + (e.code === 'ArrowRight' ? 1 : GAME_MODES.length - 1)) % GAME_MODES.length];
      scoreboardPage = 0;
    }
    return;
  }
  keys.add(e.code);
  if (e.code === 'KeyP') { togglePause(); return; }
  if (e.code === 'KeyM') { toggleMute(paused); return; }
  if (e.code === 'KeyR') { if (state === 'playing' || state === 'falling' || state === 'zenGrounded') recordScore(); resetGame(); return; }
  if (state === 'title') {
    let idx = THEME_ORDER.indexOf(selectedTheme);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { idx = (idx + THEME_ORDER.length - 1) % THEME_ORDER.length; setTheme(THEME_ORDER[idx]); return; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { idx = (idx + 1) % THEME_ORDER.length; setTheme(THEME_ORDER[idx]); return; }
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
      const index = GAME_MODES.indexOf(selectedMode);
      const delta = e.code === 'ArrowUp' || e.code === 'KeyW' ? GAME_MODES.length - 1 : 1;
      setGameMode(GAME_MODES[(index + delta) % GAME_MODES.length]); return;
    }
    if (['Space', 'Enter'].includes(e.code)) { activate(); return; }
  }
  if (paused) return;
  if (['Space', 'Enter'].includes(e.code)) {
    activate();
  }
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (!keys.has('ArrowLeft') && !keys.has('ArrowRight') && !keys.has('KeyA') && !keys.has('KeyD')) {
    if (inputMode === 'keyboard') inputMode = 'none';
  }
});

function frame(now: number): void {
  const dt = Math.min(1 / 45, Math.max(0, (now - last) / 1000));
  last = now;
  update(dt);
  draw();
  syncDomUi();
  requestAnimationFrame(frame);
}

resize();
initProgressionUi();
requestAnimationFrame(frame);
