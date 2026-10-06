// Seasonal upper realms use paintings derived from the existing scenery.
// A climb reveals them slowly; no procedural terrain or prop silhouettes are drawn.
const CHAPTER_START = 650;
const CHAPTER_SPAN = 1900;

type ChapterBand = { name: string; near: string; light: string };
const CHAPTER_BANDS: Record<ThemeName, [ChapterBand, ChapterBand, ChapterBand]> = {
  winter: [
    { name: 'Icefall Ridge', near: '#183b5b', light: '#b8eeff' },
    { name: 'Aurora Heights', near: '#233958', light: '#a7f9e3' },
    { name: 'Observatory Summit', near: '#203b52', light: '#ffe4aa' },
  ],
  spring: [
    { name: 'Blossom Orchard', near: '#4d927d', light: '#ffe1ed' },
    { name: 'Misty River', near: '#508f91', light: '#f5ffff' },
    { name: 'Cloud Garden', near: '#6fa79b', light: '#fff0f9' },
  ],
  summer: [
    { name: 'Sunlit Terraces', near: '#4b8754', light: '#fff4b3' },
    { name: 'Balloon Meadows', near: '#51916b', light: '#fff6c6' },
    { name: 'High Cloudbanks', near: '#5e9c8b', light: '#fff9e6' },
  ],
  autumn: [
    { name: 'Maple Ridge', near: '#703f40', light: '#ffd29a' },
    { name: 'Migration Sky', near: '#573c58', light: '#ffcfaa' },
    { name: 'Lantern Dusk', near: '#40334f', light: '#ffd895' },
  ],
  'starlight-eve': [
    { name: 'Harbor Lights', near: '#243e63', light: '#d8efff' },
    { name: 'Aurora Lighthouse', near: '#293b67', light: '#a7eaff' },
    { name: 'Astral Harbor', near: '#202b53', light: '#ffe7ba' },
  ],
  'great-egg-hunt': [
    { name: 'Hedge Maze', near: '#538c71', light: '#ffe0dc' },
    { name: 'Glasshouse Heights', near: '#699b92', light: '#f7f0d5' },
    { name: 'Cloud Conservatory', near: '#789fae', light: '#fff0ef' },
  ],
  'fireworks-fair': [
    { name: 'Festival Pier', near: '#3a7094', light: '#ffe3a4' },
    { name: 'Lighthouse Cliffs', near: '#315f94', light: '#fff1c0' },
    { name: 'Firework Sky', near: '#273b78', light: '#ffe7b5' },
  ],
  'moonlit-masquerade': [
    { name: 'Oak Root Path', near: '#594761', light: '#ffcc9e' },
    { name: 'Lantern Treehouses', near: '#4d3e61', light: '#f4bdc6' },
    { name: 'Clocktower Moon', near: '#32284f', light: '#f4daae' },
  ],
};

type UpperRealmArt = { mid: HTMLImageElement; high: HTMLImageElement; bridge: HTMLImageElement; state: 'idle' | 'loading' | 'ready' | 'failed' };
const UPPER_REALM_PATHS: Record<SeasonName, { mid: string; high: string }> = {
  winter: { mid: 'assets/themes/winter/winter-mid-terrain-v2.png', high: 'assets/themes/winter/winter-high-terrain.webp' },
  spring: { mid: 'assets/themes/spring/spring-mid-terrain.webp', high: 'assets/themes/spring/spring-high-terrain.webp' },
  summer: { mid: 'assets/themes/summer/summer-mid-terrain.webp', high: 'assets/themes/summer/summer-high-terrain.webp' },
  autumn: { mid: 'assets/themes/autumn/autumn-mid-terrain.webp', high: 'assets/themes/autumn/autumn-high-terrain.webp' },
};
const UPPER_FOOTHOLD_PATHS: Record<ThemeName, string> = {
  winter: 'assets/themes/winter/upper-foothold.webp',
  spring: 'assets/themes/spring/upper-foothold.webp',
  summer: 'assets/themes/summer/upper-foothold.webp',
  autumn: 'assets/themes/autumn/upper-foothold.webp',
  'starlight-eve': 'assets/themes/starlight-eve/foothold.png',
  'great-egg-hunt': 'assets/themes/great-egg-hunt/foothold.png',
  'fireworks-fair': 'assets/themes/fireworks-fair/foothold.png',
  'moonlit-masquerade': 'assets/themes/moonlit-masquerade/foothold.png',
};
const upperRealmArt = {} as Record<ThemeName, UpperRealmArt>;
const upperFootholdArt = {} as Record<ThemeName, HTMLImageElement>;
const winterContinuousWorld = new Image();
const winterUpperSky = new Image();
const winterStarfield = new Image();
let preparedWinterWorld: HTMLCanvasElement | null = null;
let preparedWinterUpperSky: HTMLCanvasElement | null = null;
let preparedWinterStarfield: HTMLCanvasElement | null = null;
let winterSkyWisps: HTMLCanvasElement[] | null = null;
const WINTER_PAINTING_WORLD_SPAN = 14000;

type SeasonContinuousArt = {
  world: HTMLImageElement; upper: HTMLImageElement; starfield: HTMLImageElement;
  preparedWorld: HTMLCanvasElement | null; preparedUpper: HTMLCanvasElement | null;
  preparedStarfield: HTMLCanvasElement | null; wisps: HTMLCanvasElement[] | null;
};
const SEASON_SKY_COLOR: Record<ThemeName, string> = {
  winter: '#081e40', spring: '#3446a6', summer: '#76b7f5', autumn: '#231838',
  'starlight-eve': '#111b40', 'great-egg-hunt': '#8495c9',
  'fireworks-fair': '#142652', 'moonlit-masquerade': '#20152d',
};
const seasonContinuousArt = {} as Record<Exclude<ThemeName, 'winter'>, SeasonContinuousArt>;
for (const theme of ['spring', 'summer', 'autumn', 'starlight-eve', 'great-egg-hunt', 'fireworks-fair', 'moonlit-masquerade'] as Exclude<ThemeName, 'winter'>[]) {
  const world = new Image();
  const upper = new Image();
  const starfield = new Image();
  seasonContinuousArt[theme] = {
    world, upper, starfield, preparedWorld: null, preparedUpper: null,
    preparedStarfield: null, wisps: null,
  };
}

const continuousState: Record<ThemeName, 'idle' | 'loading' | 'ready' | 'failed'> = {
  winter: 'idle', spring: 'idle', summer: 'idle', autumn: 'idle',
  'starlight-eve': 'idle', 'great-egg-hunt': 'idle', 'fireworks-fair': 'idle', 'moonlit-masquerade': 'idle',
};
function loadContinuousSeason(theme: ThemeName): void {
  if (continuousState[theme] !== 'idle') return;
  continuousState[theme] = 'loading';
  const art = theme === 'winter' ? { world: winterContinuousWorld, upper: winterUpperSky, starfield: winterStarfield }
    : seasonContinuousArt[theme];
  art.world.src = isFestival(theme) ? `assets/themes/${theme}/world.png` : `assets/themes/${theme}/${theme}-continuous-world-v1.png`;
  art.upper.src = isFestival(theme) ? `assets/themes/${theme}/upper-sky.png` : `assets/themes/${theme}/${theme}-upper-sky-v1.png`;
  art.starfield.src = isFestival(theme) ? `assets/themes/${theme}/starfield.png` : `assets/themes/${theme}/${theme}-starfield-v1.png`;
  void Promise.all([art.world, art.upper, art.starfield].map(image => image.decode())).then(() => {
    continuousState[theme] = 'ready';
  }).catch(error => {
    continuousState[theme] = 'failed';
    console.warn(`${theme} continuous world unavailable; using earlier scenery.`, error);
  });
}
function releasePreparedSeason(theme: ThemeName): void {
  if (theme === 'winter') {
    preparedWinterWorld = null; preparedWinterUpperSky = null; preparedWinterStarfield = null;
    winterSkyWisps = null;
  } else {
    const art = seasonContinuousArt[theme];
    art.preparedWorld = art.preparedUpper = art.preparedStarfield = null;
    art.wisps = null;
  }
  if (preparedUpperTerrain?.theme === theme) preparedUpperTerrain = null;
}

function continuousSeasonReady(theme: ThemeName): boolean {
  if (continuousState[theme] !== 'ready') return false;
  const images = theme === 'winter'
    ? [winterContinuousWorld, winterUpperSky, winterStarfield]
    : [seasonContinuousArt[theme].world, seasonContinuousArt[theme].upper, seasonContinuousArt[theme].starfield];
  return images.every(image => image.complete && image.naturalWidth > 0);
}

function prepareWinterSkyPanel(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const paint = canvas.getContext('2d')!;
  paint.drawImage(image, 0, 0);
  paint.globalCompositeOperation = 'destination-in';
  const mask = paint.createLinearGradient(0, 0, 0, canvas.height);
  mask.addColorStop(0, 'rgba(255,255,255,0)');
  mask.addColorStop(0.18, '#fff');
  mask.addColorStop(0.76, '#fff');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  paint.fillStyle = mask;
  paint.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
let preparedUpperTerrain: { theme: ThemeName; bridge: HTMLCanvasElement; mid: HTMLCanvasElement; high: HTMLCanvasElement } | null = null;

function drawWinterContinuousWorld(): void {
  // This painting starts at the village and runs through the summit. Every
  // pixel has one world position; the camera simply reveals its next slice.
  if (!preparedWinterWorld) {
    preparedWinterWorld = document.createElement('canvas');
    preparedWinterWorld.width = winterContinuousWorld.naturalWidth;
    preparedWinterWorld.height = winterContinuousWorld.naturalHeight;
    const paint = preparedWinterWorld.getContext('2d')!;
    paint.drawImage(winterContinuousWorld, 0, 0);
    paint.globalCompositeOperation = 'destination-in';
    const mask = paint.createLinearGradient(0, 0, 0, preparedWinterWorld.height * 0.20);
    mask.addColorStop(0, 'rgba(255,255,255,0)');
    mask.addColorStop(1, '#fff');
    paint.fillStyle = mask;
    paint.fillRect(0, 0, preparedWinterWorld.width, preparedWinterWorld.height);
  }
  const scale = Math.max(width / winterContinuousWorld.naturalWidth,
    height * 1.4 / winterContinuousWorld.naturalHeight);
  const imageWidth = winterContinuousWorld.naturalWidth * scale;
  const imageHeight = winterContinuousWorld.naturalHeight * scale;
  const pixelsPerWorld = imageHeight / WINTER_PAINTING_WORLD_SPAN;
  const bottom = height + backdropCameraY * pixelsPerWorld;
  if (bottom > 0 && bottom - imageHeight < height) {
    ctx.drawImage(preparedWinterWorld, (width - imageWidth) * 0.6,
      bottom - imageHeight, imageWidth, imageHeight);
  }
  if (winterUpperSky.complete && winterUpperSky.naturalWidth > 0) {
    if (!preparedWinterUpperSky) preparedWinterUpperSky = prepareWinterSkyPanel(winterUpperSky);
    // Its bottom overlaps the first painting's aurora. Both panels have fixed
    // world positions, so climbing and descending show the same composition.
    const upperBottom = height + (backdropCameraY - 12000) * pixelsPerWorld;
    if (upperBottom > 0 && upperBottom - imageHeight < height) {
      ctx.drawImage(preparedWinterUpperSky, (width - imageWidth) * 0.6,
        upperBottom - imageHeight, imageWidth, imageHeight);
    }
  }
  // The high-air details sit behind the final painted panel. Its existing
  // soft top mask reveals them gradually, without double-bright stars or
  // overlapping painted wisps where the two sections meet.
  drawWinterHighSky(pixelsPerWorld);
  if (winterStarfield.complete && winterStarfield.naturalWidth > 0) {
    if (!preparedWinterStarfield) preparedWinterStarfield = prepareWinterSkyPanel(winterStarfield);
    const starfieldBottom = height + (backdropCameraY - 23000) * pixelsPerWorld;
    if (starfieldBottom > 0 && starfieldBottom - imageHeight < height) {
      ctx.drawImage(preparedWinterStarfield, (width - imageWidth) * 0.6,
        starfieldBottom - imageHeight, imageWidth, imageHeight);
    }
  }
}

function winterSkyHash(value: number): number {
  let n = Math.imul(value ^ 0x5a17c9, 0x45d9f3b);
  n ^= n >>> 16;
  return (n >>> 0) / 0x100000000;
}

function prepareWinterSkyWisps(): HTMLCanvasElement[] {
  const crops = [[0, 160], [660, 360], [0, 960], [660, 1030]];
  return crops.map(([sourceX, sourceY]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const paint = canvas.getContext('2d')!;
    paint.drawImage(winterStarfield, sourceX, sourceY, 360, 360, 0, 0, 360, 360);
    paint.globalCompositeOperation = 'destination-in';
    const mask = paint.createRadialGradient(180, 180, 40, 180, 180, 180);
    mask.addColorStop(0, '#fff');
    mask.addColorStop(0.55, 'rgba(255,255,255,0.7)');
    mask.addColorStop(1, 'rgba(255,255,255,0)');
    paint.fillStyle = mask;
    paint.fillRect(0, 0, 360, 360);
    return canvas;
  });
}

function drawWinterHighSky(pixelsPerWorld: number): void {
  // Beyond the authored panorama, motifs occupy unique world altitudes rather
  // than repeating a screen-space tile. All overlays use the painted panels'
  // world-to-screen scale, so they never slide across the art at a different
  // rate during an ascent or descent.
  const visibleWorldSpan = height / pixelsPerWorld;
  const skyY = (worldY: number): number => height + (backdropCameraY - worldY) * pixelsPerWorld;
  const arrival = (worldY: number): number => chapterEase((worldY - 33000) / 4000);
  if (winterStarfield.complete && winterStarfield.naturalWidth > 0) {
    if (!winterSkyWisps) winterSkyWisps = prepareWinterSkyWisps();
    const wispFirst = Math.max(0, Math.floor((backdropCameraY - 34000 - 3000) / 3200));
    const wispLast = Math.floor((backdropCameraY + visibleWorldSpan + 3000 - 34000) / 3200);
    for (let index = wispFirst; index <= wispLast; index++) {
      const worldY = 34000 + index * 3200 + winterSkyHash(index * 73 + 3) * 600;
      const y = skyY(worldY);
      const side = winterSkyHash(index * 79 + 9) < 0.5 ? 0.18 : 0.82;
      const x = width * (side + (winterSkyHash(index * 83 + 5) - 0.5) * 0.18);
      const size = Math.max(260, width * (0.26 + winterSkyHash(index * 89 + 1) * 0.14));
      ctx.save();
      ctx.globalAlpha = arrival(worldY) * (0.30 + winterSkyHash(index * 97 + 4) * 0.18);
      ctx.translate(x, y);
      ctx.rotate((winterSkyHash(index * 101 + 7) - 0.5) * 0.7);
      ctx.drawImage(winterSkyWisps[index % winterSkyWisps.length], -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
  const hazeFirst = Math.max(0, Math.floor((backdropCameraY - 33000 - 3000) / 3000));
  const hazeLast = Math.floor((backdropCameraY + visibleWorldSpan + 3000 - 33000) / 3000);
  for (let index = hazeFirst; index <= hazeLast; index++) {
    const worldY = 33000 + index * 3000;
    const y = skyY(worldY);
    const x = width * (0.1 + winterSkyHash(index * 67 + 3) * 0.8);
    const radius = Math.max(280, width * (0.26 + winterSkyHash(index * 71 + 5) * 0.18));
    const color = index % 3 === 0 ? '75,132,191' : index % 3 === 1 ? '104,81,159' : '60,164,179';
    const haze = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    haze.addColorStop(0, `rgba(${color},0.12)`);
    haze.addColorStop(0.55, `rgba(${color},0.05)`);
    haze.addColorStop(1, `rgba(${color},0)`);
    ctx.save();
    ctx.globalAlpha = arrival(worldY);
    ctx.fillStyle = haze;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  const first = Math.max(0, Math.floor((backdropCameraY - 33000 - 1000) / 1400));
  const last = Math.floor((backdropCameraY + visibleWorldSpan + 1000 - 33000) / 1400);
  for (let index = first; index <= last; index++) {
    const worldY = 33000 + index * 1400 + winterSkyHash(index * 17 + 3) * 450;
    const y = skyY(worldY);
    if (y < -180 || y > height + 180) continue;
    const x = width * (0.12 + winterSkyHash(index * 23 + 11) * 0.76);
    const stage = Math.min(3, Math.floor(Math.max(0, worldY - 33000) / 9000));
    const radius = (stage === 0 ? 25 : stage === 1 ? 16 : 11) + winterSkyHash(index * 31 + 7) * 12;
    const color = stage === 0 ? '121,232,219' : stage === 1 ? '163,187,255' : '216,232,255';
    ctx.save();
    ctx.globalAlpha = arrival(worldY) * (0.28 + winterSkyHash(index * 37 + 5) * 0.22);
    const glow = ctx.createRadialGradient(x, y, 1, x, y, radius * 2.3);
    glow.addColorStop(0, `rgba(${color},0.7)`);
    glow.addColorStop(0.22, `rgba(${color},0.22)`);
    glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 2.3, y - radius * 2.3, radius * 4.6, radius * 4.6);
    ctx.strokeStyle = `rgba(${color},0.8)`;
    ctx.lineWidth = 1.2;
    const arms = stage === 0 ? 6 : stage === 1 ? 4 : 8;
    for (let arm = 0; arm < arms; arm++) {
      const angle = arm * Math.PI * 2 / arms + winterSkyHash(index * 41) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 3, y + Math.sin(angle) * 3);
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      ctx.stroke();
    }
    const companions = 3 + Math.floor(winterSkyHash(index * 43 + 2) * 4);
    for (let star = 0; star < companions; star++) {
      const angle = winterSkyHash(index * 47 + star * 13) * Math.PI * 2;
      const distance = radius * (2 + winterSkyHash(index * 53 + star * 7) * 3);
      const sx = x + Math.cos(angle) * distance;
      const sy = y + Math.sin(angle) * distance * 0.65;
      const size = 1 + winterSkyHash(index * 59 + star * 19) * 2.5;
      ctx.fillStyle = `rgba(${color},${0.38 + winterSkyHash(index * 61 + star) * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function prepareSeasonWorld(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const paint = canvas.getContext('2d')!;
  paint.drawImage(image, 0, 0);
  paint.globalCompositeOperation = 'destination-in';
  const mask = paint.createLinearGradient(0, 0, 0, canvas.height * 0.20);
  mask.addColorStop(0, 'rgba(255,255,255,0)');
  mask.addColorStop(1, '#fff');
  paint.fillStyle = mask;
  paint.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function prepareSeasonWisps(image: HTMLImageElement): HTMLCanvasElement[] {
  return [[0, 150], [664, 340], [0, 950], [664, 1070]].map(([sx, sy]) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 360;
    const paint = canvas.getContext('2d')!;
    paint.drawImage(image, sx, sy, 360, 360, 0, 0, 360, 360);
    paint.globalCompositeOperation = 'destination-in';
    const mask = paint.createRadialGradient(180, 180, 35, 180, 180, 180);
    mask.addColorStop(0, '#fff');
    mask.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    mask.addColorStop(1, 'rgba(255,255,255,0)');
    paint.fillStyle = mask;
    paint.fillRect(0, 0, 360, 360);
    return canvas;
  });
}

function drawSeasonHighSky(theme: Exclude<ThemeName, 'winter'>, pixelsPerWorld: number): void {
  const art = seasonContinuousArt[theme];
  if (!art.wisps) art.wisps = prepareSeasonWisps(art.starfield);
  const visibleWorldSpan = height / pixelsPerWorld;
  const skyY = (worldY: number): number => height + (backdropCameraY - worldY) * pixelsPerWorld;
  const arrival = (worldY: number): number => chapterEase((worldY - 33000) / 4000);
  const season = baseSeason(theme);
  const offset = season === 'spring' ? 11 : season === 'summer' ? 47 : season === 'winter' ? 5 : 83;
  const colors = season === 'spring' ? ['255,203,237', '192,225,255', '211,198,255']
    : season === 'summer' ? ['255,240,177', '211,236,255', '255,223,139']
    : ['255,181,107', '235,161,180', '255,217,150'];
  const firstWisp = Math.max(0, Math.floor((backdropCameraY - 37000) / 3200));
  const lastWisp = Math.floor((backdropCameraY + visibleWorldSpan - 31000) / 3200);
  for (let index = firstWisp; index <= lastWisp; index++) {
    const worldY = 34000 + index * 3200 + winterSkyHash(index * 73 + offset) * 600;
    const x = width * (winterSkyHash(index * 79 + offset) < 0.5 ? 0.18 : 0.82);
    const size = Math.max(260, width * (0.26 + winterSkyHash(index * 89 + offset) * 0.14));
    ctx.save();
    ctx.globalAlpha = arrival(worldY) * (0.27 + winterSkyHash(index * 97 + offset) * 0.15);
    ctx.translate(x, skyY(worldY));
    ctx.rotate((winterSkyHash(index * 101 + offset) - 0.5) * 0.7);
    ctx.drawImage(art.wisps[index % art.wisps.length], -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  const first = Math.max(0, Math.floor((backdropCameraY - 34000) / 1450));
  const last = Math.floor((backdropCameraY + visibleWorldSpan - 32000) / 1450);
  for (let index = first; index <= last; index++) {
    const worldY = 33500 + index * 1450 + winterSkyHash(index * 17 + offset) * 350;
    const y = skyY(worldY);
    if (y < -140 || y > height + 140) continue;
    const x = width * (0.13 + winterSkyHash(index * 23 + offset) * 0.74);
    const stage = Math.min(2, Math.floor(Math.max(0, worldY - 33500) / 9000));
    const color = colors[stage];
    const radius = (stage === 0 ? 18 : stage === 1 ? 13 : 9) + winterSkyHash(index * 31 + offset) * 9;
    ctx.save();
    ctx.globalAlpha = arrival(worldY) * (0.34 + winterSkyHash(index * 37 + offset) * 0.18);
    const glow = ctx.createRadialGradient(x, y, 1, x, y, radius * 2.6);
    glow.addColorStop(0, `rgba(${color},0.65)`);
    glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 2.6, y - radius * 2.6, radius * 5.2, radius * 5.2);
    ctx.translate(x, y);
    ctx.rotate(winterSkyHash(index * 41 + offset) * Math.PI);
    ctx.fillStyle = `rgba(${color},0.82)`;
    if (season === 'summer' || season === 'winter') {
      ctx.beginPath(); ctx.arc(0, 0, Math.max(2, radius * 0.18), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${color},0.65)`;
      for (let ray = 0; ray < 6; ray++) {
        const angle = ray * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (season === 'spring' ? 0.38 : 0.48), radius, 0, 0, Math.PI * 2);
      ctx.fill();
      if (season === 'autumn') {
        ctx.strokeStyle = `rgba(${color},0.7)`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, radius * 1.4); ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawSeasonContinuousWorld(theme: Exclude<ThemeName, 'winter'>): void {
  const art = seasonContinuousArt[theme];
  if (!art.preparedWorld) art.preparedWorld = prepareSeasonWorld(art.world);
  if (!art.preparedUpper) art.preparedUpper = prepareWinterSkyPanel(art.upper);
  if (!art.preparedStarfield) art.preparedStarfield = prepareWinterSkyPanel(art.starfield);
  const scale = Math.max(width / art.world.naturalWidth,
    height * 1.4 / art.world.naturalHeight);
  const imageWidth = art.world.naturalWidth * scale;
  const imageHeight = art.world.naturalHeight * scale;
  const pixelsPerWorld = imageHeight / WINTER_PAINTING_WORLD_SPAN;
  const x = (width - imageWidth) * 0.6;
  const drawPanel = (image: HTMLCanvasElement, anchor: number): void => {
    const bottom = height + (backdropCameraY - anchor) * pixelsPerWorld;
    if (bottom > 0 && bottom - imageHeight < height) {
      ctx.drawImage(image, x, bottom - imageHeight, imageWidth, imageHeight);
    }
  };
  drawPanel(art.preparedWorld, 0);
  drawPanel(art.preparedUpper, 12000);
  // The final painting's feathered top reveals these later motifs gradually.
  drawSeasonHighSky(theme, pixelsPerWorld);
  if (isFestival(theme)) {
    // One taller authored starfield carries each festival through Expedition's
    // summit. It fades into the later motifs without repeating the painting.
    const starHeight = imageHeight * 1.55;
    const bottom = height + (backdropCameraY - 23000) * pixelsPerWorld;
    if (bottom > 0 && bottom - starHeight < height) {
      ctx.drawImage(art.preparedStarfield, x, bottom - starHeight, imageWidth, starHeight);
    }
  } else drawPanel(art.preparedStarfield, 23000);
}

function prepareUpperTerrainImage(image: HTMLImageElement, fadeStart: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const paint = canvas.getContext('2d')!;
  paint.drawImage(image, 0, 0);
  // The source bottom is solid for crossfades. Feather that boundary so its
  // first pixels can enter from above without a viewport-wide straight edge.
  paint.globalCompositeOperation = 'destination-in';
  const mask = paint.createLinearGradient(0, 0, 0, canvas.height);
  mask.addColorStop(0, '#fff');
  mask.addColorStop(fadeStart, '#fff');
  // Cover-cropping on wide viewports removes up to the outer 5% of the source.
  // Finish the fade inside that crop or its remaining alpha forms a straight
  // horizontal edge in the live scene.
  mask.addColorStop(0.90, 'rgba(255,255,255,0)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  paint.fillStyle = mask;
  paint.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function prepareUpperTerrain(theme: ThemeName): void {
  const art = upperRealmArt[theme];
  if (art.state !== 'ready' || preparedUpperTerrain?.theme === theme) return;
  preparedUpperTerrain = {
    theme,
    bridge: prepareUpperTerrainImage(art.bridge, 0.50),
    mid: prepareUpperTerrainImage(art.mid, 0.78),
    high: prepareUpperTerrainImage(art.high, 0.78),
  };
}

for (const theme of ['winter', 'spring', 'summer', 'autumn', 'starlight-eve', 'great-egg-hunt', 'fireworks-fair', 'moonlit-masquerade'] as ThemeName[]) {
  const mid = new Image();
  const high = new Image();
  const bridge = new Image();
  const art: UpperRealmArt = { mid, high, bridge, state: 'idle' };
  upperRealmArt[theme] = art;
}
function loadUpperRealm(theme: ThemeName): void {
  const art = upperRealmArt[theme];
  if (art.state !== 'idle') return;
  art.state = 'loading';
  const { mid, high, bridge } = art;
  let decoding = false;
  const check = (): void => {
    if (decoding || !mid.complete || !high.complete || !bridge.complete ||
        !mid.naturalWidth || !high.naturalWidth || !bridge.naturalWidth) return;
    decoding = true;
    void Promise.all([mid.decode(), high.decode(), bridge.decode()]).then(() => {
      // Decoding finishes before any of these images are copied to a canvas.
      art.state = 'ready';
      if (theme === selectedTheme) prepareUpperTerrain(theme);
    }).catch(error => {
      art.state = 'failed';
      console.error(`${theme} upper realm art could not be decoded.`, error);
    });
  };
  mid.onload = check;
  high.onload = check;
  mid.onerror = high.onerror = () => { art.state = 'failed'; console.error(`${theme} upper realm art failed to load.`); };
  mid.src = UPPER_REALM_PATHS[baseSeason(theme)].mid;
  high.src = UPPER_REALM_PATHS[baseSeason(theme)].high;
  bridge.onload = check;
  bridge.onerror = () => { art.state = 'failed'; console.error(`${theme} bridge art failed to load.`); };
  bridge.src = `assets/themes/${baseSeason(theme)}/${baseSeason(theme)}-bridge.webp`;
  const foothold = new Image();
  foothold.src = UPPER_FOOTHOLD_PATHS[theme];
  upperFootholdArt[theme] = foothold;
}

function chapterBandAt(altitude: number): number {
  if (altitude < CHAPTER_START + CHAPTER_SPAN) return 0;
  if (altitude < CHAPTER_START + CHAPTER_SPAN * 2) return 1;
  return 2;
}

function chapterNameAt(altitude: number, theme: ThemeName = selectedTheme): string {
  return CHAPTER_BANDS[theme][chapterBandAt(altitude)].name;
}

function chapterEase(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function drawClimbChapters(): void {
  const art = upperRealmArt[selectedTheme];
  if (art.state !== 'ready') return;
  prepareUpperTerrain(selectedTheme);
  drawTransparentClimbChapters(preparedUpperTerrain!);
}

function drawTransparentClimbChapters(art: { bridge: HTMLCanvasElement; mid: HTMLCanvasElement; high: HTMLCanvasElement }): void {
  // The more distant high ridge crosses the viewport more slowly, extending
  // the authored high-altitude scenery without recycling the painting.
  const drawTerrain = (image: HTMLCanvasElement, worldY: number, traversalSpan: number, opacity = 1): void => {
    if (opacity <= 0) return;
    const depth = height / traversalSpan;
    const bottom = height - (worldY - backdropCameraY) * depth;
    const top = bottom - height;
    if (bottom <= 0 || top >= height) return;
    drawCoverImage(image, 0, top, width, height, opacity);
  };
  // Keep each painting at a fixed world altitude. Moving an overlap offset
  // independently of the camera made a ridge race into view, then made the
  // following ridge reverse direction during an otherwise steady climb.
  // An upper painting is already partly inside the viewport before its lower
  // edge meets the previous landscape. Start the handoff only near its world
  // anchor; every plane reads the same bounce-resistant backdrop height.
  const bridgeWorldY = 3650;
  const midWorldY = bridgeWorldY + 1850;
  const highWorldY = midWorldY + 5600;
  drawTerrain(art.bridge, bridgeWorldY, 3000,
    chapterEase((backdropCameraY - (bridgeWorldY - 1200)) / 1200));
  drawTerrain(art.mid, midWorldY, 4200, chapterEase((backdropCameraY - (midWorldY - 1100)) / 1300));
  drawTerrain(art.high, highWorldY, 6000,
    chapterEase((backdropCameraY - 6200) / 1400));
}

function drawUpperFoothold(x: number, y: number): void {
  const image = upperFootholdArt[selectedTheme];
  if (!image.complete || !image.naturalWidth) return;
  const w = Math.min(260, Math.max(185, width * 0.19));
  const h = w * image.naturalHeight / image.naturalWidth;
  // Align the flat center of each hand-painted ledge with Zima's feet.
  const top: Record<ThemeName, number> = { winter: 0.404, spring: 0.379, summer: 0.413, autumn: 0.350,
    'starlight-eve': 0.42, 'great-egg-hunt': 0.40, 'fireworks-fair': 0.42, 'moonlit-masquerade': 0.40 };
  ctx.drawImage(image, x - w * 0.54, y - h * top[selectedTheme], w, h);
}
