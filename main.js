// Seasonal upper realms use paintings derived from the existing scenery.
// A climb reveals them slowly; no procedural terrain or prop silhouettes are drawn.
const CHAPTER_START = 650;
const CHAPTER_SPAN = 1900;
const CHAPTER_BANDS = {
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
};
const UPPER_REALM_PATHS = {
    winter: { mid: 'assets/themes/winter/winter-mid-terrain-v2.png', high: 'assets/themes/winter/winter-high-terrain.webp' },
    spring: { mid: 'assets/themes/spring/spring-mid-terrain.webp', high: 'assets/themes/spring/spring-high-terrain.webp' },
    summer: { mid: 'assets/themes/summer/summer-mid-terrain.webp', high: 'assets/themes/summer/summer-high-terrain.webp' },
    autumn: { mid: 'assets/themes/autumn/autumn-mid-terrain.webp', high: 'assets/themes/autumn/autumn-high-terrain.webp' },
};
const UPPER_FOOTHOLD_PATHS = {
    winter: 'assets/themes/winter/upper-foothold.webp',
    spring: 'assets/themes/spring/upper-foothold.webp',
    summer: 'assets/themes/summer/upper-foothold.webp',
    autumn: 'assets/themes/autumn/upper-foothold.webp',
};
const upperRealmArt = {};
const upperFootholdArt = {};
const winterContinuousWorld = new Image();
winterContinuousWorld.src = 'assets/themes/winter/winter-continuous-world-v1.png';
const winterUpperSky = new Image();
winterUpperSky.src = 'assets/themes/winter/winter-upper-sky-v1.png';
const winterStarfield = new Image();
winterStarfield.src = 'assets/themes/winter/winter-starfield-v1.png';
let preparedWinterWorld = null;
let preparedWinterUpperSky = null;
let preparedWinterStarfield = null;
let winterSkyWisps = null;
const WINTER_PAINTING_WORLD_SPAN = 14000;
const SEASON_SKY_COLOR = {
    winter: '#081e40', spring: '#3446a6', summer: '#76b7f5', autumn: '#231838',
};
const seasonContinuousArt = {};
for (const theme of ['spring', 'summer', 'autumn']) {
    const world = new Image();
    const upper = new Image();
    const starfield = new Image();
    world.src = `assets/themes/${theme}/${theme}-continuous-world-v1.png`;
    upper.src = `assets/themes/${theme}/${theme}-upper-sky-v1.png`;
    starfield.src = `assets/themes/${theme}/${theme}-starfield-v1.png`;
    seasonContinuousArt[theme] = {
        world, upper, starfield, preparedWorld: null, preparedUpper: null,
        preparedStarfield: null, wisps: null,
    };
}
function continuousSeasonReady(theme) {
    const images = theme === 'winter'
        ? [winterContinuousWorld, winterUpperSky, winterStarfield]
        : [seasonContinuousArt[theme].world, seasonContinuousArt[theme].upper, seasonContinuousArt[theme].starfield];
    return images.every(image => image.complete && image.naturalWidth > 0);
}
function prepareWinterSkyPanel(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const paint = canvas.getContext('2d');
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
let preparedUpperTerrain = null;
function drawWinterContinuousWorld() {
    // This painting starts at the village and runs through the summit. Every
    // pixel has one world position; the camera simply reveals its next slice.
    if (!preparedWinterWorld) {
        preparedWinterWorld = document.createElement('canvas');
        preparedWinterWorld.width = winterContinuousWorld.naturalWidth;
        preparedWinterWorld.height = winterContinuousWorld.naturalHeight;
        const paint = preparedWinterWorld.getContext('2d');
        paint.drawImage(winterContinuousWorld, 0, 0);
        paint.globalCompositeOperation = 'destination-in';
        const mask = paint.createLinearGradient(0, 0, 0, preparedWinterWorld.height * 0.20);
        mask.addColorStop(0, 'rgba(255,255,255,0)');
        mask.addColorStop(1, '#fff');
        paint.fillStyle = mask;
        paint.fillRect(0, 0, preparedWinterWorld.width, preparedWinterWorld.height);
    }
    const scale = Math.max(width / winterContinuousWorld.naturalWidth, height * 1.4 / winterContinuousWorld.naturalHeight);
    const imageWidth = winterContinuousWorld.naturalWidth * scale;
    const imageHeight = winterContinuousWorld.naturalHeight * scale;
    const pixelsPerWorld = imageHeight / WINTER_PAINTING_WORLD_SPAN;
    const bottom = height + backdropCameraY * pixelsPerWorld;
    if (bottom > 0 && bottom - imageHeight < height) {
        ctx.drawImage(preparedWinterWorld, (width - imageWidth) * 0.6, bottom - imageHeight, imageWidth, imageHeight);
    }
    if (winterUpperSky.complete && winterUpperSky.naturalWidth > 0) {
        if (!preparedWinterUpperSky)
            preparedWinterUpperSky = prepareWinterSkyPanel(winterUpperSky);
        // Its bottom overlaps the first painting's aurora. Both panels have fixed
        // world positions, so climbing and descending show the same composition.
        const upperBottom = height + (backdropCameraY - 12000) * pixelsPerWorld;
        if (upperBottom > 0 && upperBottom - imageHeight < height) {
            ctx.drawImage(preparedWinterUpperSky, (width - imageWidth) * 0.6, upperBottom - imageHeight, imageWidth, imageHeight);
        }
    }
    // The high-air details sit behind the final painted panel. Its existing
    // soft top mask reveals them gradually, without double-bright stars or
    // overlapping painted wisps where the two sections meet.
    drawWinterHighSky(pixelsPerWorld);
    if (winterStarfield.complete && winterStarfield.naturalWidth > 0) {
        if (!preparedWinterStarfield)
            preparedWinterStarfield = prepareWinterSkyPanel(winterStarfield);
        const starfieldBottom = height + (backdropCameraY - 23000) * pixelsPerWorld;
        if (starfieldBottom > 0 && starfieldBottom - imageHeight < height) {
            ctx.drawImage(preparedWinterStarfield, (width - imageWidth) * 0.6, starfieldBottom - imageHeight, imageWidth, imageHeight);
        }
    }
}
function winterSkyHash(value) {
    let n = Math.imul(value ^ 0x5a17c9, 0x45d9f3b);
    n ^= n >>> 16;
    return (n >>> 0) / 0x100000000;
}
function prepareWinterSkyWisps() {
    const crops = [[0, 160], [660, 360], [0, 960], [660, 1030]];
    return crops.map(([sourceX, sourceY]) => {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 360;
        const paint = canvas.getContext('2d');
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
function drawWinterHighSky(pixelsPerWorld) {
    // Beyond the authored panorama, motifs occupy unique world altitudes rather
    // than repeating a screen-space tile. All overlays use the painted panels'
    // world-to-screen scale, so they never slide across the art at a different
    // rate during an ascent or descent.
    const visibleWorldSpan = height / pixelsPerWorld;
    const skyY = (worldY) => height + (backdropCameraY - worldY) * pixelsPerWorld;
    const arrival = (worldY) => chapterEase((worldY - 33000) / 4000);
    if (winterStarfield.complete && winterStarfield.naturalWidth > 0) {
        if (!winterSkyWisps)
            winterSkyWisps = prepareWinterSkyWisps();
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
        if (y < -180 || y > height + 180)
            continue;
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
function prepareSeasonWorld(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const paint = canvas.getContext('2d');
    paint.drawImage(image, 0, 0);
    paint.globalCompositeOperation = 'destination-in';
    const mask = paint.createLinearGradient(0, 0, 0, canvas.height * 0.20);
    mask.addColorStop(0, 'rgba(255,255,255,0)');
    mask.addColorStop(1, '#fff');
    paint.fillStyle = mask;
    paint.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}
function prepareSeasonWisps(image) {
    return [[0, 150], [664, 340], [0, 950], [664, 1070]].map(([sx, sy]) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 360;
        const paint = canvas.getContext('2d');
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
function drawSeasonHighSky(theme, pixelsPerWorld) {
    const art = seasonContinuousArt[theme];
    if (!art.wisps)
        art.wisps = prepareSeasonWisps(art.starfield);
    const visibleWorldSpan = height / pixelsPerWorld;
    const skyY = (worldY) => height + (backdropCameraY - worldY) * pixelsPerWorld;
    const arrival = (worldY) => chapterEase((worldY - 33000) / 4000);
    const offset = theme === 'spring' ? 11 : theme === 'summer' ? 47 : 83;
    const colors = theme === 'spring' ? ['255,203,237', '192,225,255', '211,198,255']
        : theme === 'summer' ? ['255,240,177', '211,236,255', '255,223,139']
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
        if (y < -140 || y > height + 140)
            continue;
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
        if (theme === 'summer') {
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(2, radius * 0.18), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(${color},0.65)`;
            for (let ray = 0; ray < 6; ray++) {
                const angle = ray * Math.PI / 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35);
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                ctx.stroke();
            }
        }
        else {
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * (theme === 'spring' ? 0.38 : 0.48), radius, 0, 0, Math.PI * 2);
            ctx.fill();
            if (theme === 'autumn') {
                ctx.strokeStyle = `rgba(${color},0.7)`;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, radius * 1.4);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}
function drawSeasonContinuousWorld(theme) {
    const art = seasonContinuousArt[theme];
    if (!art.preparedWorld)
        art.preparedWorld = prepareSeasonWorld(art.world);
    if (!art.preparedUpper)
        art.preparedUpper = prepareWinterSkyPanel(art.upper);
    if (!art.preparedStarfield)
        art.preparedStarfield = prepareWinterSkyPanel(art.starfield);
    const scale = Math.max(width / art.world.naturalWidth, height * 1.4 / art.world.naturalHeight);
    const imageWidth = art.world.naturalWidth * scale;
    const imageHeight = art.world.naturalHeight * scale;
    const pixelsPerWorld = imageHeight / WINTER_PAINTING_WORLD_SPAN;
    const x = (width - imageWidth) * 0.6;
    const drawPanel = (image, anchor) => {
        const bottom = height + (backdropCameraY - anchor) * pixelsPerWorld;
        if (bottom > 0 && bottom - imageHeight < height) {
            ctx.drawImage(image, x, bottom - imageHeight, imageWidth, imageHeight);
        }
    };
    drawPanel(art.preparedWorld, 0);
    drawPanel(art.preparedUpper, 12000);
    // The final painting's feathered top reveals these later motifs gradually.
    drawSeasonHighSky(theme, pixelsPerWorld);
    drawPanel(art.preparedStarfield, 23000);
}
function prepareUpperTerrainImage(image, fadeStart) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const paint = canvas.getContext('2d');
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
function prepareUpperTerrain(theme) {
    const art = upperRealmArt[theme];
    if (art.state !== 'ready' || preparedUpperTerrain?.theme === theme)
        return;
    preparedUpperTerrain = {
        theme,
        bridge: prepareUpperTerrainImage(art.bridge, 0.50),
        mid: prepareUpperTerrainImage(art.mid, 0.78),
        high: prepareUpperTerrainImage(art.high, 0.78),
    };
}
for (const theme of ['winter', 'spring', 'summer', 'autumn']) {
    const mid = new Image();
    const high = new Image();
    const bridge = new Image();
    const art = { mid, high, bridge, state: 'loading' };
    upperRealmArt[theme] = art;
    let decoding = false;
    const check = () => {
        if (decoding || !mid.complete || !high.complete || !bridge.complete ||
            !mid.naturalWidth || !high.naturalWidth || !bridge.naturalWidth)
            return;
        decoding = true;
        void Promise.all([mid.decode(), high.decode(), bridge.decode()]).then(() => {
            // Decoding finishes before any of these images are copied to a canvas.
            art.state = 'ready';
            if (theme === selectedTheme)
                prepareUpperTerrain(theme);
        }).catch(error => {
            art.state = 'failed';
            console.error(`${theme} upper realm art could not be decoded.`, error);
        });
    };
    mid.onload = check;
    high.onload = check;
    mid.onerror = high.onerror = () => { art.state = 'failed'; console.error(`${theme} upper realm art failed to load.`); };
    mid.src = UPPER_REALM_PATHS[theme].mid;
    high.src = UPPER_REALM_PATHS[theme].high;
    bridge.onload = check;
    bridge.onerror = () => { art.state = 'failed'; console.error(`${theme} bridge art failed to load.`); };
    bridge.src = `assets/themes/${theme}/${theme}-bridge.webp`;
    const foothold = new Image();
    foothold.src = UPPER_FOOTHOLD_PATHS[theme];
    upperFootholdArt[theme] = foothold;
}
function chapterBandAt(altitude) {
    if (altitude < CHAPTER_START + CHAPTER_SPAN)
        return 0;
    if (altitude < CHAPTER_START + CHAPTER_SPAN * 2)
        return 1;
    return 2;
}
function chapterNameAt(altitude, theme = selectedTheme) {
    return CHAPTER_BANDS[theme][chapterBandAt(altitude)].name;
}
function chapterEase(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
}
function drawClimbChapters() {
    const art = upperRealmArt[selectedTheme];
    if (art.state !== 'ready')
        return;
    prepareUpperTerrain(selectedTheme);
    drawTransparentClimbChapters(preparedUpperTerrain);
}
function drawTransparentClimbChapters(art) {
    // The more distant high ridge crosses the viewport more slowly, extending
    // the authored high-altitude scenery without recycling the painting.
    const drawTerrain = (image, worldY, traversalSpan, opacity = 1) => {
        if (opacity <= 0)
            return;
        const depth = height / traversalSpan;
        const bottom = height - (worldY - backdropCameraY) * depth;
        const top = bottom - height;
        if (bottom <= 0 || top >= height)
            return;
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
    drawTerrain(art.bridge, bridgeWorldY, 3000, chapterEase((backdropCameraY - (bridgeWorldY - 1200)) / 1200));
    drawTerrain(art.mid, midWorldY, 4200, chapterEase((backdropCameraY - (midWorldY - 1100)) / 1300));
    drawTerrain(art.high, highWorldY, 6000, chapterEase((backdropCameraY - 6200) / 1400));
}
function drawUpperFoothold(x, y) {
    const image = upperFootholdArt[selectedTheme];
    if (!image.complete || !image.naturalWidth)
        return;
    const w = Math.min(260, Math.max(185, width * 0.19));
    const h = w * image.naturalHeight / image.naturalWidth;
    // Align the flat center of each hand-painted ledge with Zima's feet.
    const top = { winter: 0.404, spring: 0.379, summer: 0.413, autumn: 0.350 };
    ctx.drawImage(image, x - w * 0.54, y - h * top[selectedTheme], w, h);
}
/// <reference path="./chapters.ts" />
const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });
const menuOverlay = document.querySelector('#menu-overlay');
const boardOverlay = document.querySelector('#board-overlay');
const TAU = Math.PI * 2;
const DPR_MAX = 2;
const GROUND_Y = 0;
const EXPEDITION_GOALS = [14000, 28000, 42000];
function expeditionGoals() {
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
spriteImage.src = 'assets/zima-animation-clean-atlas.webp';
const zimaIdleKeysImage = new Image();
zimaIdleKeysImage.src = 'assets/zima-idle-four-keys.webp';
const zimaIdleSixteenImage = new Image();
zimaIdleSixteenImage.src = 'assets/zima-idle-sixteen.webp';
const zimaWalkSixteenImage = new Image();
zimaWalkSixteenImage.src = 'assets/zima-walk-sixteen.webp';
const zimaMotionImages = {
    crouch: new Image(), launch: new Image(), rise: new Image(), apex: new Image(),
    fall: new Image(), contact: new Image(), sideContact: new Image(), land: new Image(),
};
for (const [family, image] of Object.entries(zimaMotionImages)) {
    const asset = family === 'sideContact' ? 'side-contact' : family;
    image.src = `assets/zima-${asset}-sixteen.webp`;
}
const turnPoseImage = new Image();
turnPoseImage.src = 'assets/zima-turn-pose.webp';
const zimaTurnFrontImage = new Image();
zimaTurnFrontImage.src = 'assets/zima-turn-front.webp';
const zimaTurnMiddleImage = new Image();
zimaTurnMiddleImage.src = 'assets/zima-turn-middle.webp';
const topContactImage = new Image();
topContactImage.src = 'assets/zima-top-contact.webp';
const undersideContactImage = new Image();
undersideContactImage.src = 'assets/zima-underside-contact.webp';
const airborneBoostImage = new Image();
airborneBoostImage.src = 'assets/zima-airborne-boost.webp';
const fallPoseImage = new Image();
fallPoseImage.src = 'assets/zima-fall-pose.png';
const fallTuckImage = new Image();
fallTuckImage.src = 'assets/zima-fall-tuck.png';
// Preserve the scarf's painted highlights and folds while changing only its
// blue cloth pixels. Keep one season's derived canvases in memory at a time.
const SCARF_COLORS = {
    spring: [218, 126, 164],
    summer: [65, 165, 153],
    autumn: [151, 68, 112],
};
const scarfArtCache = new Map();
const MAX_SCARF_TINT_CELLS = 72;
function seasonalScarfArt(image, key, frame) {
    if (selectedTheme === 'winter' || !image.naturalWidth)
        return image;
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
    const paint = result.getContext('2d', { willReadFrequently: true });
    if (frame)
        paint.drawImage(image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, result.width, result.height);
    else
        paint.drawImage(image, 0, 0, result.width, result.height);
    const pixels = paint.getImageData(0, 0, result.width, result.height);
    const data = pixels.data;
    const color = SCARF_COLORS[selectedTheme];
    const limit = key.startsWith('fall') ? 0.73 : frame ? 0.78 : 0.80;
    const rowStride = result.width * 4;
    for (let y = 0; y < result.height; y++) {
        for (let x = 0; x < result.width; x++) {
            const localX = x / result.width;
            if (localX > limit)
                continue; // leave Zima's blue eyes alone
            const i = y * rowStride + x * 4;
            const red = data[i], green = data[i + 1], blue = data[i + 2];
            if (data[i + 3] < 8 || blue - red < 20 || blue - green < 4)
                continue;
            const cloth = Math.min(1, (blue - red - 16) / 28, (blue - green) / 18);
            if (cloth <= 0)
                continue;
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
        if (!oldest.done)
            scarfArtCache.delete(oldest.value);
    }
    return result;
}
const THEME_ORDER = ['winter', 'spring', 'summer', 'autumn'];
const THEME_META = {
    winter: { label: 'Winter', subtitle: 'Moonlit snow and ringing bells', normal: 'Bell', medium: 'Silver Bell', strong: 'Crystal Bell', airborne: 'Aurora Bird', accent: '#9fe8da', card: '#173c56' },
    spring: { label: 'Spring', subtitle: 'Rain, blossoms, and dragonflies', normal: 'Raindrop', medium: 'Blossom', strong: 'Glow Bloom', airborne: 'Dragonfly', accent: '#ff96cf', card: '#2b5f60' },
    summer: { label: 'Summer', subtitle: 'Sunflowers, swallows, and warm fields', normal: 'Sunflower', medium: 'Golden Bloom', strong: 'Radiant Flower', airborne: 'Swallow', accent: '#ffd36d', card: '#5c7c2f' },
    autumn: { label: 'Autumn', subtitle: 'Pumpkins, crows, and harvest fields', normal: 'Pumpkin', medium: 'Harvest Gourd', strong: "Jack-o'-Lantern", airborne: 'Crow', accent: '#ffb062', card: '#75411c' },
};
const CHARACTER_ORDER = ['zima', 'earl-grey', 'betty-davis', 'gracie-bell'];
const CHARACTER_META = {
    zima: { name: 'Zima', hint: 'Bright adventurer', portrait: 'assets/zima-turn-pose.webp' },
    'earl-grey': { name: 'Earl Grey', hint: 'Sturdy explorer', portrait: 'assets/characters/earl-grey/idle.png' },
    'betty-davis': { name: 'Betty Davis', hint: 'Petite wanderer', portrait: 'assets/characters/betty-davis/idle.png' },
    'gracie-bell': { name: 'Gracie Bell', hint: 'Graceful climber', portrait: 'assets/characters/gracie-bell/idle.png' },
};
const COMPANION_IDS = ['earl-grey', 'betty-davis', 'gracie-bell'];
const COMPANION_POSES = ['idle', 'walk', 'rise', 'fall', 'contact', 'land'];
const companionArt = {};
const earlWalkKeysImage = new Image();
earlWalkKeysImage.src = 'assets/characters/earl-grey/walk-keys.webp';
const bettyWalkKeysImage = new Image();
bettyWalkKeysImage.src = 'assets/characters/betty-davis/walk-keys.webp';
const gracieWalkKeysImage = new Image();
gracieWalkKeysImage.src = 'assets/characters/gracie-bell/walk-keys.webp';
const companionWalkKeys = {
    'earl-grey': earlWalkKeysImage, 'betty-davis': bettyWalkKeysImage, 'gracie-bell': gracieWalkKeysImage,
};
const companionWalkSixteen = {};
const companionIdleSixteen = {};
for (const character of COMPANION_IDS) {
    companionWalkSixteen[character] = new Image();
    companionWalkSixteen[character].src = `assets/characters/${character}/walk-sixteen.webp`;
    companionIdleSixteen[character] = new Image();
    companionIdleSixteen[character].src = `assets/characters/${character}/idle-sixteen.webp`;
}
const companionMotionKeys = {};
for (const character of COMPANION_IDS) {
    const images = {};
    for (const family of ['crouch', 'launch', 'rise', 'apex', 'fall']) {
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
function companionEventImages(character) {
    const names = {
        launch: 'launch', apex: 'apex', fallTuck: 'fall-tuck', recover: 'recover',
        sideContact: 'side-contact', topContact: 'top-contact',
        undersideContact: 'underside-contact', boostContact: 'boost-contact', turn: 'turn',
    };
    const images = {};
    for (const key of Object.keys(names)) {
        images[key] = new Image();
        images[key].src = `assets/characters/${character}/${names[key]}.webp`;
    }
    return images;
}
const companionEventArt = {
    'earl-grey': earlEventArt,
    'betty-davis': companionEventImages('betty-davis'),
    'gracie-bell': companionEventImages('gracie-bell'),
};
const companionArtState = { 'earl-grey': 'loading', 'betty-davis': 'loading', 'gracie-bell': 'loading' };
const companionTintCache = new Map();
const COMPANION_CLOTH = {
    'earl-grey': { winter: [106, 132, 178], spring: [181, 119, 153], summer: [104, 152, 113], autumn: [163, 94, 69] },
    'betty-davis': { winter: [138, 169, 193], spring: [177, 118, 168], summer: [203, 165, 104], autumn: [167, 104, 132] },
    'gracie-bell': { winter: [111, 151, 183], spring: [185, 139, 171], summer: [81, 164, 157], autumn: [193, 147, 83] },
};
const GRACIE_RIBBON_BOUNDS = {
    idle: [420, 145, 580, 260], walk: [425, 145, 585, 265],
    rise: [375, 115, 510, 205], fall: [390, 185, 495, 340],
    contact: [410, 120, 565, 255], land: [410, 145, 580, 275],
};
function seasonalCompanionArt(character, pose, sourceOverride) {
    const source = sourceOverride ?? companionArt[character][pose];
    if ((selectedTheme === 'autumn' && character === 'gracie-bell') || (selectedTheme === 'spring' && character === 'betty-davis'))
        return source;
    const key = `${character}:${pose}:${selectedTheme}:${sourceOverride?.src ?? 'base'}`;
    const cached = companionTintCache.get(key);
    if (cached)
        return cached;
    const result = document.createElement('canvas');
    result.width = source.naturalWidth;
    result.height = source.naturalHeight;
    const paint = result.getContext('2d', { willReadFrequently: true });
    paint.drawImage(source, 0, 0);
    const pixels = paint.getImageData(0, 0, result.width, result.height);
    const data = pixels.data;
    const target = COMPANION_CLOTH[character][selectedTheme];
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 16)
            continue;
        if (character === 'gracie-bell') {
            const x = (i / 4) % result.width, y = Math.floor(i / 4 / result.width);
            const motionAtlas = sourceOverride && result.height === 356 && result.width % 500 === 0;
            const [left, top, right, bottom] = motionAtlas
                ? [220, 85, 430, 270] : GRACIE_RIBBON_BOUNDS[pose];
            const localX = motionAtlas ? x % 500 : x;
            if (localX < left || localX > right || y < top || y > bottom)
                continue;
        }
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const high = Math.max(r, g, b), low = Math.min(r, g, b), span = high - low;
        if (high < 28 || span < 10)
            continue;
        const saturation = span / high;
        let hue = high === r ? 60 * ((g - b) / span % 6) : high === g ? 60 * ((b - r) / span + 2) : 60 * ((r - g) / span + 4);
        if (hue < 0)
            hue += 360;
        const cloth = character === 'earl-grey' ? hue >= 45 && hue <= 100 && saturation > 0.16
            : character === 'betty-davis' ? hue >= 275 && hue <= 345 && saturation > 0.10
                : hue >= 25 && hue <= 50 && saturation > 0.48 && high > 75;
        if (!cloth)
            continue;
        const shade = Math.max(0.30, Math.min(1.4, (r * 0.21 + g * 0.72 + b * 0.07) / 120));
        for (let channel = 0; channel < 3; channel++)
            data[i + channel] = Math.min(255, Math.round(target[channel] * shade));
    }
    paint.putImageData(pixels, 0, 0);
    companionTintCache.set(key, result);
    return result;
}
for (const character of COMPANION_IDS) {
    const poses = {};
    companionArt[character] = poses;
    let loaded = 0;
    for (const pose of COMPANION_POSES) {
        const image = new Image();
        image.onload = () => { if (++loaded === COMPANION_POSES.length)
            companionArtState[character] = 'ready'; };
        image.onerror = () => { companionArtState[character] = 'failed'; console.error(`${character} ${pose} art failed to load.`); };
        image.src = `assets/characters/${character}/${pose}.png`;
        poses[pose] = image;
    }
}
const SCENE_ASSET_PATHS = {
    winter: { sky: 'assets/themes/winter/sky.webp', far: 'assets/themes/winter/far-mountains.webp', mid: 'assets/themes/winter/mid-village.webp', near: 'assets/themes/winter/mid-pines.webp', ground: 'assets/themes/winter/ground-front.webp' },
    spring: { sky: 'assets/themes/spring/sky.webp', far: 'assets/themes/spring/far.webp', mid: 'assets/themes/spring/mid.webp', near: 'assets/themes/spring/near.webp', ground: 'assets/themes/spring/ground.webp' },
    summer: { sky: 'assets/themes/summer/sky.webp', far: 'assets/themes/summer/far.webp', mid: 'assets/themes/summer/mid.webp', near: 'assets/themes/summer/near.webp', ground: 'assets/themes/summer/ground.webp', prop: 'assets/themes/summer/windmill-prop.webp' },
    autumn: { sky: 'assets/themes/autumn/sky.webp', far: 'assets/themes/autumn/far.webp', mid: 'assets/themes/autumn/mid.webp', near: 'assets/themes/autumn/near.webp', ground: 'assets/themes/autumn/ground.webp', prop: 'assets/themes/autumn/scarecrow-prop.webp' },
};
const SCENE_LAYOUT = {
    winter: { far: [0.15, 0.76], mid: [0.36, 0.62], near: [0.18, 0.70], groundSurface: 0.75 },
    spring: { far: [0.15, 0.75], mid: [0.32, 0.65], near: [0.00, 0.90], groundSurface: 0.70 },
    summer: { far: [0.15, 0.75], mid: [0.34, 0.64], near: [0.10, 0.80], groundSurface: 0.69 },
    autumn: { far: [0.15, 0.75], mid: [0.18, 0.78], near: [0.00, 0.90], groundSurface: 0.70 },
};
const sceneAssets = {};
const sceneAssetState = { winter: 'loading', spring: 'loading', summer: 'loading', autumn: 'loading' };
let groundFrontCache = null;
const winterReeds = new Image();
winterReeds.src = 'assets/themes/winter/winter-snow-reeds.webp';
const springFlowerBank = new Image();
springFlowerBank.src = 'assets/themes/spring/spring-flower-bank.webp';
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load ${src}`));
        image.src = src;
    });
}
function softenLayerEdges(image, fadeTop, clearLowAlpha = false) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const layerCtx = canvas.getContext('2d');
    layerCtx.drawImage(image, 0, 0);
    if (clearLowAlpha) {
        // Spring's near painting carries a low-alpha wash through the play lane.
        // Remove that wash while retaining the painted silhouettes and their soft edges.
        const pixels = layerCtx.getImageData(0, 0, canvas.width, canvas.height);
        for (let offset = 3; offset < pixels.data.length; offset += 4) {
            const alpha = pixels.data[offset];
            if (alpha <= 24)
                pixels.data[offset] = 0;
            else if (alpha < 64)
                pixels.data[offset] = Math.round(alpha * (alpha - 24) / 40);
        }
        layerCtx.putImageData(pixels, 0, 0);
    }
    layerCtx.globalCompositeOperation = 'destination-in';
    const fade = layerCtx.createLinearGradient(0, 0, 0, image.naturalHeight);
    fade.addColorStop(0, fadeTop ? 'rgba(255,255,255,0)' : '#fff');
    if (fadeTop)
        fade.addColorStop(0.10, '#fff');
    fade.addColorStop(0.73, '#fff');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    layerCtx.fillStyle = fade;
    layerCtx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}
function softenSkyTop(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const paint = canvas.getContext('2d');
    paint.drawImage(image, 0, 0);
    paint.globalCompositeOperation = 'destination-in';
    const edge = paint.createLinearGradient(0, 0, 0, image.naturalHeight * 0.10);
    edge.addColorStop(0, 'rgba(255,255,255,0)');
    edge.addColorStop(1, '#fff');
    paint.fillStyle = edge;
    paint.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}
for (const theme of THEME_ORDER) {
    const paths = SCENE_ASSET_PATHS[theme];
    const layout = SCENE_LAYOUT[theme];
    const layers = Promise.all([paths.sky, paths.far, paths.mid, paths.near, paths.ground].map(preloadImage));
    const propAsset = paths.prop ? preloadImage(paths.prop).catch(error => { console.warn(`${theme} landmark art unavailable.`, error); return null; }) : Promise.resolve(null);
    const continuousImages = theme === 'winter'
        ? [winterContinuousWorld, winterUpperSky, winterStarfield]
        : [seasonContinuousArt[theme].world, seasonContinuousArt[theme].upper, seasonContinuousArt[theme].starfield];
    const continuousWorld = Promise.all(continuousImages.map(image => image.decode())).catch(error => {
        console.warn(`${theme} continuous world unavailable; using the earlier scenery.`, error);
    });
    void Promise.all([layers, propAsset, continuousWorld]).then(([[sky, far, mid, near, ground], prop]) => {
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
function loadThemeImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}
const THEME_ART = {};
function ensureLegacyArt(theme) {
    if (THEME_ART[theme])
        return;
    THEME_ART[theme] = {
        bg: loadThemeImage(`assets/seasonal/${theme}-painted-bg.png`),
        ground: loadThemeImage(`assets/seasonal/${theme}-painted-ground.png`),
    };
}
const OBJECT_BOUNDS = {
    winter: [{ x: 95, y: 88, w: 513, h: 577 }, { x: 704, y: 88, w: 629, h: 580 }, { x: 1437, y: 76, w: 570, h: 616 }],
    spring: [{ x: 138, y: 74, w: 391, h: 601 }, { x: 693, y: 87, w: 605, h: 584 }, { x: 1368, y: 63, w: 645, h: 606 }],
    summer: [{ x: 25, y: 60, w: 630, h: 625 }, { x: 698, y: 77, w: 667, h: 609 }, { x: 1365, y: 40, w: 670, h: 680 }],
    autumn: [{ x: 59, y: 74, w: 623, h: 603 }, { x: 682, y: 27, w: 582, h: 677 }, { x: 1376, y: 72, w: 618, h: 614 }],
};
const INTERACTION_ASSET_PATHS = {
    winter: { objects: 'assets/themes/winter/objects-atlas.webp', airborne: 'assets/themes/winter/airborne-atlas.webp' },
    spring: { objects: 'assets/themes/spring/objects-atlas.webp', airborne: 'assets/themes/spring/airborne-atlas.webp' },
    summer: { objects: 'assets/themes/summer/objects-atlas.webp', airborne: 'assets/themes/summer/airborne-atlas.webp' },
    autumn: { objects: 'assets/themes/autumn/objects-atlas.webp', airborne: 'assets/themes/autumn/airborne-atlas.webp' },
};
const interactionAssets = {};
const interactionAssetState = { winter: 'loading', spring: 'loading', summer: 'loading', autumn: 'loading' };
for (const theme of THEME_ORDER) {
    const paths = INTERACTION_ASSET_PATHS[theme];
    void Promise.all([preloadImage(paths.objects), preloadImage(paths.airborne)]).then(([objects, airborne]) => {
        interactionAssets[theme] = { objects, airborne };
        interactionAssetState[theme] = 'ready';
    }).catch(error => {
        console.error(`${theme} object art preload failed; using vector fallbacks.`, error);
        interactionAssetState[theme] = 'failed';
    });
}
function selectedArtLoading() {
    return interactionAssetState[selectedTheme] === 'loading' || sceneAssetState[selectedTheme] === 'loading'
        || upperRealmArt[selectedTheme].state === 'loading'
        || (selectedCharacter !== 'zima' && companionArtState[selectedCharacter] === 'loading');
}
function atlasFrame(index) {
    const packed = CLEAN_FRAME_INDEX.get(index);
    if (packed === undefined)
        throw new Error(`Missing Zima pose ${index} from the clean atlas`);
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
const animRanges = {
    idle: { frames: [0], fps: 1, loop: true },
    walk: { frames: [32, 38, 45, 51, 58, 64, 70, 77, 83, 90], fps: 16, loop: true },
    crouch: { frames: [96, 100, 104, 108], fps: 12, loop: true },
    launch: { frames: [112, 115, 118, 121, 124], fps: 18, loop: false },
    rise: { frames: [128, 136, 144, 152], fps: 12, loop: true },
    apex: { frames: [160, 164, 168, 172], fps: 10, loop: true },
    fall: { frames: [176, 184, 192, 200], fps: 12, loop: true },
    land: { frames: [208, 224, 239], fps: 24, loop: false },
    groundLand: { frames: [229, 250, 255], fps: 12, loop: false },
    undersideContact: { frames: [112, 115, 118], fps: 18, loop: false },
    boostContact: { frames: [118, 121, 124], fps: 18, loop: false },
};
const CLEAN_FRAME_IDS = Array.from(new Set(Object.values(animRanges).flatMap(spec => spec.frames))).sort((a, b) => a - b);
const CLEAN_FRAME_INDEX = new Map(CLEAN_FRAME_IDS.map((id, packed) => [id, packed]));
// Alpha-measured lowest solid paw pixel for each selected grounded pose.
const GROUND_CONTACT_Y = {
    0: 280, 32: 278, 38: 281, 45: 277, 51: 281, 58: 274,
    64: 276, 70: 274, 77: 281, 83: 277, 90: 281,
    96: 287, 100: 287, 104: 286, 108: 287,
    208: 287, 224: 280, 239: 287, 229: 283, 250: 280, 255: 280,
};
let width = 1280;
let height = 720;
let dpr = 1;
let state = 'title';
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
let inputMode = 'none';
let audioStarted = false;
let audioCtx = null;
let masterGain = null;
let musicGain = null;
let effectsGain = null;
let brushBuffer = null;
let musicNext = 0;
let musicBar = 0;
let musicChapterBand = -1;
let musicLift = 0;
let musicDescending = false;
let gameSeed = 0;
let launchBuffer = 0;
let sparks = [];
let groundMarks = [];
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
let animState = 'idle';
let animStateTime = 0;
let contactAnimHold = 0;
let turnTime = TURN_DURATION;
let turnFrom = 1;
let lastBellContactDirection = 'top';
let cameraShake = 0;
let nextBonusBell = 50;
let bounceHold = 0;
let fieldDrop = 0;
let bounceChain = 0;
let pendingBounce = 0;
let paused = false;
let muted = localStorage.getItem('zima-skybells-muted') === '1';
function savedAudioLevel(key) {
    const stored = localStorage.getItem(key);
    if (stored === null)
        return 1;
    const value = Number(stored);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}
let musicLevel = savedAudioLevel('zima-skybells-music-level');
let effectsLevel = savedAudioLevel('zima-skybells-effects-level');
const savedTheme = localStorage.getItem('zima-skybells-theme');
const savedMode = localStorage.getItem('zima-skybells-mode');
const savedCharacter = localStorage.getItem('zima-skybells-character');
let selectedTheme = THEME_ORDER.includes(savedTheme) ? savedTheme : 'winter';
let selectedMode = savedMode === 'zen' || savedMode === 'expedition' ? savedMode : 'classic';
let selectedCharacter = CHARACTER_ORDER.includes(savedCharacter) ? savedCharacter : 'zima';
let themeCardRects = [];
let modeCardRects = [];
let titleStartRect = null;
let menuRect = null;
let scoreboardOpen = false;
let scoreboardMode = selectedMode;
let scoreboardPage = 0;
let scoreboardPageCount = 1;
let scoreboardPrevRect = null;
let scoreboardNextRect = null;
let scoreboardModeRects = [];
function parseStoredScore(value) {
    if (typeof value === 'string' && /^\d+$/.test(value))
        return { score: BigInt(value), approximate: false };
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
let scoreHistory = (() => {
    try {
        const saved = JSON.parse(localStorage.getItem('zima-skybells-scores') || '[]');
        return Array.isArray(saved) ? saved.flatMap(r => {
            const parsed = parseStoredScore(r?.score);
            if (!parsed || !Number.isSafeInteger(r.bounces) || !Number.isSafeInteger(r.multiplier) ||
                !THEME_ORDER.includes(r.theme) || (r.mode !== 'classic' && r.mode !== 'zen' && r.mode !== 'expedition'))
                return [];
            return [{ score: parsed.score, approximate: Boolean(r.approximate) || parsed.approximate,
                    bounces: r.bounces, multiplier: r.multiplier,
                    retries: Number.isSafeInteger(r.retries) ? r.retries : undefined, theme: r.theme, mode: r.mode,
                    cat: CHARACTER_ORDER.includes(r.cat) ? r.cat : 'zima',
                    at: Number.isFinite(r.at) ? r.at : 0 }];
        }) : [];
    }
    catch {
        return [];
    }
})();
const legacyBest = parseStoredScore(localStorage.getItem('zima-skybells-legacy-best') || localStorage.getItem('zima-skybells-best'));
if (legacyBest) {
    legacyBest.approximate ||= localStorage.getItem('zima-skybells-legacy-best-approx') === '1';
    localStorage.setItem('zima-skybells-legacy-best', legacyBest.score.toString());
    localStorage.setItem('zima-skybells-legacy-best-approx', legacyBest.approximate ? '1' : '0');
}
const GAME_MODES = ['classic', 'zen', 'expedition'];
function openScoreboard() {
    scoreboardMode = selectedMode;
    scoreboardPage = 0;
    scoreboardOpen = true;
    document.querySelector('#close-scores')?.focus();
}
function closeScoreboard() {
    scoreboardOpen = false;
    if (state === 'title')
        document.querySelector('#open-scores')?.focus();
    else
        canvas.focus();
}
let lastMenuUi = '';
let lastBoardUi = '';
function syncDomUi() {
    if (menuOverlay) {
        menuOverlay.hidden = state !== 'title' || scoreboardOpen;
        const signature = `${selectedTheme}|${selectedMode}|${selectedCharacter}|${bestForMode()}|${selectedArtLoading()}`;
        if (signature !== lastMenuUi) {
            lastMenuUi = signature;
            menuOverlay.style.setProperty('--accent', themeMeta().accent);
            menuOverlay.querySelectorAll('[data-season]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === selectedTheme)));
            menuOverlay.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === selectedMode)));
            menuOverlay.querySelectorAll('[data-character]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.character === selectedCharacter)));
            const desc = menuOverlay.querySelector('#menu-description');
            if (desc)
                desc.textContent = `${CHARACTER_META[selectedCharacter].name} explores ${themeMeta().subtitle.toLowerCase()}. ${selectedMode === 'expedition' ? 'Reach the summit through two base camps.' : selectedMode === 'zen' ? 'Land safely and launch again with your score.' : 'Keep the chain alive for your best climb.'}`;
            const best = menuOverlay.querySelector('#menu-best');
            if (best)
                best.textContent = `${selectedMode.toUpperCase()} best: ${formatScore(bestForMode())}`;
            const start = menuOverlay.querySelector('#start-game');
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
            boardOverlay.querySelectorAll('[data-board-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.boardMode === scoreboardMode)));
            const summary = boardOverlay.querySelector('#board-summary');
            if (summary) {
                summary.replaceChildren();
                const line = (label, value) => {
                    const p = document.createElement('p');
                    const strong = document.createElement('strong');
                    strong.textContent = `${label}: `;
                    p.append(strong, document.createTextNode(value));
                    summary.append(p);
                };
                line('Best', `${formatScore(bestForMode(scoreboardMode))}${bestIsApproximate(scoreboardMode) ? ' (approximate legacy value)' : ''}`);
                if (scoreboardMode === selectedMode)
                    line('Current', formatScore(score));
                if (legacyBest?.score)
                    line('Legacy best, mode unknown', `${formatScore(legacyBest.score)}${legacyBest.approximate ? ' (approximate)' : ''}`);
            }
            const list = boardOverlay.querySelector('#board-records');
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
                    meta.textContent = `#${index + 1} · ${CHARACTER_META[run.cat].name} · ${run.theme.toUpperCase()} · ${run.bounces} bounces · x${run.multiplier}${run.retries !== undefined ? ` · ${run.retries} retries` : ''}${run.approximate ? ' · approximate' : ''}`;
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
    const musicSlider = menuOverlay.querySelector('#music-level');
    const effectsSlider = menuOverlay.querySelector('#effects-level');
    if (musicSlider) {
        musicSlider.value = String(Math.round(musicLevel * 100));
        musicSlider.addEventListener('input', () => {
            musicLevel = Number(musicSlider.value) / 100;
            localStorage.setItem('zima-skybells-music-level', String(musicLevel));
            if (musicGain && audioCtx)
                musicGain.gain.setTargetAtTime(0.87 * musicLevel, audioCtx.currentTime, 0.025);
        });
    }
    if (effectsSlider) {
        effectsSlider.value = String(Math.round(effectsLevel * 100));
        effectsSlider.addEventListener('input', () => {
            effectsLevel = Number(effectsSlider.value) / 100;
            localStorage.setItem('zima-skybells-effects-level', String(effectsLevel));
            if (effectsGain && audioCtx)
                effectsGain.gain.setTargetAtTime(0.94 * effectsLevel, audioCtx.currentTime, 0.025);
        });
    }
    const characterOptions = menuOverlay.querySelector('#character-options');
    for (const character of CHARACTER_ORDER) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.character = character;
        button.setAttribute('aria-pressed', String(character === selectedCharacter));
        button.setAttribute('aria-label', `Play as ${CHARACTER_META[character].name}`);
        const portrait = document.createElement('img');
        portrait.src = CHARACTER_META[character].portrait;
        portrait.alt = '';
        const name = document.createElement('span');
        name.textContent = CHARACTER_META[character].name;
        const hint = document.createElement('small');
        hint.textContent = CHARACTER_META[character].hint;
        button.append(portrait, name, hint);
        button.addEventListener('click', () => setCharacter(character));
        characterOptions?.append(button);
    }
    const seasonOptions = menuOverlay.querySelector('#season-options');
    for (const theme of THEME_ORDER) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.season = theme;
        button.setAttribute('aria-pressed', String(theme === selectedTheme));
        const name = document.createElement('span');
        name.textContent = THEME_META[theme].label;
        const hint = document.createElement('small');
        hint.textContent = `${THEME_META[theme].normal} · ${THEME_META[theme].airborne}`;
        button.append(name, hint);
        button.addEventListener('click', () => setTheme(theme));
        seasonOptions?.append(button);
    }
    const modeOptions = menuOverlay.querySelector('#mode-options');
    const modeHints = { classic: 'Endless climb', zen: 'Safe landings', expedition: 'Summit quest' };
    for (const mode of GAME_MODES) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.mode = mode;
        button.setAttribute('aria-pressed', String(mode === selectedMode));
        const name = document.createElement('span');
        name.textContent = mode.toUpperCase();
        const hint = document.createElement('small');
        hint.textContent = modeHints[mode];
        button.append(name, hint);
        button.addEventListener('click', () => setGameMode(mode));
        modeOptions?.append(button);
    }
    menuOverlay.querySelector('#start-game')?.addEventListener('click', activate);
    menuOverlay.querySelector('#open-scores')?.addEventListener('click', openScoreboard);
}
if (boardOverlay) {
    const tabs = boardOverlay.querySelector('#board-modes');
    for (const mode of GAME_MODES) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.boardMode = mode;
        button.textContent = mode.toUpperCase();
        button.addEventListener('click', () => { scoreboardMode = mode; scoreboardPage = 0; });
        tabs?.append(button);
    }
    boardOverlay.querySelector('#close-scores')?.addEventListener('click', closeScoreboard);
}
const bestByMode = { classic: 0n, zen: 0n, expedition: 0n };
for (const mode of GAME_MODES) {
    const saved = parseStoredScore(localStorage.getItem(`zima-skybells-best-${mode}`));
    if (saved)
        bestByMode[mode] = saved.score;
}
for (const run of scoreHistory)
    if (run.score > bestByMode[run.mode])
        bestByMode[run.mode] = run.score;
for (const mode of GAME_MODES)
    localStorage.setItem(`zima-skybells-best-${mode}`, bestByMode[mode].toString());
function bestForMode(mode = selectedMode) { return bestByMode[mode]; }
function bestIsApproximate(mode = selectedMode) {
    if (mode === selectedMode && score === bestByMode[mode] && score > 0n)
        return false;
    return scoreHistory.some(run => run.mode === mode && run.score === bestByMode[mode] && run.approximate);
}
function formatScore(value) { return value.toLocaleString('en-US'); }
function tierPoints(kind) { return kind === 'crystal' ? 30 : kind === 'silver' ? 20 : 10; }
function awardPoints(base) {
    score += BigInt(base) * BigInt(multiplier);
    if (selectedMode !== 'expedition' && score > bestByMode[selectedMode])
        bestByMode[selectedMode] = score;
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
let bells = [];
let moths = [];
let snow = [];
let stars = [];
const keys = new Set();
function rand(min = 0, max = 1) {
    gameSeed = (gameSeed * 1664525 + 1013904223) >>> 0;
    return min + (gameSeed / 4294967296) * (max - min);
}
function themeMeta() {
    return THEME_META[selectedTheme];
}
function setTheme(theme) {
    selectedTheme = theme;
    scarfArtCache.clear();
    companionTintCache.clear();
    localStorage.setItem('zima-skybells-theme', theme);
    rebuildBackdrop();
    prepareUpperTerrain(theme);
    if (audioCtx) {
        musicNext = audioCtx.currentTime + 0.08;
        musicBar = 0;
        musicChapterBand = -1;
    }
}
function setGameMode(mode) {
    selectedMode = mode;
    localStorage.setItem('zima-skybells-mode', mode);
}
function setCharacter(character) {
    if (selectedCharacter !== character) {
        scarfArtCache.clear();
        companionTintCache.clear();
    }
    selectedCharacter = character;
    localStorage.setItem('zima-skybells-character', character);
}
function recordScore() {
    if (score <= 0n || bellCount <= 0)
        return;
    if (selectedMode === 'expedition' && state !== 'expeditionComplete')
        return;
    if (score > bestByMode[selectedMode])
        bestByMode[selectedMode] = score;
    localStorage.setItem(`zima-skybells-best-${selectedMode}`, bestByMode[selectedMode].toString());
    scoreHistory.push({ score, bounces: bellCount, multiplier,
        retries: selectedMode === 'expedition' ? expeditionRetries : undefined,
        theme: selectedTheme, mode: selectedMode, cat: selectedCharacter, at: Date.now() });
    scoreHistory.sort((a, b) => a.score === b.score ? b.at - a.at : a.score > b.score ? -1 : 1);
    scoreHistory = scoreHistory.filter((run, index) => scoreHistory.slice(0, index).filter(other => other.mode === run.mode).length < 40);
    localStorage.setItem('zima-skybells-scores', JSON.stringify(scoreHistory.map(run => ({ ...run, score: run.score.toString() }))));
}
function returnToTitle() {
    if (state === 'playing' || state === 'falling' || state === 'zenGrounded')
        recordScore();
    state = 'title';
    paused = false;
    syncMasterAudio();
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
function pointInRect(x, y, r) {
    return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function seasonStroke() {
    return selectedTheme === 'winter' ? '#eff9ff' : selectedTheme === 'spring' ? '#ffffff' : selectedTheme === 'summer' ? '#fff6cc' : '#fff0cf';
}
function seasonPanelFill(alpha = 0.50) {
    const a = alpha.toFixed(2);
    if (selectedTheme === 'winter')
        return `rgba(5,19,32,${a})`;
    if (selectedTheme === 'spring')
        return `rgba(29,67,73,${a})`;
    if (selectedTheme === 'summer')
        return `rgba(58,72,22,${a})`;
    return `rgba(64,35,18,${a})`;
}
function drawCoverImage(img, x, y, w, h, alpha = 1, focusY = 0.5, target = ctx) {
    if (img instanceof HTMLImageElement && !img.complete)
        return;
    const sourceWidth = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    const sourceHeight = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
    if (sourceWidth <= 0 || sourceHeight <= 0)
        return;
    const srcAspect = sourceWidth / sourceHeight;
    const dstAspect = w / h;
    let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
    if (srcAspect > dstAspect) {
        sw = sourceHeight * dstAspect;
        sx = (sourceWidth - sw) / 2;
    }
    else {
        sh = sourceWidth / dstAspect;
        sy = Math.max(0, Math.min(sourceHeight - sh, sourceHeight * focusY - sh * focusY));
    }
    target.save();
    target.globalAlpha = alpha;
    target.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    target.restore();
}
function drawPaintedBackdrop() {
    const art = THEME_ART[selectedTheme]?.bg;
    const top = height * 0.06;
    const h = Math.max(340, height * 0.64);
    if (art)
        drawCoverImage(art, 0, top, width, h, selectedTheme === 'winter' ? 0.72 : 0.78);
    const wash = ctx.createLinearGradient(0, top, 0, top + h);
    wash.addColorStop(0, selectedTheme === 'winter' ? 'rgba(4,15,29,.22)' : 'rgba(255,255,255,.04)');
    wash.addColorStop(0.72, 'rgba(255,255,255,0)');
    wash.addColorStop(1, selectedTheme === 'winter' ? 'rgba(9,29,43,.28)' : selectedTheme === 'spring' ? 'rgba(82,136,123,.14)' : selectedTheme === 'summer' ? 'rgba(102,128,57,.12)' : 'rgba(116,65,30,.16)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, top, width, h);
}
function drawPaintedGround(baseY) {
    if (cameraY > height * 0.95)
        return;
    const art = THEME_ART[selectedTheme]?.ground;
    const h = Math.min(285, Math.max(210, height * 0.31));
    const y = baseY - h + 34;
    if (art)
        drawCoverImage(art, 0, y, width, h, 0.92);
    const fade = ctx.createLinearGradient(0, y, 0, y + h);
    fade.addColorStop(0, 'rgba(255,255,255,0)');
    fade.addColorStop(0.82, 'rgba(255,255,255,0)');
    fade.addColorStop(1, selectedTheme === 'winter' ? 'rgba(177,207,221,.30)' : selectedTheme === 'spring' ? 'rgba(84,146,86,.22)' : selectedTheme === 'summer' ? 'rgba(85,139,59,.20)' : 'rgba(129,78,34,.24)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, y, width, h);
}
function drawSceneLayer(layer, opacity = 1) {
    // Each band moves independently. The ground itself stays tied to world Y = 0.
    if (opacity <= 0)
        return;
    const y = height * layer.top + backdropCameraY * layer.depth;
    drawCoverImage(layer.image, 0, y, width, height * layer.height, opacity);
}
function drawNearSceneLayer(layer) {
    // Transparent edge art needs its complete silhouettes. Fit it without
    // cropping, then anchor the two sides to the viewport when space opens up.
    const sourceWidth = layer.image instanceof HTMLImageElement ? layer.image.naturalWidth : layer.image.width;
    const sourceHeight = layer.image instanceof HTMLImageElement ? layer.image.naturalHeight : layer.image.height;
    if (!sourceWidth || !sourceHeight)
        return;
    const layerHeight = height * layer.height;
    const scale = Math.min(layerHeight / sourceHeight, width / sourceWidth);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const y = height * layer.top + backdropCameraY * layer.depth + layerHeight - drawHeight;
    if (drawWidth >= width - 1) {
        ctx.drawImage(layer.image, 0, y, drawWidth, drawHeight);
        return;
    }
    const halfSource = sourceWidth / 2;
    const halfDraw = drawWidth / 2;
    ctx.drawImage(layer.image, 0, 0, halfSource, sourceHeight, 0, y, halfDraw, drawHeight);
    ctx.drawImage(layer.image, halfSource, 0, sourceWidth - halfSource, sourceHeight, width - halfDraw, y, halfDraw, drawHeight);
}
function drawSceneBackdrop(art) {
    ctx.fillStyle = selectedTheme === 'winter' ? '#081e40' : selectedTheme === 'spring' ? '#849be0' : selectedTheme === 'summer' ? '#3a94e9' : '#4a2c50';
    ctx.fillRect(0, 0, width, height);
    // The one painted sky travels below the camera as altitude increases.
    // A softened top edge leaves the atmosphere open without repeating clouds
    // or celestial objects at every height.
    // Stretch the single sky downward as the camera rises while keeping its top
    // in frame. Translating the whole image exposed a flat-colored top strip.
    const skyTravel = Math.max(0, backdropCameraY - 3000) * 0.025;
    const skyOpacity = 1 - chapterEase((backdropCameraY - 9000) / 11000);
    if (skyOpacity > 0)
        drawCoverImage(art.sky, 0, 0, width, height + skyTravel, skyOpacity);
}
function drawSceneGround(art) {
    const groundY = worldToScreenY(GROUND_Y);
    const layerHeight = Math.max(270, height * art.groundHeight);
    // Align the painted center walking surface with Zima's world-space feet.
    drawCoverImage(art.ground, 0, groundY - layerHeight * art.groundSurface, width, layerHeight, 1, art.groundSurface);
    if (selectedTheme === 'winter' || selectedTheme === 'spring')
        drawGroundCutouts(groundY, false);
}
function drawGroundCutouts(groundY, inFront) {
    const detail = selectedTheme === 'winter' ? winterReeds : springFlowerBank;
    if (!detail.complete || !detail.naturalWidth || groundY < -120 || groundY > height + 130)
        return;
    const spots = inFront ? [0.07, 0.93] : [0.25, 0.75];
    const w = Math.min(132, Math.max(72, width * (inFront ? 0.105 : 0.075)));
    const h = w * detail.naturalHeight / detail.naturalWidth;
    for (let i = 0; i < spots.length; i++) {
        const x = width * spots[i];
        const sway = Math.sin(elapsed * 1.25 + i * 2.1) * 0.012;
        ctx.save();
        ctx.translate(x, groundY + (inFront ? 17 : 13));
        ctx.rotate(sway);
        if (i === 1)
            ctx.scale(-1, 1);
        ctx.globalAlpha = inFront ? 0.95 : 0.76;
        ctx.drawImage(detail, -w / 2, -h, w, h);
        ctx.restore();
    }
}
function groundFrontImage(art) {
    const layerHeight = Math.max(270, height * art.groundHeight);
    const key = `${selectedTheme}:${width}:${layerHeight}`;
    if (groundFrontCache?.key === key)
        return groundFrontCache.image;
    const image = document.createElement('canvas');
    image.width = width;
    image.height = Math.ceil(layerHeight);
    const paint = image.getContext('2d');
    drawCoverImage(art.ground, 0, 0, width, layerHeight, 1, art.groundSurface, paint);
    // Use registered pixels from the existing painting for a few nearby props.
    // Replaying the entire edge image would hide Zima, so each front shape has
    // a soft, bounded mask and the central play lane stays unobstructed.
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = Math.ceil(layerHeight);
    const m = mask.getContext('2d');
    const surface = layerHeight * art.groundSurface;
    const props = {
        winter: [[0.12, -4, 0.05, 25], [0.88, -4, 0.05, 25]],
        spring: [[0.11, -6, 0.05, 30], [0.89, -6, 0.05, 30]],
        summer: [[0.13, -5, 0.085, 40], [0.87, -5, 0.085, 40]],
        autumn: [[0.09, -2, 0.075, 32], [0.91, -2, 0.075, 32]],
    };
    for (const [cx, cy, rx, ry] of props[selectedTheme]) {
        m.save();
        m.translate(width * cx, surface + cy);
        m.scale(width * rx, ry);
        const softness = m.createRadialGradient(0, 0, 0, 0, 0, 1);
        softness.addColorStop(0, '#fff');
        softness.addColorStop(0.70, '#fff');
        softness.addColorStop(1, 'rgba(255,255,255,0)');
        m.fillStyle = softness;
        m.fillRect(-1, -1, 2, 2);
        m.restore();
    }
    // A few registered surface pixels overlap the paws instead of a drawn arc.
    const winter = selectedTheme === 'winter';
    const lip = m.createLinearGradient(0, surface - (winter ? 20 : 13), 0, surface + (winter ? 15 : 10));
    lip.addColorStop(0, 'rgba(255,255,255,0)');
    lip.addColorStop(0.55, 'rgba(255,255,255,0.52)');
    lip.addColorStop(1, 'rgba(255,255,255,0)');
    m.fillStyle = lip;
    m.fillRect(0, surface - (winter ? 20 : 13), width, winter ? 35 : 23);
    paint.globalCompositeOperation = 'destination-in';
    paint.drawImage(mask, 0, 0);
    groundFrontCache = { key, image };
    return image;
}
function drawSceneFront(art) {
    const groundY = worldToScreenY(GROUND_Y);
    const layerHeight = Math.max(270, height * art.groundHeight);
    const top = groundY - layerHeight * art.groundSurface;
    if (top > height || top + layerHeight < 0)
        return;
    ctx.drawImage(groundFrontImage(art), 0, top);
    if (selectedTheme === 'winter' || selectedTheme === 'spring')
        drawGroundCutouts(groundY, true);
}
function drawSceneProp(art) {
    if (!art.prop)
        return;
    const isSummer = selectedTheme === 'summer';
    const propHeight = height * (isSummer ? 0.25 : 0.20);
    const propWidth = propHeight * art.prop.naturalWidth / art.prop.naturalHeight;
    const x = width * (isSummer ? 0.33 : 0.73);
    const baseY = worldToScreenY(GROUND_Y);
    // Landmarks share the ground's world anchor and fade as their bases leave view.
    const visibleBase = Math.max(0, Math.min(1, (height + 40 - baseY) / (propHeight * 0.45)));
    if (visibleBase <= 0)
        return;
    ctx.save();
    ctx.globalAlpha = 0.94 * visibleBase;
    ctx.drawImage(art.prop, x - propWidth / 2, baseY - propHeight, propWidth, propHeight);
    ctx.restore();
}
function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    width = Math.max(640, window.innerWidth);
    height = Math.max(480, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundFrontCache = null;
    if (!pointerActive)
        mouseX = width / 2;
    rebuildBackdrop();
    if (state === 'title') {
        cat.x = width / 2;
        cat.y = GROUND_Y;
    }
}
function rebuildBackdrop() {
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
function setReadyState() {
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
    syncMasterAudio();
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
function resetGame() {
    gameSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    setReadyState();
}
function launchRun() {
    if (state !== 'ready' && state !== 'zenGrounded' && state !== 'expeditionCheckpoint')
        return;
    state = 'playing';
    const firstBell = bells.find(b => !b.touched && bellTop(b) > cat.y + 70);
    cat.vy = firstBell ? jumpVelocityFor(cat.y, cat.x, firstBell) : PHYS.firstBounce;
    cat.prevY = cat.y;
    descentPeakY = cat.y;
    setAnimState('launch');
    ensureAudio();
    if (audioCtx?.state === 'suspended')
        void audioCtx.resume();
    ping(523.25, 0.05, 0.10, 'sine');
}
function bellWorldY(bell) {
    return bell.y - fieldDrop;
}
function firstBellAtOrAbove(worldY) {
    const target = worldY + fieldDrop;
    let low = 0, high = bells.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (bells[middle].y < target)
            low = middle + 1;
        else
            high = middle;
    }
    return low;
}
function mothWorldY(moth) {
    return moth.flightWorldY ?? moth.y - fieldDrop;
}
function bellTop(bell) {
    return bellWorldY(bell) + bell.h * 0.58;
}
function jumpVelocityFor(fromY, fromX, target) {
    const dy = Math.max(80, bellTop(target) - fromY);
    const dx = Math.abs(target.x - fromX);
    const desiredPeak = dy + 105 + Math.min(135, dx * 0.13);
    return Math.max(1100, Math.min(1480, Math.sqrt(2 * -PHYS.gravity * desiredPeak)));
}
function flightTimeToHeight(v0, dy) {
    const g = -PHYS.gravity;
    const disc = Math.max(0, v0 * v0 - 2 * g * dy);
    return (v0 + Math.sqrt(disc)) / g;
}
function targetWidthFor(ordinal) {
    let base = 84 + 10 * (1 - Math.cos((ordinal - 600) * 0.13));
    if (ordinal <= 100)
        base = 112 - (ordinal - 1) * (10 / 99);
    else if (ordinal <= 200)
        base = 102 - (ordinal - 100) * 0.06;
    else if (ordinal <= 600)
        base = 96 - (ordinal - 200) * 0.03;
    const viewportGain = 1 + Math.min(0.18, Math.max(0, (height - 768) / 672) * 0.18);
    const progress = Math.min(1, Math.max(0, (ordinal - 1) / 100));
    return base * (1 + (viewportGain - 1) * progress);
}
function generateInitialPath(startOrdinal = 1, startY = 205) {
    let y = startY;
    let x = width * 0.52;
    let prevTop = startY - 205;
    for (let i = 0; i < 10; i++) {
        const ordinal = startOrdinal + i;
        const gap = rand(235, 300 + i * 4);
        const w = targetWidthFor(ordinal);
        const nextY = y;
        const temp = makeBell(x, nextY, w, ordinal);
        const v0 = jumpVelocityFor(prevTop, x, temp);
        const t = flightTimeToHeight(v0, Math.max(1, bellTop(temp) - prevTop));
        const maxDx = Math.min(width * 0.42, PHYS.maxSpeed * t * 0.72);
        if (i === 0) {
            x = width * 0.5 + rand(-24, 24);
        }
        else {
            const direction = rand() > 0.5 ? 1 : -1;
            x += direction * rand(maxDx * 0.24, maxDx * (i === 1 ? 0.45 : 0.82));
        }
        x = Math.max(w * 0.75 + 22, Math.min(width - w * 0.75 - 22, x));
        const bell = makeBell(x, nextY, w, ordinal);
        bells.push(bell);
        prevTop = bellTop(bell);
        y += gap;
    }
}
function makeBell(x, y, w, ordinal) {
    const roll = rand();
    const kind = ordinal < 8 ? 'bronze' : roll < 0.08 ? 'crystal' : roll < 0.30 ? 'silver' : 'bronze';
    const boost = kind === 'crystal' ? 210 : kind === 'silver' ? 105 : 0;
    return {
        id: ordinal,
        x,
        y,
        w,
        h: Math.max(24, w * 0.58),
        touched: false,
        scored: false,
        lastHit: -999,
        phase: rand(0, TAU),
        value: tierPoints(kind),
        kind,
        boost,
    };
}
function extendPath() {
    if (!bells.length)
        return;
    let lastBell = bells[bells.length - 1];
    while (bellWorldY(lastBell) < cameraY + height * 2.45) {
        const ordinal = lastBell.id + 1;
        const altitude = lastBell.y;
        const gap = rand(260, 355 + Math.min(70, altitude / 1050));
        const w = targetWidthFor(ordinal);
        const y = lastBell.y + gap;
        const probe = makeBell(lastBell.x, y, w, ordinal);
        const v0 = jumpVelocityFor(bellTop(lastBell), lastBell.x, probe);
        const t = flightTimeToHeight(v0, Math.max(1, bellTop(probe) - bellTop(lastBell)));
        const reachableDx = Math.min(width * 0.46, PHYS.maxSpeed * t * 0.76);
        let dx = rand(reachableDx * 0.30, reachableDx * 0.88) * (rand() > 0.5 ? 1 : -1);
        let x = lastBell.x + dx;
        if (x < w * 0.75 + 22 || x > width - w * 0.75 - 22) {
            dx *= -1;
            x = lastBell.x + dx;
        }
        x = Math.max(w * 0.75 + 22, Math.min(width - w * 0.75 - 22, x));
        const next = makeBell(x, y, w, ordinal);
        bells.push(next);
        if (ordinal >= nextBonusBell) {
            maybeSpawnMoth(lastBell.y + gap * rand(0.38, 0.68), ordinal);
            nextBonusBell += Math.floor(rand(ordinal < 120 ? 20 : 18, ordinal < 120 ? 27 : 24));
        }
        lastBell = next;
    }
    // Descended objects far below the ground cannot be seen or reused in Zen.
    let expired = 0;
    while (expired < bells.length - 1 && bellWorldY(bells[expired]) <= GROUND_Y - 180)
        expired++;
    if (expired)
        bells.splice(0, expired);
    const cutoff = cameraY - 300;
    moths = moths.filter(m => m.alive && mothWorldY(m) > cutoff - 160);
}
function maybeSpawnMoth(y, ordinal) {
    const dir = rand() > 0.5 ? 1 : -1;
    const pace = Math.min(1, Math.max(0, (ordinal - 18) / 150));
    // Give the painted body a readable crossing at every viewport width.
    const crossingTime = 3.2 - 0.5 * pace;
    const speed = (width + 160) / crossingTime * rand(0.92, 1.02);
    const entryDistance = speed * 0.25 + 70;
    const roll = rand();
    const kind = roll < 0.08 ? 'crystal' : roll < 0.30 ? 'silver' : 'bronze';
    moths.push({
        x: dir > 0 ? -entryDistance : width + entryDistance,
        prevX: dir > 0 ? -entryDistance : width + entryDistance,
        y,
        vx: speed * dir,
        phase: rand(0, TAU),
        alive: true,
        warned: false,
        kind,
    });
}
function worldToScreenY(worldY) {
    return height - 84 - (worldY - cameraY);
}
function addSparkBurst(x, y, count, color) {
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
function addSeasonBurst(x, y, intensity = 1) {
    const count = Math.round(8 * intensity);
    for (let i = 0; i < count; i++) {
        const ang = rand(-0.15 * Math.PI, 1.15 * Math.PI);
        const speed = rand(55, 170) * intensity;
        let kind = 'spark';
        let color = '#ffffff';
        if (selectedTheme === 'winter') {
            kind = 'snow';
            color = i % 3 === 0 ? '#d8f5ff' : '#ffffff';
        }
        else if (selectedTheme === 'spring') {
            kind = i % 3 === 0 ? 'droplet' : 'petal';
            color = kind === 'droplet' ? '#8ddcff' : (i % 2 ? '#ffd0e8' : '#ffffff');
        }
        else if (selectedTheme === 'summer') {
            kind = 'pollen';
            color = i % 3 === 0 ? '#fff7b8' : '#ffd75c';
        }
        else {
            kind = 'leaf';
            color = ['#d94f2e', '#ef8b35', '#f1b548', '#9d5b2b'][i % 4];
        }
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
function emitGroundStep() {
    const side = groundStepSide;
    groundStepSide *= -1;
    const x = cat.x + side * 17;
    groundMarks.push({ x, age: 0, life: selectedTheme === 'winter' ? 4 : 2.6, side, theme: selectedTheme });
    if (groundMarks.length > 40)
        groundMarks.shift();
    const kind = selectedTheme === 'winter' ? 'snow' : selectedTheme === 'spring' ? 'droplet' : selectedTheme === 'summer' ? 'pollen' : 'leaf';
    const color = selectedTheme === 'winter' ? '#eaf7ff' : selectedTheme === 'spring' ? '#a9e6bb' : selectedTheme === 'summer' ? '#ffe39a' : '#eaa151';
    for (let i = 0; i < 3; i++)
        sparks.push({
            x, y: GROUND_Y + 3, vx: rand(-36, 36), vy: rand(15, 58),
            ttl: rand(0.35, 0.7), life: 0, size: rand(1.3, 3), color, kind, spin: rand(-3, 3),
        });
}
function updateGroundTravel(distance) {
    if (distance < 0.25)
        return;
    groundTravel += distance;
    while (groundTravel >= nextGroundStep) {
        emitGroundStep();
        nextGroundStep += 38;
    }
}
function updateEffects(dt) {
    for (const mark of groundMarks)
        mark.age += dt;
    groundMarks = groundMarks.filter(mark => mark.age < mark.life);
    for (const s of sparks) {
        s.ttl -= dt;
        s.life += dt;
        s.x += s.vx * dt;
        s.y -= s.vy * dt;
        const gravity = s.kind === 'snow' || s.kind === 'pollen' ? 70 : s.kind === 'leaf' || s.kind === 'petal' ? 120 : 200;
        s.vy -= gravity * dt;
        if (s.kind === 'leaf' || s.kind === 'petal' || s.kind === 'snow')
            s.vx += Math.sin((s.life * 8) + s.spin) * 14 * dt;
    }
    sparks = sparks.filter(s => s.ttl > 0);
}
function setAnimState(next) {
    if (animState === next)
        return;
    animState = next;
    animStateTime = 0;
}
function updateAnimState(dt) {
    animStateTime += dt;
    if (state === 'title') {
        setAnimState('idle');
        return;
    }
    if (state === 'gameover' || state === 'zenGrounded' || state === 'expeditionCheckpoint' || state === 'expeditionComplete') {
        if ((state === 'zenGrounded' || state === 'expeditionCheckpoint') && launchBuffer > 0) {
            setAnimState('crouch');
            return;
        }
        if (animState === 'groundLand' && animStateTime < 0.25)
            return;
        if ((state === 'zenGrounded' || state === 'expeditionCheckpoint') && Math.abs(cat.vx) > 38)
            setAnimState('walk');
        else
            setAnimState('idle');
        return;
    }
    if (contactAnimHold > 0) {
        contactAnimHold = Math.max(0, contactAnimHold - dt);
        return;
    }
    if (state === 'ready') {
        if (launchBuffer > 0)
            setAnimState('crouch');
        else if (animState === 'walk' ? Math.abs(cat.vx) > 14 : Math.abs(cat.vx) > 38)
            setAnimState('walk');
        else
            setAnimState('idle');
        return;
    }
    if (cat.landedFlash > 0.01) {
        setAnimState('land');
        return;
    }
    if (cat.vy > 620)
        setAnimState('launch');
    else if (cat.vy > 170)
        setAnimState('rise');
    else if (cat.vy > -120)
        setAnimState('apex');
    else
        setAnimState('fall');
}
function syncMasterAudio() {
    if (audioCtx && masterGain) {
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setTargetAtTime(muted || paused ? 0 : 1, audioCtx.currentTime, 0.025);
    }
}
function toggleMute() {
    muted = !muted;
    localStorage.setItem('zima-skybells-muted', muted ? '1' : '0');
    syncMasterAudio();
    if (!muted && audioCtx)
        musicNext = audioCtx.currentTime + 0.08;
}
function togglePause() {
    if (state !== 'playing' && state !== 'ready')
        return;
    paused = !paused;
    syncMasterAudio();
    if (!paused && audioCtx)
        musicNext = audioCtx.currentTime + 0.08;
}
function update(dt) {
    if (scoreboardOpen) {
        if (!paused)
            updateMusic();
        return;
    }
    elapsed += dt;
    updateSnow(dt);
    if (!paused)
        updateMusic();
    if (messageTimer > 0)
        messageTimer -= dt;
    if (cat.landedFlash > 0)
        cat.landedFlash -= dt;
    updateEffects(dt);
    if (cameraShake > 0)
        cameraShake = Math.max(0, cameraShake - dt);
    if (state === 'playing' && !paused) {
        const fallSpeed = 86 + Math.min(110, bellCount * 0.65);
        fieldDrop += fallSpeed * dt;
    }
    if (paused)
        return;
    if (launchBuffer > 0) {
        launchBuffer = Math.max(0, launchBuffer - dt);
        if (launchBuffer === 0)
            launchRun();
    }
    updateAnimState(dt);
    if (state === 'title' || state === 'gameover' || state === 'expeditionComplete')
        return;
    cat.prevX = cat.x;
    cat.prevY = cat.y;
    let desired = 0;
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    if (left || right)
        inputMode = 'keyboard';
    if (left !== right) {
        desired = left ? -PHYS.maxSpeed : PHYS.maxSpeed;
    }
    else if (inputMode === 'mouse' && pointerActive) {
        const dx = mouseX - cat.x;
        desired = Math.max(-PHYS.maxSpeed, Math.min(PHYS.maxSpeed, dx * 6.5));
        if (Math.abs(dx) < 18)
            desired = 0;
    }
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
        if (cat.x < halfW)
            cat.x = halfW;
        if (cat.x > width - halfW)
            cat.x = width - halfW;
        if (cat.y === GROUND_Y)
            updateGroundTravel(Math.abs(cat.x - cat.prevX));
        return;
    }
    highestY = Math.max(highestY, cat.y);
    if (state === 'playing' && cat.vy >= 0)
        descentPeakY = cat.y;
    if (bounceHold > 0) {
        bounceHold = Math.max(0, bounceHold - dt);
        cat.vy = 0;
        cat.x += cat.vx * dt * 0.25;
        if (bounceHold <= 0 && pendingBounce > 0) {
            cat.vy = pendingBounce;
            pendingBounce = 0;
            cat.landedFlash = 0;
            if (contactAnimHold <= 0)
                setAnimState('launch');
        }
        else {
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
    cat.vy = Math.max(-fallCap, cat.vy + PHYS.gravity * dt);
    cat.x += cat.vx * dt;
    cat.y += cat.vy * dt;
    highestY = Math.max(highestY, cat.y);
    const halfW = CAT_EDGE_MARGIN;
    if (cat.x < halfW) {
        cat.x = halfW;
        cat.vx = 0;
    }
    if (cat.x > width - halfW) {
        cat.x = width - halfW;
        cat.vx = 0;
    }
    if (state === 'playing') {
        checkBellContacts();
        checkMoths();
        if (selectedMode === 'expedition') {
            advanceExpedition();
            if (state === 'expeditionComplete')
                return;
        }
        const targetCamera = Math.max(0, cat.y - height * 0.43);
        cameraY += (targetCamera - cameraY) * Math.min(1, dt * (sustainedDescent ? 7.5 : 7.0));
        keepRisingCatVisible();
        extendPath();
        if (selectedMode === 'classic' && cat.y <= GROUND_Y) {
            cat.y = GROUND_Y;
            cat.vy = 0;
            cameraY = 0;
            finishGame();
            return;
        }
        if (selectedMode === 'expedition' && cat.y <= expeditionCheckpointY) {
            settleExpeditionCheckpoint();
            return;
        }
        if (selectedMode !== 'zen' && cat.y < descentPeakY - height * 0.43 - 150 && cat.vy < 0)
            beginLongFall();
        if (cat.vy < 0)
            keepFallingCatVisible();
        if (selectedMode === 'zen' && cat.y <= GROUND_Y) {
            settleZenGround();
        }
    }
    else if (state === 'falling') {
        const previousContacts = bellCount + mothCount;
        checkBellContacts();
        checkMoths();
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
            finishGame();
        }
    }
}
function descentSpeedLimit(y) {
    // The ridge and village bands stay readable; only empty high sky accelerates.
    if (y <= 1400)
        return 650 + 350 * chapterEase(y / 1400);
    if (y <= 8000)
        return 1000;
    if (y <= 11000)
        return 1000 + 400 * chapterEase((y - 8000) / 3000);
    if (y <= 14000)
        return 1400 + 500 * chapterEase((y - 11000) / 3000);
    return Math.min(5200, 1900 + (y - 14000) * 0.10);
}
function keepFallingCatVisible() {
    // The camera may ease toward Zima, but it cannot leave him below the viewport.
    cameraY = Math.min(cameraY, Math.max(0, cat.y - height * 0.20));
}
function keepRisingCatVisible() {
    // A fast launch must not let the cat disappear under the top command panel.
    const lowestAllowedScreenY = Math.max(205, height * 0.34);
    cameraY = Math.max(cameraY, Math.max(0, cat.y - (height - 84 - lowestAllowedScreenY)));
}
function expeditionGoalName(stage = expeditionStage) {
    const names = {
        winter: ['Cross Aurora Heights', 'Cross Constellation Sea', 'Reach Winter Crown'],
        spring: ['Cross Blossom Heights', 'Cross Petal Constellations', 'Reach Spring Crown'],
        summer: ['Cross Sunlit Heights', 'Cross Sapphire Clouds', 'Reach Summer Crown'],
        autumn: ['Cross Ember Heights', 'Cross Copper Constellations', 'Reach Autumn Crown'],
    };
    return names[selectedTheme][Math.min(2, stage)];
}
function advanceExpedition() {
    if (selectedMode !== 'expedition' || state !== 'playing')
        return;
    const goals = expeditionGoals();
    while (expeditionStage < goals.length && highestY >= goals[expeditionStage]) {
        expeditionStage++;
        if (expeditionStage <= 2)
            expeditionCheckpointY = goals[expeditionStage - 1];
    }
    if (expeditionStage === 3)
        finishExpedition();
}
function settleExpeditionCheckpoint() {
    state = 'expeditionCheckpoint';
    message = '';
    messageTimer = 0;
    expeditionRetries++;
    cat.y = expeditionCheckpointY;
    cat.prevY = cat.y;
    cat.vx = 0;
    cat.vy = 0;
    expeditionFootholdY = expeditionCheckpointY;
    expeditionFootholdX = cat.x;
    cameraY = Math.max(0, cat.y + 84 - height * 0.08);
    bounceHold = 0;
    pendingBounce = 0;
    contactAnimHold = 0;
    bounceChain = 0;
    multiplier = 1;
    fieldDrop = 0;
    const nextOrdinal = (bells.at(-1)?.id ?? bellCount) + 1;
    bells = [];
    moths = [];
    nextBonusBell = nextOrdinal + 17;
    generateInitialPath(nextOrdinal, expeditionCheckpointY + 205);
    setAnimState('groundLand');
    ping(400, 0.03, 0.13, 'sine');
}
function finishExpedition() {
    if (state === 'expeditionComplete')
        return;
    state = 'expeditionComplete';
    expeditionEndingAt = elapsed;
    cat.y = expeditionGoals()[2];
    cat.prevY = cat.y;
    cat.vx = 0;
    cat.vy = 0;
    cameraY = Math.max(0, cat.y + 84 - height * 0.08);
    bounceHold = 0;
    pendingBounce = 0;
    setAnimState('groundLand');
    addSeasonBurst(cat.x, cat.y, 2.3);
    ping(784, 0.02, 0.22, 'sine');
    setTimeout(() => ping(1046, 0.02, 0.28, 'sine'), 120);
    recordScore();
}
function settleZenGround() {
    state = 'zenGrounded';
    cat.y = GROUND_Y;
    cat.prevY = GROUND_Y;
    cat.vy = 0;
    cameraY = 0;
    bounceHold = 0;
    pendingBounce = 0;
    contactAnimHold = 0;
    bounceChain = 0;
    setAnimState('groundLand');
    emitGroundStep();
    emitGroundStep();
    // After a long climb, the remaining path is far above the ground.
    // Start a reachable local path without resetting this Zen run's score.
    const nextOrdinal = (bells.at(-1)?.id ?? bellCount) + 1;
    bells = [];
    moths = [];
    fieldDrop = 0;
    nextBonusBell = nextOrdinal + 17;
    generateInitialPath(nextOrdinal);
}
function registerBellHit(bell, fromBelow) {
    bell.touched = true;
    descentBlend = 0;
    bell.lastHit = elapsed;
    bellCount++;
    bounceChain++;
    const chainBoost = Math.min(165, bounceChain * 7);
    const nextBell = bells.find(b => b.id > bell.id && !b.touched);
    const top = bellTop(bell);
    if (fromBelow) {
        const baseTap = 170 + chainBoost + bell.boost;
        const targetBounce = nextBell ? jumpVelocityFor(cat.y, cat.x, nextBell) : PHYS.bounce;
        const automaticBoost = Math.max(cat.vy + baseTap, targetBounce * 0.84 + bell.boost * 0.55, 1180 + bell.boost * 0.70);
        cat.vy = Math.min(1680, automaticBoost);
        setAnimState('undersideContact');
        contactAnimHold = 0.12;
    }
    else {
        cat.y = top;
        const targetBounce = nextBell ? jumpVelocityFor(top, bell.x, nextBell) : PHYS.bounce;
        pendingBounce = Math.min(1640, targetBounce + chainBoost + bell.boost);
        cat.vy = 0;
        bounceHold = 0.045;
        cat.landedFlash = bounceHold;
        setAnimState('land');
        contactAnimHold = 0.12;
    }
    if (!bell.scored) {
        bell.scored = true;
        awardPoints(bell.value);
    }
    const sparkColor = bell.kind === 'crystal' ? '#a8f5ff' : bell.kind === 'silver' ? '#dbe9ff' : '#ffe491';
    addSparkBurst(bell.x, top, bell.kind === 'crystal' ? 18 : bell.kind === 'silver' ? 15 : 12, sparkColor);
    addSeasonBurst(bell.x, top, bell.kind === 'crystal' ? 1.5 : bell.kind === 'silver' ? 1.2 : 0.9);
    cameraShake = bell.kind === 'crystal' ? 0.15 : 0.10;
    const toneBase = bell.kind === 'crystal' ? 760 : bell.kind === 'silver' ? 680 : 610;
    ping(toneBase + Math.min(320, bell.id * 4), 0.02, 0.12, 'sine');
    setTimeout(() => ping(toneBase * 1.48, 0.015, 0.06, 'sine'), 26);
}
function sweptEllipseContact(x0, y0, x1, y1, centerX, centerY, radiusX, radiusY, angle = 0) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const local = (x, y) => ({
        x: ((x - centerX) * cos + (y - centerY) * sin) / radiusX,
        y: (-(x - centerX) * sin + (y - centerY) * cos) / radiusY,
    });
    const a = local(x0, y0), b = local(x1, y1);
    const dx = b.x - a.x, dy = b.y - a.y;
    const aa = dx * dx + dy * dy;
    const bb = 2 * (a.x * dx + a.y * dy);
    const cc = a.x * a.x + a.y * a.y - 1;
    let t = 0;
    if (cc > 0) {
        if (aa < 1e-8)
            return null;
        const discriminant = bb * bb - 4 * aa * cc;
        if (discriminant < 0)
            return null;
        t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
        if (t < 0 || t > 1)
            return null;
    }
    const hitX = a.x + dx * t, hitY = a.y + dy * t;
    const nx = hitX * cos / radiusX - hitY * sin / radiusY;
    const ny = hitX * sin / radiusX + hitY * cos / radiusY;
    const length = Math.hypot(nx, ny);
    return length > 1e-8 ? { x: nx / length, y: ny / length } : { x: 0, y: 1 };
}
function checkBellContacts() {
    const bottom = Math.min(cat.prevY, cat.y) - 200;
    const top = Math.max(cat.prevY, cat.y) + 200;
    for (let index = firstBellAtOrAbove(bottom); index < bells.length; index++) {
        const bell = bells[index];
        if (bellWorldY(bell) > top)
            break;
        if (bell.touched) {
            if (selectedMode === 'zen' && elapsed - bell.lastHit > 1.15)
                bell.touched = false;
            else
                continue;
        }
        const frame = OBJECT_BOUNDS[selectedTheme][bell.kind === 'bronze' ? 0 : bell.kind === 'silver' ? 1 : 2];
        const scale = Math.min(bell.w * 1.05 / frame.w, bell.h * 1.65 / frame.h);
        const bob = Math.sin(elapsed * 1.55 + bell.phase) * 2.2;
        const angle = -Math.sin(elapsed * 1.95 + bell.phase) * 0.045;
        const normal = sweptEllipseContact(cat.prevX, cat.prevY + cat.h * 0.43, cat.x, cat.y + cat.h * 0.43, bell.x, bellWorldY(bell) - bob, frame.w * scale * 0.42 + cat.w * 0.28, frame.h * scale * 0.42 + cat.h * 0.34, angle);
        if (!normal)
            continue;
        const topLanding = cat.vy < 0 && normal.y > 0.4 && normal.y > Math.abs(normal.x) * 0.65;
        lastBellContactDirection = topLanding ? 'top' : Math.abs(normal.x) > 0.6 ? 'side' : 'underside';
        registerBellHit(bell, !topLanding);
        break;
    }
}
function beginLongFall() {
    if (state !== 'playing')
        return;
    state = 'falling';
    bounceHold = 0;
    pendingBounce = 0;
    bounceChain = 0;
    message = 'MISSED — FALLING HOME';
    messageTimer = 1.8;
    setAnimState('fall');
    ping(260, 0.03, 0.18, 'sine');
}
function checkMoths() {
    const bodyY = cat.y + cat.h * 0.48;
    for (const moth of moths) {
        if (!moth.alive)
            continue;
        const my = mothWorldY(moth);
        if (sweptEllipseContact(cat.prevX - moth.prevX + moth.x, cat.prevY + cat.h * 0.48, cat.x, bodyY, moth.x, my, 88, 68)) {
            moth.alive = false;
            descentBlend = 0;
            mothCount++;
            awardPoints(tierPoints(moth.kind));
            multiplier = Math.min(20, multiplier + 1);
            bounceHold = 0;
            pendingBounce = 0;
            cat.y = Math.max(cat.y, my - cat.h * 0.38);
            const nextBell = bells.find(b => !b.touched && bellTop(b) > cat.y + 60);
            const targetBounce = nextBell ? jumpVelocityFor(cat.y, cat.x, nextBell) : 1380;
            cat.vy = Math.min(1710, Math.max(1510, targetBounce + 250, cat.vy + 620));
            setAnimState('boostContact');
            contactAnimHold = 0.16;
            cameraShake = 0.18;
            message = '';
            messageTimer = 0;
            addSparkBurst(moth.x, my, 22, themeMeta().accent);
            addSeasonBurst(moth.x, my, 1.8);
            ping(820, 0.025, 0.16, 'triangle');
            setTimeout(() => ping(1230, 0.025, 0.20, 'triangle'), 65);
        }
    }
}
function finishGame() {
    paused = false;
    state = 'gameover';
    contactAnimHold = 0;
    setAnimState('groundLand');
    emitGroundStep();
    emitGroundStep();
    recordScore();
    ping(240, 0.045, 0.22, 'sine');
    setTimeout(() => ping(180, 0.04, 0.30, 'sine'), 90);
}
function updateSnow(dt) {
    for (const s of snow) {
        s.phase += dt * (selectedTheme === 'summer' ? 1.3 : 0.6);
        s.y += s.speed * dt;
        s.x += Math.sin(s.phase) * s.drift * dt;
        if (selectedTheme === 'spring')
            s.x -= 20 * dt;
        if (selectedTheme === 'autumn')
            s.x += Math.sin(s.phase * 1.6) * 18 * dt;
        if (s.y > height + 12 || s.x < -20 || s.x > width + 20) {
            s.y = -12;
            s.x = Math.random() * width;
        }
    }
    if (state === 'playing' || state === 'falling') {
        for (const m of moths) {
            if (!m.alive)
                continue;
            const sy = worldToScreenY(mothWorldY(m));
            // Choose an intercept altitude once, before the bird enters. Keeping it
            // fixed in world space lets a falling cat meet it by steering; a lane
            // tied to cameraY follows the cat and appears to dodge contact.
            if (m.flightWorldY === undefined) {
                if (sy < height * 0.10 || sy > height * 0.90)
                    continue;
                // Enter from the closer edge, giving the player time to steer toward
                // a visible crossing instead of watching the target pass far away.
                const direction = cat.x <= width * 0.5 ? 1 : -1;
                const speed = Math.abs(m.vx);
                m.vx = speed * direction;
                m.x = direction > 0 ? -speed * 0.25 - 70 : width + speed * 0.25 + 70;
                m.prevX = m.x;
                const timeToCatX = Math.min(1.1, Math.abs(cat.x - m.x) / speed);
                const fallEndVelocity = Math.max(-descentSpeedLimit(cat.y), cat.vy + PHYS.gravity * timeToCatX);
                const projectedTravel = cat.vy >= 0
                    ? Math.min(900, cat.vy) * timeToCatX * 0.7
                    : (cat.vy + fallEndVelocity) * 0.5 * timeToCatX;
                m.flightWorldY = Math.max(GROUND_Y + 80, cat.y + cat.h * 0.48 + projectedTravel);
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
            if ((m.vx > 0 && m.x > width + 110) || (m.vx < 0 && m.x < -110))
                m.alive = false;
        }
    }
}
function draw() {
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
            if (selectedTheme === 'winter')
                drawWinterContinuousWorld();
            else
                drawSeasonContinuousWorld(selectedTheme);
            drawSceneGround(scene);
            drawSceneProp(scene);
        }
        else {
            drawSceneBackdrop(scene);
            drawClimbChapters();
            // Keep the previous painted planes available if an extended asset fails.
            drawSceneLayer(scene.far, 1 - chapterEase((backdropCameraY - 2450) / 1200));
            drawSceneLayer(scene.mid);
            drawNearSceneLayer(scene.near);
            drawSceneGround(scene);
            drawSceneProp(scene);
        }
    }
    else {
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
        if (scene)
            drawSceneFront(scene);
        if (!menuOverlay)
            drawTitle();
    }
    else {
        drawGroundMarks();
        if (selectedMode === 'expedition') {
            if (expeditionFootholdY > GROUND_Y)
                drawUpperFoothold(expeditionFootholdX, worldToScreenY(expeditionFootholdY));
            if (state === 'expeditionComplete')
                drawUpperFoothold(cat.x, worldToScreenY(cat.y));
        }
        drawWorld();
        if (scene)
            drawSceneFront(scene);
        if (state !== 'gameover' && state !== 'expeditionComplete')
            drawHUD();
        if (state === 'ready')
            drawReady();
        if (state === 'zenGrounded')
            drawZenGrounded();
        if (state === 'expeditionCheckpoint')
            drawExpeditionCheckpoint();
        if (paused)
            drawPaused();
        if (state === 'gameover')
            drawGameOver();
        if (state === 'expeditionComplete')
            drawExpeditionComplete();
    }
    drawSnow();
    if (scoreboardOpen && !boardOverlay)
        drawScoreboard();
}
function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    if (selectedTheme === 'winter') {
        g.addColorStop(0, '#020912');
        g.addColorStop(0.46, '#09213a');
        g.addColorStop(1, '#17435a');
    }
    else if (selectedTheme === 'spring') {
        g.addColorStop(0, '#8fc8ef');
        g.addColorStop(0.40, '#bae6f4');
        g.addColorStop(0.82, '#d8f5e5');
        g.addColorStop(1, '#ecf8df');
    }
    else if (selectedTheme === 'summer') {
        g.addColorStop(0, '#3d9fe3');
        g.addColorStop(0.52, '#87d6ff');
        g.addColorStop(0.86, '#d8ef98');
        g.addColorStop(1, '#f7e39d');
    }
    else {
        g.addColorStop(0, '#6b3424');
        g.addColorStop(0.38, '#c46334');
        g.addColorStop(0.72, '#e8a052');
        g.addColorStop(1, '#f3d69a');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.35, 80, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, 'rgba(255,255,255,0)');
    vignette.addColorStop(1, selectedTheme === 'winter' ? 'rgba(0,10,20,.32)' : selectedTheme === 'spring' ? 'rgba(8,35,30,.14)' : selectedTheme === 'summer' ? 'rgba(28,46,12,.16)' : 'rgba(25,8,2,.18)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}
function drawStars() {
    if (selectedTheme === 'winter') {
        for (const s of stars) {
            const a = s.alpha + Math.sin(elapsed * 1.6 + s.twinkle) * 0.16;
            ctx.globalAlpha = Math.max(0.08, a);
            ctx.fillStyle = '#e8f7ff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, TAU);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        const moonX = width * 0.82;
        const moonY = height * 0.15;
        const rg = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 62);
        rg.addColorStop(0, 'rgba(241,249,255,.9)');
        rg.addColorStop(0.35, 'rgba(210,236,248,.24)');
        rg.addColorStop(1, 'rgba(210,236,248,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 62, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#eef8ff';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 23, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#0a1c30';
        ctx.beginPath();
        ctx.arc(moonX + 10, moonY - 5, 23, 0, TAU);
        ctx.fill();
    }
    else if (selectedTheme === 'spring') {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        for (let i = 0; i < 4; i++) {
            const x = width * (0.16 + i * 0.22);
            const y = height * (0.18 + (i % 2) * 0.06);
            drawCloud(x, y, 0.9 + (i % 3) * 0.15);
        }
    }
    else if (selectedTheme === 'summer') {
        const sunX = width * 0.84;
        const sunY = height * 0.16;
        const rg = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 78);
        rg.addColorStop(0, 'rgba(255,248,196,.95)');
        rg.addColorStop(0.4, 'rgba(255,233,130,.38)');
        rg.addColorStop(1, 'rgba(255,233,130,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 78, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff0a8';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 28, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (let i = 0; i < 3; i++)
            drawCloud(width * (0.18 + i * 0.28), height * (0.16 + (i % 2) * 0.07), 0.85 + i * 0.1);
    }
    else {
        const sunX = width * 0.80;
        const sunY = height * 0.18;
        ctx.fillStyle = 'rgba(255,235,176,.50)';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 34, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        for (let i = 0; i < 2; i++)
            drawCloud(width * (0.24 + i * 0.32), height * (0.18 + i * 0.06), 0.9);
    }
    ctx.globalAlpha = 1;
}
function drawAurora() {
    ctx.save();
    if (selectedTheme === 'winter') {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.10;
        for (let band = 0; band < 3; band++) {
            ctx.beginPath();
            const base = height * (0.17 + band * 0.05);
            ctx.moveTo(-30, base);
            for (let x = -30; x <= width + 30; x += 45) {
                const y = base + Math.sin(x * 0.008 + elapsed * 0.12 + band) * (22 + band * 7);
                ctx.lineTo(x, y);
            }
            ctx.lineWidth = 18 + band * 11;
            ctx.strokeStyle = band === 1 ? '#7ed0dc' : '#79c2b1';
            ctx.stroke();
        }
    }
    else if (selectedTheme === 'spring') {
        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = i % 2 === 0 ? '#d9f7ff' : '#f7d4f1';
            ctx.lineWidth = 10 + i * 3;
            ctx.beginPath();
            const base = height * (0.22 + i * 0.03);
            ctx.moveTo(-20, base);
            for (let x = 0; x <= width + 20; x += 40)
                ctx.lineTo(x, base + Math.sin(x * 0.01 + elapsed * 0.6 + i) * (6 + i * 1.6));
            ctx.stroke();
        }
    }
    else if (selectedTheme === 'summer') {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#fff7c0';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const x = width * (0.1 + i * 0.18);
            ctx.moveTo(x, 0);
            ctx.lineTo(x - 120, height * 0.8);
            ctx.lineWidth = 20;
            ctx.stroke();
        }
    }
    else {
        ctx.globalAlpha = 0.10;
        ctx.strokeStyle = '#f6d59a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const base = height * (0.28 + i * 0.06);
            ctx.moveTo(-20, base);
            for (let x = 0; x <= width + 20; x += 50)
                ctx.lineTo(x, base + Math.sin(x * 0.008 + elapsed * 0.35 + i) * (10 + i * 2));
            ctx.lineWidth = 14;
            ctx.stroke();
        }
    }
    ctx.restore();
}
function drawFarMountains() {
    const parallax = (cameraY * 0.05) % 80;
    ctx.save();
    const base = height * 0.73 + parallax * 0.08;
    drawPaintedBackdrop();
    // far haze
    ctx.globalAlpha = selectedTheme === 'winter' ? 0.22 : 0.18;
    const haze = ctx.createLinearGradient(0, base - 180, 0, base + 20);
    haze.addColorStop(0, 'rgba(255,255,255,.00)');
    haze.addColorStop(1, selectedTheme === 'winter' ? 'rgba(214,235,248,.22)' : selectedTheme === 'spring' ? 'rgba(224,246,255,.18)' : selectedTheme === 'summer' ? 'rgba(255,247,211,.18)' : 'rgba(255,223,185,.16)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, base - 180, width, 220);
    // back range
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 150; x += 150) {
        ctx.lineTo(x, base - 76 - (x / 150 % 3) * 20);
        ctx.lineTo(x + 80, base + 20);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = selectedTheme === 'winter' ? '#183d56' : selectedTheme === 'spring' ? '#8eb4be' : selectedTheme === 'summer' ? '#9db783' : '#b08261';
    ctx.fill();
    // mid range
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 120; x += 120) {
        ctx.lineTo(x, base - 42 - (x / 120 % 3) * 22);
        ctx.lineTo(x + 65, base + 20);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = selectedTheme === 'winter' ? '#113047' : selectedTheme === 'spring' ? '#749ca6' : selectedTheme === 'summer' ? '#78956d' : '#94694a';
    ctx.fill();
    // seasonal landmarks for depth
    if (selectedTheme === 'winter') {
        drawStoneBridge(width * 0.18, base + 18, 1.25, '#718bad', '#547092');
        drawVillageSilhouette(width * 0.62, base + 6, 0.9, '#ffd79d', '#314965');
    }
    else if (selectedTheme === 'spring') {
        drawStoneBridge(width * 0.20, base + 16, 1.1, '#7898a6', '#6f8896');
        drawVillageSilhouette(width * 0.70, base + 8, 0.85, '#ffd6b5', '#7697a4');
        drawWaterRibbon(base + 4, 0.22, 'rgba(201,235,245,.40)', 'rgba(255,255,255,.0)');
    }
    else if (selectedTheme === 'summer') {
        drawWaterRibbon(base + 18, 0.18, 'rgba(126,190,236,.42)', 'rgba(255,255,255,0)');
        drawVillageSilhouette(width * 0.62, base + 14, 0.92, '#f7cda1', '#7f9a75');
        drawWindmill(width * 0.80, base - 18, 0.9, 0.28);
    }
    else {
        drawBarn(width * 0.16, base + 18, 0.92, 0.30);
        drawWindmill(width * 0.74, base - 10, 0.85, 0.26);
        drawWaterRibbon(base + 20, 0.12, 'rgba(253,209,149,.26)', 'rgba(255,255,255,0)');
    }
    ctx.restore();
}
function drawPines() {
    if (cameraY > height * 1.2)
        return;
    const baseY = worldToScreenY(0) + 8;
    ctx.save();
    drawPaintedGround(baseY);
    if (selectedTheme === 'winter') {
        for (let i = -1; i < Math.ceil(width / 70) + 2; i++) {
            const x = i * 70 + ((i % 2) * 18);
            const h = 98 + ((i * 37) % 55 + 55) % 55;
            drawPine(x, baseY, h, i % 3 === 0 ? 0.22 : 0.14);
        }
        drawLanternPost(width * 0.10, baseY + 4, 0.95, '#ffd995');
        drawSnowBankDetail(baseY + 10);
        const groundG = ctx.createLinearGradient(0, baseY - 8, 0, baseY + 70);
        groundG.addColorStop(0, 'rgba(240,250,255,.18)');
        groundG.addColorStop(0.4, 'rgba(201,228,239,.14)');
        groundG.addColorStop(1, 'rgba(120,177,198,.18)');
        ctx.fillStyle = groundG;
    }
    else if (selectedTheme === 'spring') {
        for (let i = -1; i < Math.ceil(width / 95) + 2; i++)
            if (i % 2 === 0)
                drawBlossomTree(i * 95 + ((i % 2) * 24), baseY + 6, 0.72 + (i % 3) * 0.05);
        drawWisteriaPergola(width * 0.83, baseY - 4, 0.94);
        drawFlowerMeadow(width * 0.18, baseY + 10, 1.1, ['#f7c0de', '#ffffff', '#b68ef0']);
        drawFlowerMeadow(width * 0.52, baseY + 12, 1.25, ['#f9d4eb', '#ffffff', '#ffd36d']);
        drawStreamBank(width * 0.14, baseY + 14, width * 0.20);
        const groundG = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 70);
        groundG.addColorStop(0, 'rgba(194,236,172,.14)');
        groundG.addColorStop(0.55, 'rgba(138,199,125,.12)');
        groundG.addColorStop(1, 'rgba(111,168,103,.16)');
        ctx.fillStyle = groundG;
    }
    else if (selectedTheme === 'summer') {
        for (let i = -1; i < Math.ceil(width / 88) + 2; i++)
            if (i % 2 === 0)
                drawSunflowerCluster(i * 88 + ((i % 2) * 16), baseY + 2, 0.74 + (i % 3) * 0.05);
        drawStoneWall(width * 0.18, baseY + 8, 0.95);
        drawFlowerMeadow(width * 0.24, baseY + 12, 1.15, ['#ffffff', '#ffd54f', '#9ed0ff']);
        drawFlowerMeadow(width * 0.70, baseY + 12, 1.05, ['#ffffff', '#ffd54f', '#b88bd6']);
        drawWoodenBanner(width * 0.82, baseY - 2, 0.88, '#5c7c2f');
        const groundG = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 75);
        groundG.addColorStop(0, 'rgba(199,233,119,.13)');
        groundG.addColorStop(0.55, 'rgba(124,182,78,.12)');
        groundG.addColorStop(1, 'rgba(85,140,60,.16)');
        ctx.fillStyle = groundG;
    }
    else {
        for (let i = -1; i < Math.ceil(width / 90) + 2; i++)
            if (i % 3 === 0)
                drawCornStalk(i * 44, baseY + 10, 0.74 + (i % 4) * 0.03);
        drawScarecrow(width * 0.88, baseY + 2, 0.94);
        drawPumpkinCart(width * 0.18, baseY + 8, 0.94);
        drawPumpkinPatch(width * 0.55, baseY + 12, 1.15);
        const groundG = ctx.createLinearGradient(0, baseY - 8, 0, baseY + 76);
        groundG.addColorStop(0, 'rgba(231,176,92,.14)');
        groundG.addColorStop(0.55, 'rgba(186,123,54,.12)');
        groundG.addColorStop(1, 'rgba(146,92,38,.16)');
        ctx.fillStyle = groundG;
    }
    ctx.beginPath();
    ctx.moveTo(0, baseY + 2);
    for (let x = 0; x <= width; x += 80)
        ctx.quadraticCurveTo(x + 40, baseY - 5 + Math.sin(x * 0.01) * 4, x + 80, baseY + 2);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    drawGroundDetail(baseY + 8);
    ctx.restore();
}
function drawPine(x, baseY, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#c8e7ef';
    ctx.fillRect(x - 3, baseY - h * 0.12, 6, h * 0.2);
    for (let j = 0; j < 4; j++) {
        const top = baseY - h + j * h * 0.19;
        const half = h * (0.20 + j * 0.045);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x - half, top + h * 0.42);
        ctx.quadraticCurveTo(x, top + h * 0.34, x + half, top + h * 0.42);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}
function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(-26, 6, 18, 0, TAU);
    ctx.arc(0, 0, 24, 0, TAU);
    ctx.arc(28, 6, 19, 0, TAU);
    ctx.arc(8, 16, 18, 0, TAU);
    ctx.fill();
    ctx.restore();
}
function drawStoneBridge(x, y, scale, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.lineTo(-58, -12);
    ctx.quadraticCurveTo(0, -34, 58, -12);
    ctx.lineTo(58, 0);
    ctx.lineTo(36, 0);
    ctx.quadraticCurveTo(0, -18, -36, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 18, -4);
        ctx.lineTo(i * 18, -17 + Math.abs(i) * 2);
        ctx.stroke();
    }
    ctx.restore();
}
function drawVillageSilhouette(x, y, scale, glow, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = fill;
    for (const [dx, w, h, r] of [[-44, 30, 24, 0], [-8, 24, 20, 0], [22, 28, 18, 0], [52, 26, 22, 0]]) {
        ctx.fillRect(dx, -h, w, h);
        ctx.beginPath();
        ctx.moveTo(dx - 2, -h);
        ctx.lineTo(dx + w / 2, -h - 12 - r);
        ctx.lineTo(dx + w + 2, -h);
        ctx.closePath();
        ctx.fill();
    }
    ctx.fillRect(5, -42, 8, 42);
    ctx.beginPath();
    ctx.moveTo(1, -42);
    ctx.lineTo(9, -58);
    ctx.lineTo(17, -42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.32;
    for (const [dx, dy] of [[-34, -12], [-22, -12], [-2, -10], [28, -10], [58, -12]])
        ctx.fillRect(dx, dy, 6, 7);
    ctx.restore();
}
function drawWaterRibbon(y, alpha, fill1, fill2) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, y - 6, 0, y + 36);
    g.addColorStop(0, fill1);
    g.addColorStop(1, fill2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(width * 0.05, y + 10);
    for (let x = width * 0.05; x <= width * 0.95; x += 80)
        ctx.quadraticCurveTo(x + 40, y - 5 + Math.sin(x * 0.02) * 4, x + 80, y + 10);
    ctx.lineTo(width * 0.95, y + 24);
    for (let x = width * 0.95; x >= width * 0.05; x -= 80)
        ctx.quadraticCurveTo(x - 40, y + 30 + Math.cos(x * 0.02) * 3, x - 80, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
function drawWindmill(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f0e1b9';
    ctx.fillRect(-10, -36, 20, 36);
    ctx.fillStyle = '#7d6242';
    ctx.fillRect(-2, -56, 4, 24);
    ctx.strokeStyle = '#7d6242';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2 + 0.4);
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, -26);
        ctx.lineTo(4, -4);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
function drawBarn(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#a84d32';
    ctx.fillRect(-24, -20, 48, 20);
    ctx.beginPath();
    ctx.moveTo(-28, -20);
    ctx.lineTo(0, -38);
    ctx.lineTo(28, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ede3d2';
    ctx.fillRect(-4, -12, 8, 12);
    ctx.fillRect(12, -12, 6, 6);
    ctx.restore();
}
function drawLanternPost(x, y, scale, glowColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#6c5136';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, -44);
    ctx.lineTo(18, -44);
    ctx.stroke();
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(12, -36, 14, 18, 3);
    ctx.fill();
    ctx.restore();
}
function drawFlowerMeadow(x, y, scale, colors) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    for (let i = 0; i < 16; i++) {
        const px = -70 + i * 9 + (i % 3) * 3;
        const py = (i % 4) * 2;
        ctx.strokeStyle = '#5d8d4c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px, 8);
        ctx.lineTo(px, -8 - (i % 3) * 5);
        ctx.stroke();
        const c = colors[i % colors.length];
        ctx.fillStyle = c;
        const fy = -10 - (i % 3) * 5;
        for (let p = 0; p < 5; p++) {
            const a = p / 5 * TAU;
            ctx.beginPath();
            ctx.ellipse(px + Math.cos(a) * 3.2, fy + Math.sin(a) * 3.2, 2.6, 1.7, a, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#f7de79';
        ctx.beginPath();
        ctx.arc(px, fy, 1.5, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawStreamBank(x, y, w) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y - 18, 0, y + 24);
    g.addColorStop(0, 'rgba(193,233,244,.70)');
    g.addColorStop(1, 'rgba(145,194,215,.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.18, y - 16, x + w * 0.36, y - 8);
    ctx.quadraticCurveTo(x + w * 0.58, y, x + w, y - 12);
    ctx.lineTo(x + w, y + 6);
    ctx.quadraticCurveTo(x + w * 0.5, y + 14, x, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
function drawWisteriaPergola(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#8b6d50';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-34, 10);
    ctx.lineTo(-34, -38);
    ctx.lineTo(26, -38);
    ctx.lineTo(26, 10);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
        const gx = -24 + i * 12;
        const gy = -36 + (i % 2) * 3;
        ctx.fillStyle = i % 2 === 0 ? '#9c6de0' : '#c9a0f2';
        for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.arc(gx + Math.sin(j) * 2, gy + 8 + j * 6, 4.5 - j * 0.4, 0, TAU);
            ctx.fill();
        }
    }
    ctx.restore();
}
function drawStoneWall(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#c6b39a';
    ctx.strokeStyle = '#917f68';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-52, -16, 104, 24, 6);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
        ctx.strokeRect(-48 + i * 16, -14 + (i % 2) * 2, 14, 8);
    }
    ctx.fillStyle = '#6da85a';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(-42 + i * 18, -18 + (i % 3) * 2, 4, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawWoodenBanner(x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#7b5a31';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -44);
    ctx.lineTo(28, -44);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(24, -39);
    ctx.lineTo(44, -35);
    ctx.lineTo(24, -16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c08c2a';
    ctx.beginPath();
    ctx.arc(28, -44, 8, 0, TAU);
    ctx.stroke();
    ctx.restore();
}
function drawPumpkinCart(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#7b4f2a';
    ctx.lineWidth = 3;
    ctx.strokeRect(-34, -18, 54, 18);
    ctx.beginPath();
    ctx.arc(-20, 4, 8, 0, TAU);
    ctx.arc(10, 4, 8, 0, TAU);
    ctx.stroke();
    for (const [px, py, r, c] of [[-18, -10, 11, '#ef9333'], [-2, -12, 9, '#f4cc9d'], [12, -10, 10, '#6f8f3d']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawPumpkinPatch(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    for (let i = 0; i < 8; i++) {
        const px = -80 + i * 22;
        const col = i % 3 === 0 ? '#f0a043' : i % 3 === 1 ? '#f5d8a8' : '#6d8f42';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(px, 4 + (i % 2) * 3, 11, 9, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#597d35';
        ctx.fillRect(px - 1, -8 + (i % 2) * 3, 2, 7);
    }
    ctx.restore();
}
function drawSnowBankDetail(baseY) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(width * (0.1 + i * 0.13), baseY + (i % 2) * 4, 26, 9, 0, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawGroundDetail(baseY) {
    ctx.save();
    if (selectedTheme === 'winter') {
        ctx.fillStyle = 'rgba(214,239,248,.72)';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.ellipse(width * (0.12 + i * 0.14), baseY + 10 + (i % 2) * 4, 28, 8, 0, 0, TAU);
            ctx.fill();
        }
    }
    else if (selectedTheme === 'spring') {
        drawFlowerMeadow(width * 0.84, baseY + 20, 1.1, ['#f3b9de', '#ffffff', '#8dbbff']);
    }
    else if (selectedTheme === 'summer') {
        drawFlowerMeadow(width * 0.50, baseY + 20, 1.15, ['#ffffff', '#ffe06d', '#b183d0']);
    }
    else {
        ctx.fillStyle = 'rgba(166,104,38,.65)';
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.ellipse(width * 0.06 + i * 60, baseY + 16 + (i % 3) * 4, 10, 3, Math.sin(i), 0, TAU);
            ctx.fill();
        }
    }
    ctx.restore();
}
function drawBlossomTree(x, baseY, scale) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#6e4d35';
    ctx.fillRect(-4, -54, 8, 56);
    ctx.fillStyle = '#f7c7df';
    for (const [dx, dy, r] of [[0, -62, 20], [-16, -50, 16], [16, -48, 17], [-4, -36, 15], [13, -31, 12]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, TAU);
        ctx.fill();
    }
    ctx.fillStyle = '#ffdff0';
    for (const [dx, dy, r] of [[-8, -59, 6], [14, -54, 6], [-20, -46, 5], [10, -34, 5]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawSunflowerCluster(x, baseY, scale) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#5a7f1f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -48);
    ctx.stroke();
    ctx.fillStyle = '#6e9927';
    ctx.beginPath();
    ctx.ellipse(-9, -26, 10, 5, -0.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -18, 11, 5, 0.5, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU;
        ctx.fillStyle = '#ffd44f';
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 15, -48 + Math.sin(a) * 15, 8, 4.5, a, 0, TAU);
        ctx.fill();
    }
    ctx.fillStyle = '#6d4518';
    ctx.beginPath();
    ctx.arc(0, -48, 11, 0, TAU);
    ctx.fill();
    ctx.restore();
}
function drawCornStalk(x, baseY, scale) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#b58d36';
    ctx.fillRect(-1.5, -42, 3, 44);
    ctx.fillStyle = '#7da438';
    ctx.beginPath();
    ctx.ellipse(-7, -28, 13, 4, -0.6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -18, 14, 4, 0.45, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, -10, 12, 4, -0.25, 0, TAU);
    ctx.fill();
    ctx.restore();
}
function drawScarecrow(x, baseY, scale) {
    ctx.save();
    ctx.translate(x, baseY);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#6c4e2d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -52);
    ctx.moveTo(-18, -34);
    ctx.lineTo(18, -34);
    ctx.stroke();
    ctx.fillStyle = '#e4c17e';
    ctx.beginPath();
    ctx.arc(0, -60, 10, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7b4d25';
    ctx.beginPath();
    ctx.moveTo(-12, -68);
    ctx.lineTo(12, -68);
    ctx.lineTo(5, -78);
    ctx.lineTo(-5, -78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8c5e34';
    ctx.fillRect(-10, -46, 20, 14);
    ctx.restore();
}
function drawWorld() {
    for (let index = firstBellAtOrAbove(cameraY - 200); index < bells.length; index++) {
        const bell = bells[index];
        if (bellWorldY(bell) > cameraY + height + 100)
            break;
        const y = worldToScreenY(bellWorldY(bell));
        if (y < -80 || y > height + 100)
            continue;
        drawBell(bell.x, y, bell, elapsed);
    }
    for (const moth of moths) {
        if (!moth.alive)
            continue;
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
        if (y < -80 || y > height + 80)
            continue;
        drawMoth(moth.x, y + Math.sin(moth.phase) * 6, moth.phase, moth.vx, moth.kind);
    }
    drawEffects();
    if (cameraY < 90 && !sceneAssets[selectedTheme])
        drawLaunchPad(cat.x, worldToScreenY(GROUND_Y) + 2);
    drawCat(cat.x, worldToScreenY(cat.y), cat.vx, cat.vy);
}
function drawGroundCatScene() {
    if (!sceneAssets[selectedTheme])
        drawLaunchPad(width / 2, worldToScreenY(GROUND_Y) + 2);
    drawCat(width / 2, worldToScreenY(GROUND_Y), 0, 0);
}
function drawLaunchPad(x, y) {
    ctx.save();
    const gx = x;
    const gy = y + 2;
    if (selectedTheme === 'winter') {
        const g = ctx.createRadialGradient(gx, gy + 2, 10, gx, gy + 2, 90);
        g.addColorStop(0, 'rgba(252,254,255,.98)');
        g.addColorStop(0.62, 'rgba(215,233,244,.92)');
        g.addColorStop(1, 'rgba(150,188,208,.68)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(gx, gy + 12, 94, 22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath();
        ctx.ellipse(gx - 24, gy + 9, 24, 6, -0.18, 0, TAU);
        ctx.ellipse(gx + 24, gy + 13, 22, 5, 0.14, 0, TAU);
        ctx.fill();
    }
    else if (selectedTheme === 'spring') {
        ctx.fillStyle = 'rgba(139,207,119,.95)';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 12, 94, 23, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(171,225,246,.52)';
        ctx.beginPath();
        ctx.ellipse(gx - 18, gy + 12, 32, 8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd1ea';
        for (let i = 0; i < 8; i++) {
            const px = gx - 48 + i * 13;
            const py = gy + 2 + (i % 3) * 3;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, TAU);
            ctx.fill();
        }
    }
    else if (selectedTheme === 'summer') {
        ctx.fillStyle = 'rgba(145,200,86,.96)';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 14, 96, 22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#f4d56d';
        for (let i = 0; i < 6; i++) {
            const px = gx - 42 + i * 17;
            const py = gy + 5 + Math.sin(i) * 2;
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, TAU);
            ctx.fill();
        }
        ctx.strokeStyle = 'rgba(245,239,192,.30)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gx, gy + 11, 72, Math.PI * 0.15, Math.PI * 0.9);
        ctx.stroke();
    }
    else {
        ctx.fillStyle = 'rgba(207,127,55,.94)';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 14, 96, 22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d58b41';
        for (let i = 0; i < 8; i++) {
            const px = gx - 44 + i * 13;
            const py = gy + 7 + (i % 2) * 2;
            ctx.beginPath();
            ctx.ellipse(px, py, 8, 3, Math.sin(i), 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#7b5624';
        ctx.beginPath();
        ctx.arc(gx + 24, gy + 2, 7, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}
function drawEffects() {
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
            for (let i = 0; i < 3; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(-s.size, 0);
                ctx.lineTo(s.size, 0);
                ctx.stroke();
            }
        }
        else if (s.kind === 'petal') {
            ctx.beginPath();
            ctx.ellipse(0, 0, s.size * 1.25, s.size * 0.62, 0.25, 0, TAU);
            ctx.fill();
        }
        else if (s.kind === 'droplet') {
            ctx.beginPath();
            ctx.moveTo(0, -s.size * 1.4);
            ctx.bezierCurveTo(s.size, -s.size * 0.3, s.size, s.size, 0, s.size * 1.25);
            ctx.bezierCurveTo(-s.size, s.size, -s.size, -s.size * 0.3, 0, -s.size * 1.4);
            ctx.fill();
        }
        else if (s.kind === 'pollen') {
            ctx.beginPath();
            ctx.arc(0, 0, s.size * 0.72, 0, TAU);
            ctx.fill();
            ctx.globalAlpha *= 0.35;
            ctx.beginPath();
            ctx.arc(0, 0, s.size * 1.8, 0, TAU);
            ctx.fill();
        }
        else if (s.kind === 'leaf') {
            ctx.beginPath();
            ctx.moveTo(0, -s.size * 1.4);
            ctx.quadraticCurveTo(s.size * 1.1, -s.size * 0.2, 0, s.size * 1.4);
            ctx.quadraticCurveTo(-s.size * 1.1, -s.size * 0.2, 0, -s.size * 1.4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,55,22,.45)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -s.size);
            ctx.lineTo(0, s.size);
            ctx.stroke();
        }
        else {
            ctx.beginPath();
            ctx.arc(0, 0, s.size, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
    ctx.restore();
}
function drawObjectSprite(x, y, bell, t, atlas) {
    const index = bell.kind === 'bronze' ? 0 : bell.kind === 'silver' ? 1 : 2;
    const frame = OBJECT_BOUNDS[selectedTheme][index];
    const bob = Math.sin(t * 1.55 + bell.phase) * 2.2;
    const scale = Math.min(bell.w * 1.05 / frame.w, bell.h * 1.65 / frame.h);
    const drawWidth = frame.w * scale;
    const drawHeight = frame.h * scale;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.sin(t * 1.95 + bell.phase) * 0.045);
    if (bell.touched)
        ctx.globalAlpha = touchedObjectAlpha(bell);
    if (bell.kind === 'crystal') {
        ctx.shadowColor = themeMeta().accent;
        ctx.shadowBlur = 12;
    }
    ctx.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
}
function touchedObjectAlpha(bell) {
    return Math.max(0.14, 0.82 - Math.max(0, elapsed - bell.lastHit) * 2.4);
}
function drawAirborneSprite(x, y, phase, vx, kind, atlas, drawSize = 140) {
    const frame = Math.floor(phase * 1.35) % 6;
    const cellWidth = atlas.naturalWidth / 3;
    const cellHeight = atlas.naturalHeight / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(vx < 0 ? -1 : 1, 1);
    ctx.shadowColor = kind === 'crystal' ? 'rgba(113,235,255,.85)' : kind === 'silver' ? 'rgba(222,241,255,.70)' : 'rgba(255,201,115,.68)';
    ctx.shadowBlur = kind === 'crystal' ? 24 : kind === 'silver' ? 19 : 15;
    // The painted head and body sit right of the atlas cell center. Center them on the hitbox.
    ctx.drawImage(atlas, (frame % 3) * cellWidth, Math.floor(frame / 3) * cellHeight, cellWidth, cellHeight, -drawSize * 0.78, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
}
function drawBell(x, y, bell, t) {
    const art = interactionAssets[selectedTheme];
    if (art) {
        drawObjectSprite(x, y, bell, t, art.objects);
        return;
    }
    const bob = Math.sin(t * 1.55 + bell.phase) * 2.2;
    y += bob;
    ctx.save();
    if (bell.touched)
        ctx.globalAlpha = touchedObjectAlpha(bell);
    const glowColor = bell.kind === 'crystal' ? 'rgba(173,243,255,.25)' : bell.kind === 'silver' ? 'rgba(246,248,255,.22)' : 'rgba(255,235,157,.22)';
    const glow = ctx.createRadialGradient(x, y, 4, x, y, bell.w * 0.95);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, bell.w * 0.95, 0, TAU);
    ctx.fill();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    if (selectedTheme === 'winter') {
        const sway = Math.sin(t * 1.95 + bell.phase) * 0.055;
        ctx.rotate(sway + Math.sin(t * 6.2 + bell.phase) * 0.018);
        const h = bell.h, w = bell.w;
        ctx.strokeStyle = '#a9711d';
        ctx.lineWidth = Math.max(2, w * 0.045);
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.61, w * 0.12, h * 0.12, 0, Math.PI, 0);
        ctx.stroke();
        const body = ctx.createLinearGradient(-w * 0.25, -h * 0.48, w * 0.32, h * 0.38);
        if (bell.kind === 'crystal') {
            body.addColorStop(0, '#e9fdff');
            body.addColorStop(0.28, '#a9eef8');
            body.addColorStop(0.72, '#62bed4');
            body.addColorStop(1, '#2d7289');
            ctx.strokeStyle = '#225d72';
        }
        else if (bell.kind === 'silver') {
            body.addColorStop(0, '#ffffff');
            body.addColorStop(0.28, '#e7edf3');
            body.addColorStop(0.72, '#aebbc8');
            body.addColorStop(1, '#667684');
            ctx.strokeStyle = '#566773';
        }
        else {
            body.addColorStop(0, '#fff0a9');
            body.addColorStop(0.28, '#f3cd62');
            body.addColorStop(0.72, '#d49b32');
            body.addColorStop(1, '#9c6818');
            ctx.strokeStyle = '#8f5c14';
        }
        ctx.fillStyle = body;
        ctx.lineWidth = Math.max(1.8, w * 0.028);
        ctx.beginPath();
        ctx.moveTo(-w * 0.12, -h * 0.50);
        ctx.quadraticCurveTo(-w * 0.31, -h * 0.42, -w * 0.34, -h * 0.16);
        ctx.quadraticCurveTo(-w * 0.36, h * 0.10, -w * 0.48, h * 0.27);
        ctx.quadraticCurveTo(-w * 0.52, h * 0.34, -w * 0.42, h * 0.38);
        ctx.quadraticCurveTo(0, h * 0.51, w * 0.42, h * 0.38);
        ctx.quadraticCurveTo(w * 0.52, h * 0.34, w * 0.48, h * 0.27);
        ctx.quadraticCurveTo(w * 0.36, h * 0.10, w * 0.34, -h * 0.16);
        ctx.quadraticCurveTo(w * 0.31, -h * 0.42, w * 0.12, -h * 0.50);
        ctx.quadraticCurveTo(0, -h * 0.56, -w * 0.12, -h * 0.50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,221,.45)';
        ctx.beginPath();
        ctx.ellipse(-w * 0.16, -h * 0.08, w * 0.075, h * 0.24, -0.12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#7a4c12';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.36, w * 0.40, h * 0.105, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#ffe7a0';
        ctx.lineWidth = Math.max(2, w * 0.032);
        ctx.beginPath();
        ctx.ellipse(0, h * 0.32, w * 0.44, h * 0.10, 0, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = '#6e4310';
        ctx.lineWidth = Math.max(1.5, w * 0.025);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.12);
        ctx.lineTo(0, h * 0.42);
        ctx.stroke();
        ctx.fillStyle = bell.kind === 'crystal' ? '#d8fbff' : bell.kind === 'silver' ? '#edf4fb' : '#d69f36';
        ctx.beginPath();
        ctx.arc(0, h * 0.45, Math.max(3, w * 0.065), 0, TAU);
        ctx.fill();
    }
    else if (selectedTheme === 'spring') {
        const size = bell.w * 0.48;
        ctx.lineWidth = 2.1;
        if (bell.kind === 'bronze') {
            ctx.strokeStyle = '#3d94aa';
            const drop = ctx.createLinearGradient(0, -size, 0, size);
            drop.addColorStop(0, '#c7f0ff');
            drop.addColorStop(0.35, '#6cccf5');
            drop.addColorStop(1, '#2f96d8');
            ctx.fillStyle = drop;
            ctx.beginPath();
            ctx.moveTo(0, -size * 1.12);
            ctx.bezierCurveTo(size * 0.52, -size * 0.64, size * 0.64, 0, 0, size * 0.86);
            ctx.bezierCurveTo(-size * 0.64, 0, -size * 0.52, -size * 0.64, 0, -size * 1.12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,.58)';
            ctx.beginPath();
            ctx.ellipse(-size * 0.18, -size * 0.20, size * 0.10, size * 0.26, -0.2, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.40)';
            ctx.beginPath();
            ctx.arc(0, size * 0.54, size * 0.24, Math.PI * 0.1, Math.PI * 0.9);
            ctx.stroke();
        }
        else if (bell.kind === 'silver') {
            const petals = 5;
            ctx.strokeStyle = '#c98aa6';
            for (let i = 0; i < petals; i++) {
                const a = i / petals * TAU;
                ctx.fillStyle = '#ffd6eb';
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * size * 0.28, Math.sin(a) * size * 0.28, size * 0.34, size * 0.17, a, 0, TAU);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = '#fff0ab';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.20, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#f1d56d';
            ctx.stroke();
        }
        else {
            ctx.strokeStyle = '#6e9f4b';
            ctx.fillStyle = '#f5f0c3';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.ellipse((i - 1.5) * size * 0.18, Math.abs(i - 1.5) * size * 0.10, size * 0.18, size * 0.34, 0.2 * (i - 1.5), 0, TAU);
                ctx.fill();
                ctx.stroke();
            }
            ctx.strokeStyle = '#729b47';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.70);
            ctx.quadraticCurveTo(size * 0.08, -size * 0.95, size * 0.28, -size * 0.95);
            ctx.stroke();
            ctx.fillStyle = '#81b756';
            ctx.beginPath();
            ctx.ellipse(size * 0.30, -size * 0.98, size * 0.12, size * 0.08, 0.6, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#fff8d6';
            ctx.beginPath();
            ctx.arc(0, size * 0.18, size * 0.10, 0, TAU);
            ctx.fill();
        }
    }
    else if (selectedTheme === 'summer') {
        const size = bell.w * 0.50;
        ctx.lineWidth = 2.1;
        if (bell.kind === 'bronze') {
            ctx.strokeStyle = '#8f6425';
            for (let i = 0; i < 14; i++) {
                const a = i / 14 * TAU;
                ctx.fillStyle = '#ffd34c';
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * size * 0.50, Math.sin(a) * size * 0.50, size * 0.34, size * 0.12, a, 0, TAU);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = '#6d4518';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.31, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#8ba939';
            ctx.beginPath();
            ctx.ellipse(0, size * 0.80, size * 0.12, size * 0.20, 0, 0, TAU);
            ctx.fill();
        }
        else if (bell.kind === 'silver') {
            ctx.strokeStyle = '#ad7a20';
            for (let i = 0; i < 10; i++) {
                const a = i / 10 * TAU;
                ctx.fillStyle = '#ffcf57';
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * size * 0.36, Math.sin(a) * size * 0.36, size * 0.26, size * 0.12, a, 0, TAU);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = '#f1a63b';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.24, 0, TAU);
            ctx.fill();
        }
        else {
            ctx.strokeStyle = '#c99929';
            for (let i = 0; i < 8; i++) {
                const a = i / 8 * TAU;
                ctx.fillStyle = '#fff1b5';
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * size * 0.30, Math.sin(a) * size * 0.28, size * 0.28, size * 0.11, a, 0, TAU);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle = '#ffe9a1';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.20, 0, TAU);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,232,155,.36)';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.76, 0, TAU);
            ctx.fill();
        }
    }
    else {
        const rx = bell.kind === 'crystal' ? bell.w * 0.42 : bell.kind === 'silver' ? bell.w * 0.39 : bell.w * 0.44;
        const ry = bell.kind === 'crystal' ? bell.h * 0.46 : bell.kind === 'silver' ? bell.h * 0.34 : bell.h * 0.38;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#8f4f1d';
        ctx.fillStyle = bell.kind === 'crystal' ? '#ffad47' : bell.kind === 'silver' ? '#dcb15b' : '#ec8b2f';
        ctx.beginPath();
        ctx.ellipse(0, 4, rx, ry, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * rx * 0.45, -ry * 0.84 + 4);
            ctx.quadraticCurveTo(i * rx * 0.25, 4, i * rx * 0.45, ry * 0.82 + 4);
            ctx.stroke();
        }
        ctx.fillStyle = '#6e8b34';
        ctx.beginPath();
        ctx.ellipse(0, -ry + 1, rx * 0.20, ry * 0.12, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#476825';
        ctx.stroke();
        ctx.fillStyle = '#4c7d2d';
        ctx.fillRect(-2, -ry * 1.15, 4, 10);
        if (bell.kind === 'crystal') {
            ctx.fillStyle = '#23140d';
            ctx.beginPath();
            ctx.arc(-rx * 0.18, -2, 3, 0, TAU);
            ctx.arc(rx * 0.18, -2, 3, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#23140d';
            ctx.beginPath();
            ctx.arc(0, 8, 12, 0.12 * Math.PI, 0.88 * Math.PI);
            ctx.stroke();
        }
        else {
            ctx.fillStyle = 'rgba(255,255,255,.18)';
            ctx.beginPath();
            ctx.ellipse(-rx * 0.18, -ry * 0.15, rx * 0.10, ry * 0.20, -0.2, 0, TAU);
            ctx.fill();
        }
    }
    ctx.restore();
}
function drawMoth(x, y, phase, vx, kind) {
    const art = interactionAssets[selectedTheme];
    if (art) {
        drawAirborneSprite(x, y, phase, vx, kind, art.airborne);
        return;
    }
    const tierColor = kind === 'crystal' ? '#9df3ff' : kind === 'silver' ? '#eff5ff' : '#ffd17a';
    ctx.save();
    ctx.strokeStyle = tierColor;
    ctx.globalAlpha = 0.58 + Math.sin(phase * 0.7) * 0.14;
    ctx.lineWidth = kind === 'crystal' ? 3.2 : kind === 'silver' ? 2.6 : 2;
    ctx.shadowColor = tierColor;
    ctx.shadowBlur = kind === 'crystal' ? 19 : 12;
    ctx.beginPath();
    ctx.ellipse(x, y, 51, 38, 0, 0, TAU);
    ctx.stroke();
    const pips = kind === 'crystal' ? 3 : kind === 'silver' ? 2 : 1;
    ctx.fillStyle = tierColor;
    for (let i = 0; i < pips; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - (pips - 1) / 2) * 12, y - 43, 3, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(vx < 0 ? -1 : 1, 1);
    ctx.shadowColor = 'rgba(0,0,0,.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    if (selectedTheme === 'winter') {
        const flap = Math.sin(phase) * 0.72;
        const pulse = 0.78 + Math.sin(phase * 0.5) * 0.16;
        const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 54);
        glow.addColorStop(0, `rgba(139,255,235,${0.50 * pulse})`);
        glow.addColorStop(1, 'rgba(139,255,235,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 54, 0, TAU);
        ctx.fill();
        ctx.rotate(Math.sin(phase * 0.35) * 0.06);
        ctx.fillStyle = 'rgba(151,244,231,.90)';
        ctx.beginPath();
        ctx.moveTo(-18, 2);
        ctx.lineTo(-34, -5);
        ctx.lineTo(-28, 7);
        ctx.lineTo(-37, 14);
        ctx.lineTo(-16, 10);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.rotate(-0.10 - flap * 0.48);
        ctx.fillStyle = 'rgba(217,255,249,.95)';
        ctx.beginPath();
        ctx.moveTo(-3, -2);
        ctx.quadraticCurveTo(-14, -25, -35, -28);
        ctx.quadraticCurveTo(-25, -7, -8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.08 + flap * 0.36);
        ctx.fillStyle = 'rgba(180,250,238,.88)';
        ctx.beginPath();
        ctx.moveTo(-1, 2);
        ctx.quadraticCurveTo(-8, 22, -27, 27);
        ctx.quadraticCurveTo(-21, 7, -5, -4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#dffff8';
        ctx.beginPath();
        ctx.ellipse(5, 2, 18, 10, -0.08, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(19, -3, 8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#7ee5d2';
        ctx.beginPath();
        ctx.moveTo(26, -3);
        ctx.lineTo(35, 0);
        ctx.lineTo(26, 3);
        ctx.closePath();
        ctx.fill();
    }
    else if (selectedTheme === 'spring') {
        const wing = Math.sin(phase * 1.7) * 0.6;
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
        glow.addColorStop(0, 'rgba(179,232,255,.32)');
        glow.addColorStop(1, 'rgba(179,232,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#4d94a0';
        ctx.lineWidth = 1.2;
        ctx.fillStyle = 'rgba(177,235,246,.85)';
        ctx.beginPath();
        ctx.ellipse(-12, -5, 15, 7 + wing * 3, -0.6, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(12, -5, 15, 7 - wing * 3, 0.6, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(151,214,242,.85)';
        ctx.beginPath();
        ctx.ellipse(-10, 8, 12, 6 + wing * 2, -0.25, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(10, 8, 12, 6 - wing * 2, 0.25, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3f8aa0';
        ctx.fillRect(-1.5, -12, 3, 26);
        ctx.beginPath();
        ctx.arc(0, -14, 4, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#7fcaee';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.quadraticCurveTo(-8, -24, -12, -24);
        ctx.moveTo(0, -14);
        ctx.quadraticCurveTo(8, -24, 12, -24);
        ctx.stroke();
    }
    else if (selectedTheme === 'summer') {
        const flap = Math.sin(phase * 1.9) * 0.26;
        ctx.rotate(flap);
        ctx.fillStyle = '#29365a';
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.quadraticCurveTo(-8, -12, 7, -2);
        ctx.quadraticCurveTo(-4, 2, -24, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-20, 4);
        ctx.quadraticCurveTo(-6, 16, 9, 6);
        ctx.quadraticCurveTo(-5, 7, -20, 4);
        ctx.fill();
        ctx.fillStyle = '#f4f6fb';
        ctx.beginPath();
        ctx.ellipse(8, 0, 18, 8, 0.1, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(24, -2, 6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d86f2e';
        ctx.beginPath();
        ctx.ellipse(8, -2, 8, 4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d08d27';
        ctx.beginPath();
        ctx.moveTo(29, -2);
        ctx.lineTo(38, 1);
        ctx.lineTo(29, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,155,.36)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(6, 0, 32, -0.3, 1.5);
        ctx.stroke();
    }
    else {
        const flap = Math.sin(phase * 1.5) * 0.34;
        ctx.fillStyle = '#1b1a1f';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(-28, -18 - flap * 10, -42, -6);
        ctx.quadraticCurveTo(-26, 2, -8, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-6, 4);
        ctx.quadraticCurveTo(-24, 18 + flap * 10, -36, 14);
        ctx.quadraticCurveTo(-20, 8, -6, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(9, 1, 18, 9, 0.08, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(24, -2, 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d9b65c';
        ctx.beginPath();
        ctx.arc(25, -4, 1.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#c58b35';
        ctx.beginPath();
        ctx.moveTo(30, -2);
        ctx.lineTo(39, 1);
        ctx.lineTo(30, 4);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}
function currentAnimFrame() {
    const spec = animRanges[animState];
    if (animState === 'walk')
        return atlasFrame(spec.frames[Math.floor(groundTravel / 19) % spec.frames.length]);
    if (animState === 'rise' || animState === 'apex') {
        // These velocity windows end before their timed four-frame loops can finish.
        // Use the full curated sequence as Zima slows through ascent and the crest.
        const upper = animState === 'rise' ? 620 : 170;
        const lower = animState === 'rise' ? 170 : -120;
        const progress = Math.max(0, Math.min(1, (upper - cat.vy) / (upper - lower)));
        const index = Math.min(spec.frames.length - 1, Math.floor(progress * spec.frames.length));
        return atlasFrame(spec.frames[index]);
    }
    const raw = Math.floor(animStateTime * spec.fps);
    const localIndex = spec.loop ? (raw % spec.frames.length) : Math.min(spec.frames.length - 1, raw);
    return atlasFrame(spec.frames[localIndex]);
}
function drawOneAtlasFrame(frame) {
    const art = seasonalScarfArt(spriteImage, `atlas:${frame.sx}:${frame.sy}`, frame);
    const sourceX = art === spriteImage ? frame.sx : 0;
    const sourceY = art === spriteImage ? frame.sy : 0;
    const sourceWidth = art === spriteImage ? frame.sw : art.width;
    const sourceHeight = art === spriteImage ? frame.sh : art.height;
    ctx.drawImage(art, sourceX, sourceY, sourceWidth, sourceHeight, -frame.sw * SPRITE_SCALE * frame.ax, -frame.sh * SPRITE_SCALE * frame.ay, frame.sw * SPRITE_SCALE, frame.sh * SPRITE_SCALE);
}
function drawZimaCutCell(image, index, cacheKey, facing, anchor = 340 / 356, paintedHeight = 89) {
    const frame = { sx: index * 500, sy: 0, sw: 500, sh: 356, ax: 0.5, ay: anchor };
    const art = seasonalScarfArt(image, cacheKey, frame);
    const sourceX = art === image ? frame.sx : 0;
    const sourceWidth = art === image ? frame.sw : art.width;
    const sourceHeight = art === image ? frame.sh : art.height;
    const paintedWidth = paintedHeight * frame.sw / frame.sh;
    ctx.scale(facing, 1);
    ctx.drawImage(art, sourceX, 0, sourceWidth, sourceHeight, -paintedWidth / 2, -paintedHeight * frame.ay, paintedWidth, paintedHeight);
}
const COMPANION_HEIGHT = {
    'earl-grey': 89,
    'betty-davis': 76,
    'gracie-bell': 84,
};
const COMPANION_GROUND_ANCHOR = {
    'earl-grey': { idle: 1019 / 1079, walk: 1007 / 1080, land: 949 / 1080, contact: 964 / 1079 },
    'betty-davis': { idle: 1031 / 1079, walk: 1007 / 1080, land: 965 / 1079, contact: 1021 / 1079 },
    'gracie-bell': { idle: 1021 / 1079, walk: 1009 / 1079, land: 946 / 1079, contact: 920 / 1079 },
};
const COMPANION_EVENT_ANCHOR = {
    'earl-grey': { launch: 0.95158, recover: 0.90316, topContact: 0.93053, turn: 0.94316 },
    'betty-davis': { launch: 0.91561, recover: 0.89873, topContact: 0.96211, turn: 0.95148 },
    'gracie-bell': { launch: 0.92, recover: 0.91543, topContact: 0.96842, turn: 0.95359 },
};
function drawCompanionSprite(character, x, y, facing, vx, vy) {
    const grounded = state === 'title' || state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint'
        || animState === 'groundLand' || animState === 'land';
    let pose;
    if (state === 'title' || (state === 'ready' && animState !== 'walk' && animState !== 'crouch'))
        pose = 'idle';
    else if (animState === 'groundLand' || animState === 'crouch')
        pose = 'land';
    else if (animState === 'boostContact' || animState === 'undersideContact' || animState === 'land')
        pose = 'contact';
    else if (animState === 'fall')
        pose = 'fall';
    else if (animState === 'rise' || animState === 'launch' || animState === 'apex')
        pose = 'rise';
    else
        pose = animState === 'walk' ? 'walk' : 'idle';
    const sixteenWalkImage = companionWalkSixteen[character];
    const fourWalkImage = companionWalkKeys[character];
    const useSixteenWalk = pose === 'walk' && sixteenWalkImage.complete
        && sixteenWalkImage.naturalWidth === 8000 && sixteenWalkImage.naturalHeight === 356;
    const useFourWalk = pose === 'walk' && fourWalkImage.complete
        && fourWalkImage.naturalWidth === 2000 && fourWalkImage.naturalHeight === 356;
    const useWalkKeys = useSixteenWalk || useFourWalk;
    const walkKeysImage = useSixteenWalk ? sixteenWalkImage : fourWalkImage;
    const idleKeysImage = companionIdleSixteen[character];
    const useSixteenIdle = pose === 'idle' && idleKeysImage.complete
        && idleKeysImage.naturalWidth === 8000 && idleKeysImage.naturalHeight === 356;
    const displayedPose = pose === 'walk' && !useWalkKeys && Math.floor(groundTravel / 18) % 2 === 0 ? 'idle' : pose;
    const turnProgress = turnTime / TURN_DURATION;
    const eventImages = companionEventArt[character];
    const eventAnchors = COMPANION_EVENT_ANCHOR[character];
    let companionEvent = null;
    {
        if (grounded && turnProgress >= 0.28 && turnProgress <= 0.72) {
            companionEvent = { image: eventImages.turn, tintPose: 'walk', anchor: eventAnchors.turn };
        }
        else if (animState === 'land') {
            companionEvent = { image: eventImages.topContact, tintPose: 'contact', anchor: eventAnchors.topContact };
        }
        else if (animState === 'undersideContact' && animStateTime < 0.085) {
            companionEvent = { image: lastBellContactDirection === 'side' ? eventImages.sideContact : eventImages.undersideContact,
                tintPose: 'contact', anchor: 0.72 };
        }
        else if (animState === 'boostContact' && animStateTime < 0.085) {
            companionEvent = { image: eventImages.boostContact, tintPose: 'contact', anchor: 0.72 };
        }
        else if (animState === 'launch' && animStateTime < 0.12) {
            companionEvent = { image: eventImages.launch, tintPose: 'rise',
                anchor: eventAnchors.launch + (0.72 - eventAnchors.launch) * Math.min(1, animStateTime / 0.12) };
        }
        else if (animState === 'apex' && animStateTime < 0.07) {
            companionEvent = { image: eventImages.apex, tintPose: 'rise', anchor: 0.72 };
        }
        else if (animState === 'fall' && character !== 'earl-grey' && Math.floor(animStateTime * 6) % 2 === 1) {
            companionEvent = { image: eventImages.fallTuck, tintPose: 'fall', anchor: 0.72 };
        }
        else if (animState === 'groundLand' && animStateTime >= 0.11) {
            companionEvent = { image: eventImages.recover, tintPose: 'land', anchor: eventAnchors.recover };
        }
        if (companionEvent && !companionEvent.image.naturalWidth)
            companionEvent = null;
    }
    const image = companionArt[character][displayedPose];
    if (!image?.naturalWidth)
        return;
    const height = COMPANION_HEIGHT[character];
    const width = height * image.naturalWidth / image.naturalHeight;
    const anchor = grounded && (displayedPose === 'idle' || displayedPose === 'walk' || displayedPose === 'land' || displayedPose === 'contact')
        ? COMPANION_GROUND_ANCHOR[character][displayedPose] : 0.72;
    const tilt = grounded ? 0 : Math.max(-0.13, Math.min(0.13, vx / 2500)) + Math.max(-0.08, Math.min(0.08, -vy / 6500));
    const gait = grounded && pose === 'walk' && !useWalkKeys ? Math.sin(groundTravel / 38 * TAU) * 0.018 : 0;
    const motionFamily = (animState === 'crouch' || animState === 'launch' || animState === 'rise'
        || animState === 'apex' || animState === 'fall') ? animState : null;
    const motionImage = motionFamily ? companionMotionKeys[character][motionFamily] : null;
    const useMotionKeys = !!motionImage && motionImage.complete && motionImage.naturalHeight === 356
        && motionImage.naturalWidth === (motionFamily === 'rise' || motionFamily === 'fall' ? 4000 : 2000);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const drawFacing = grounded && turnProgress < 0.5 ? turnFrom : facing;
    ctx.scale(drawFacing * (1 + gait), 1 - gait * 0.5);
    if (companionEvent) {
        const paintedWidth = height * companionEvent.image.naturalWidth / companionEvent.image.naturalHeight;
        ctx.drawImage(seasonalCompanionArt(character, companionEvent.tintPose, companionEvent.image), -paintedWidth / 2, -height * companionEvent.anchor, paintedWidth, height);
    }
    else if (useMotionKeys && motionImage && motionFamily) {
        const count = motionFamily === 'rise' || motionFamily === 'fall' ? 8 : 4;
        const rate = motionFamily === 'crouch' ? 10 : motionFamily === 'launch' ? 16 : 12;
        const velocityPhase = motionFamily === 'rise' ? (620 - vy) / 450
            : motionFamily === 'apex' ? (170 - vy) / 290 : null;
        const frame = character !== 'earl-grey' && velocityPhase !== null
            ? Math.max(0, Math.min(count - 1, Math.floor(velocityPhase * count)))
            : motionFamily === 'rise' || motionFamily === 'fall'
                ? Math.floor(animStateTime * rate) % count : Math.min(count - 1, Math.floor(animStateTime * rate));
        // The airborne sheets were packed with a smaller painted subject than the
        // separate event paintings. Keep their visible body size aligned at handoff.
        const motionScale = motionFamily === 'crouch' ? 1 : 1.3;
        const paintedHeight = height * motionScale;
        const paintedWidth = paintedHeight * 500 / 356;
        const anchor = motionFamily === 'crouch' ? 340 / 356 : 225 / 356;
        ctx.drawImage(seasonalCompanionArt(character, displayedPose, motionImage), frame * 500, 0, 500, 356, -paintedWidth / 2, -paintedHeight * anchor, paintedWidth, paintedHeight);
    }
    else if (useWalkKeys || useSixteenIdle) {
        const cellWidth = 500, cellHeight = 356;
        const idleStep = Math.floor(elapsed * 4) % 30;
        const frame = useSixteenIdle ? (idleStep <= 15 ? idleStep : 30 - idleStep)
            : useSixteenWalk ? Math.floor(groundTravel / 4.5) % 16 : Math.floor(groundTravel / 18) % 4;
        const paintedWidth = height * cellWidth / cellHeight;
        ctx.drawImage(seasonalCompanionArt(character, useSixteenIdle ? 'idle' : 'walk', useSixteenIdle ? idleKeysImage : walkKeysImage), frame * cellWidth, 0, cellWidth, cellHeight, -paintedWidth / 2, -height * (340 / cellHeight), paintedWidth, height);
    }
    else {
        ctx.drawImage(seasonalCompanionArt(character, displayedPose), -width / 2, -height * anchor, width, height);
    }
    ctx.restore();
}
function drawSpriteFrame(x, y, facing, vx, vy) {
    if (selectedCharacter !== 'zima' && companionArtState[selectedCharacter] === 'ready') {
        drawCompanionSprite(selectedCharacter, x, y, facing, vx, vy);
        return;
    }
    const current = currentAnimFrame();
    const grounded = state === 'title' || state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint' || animState === 'groundLand' || (animState === 'land' && bounceHold > 0);
    const tilt = grounded ? 0 : Math.max(-0.13, Math.min(0.13, vx / 2500)) + Math.max(-0.08, Math.min(0.08, -vy / 6500));
    const turnProgress = turnTime / TURN_DURATION;
    const drawFacing = turnProgress < 0.5 ? turnFrom : facing;
    const hasTurnFront = zimaTurnFrontImage.complete
        && zimaTurnFrontImage.naturalWidth === 500 && zimaTurnFrontImage.naturalHeight === 356;
    const hasTurnMiddle = zimaTurnMiddleImage.complete
        && zimaTurnMiddleImage.naturalWidth === 500 && zimaTurnMiddleImage.naturalHeight === 356;
    const hasTurnPose = grounded && (hasTurnFront || hasTurnMiddle || turnPoseImage.complete && turnPoseImage.naturalWidth > 0);
    const showTurnPose = hasTurnPose && turnProgress >= 0.28 && turnProgress <= 0.72;
    const motionFamily = animState === 'undersideContact' ? 'sideContact'
        : animState === 'boostContact' ? 'contact'
            : animState === 'groundLand' || animState === 'land' ? 'land'
                : animState === 'crouch' || animState === 'launch' || animState === 'rise'
                    || animState === 'apex' || animState === 'fall' ? animState : null;
    const motionImage = motionFamily ? zimaMotionImages[motionFamily] : null;
    const useMotion = !!motionImage && motionImage.complete
        && motionImage.naturalWidth === 8000 && motionImage.naturalHeight === 356;
    const showTopContact = animState === 'land' && !useMotion && animStateTime <= 0.050
        && topContactImage.complete && topContactImage.naturalWidth > 0;
    const showUndersideContact = animState === 'undersideContact' && !useMotion && animStateTime <= 0.050
        && undersideContactImage.complete && undersideContactImage.naturalWidth > 0;
    const showAirborneBoost = animState === 'boostContact' && !useMotion && animStateTime <= 0.085
        && airborneBoostImage.complete && airborneBoostImage.naturalWidth > 0;
    const showFallPose = animState === 'fall' && !useMotion
        && fallPoseImage.complete && fallPoseImage.naturalWidth > 0;
    const turnWidth = 1 - (hasTurnPose ? 0.20 : 0.42) * Math.sin(Math.PI * turnProgress);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    if (showTopContact) {
        const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
        const poseWidth = poseHeight * topContactImage.naturalWidth / topContactImage.naturalHeight;
        ctx.scale(facing, 1);
        ctx.drawImage(seasonalScarfArt(topContactImage, 'top'), -poseWidth / 2, -poseHeight * (1015 / 1079), poseWidth, poseHeight);
    }
    else if (showUndersideContact) {
        const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
        const poseWidth = poseHeight * undersideContactImage.naturalWidth / undersideContactImage.naturalHeight;
        ctx.scale(facing, 1);
        ctx.drawImage(seasonalScarfArt(undersideContactImage, 'underside'), -poseWidth / 2, -poseHeight, poseWidth, poseHeight);
    }
    else if (showAirborneBoost) {
        const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
        const poseWidth = poseHeight * airborneBoostImage.naturalWidth / airborneBoostImage.naturalHeight;
        ctx.scale(facing, 1);
        ctx.drawImage(seasonalScarfArt(airborneBoostImage, 'boost'), -poseWidth / 2, -poseHeight, poseWidth, poseHeight);
    }
    else if (showFallPose) {
        const fallFrame = fallTuckImage.naturalWidth && Math.floor(animStateTime * 6) % 2 === 1 ? fallTuckImage : fallPoseImage;
        const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.96;
        const poseWidth = poseHeight * fallFrame.naturalWidth / fallFrame.naturalHeight;
        ctx.scale(drawFacing, 1);
        ctx.rotate(Math.sin(animStateTime * 6) * 0.025);
        ctx.drawImage(seasonalScarfArt(fallFrame, fallFrame === fallPoseImage ? 'fall' : 'fallTuck'), -poseWidth / 2, -poseHeight * 0.72, poseWidth, poseHeight);
    }
    else if (showTurnPose) {
        if (hasTurnMiddle && (turnProgress < 0.42 || turnProgress > 0.58)) {
            drawZimaCutCell(zimaTurnMiddleImage, 0, 'zima-turn-middle', drawFacing, 340 / 356, 95);
        }
        else if (hasTurnFront) {
            drawZimaCutCell(zimaTurnFrontImage, 0, 'zima-turn-front', drawFacing, 340 / 356, 95);
        }
        else {
            const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
            const poseWidth = poseHeight * turnPoseImage.naturalWidth / turnPoseImage.naturalHeight;
            const midPhase = (turnProgress - 0.28) / 0.44;
            const poseScale = 0.80 + 0.15 * Math.sin(Math.PI * midPhase);
            ctx.scale(drawFacing * poseScale, 1);
            ctx.drawImage(seasonalScarfArt(turnPoseImage, 'turn'), -poseWidth / 2, -poseHeight * (991 / 1079), poseWidth, poseHeight);
        }
    }
    else if (useMotion && motionImage && motionFamily) {
        let index;
        if (motionFamily === 'crouch')
            index = Math.min(15, Math.floor(animStateTime / 0.12 * 16));
        else if (motionFamily === 'launch')
            index = Math.min(15, Math.floor(animStateTime * 50));
        else if (motionFamily === 'rise')
            index = Math.max(1, Math.min(15, 1 + Math.floor((620 - vy) / 450 * 15)));
        else if (motionFamily === 'apex')
            index = Math.max(0, Math.min(15, Math.floor((170 - vy) / 290 * 16)));
        else if (motionFamily === 'fall')
            index = Math.floor(animStateTime * 10) % 16;
        else if (motionFamily === 'land') {
            const settle = [6, 7, 9, 11, 13, 15, 8, 10, 12, 14];
            index = settle[Math.min(settle.length - 1, Math.floor(animStateTime / 0.25 * settle.length))];
        }
        else
            index = Math.min(15, Math.floor(animStateTime / 0.16 * 16));
        const anchor = motionFamily === 'crouch' || motionFamily === 'land' && grounded
            ? 340 / 356 : motionFamily === 'launch'
            ? 340 / 356 + (0.72 - 340 / 356) * Math.min(1, animStateTime / 0.12)
            : 0.72;
        const paintedHeight = motionFamily === 'fall' ? 105 : motionFamily === 'land' ? 102 : 89;
        drawZimaCutCell(motionImage, index, `zima-${motionFamily}:16:${index}`, drawFacing, anchor, paintedHeight);
    }
    else if (grounded && animState === 'walk' && zimaWalkSixteenImage.naturalWidth === 8000
        && zimaWalkSixteenImage.naturalHeight === 356) {
        const index = Math.floor(groundTravel / 8) % 16;
        drawZimaCutCell(zimaWalkSixteenImage, index, `zima-walk:16:${index}`, drawFacing);
    }
    else if (grounded && animState === 'idle' && ((zimaIdleSixteenImage.naturalWidth === 8000 && zimaIdleSixteenImage.naturalHeight === 356)
        || (zimaIdleKeysImage.naturalWidth === 2000 && zimaIdleKeysImage.naturalHeight === 356))) {
        const useSixteen = zimaIdleSixteenImage.naturalWidth === 8000 && zimaIdleSixteenImage.naturalHeight === 356;
        const idleImage = useSixteen ? zimaIdleSixteenImage : zimaIdleKeysImage;
        const idleStep = Math.floor(elapsed * 4) % 30;
        const fourCycle = [0, 0, 1, 0, 2, 2, 3, 0];
        const index = useSixteen ? (idleStep <= 15 ? idleStep : 30 - idleStep)
            : fourCycle[Math.floor(elapsed * 2) % fourCycle.length];
        drawZimaCutCell(idleImage, index, `zima-idle:${useSixteen ? '16' : '4'}:${index}`, drawFacing);
    }
    else {
        const gaitWeight = grounded && animState === 'walk' ? Math.sin(groundTravel / 38 * TAU) * 0.012 : 0;
        ctx.scale(drawFacing * turnWidth * (1 + gaitWeight), (1 + 0.03 * Math.sin(Math.PI * turnProgress)) * (1 - gaitWeight * 0.5));
        drawOneAtlasFrame(current);
    }
    ctx.restore();
}
function drawShadow(radius, alpha, yOffset) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(0, yOffset, 3, 0, yOffset, radius);
    g.addColorStop(0, 'rgba(5,10,16,.45)');
    g.addColorStop(1, 'rgba(5,10,16,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, yOffset, radius, radius * 0.35, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
}
function drawGroundMarks() {
    const surfaceY = worldToScreenY(GROUND_Y) + 2;
    if (surfaceY < -20 || surfaceY > height + 20)
        return;
    ctx.save();
    for (const mark of groundMarks) {
        ctx.globalAlpha = Math.max(0, 1 - mark.age / mark.life) * 0.72;
        ctx.save();
        ctx.translate(mark.x, surfaceY);
        if (mark.theme === 'winter') {
            ctx.fillStyle = '#b7d6e8';
            ctx.beginPath();
            ctx.ellipse(0, 1, 11, 3.7, 0, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#f3fbff';
            ctx.lineWidth = 1.1;
            ctx.stroke();
        }
        else if (mark.theme === 'spring') {
            ctx.strokeStyle = '#6eb779';
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            for (const offset of [-7, 0, 7]) {
                ctx.beginPath();
                ctx.moveTo(offset, 2);
                ctx.quadraticCurveTo(offset + mark.side * 3, -7, offset + mark.side * 6, -9);
                ctx.stroke();
            }
            ctx.strokeStyle = '#b5e4dc';
            ctx.beginPath();
            ctx.ellipse(0, 3, 12, 2.6, 0, 0, Math.PI);
            ctx.stroke();
        }
        else if (mark.theme === 'summer') {
            ctx.strokeStyle = '#d9ad69';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(0, 2, 12, 3, 0, 0, Math.PI);
            ctx.stroke();
            ctx.fillStyle = '#f5d99f';
            for (const offset of [-9, 0, 9]) {
                ctx.beginPath();
                ctx.arc(offset, -2, 1.3, 0, TAU);
                ctx.fill();
            }
        }
        else {
            ctx.fillStyle = '#bd6837';
            ctx.beginPath();
            ctx.ellipse(mark.side * 3, 0, 8, 3.8, mark.side * 0.25, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#e5ae67';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-7, 3);
            ctx.lineTo(8, 3);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore();
}
function drawFallbackCat(x, y, vx, vy) {
    ctx.save();
    ctx.translate(x, y);
    const speedTilt = Math.max(-0.28, Math.min(0.28, vx / 950));
    ctx.rotate(speedTilt);
    ctx.scale(cat.facing, 1);
    const squash = cat.landedFlash > 0 ? 1.14 : 1;
    const stretch = vy > 300 ? 1.07 : vy < -300 ? 0.98 : 1;
    ctx.scale(1 / squash, squash * stretch);
    ctx.strokeStyle = '#f6fbff';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, 13);
    ctx.bezierCurveTo(-39, 18, -37, -10, -24, -16 + Math.sin(elapsed * 8) * 3);
    ctx.stroke();
    ctx.strokeStyle = '#c9dbe6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f7fbff';
    ctx.strokeStyle = '#bfd0dc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 7, 20, 24, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5bbbd5';
    ctx.beginPath();
    ctx.roundRect(-17, -7, 33, 7, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.quadraticCurveTo(-22, 10, -14, 20);
    ctx.lineTo(-7, 16);
    ctx.quadraticCurveTo(-14, 8, -4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8fcff';
    ctx.strokeStyle = '#bfd0dc';
    ctx.beginPath();
    ctx.moveTo(-17, -25);
    ctx.lineTo(-13, -43);
    ctx.lineTo(-3, -32);
    ctx.quadraticCurveTo(8, -34, 16, -26);
    ctx.lineTo(20, -43);
    ctx.lineTo(28, -24);
    ctx.quadraticCurveTo(31, -5, 9, 0);
    ctx.quadraticCurveTo(-12, 3, -24, -10);
    ctx.quadraticCurveTo(-29, -18, -17, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
function drawCat(x, y, vx, vy) {
    const grounded = state === 'title' || state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint' || animState === 'groundLand' || (animState === 'land' && bounceHold > 0);
    if (grounded) {
        ctx.save();
        ctx.translate(x, y);
        const alpha = selectedTheme === 'winter' ? 0.30 : selectedTheme === 'spring' ? 0.25 : selectedTheme === 'summer' ? 0.27 : 0.28;
        drawShadow(25 + Math.abs(vx) * 0.012, alpha, 4);
        ctx.restore();
    }
    if (spriteImage.complete && spriteImage.naturalWidth > 0) {
        drawSpriteFrame(x, y, cat.facing, vx, vy);
    }
    else {
        drawFallbackCat(x, y, vx, vy);
    }
}
function decimalLines(value, font, maxWidth) {
    ctx.save();
    ctx.font = font;
    const groups = formatScore(value).split(',');
    const lines = [];
    let line = groups.shift() || '0';
    for (const group of groups) {
        const candidate = `${line},${group}`;
        if (ctx.measureText(candidate).width > maxWidth) {
            lines.push(`${line},`);
            line = group;
        }
        else
            line = candidate;
    }
    lines.push(line);
    ctx.restore();
    return lines;
}
function drawDecimal(value, x, y, maxWidth, font, lineHeight, align = 'left') {
    const lines = decimalLines(value, font, maxWidth);
    ctx.font = font;
    ctx.textAlign = align;
    for (const line of lines) {
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
    return y;
}
function drawHUD() {
    ctx.save();
    const scoreFont = '700 18px ui-rounded, system-ui, sans-serif';
    const bestFont = '600 13px ui-rounded, system-ui, sans-serif';
    const scoreLineCount = decimalLines(score, scoreFont, 222).length;
    const bestLineCount = decimalLines(bestForMode(), bestFont, 222).length;
    const panelH = 76 + scoreLineCount * 20 + bestLineCount * 16 + (selectedMode === 'expedition' ? 58 : 0);
    ctx.fillStyle = 'rgba(4,18,30,.94)';
    ctx.beginPath();
    ctx.roundRect(18, 18, 254, panelH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.30)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '700 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`SCORE  ·  ${themeMeta().label.toUpperCase()}`, 34, 39);
    ctx.fillStyle = '#f2fbff';
    let nextY = drawDecimal(score, 34, 62, 222, scoreFont, 20);
    ctx.fillStyle = '#eaf7ff';
    ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${selectedMode.toUpperCase()} BEST${bestIsApproximate() ? ' · APPROX.' : ''}`, 34, nextY + 7);
    nextY = drawDecimal(bestForMode(), 34, nextY + 24, 222, bestFont, 16);
    ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`BOUNCES ${bellCount}     MULTI x${multiplier}`, 34, nextY + 4);
    if (selectedMode === 'expedition') {
        const goals = expeditionGoals();
        const target = goals[Math.min(2, expeditionStage)];
        const from = expeditionStage === 0 ? 0 : goals[expeditionStage - 1];
        const progress = Math.max(0, Math.min(1, (highestY - from) / (target - from)));
        ctx.fillStyle = themeMeta().accent;
        ctx.font = '700 11px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`STAGE ${expeditionStage + 1}/3  ·  ${expeditionGoalName()}`, 34, nextY + 24, 220);
        ctx.fillStyle = 'rgba(255,255,255,.20)';
        ctx.beginPath();
        ctx.roundRect(34, nextY + 34, 220, 8, 4);
        ctx.fill();
        ctx.fillStyle = themeMeta().accent;
        ctx.beginPath();
        ctx.roundRect(34, nextY + 34, Math.max(1, 220 * progress), 8, 4);
        ctx.fill();
        ctx.font = '600 10px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`${Math.max(0, Math.ceil(target - highestY)).toLocaleString()} TO GO  ·  ${expeditionRetries} RETRIES`, 34, nextY + 56, 220);
    }
    ctx.textAlign = 'center';
    if (messageTimer > 0) {
        ctx.globalAlpha = Math.min(1, messageTimer * 1.8);
        ctx.font = '800 24px ui-rounded, system-ui, sans-serif';
        ctx.fillStyle = themeMeta().accent;
        ctx.fillText(message, width / 2, Math.max(150, height * 0.19));
    }
    const controlsX = width >= 620 ? Math.max(282, width - 390) : 18;
    const controlsY = width >= 620 ? 18 : 128;
    const controlsW = Math.min(372, width - controlsX - 18);
    ctx.fillStyle = 'rgba(4,18,30,.96)';
    ctx.beginPath();
    ctx.roundRect(controlsX, controlsY, controlsW, 76, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.42)';
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '700 13px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = '#f3fbff';
    ctx.fillText(`${selectedMode.toUpperCase()}  ·  L Scores  ·  P ${paused ? 'Resume' : 'Pause'}`, controlsX + 12, controlsY + 29, controlsW - 105);
    ctx.fillText(`M Music ${muted ? 'off' : 'on'}  ·  R Restart`, controlsX + 12, controlsY + 56, controlsW - 105);
    menuRect = { x: controlsX + controlsW - 88, y: controlsY + 19, w: 76, h: 40 };
    ctx.fillStyle = '#f3fbff';
    ctx.beginPath();
    ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 11);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#081c2c';
    ctx.font = '800 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText('MENU', menuRect.x + menuRect.w / 2, menuRect.y + 17);
    ctx.font = '600 10px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Esc', menuRect.x + menuRect.w / 2, menuRect.y + 31);
    ctx.restore();
}
function drawTitle() {
    ctx.save();
    const cx = width / 2;
    const meta = themeMeta();
    const compact = height < 680;
    ctx.textAlign = 'center';
    const top = compact ? 42 : 48;
    ctx.fillStyle = '#f4fbff';
    ctx.font = `800 ${Math.min(compact ? 44 : 58, width * 0.058)}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText('CATS OF THE CHANGING SKY', cx, top, width - 28);
    ctx.font = `500 ${compact ? 13 : 16}px ui-rounded, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(240,248,252,.88)';
    ctx.fillText('Choose a season and a play mode.', cx, top + (compact ? 23 : 30));
    const gap = compact ? 8 : 14;
    const cardW = Math.max(112, Math.min(205, (width - (compact ? 40 : 90) - gap * 3) / 4));
    const cardH = compact ? 82 : 108;
    const totalW = cardW * 4 + gap * 3;
    const sx = (width - totalW) / 2;
    const themeY = top + (compact ? 39 : 52);
    themeCardRects = [];
    THEME_ORDER.forEach((theme, i) => {
        const x = sx + i * (cardW + gap);
        themeCardRects.push({ theme, rect: { x, y: themeY, w: cardW, h: cardH } });
        const sel = theme === selectedTheme;
        ctx.fillStyle = sel ? 'rgba(255,255,255,.16)' : 'rgba(5,19,32,.48)';
        ctx.beginPath();
        ctx.roundRect(x, themeY, cardW, cardH, 17);
        ctx.fill();
        ctx.strokeStyle = sel ? THEME_META[theme].accent : 'rgba(255,255,255,.16)';
        ctx.lineWidth = sel ? 3 : 1.2;
        ctx.stroke();
        drawThemeIcon(theme, x + cardW / 2, themeY + (compact ? 22 : 30), (sel ? 0.96 : 0.86) * (compact ? 0.76 : 1));
        ctx.fillStyle = '#fff';
        ctx.font = '700 17px ui-rounded, system-ui, sans-serif';
        ctx.fillText(THEME_META[theme].label, x + cardW / 2, themeY + (compact ? 52 : 68));
        ctx.font = '500 11px ui-rounded, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(235,246,250,.80)';
        ctx.fillText(`${THEME_META[theme].normal} • ${THEME_META[theme].airborne}`, x + cardW / 2, themeY + (compact ? 72 : 89), cardW - 12);
    });
    const modeY = themeY + cardH + (compact ? 8 : 16);
    const modeW = Math.min(205, (width - 52 - 20) / 3);
    const modeH = compact ? 48 : 62;
    modeCardRects = [];
    const modes = [
        { mode: 'classic', title: 'CLASSIC', desc: 'Miss the chain and eventually land.' },
        { mode: 'zen', title: 'ZEN', desc: 'Land safely and launch again. Keep your score.' },
        { mode: 'expedition', title: 'EXPEDITION', desc: 'Reach a seasonal summit with checkpoints.' },
    ];
    modes.forEach((m, i) => {
        const x = cx - (modeW * 3 + 20) / 2 + i * (modeW + 10);
        modeCardRects.push({ mode: m.mode, rect: { x, y: modeY, w: modeW, h: modeH } });
        const sel = selectedMode === m.mode;
        ctx.fillStyle = sel ? seasonPanelFill(0.72) : 'rgba(5,19,32,.42)';
        ctx.beginPath();
        ctx.roundRect(x, modeY, modeW, modeH, 16);
        ctx.fill();
        ctx.strokeStyle = sel ? meta.accent : 'rgba(255,255,255,.14)';
        ctx.lineWidth = sel ? 2.5 : 1;
        ctx.stroke();
        ctx.fillStyle = sel ? meta.accent : '#f0f7fa';
        ctx.font = '800 16px ui-rounded, system-ui, sans-serif';
        ctx.fillText(m.title, x + modeW / 2, modeY + (compact ? 19 : 23));
        ctx.fillStyle = 'rgba(231,244,250,.78)';
        ctx.font = '500 11px ui-rounded, system-ui, sans-serif';
        ctx.fillText(m.desc, x + modeW / 2, modeY + (compact ? 37 : 44), modeW - 14);
    });
    const panelW = Math.min(720, width - 70);
    const panelH = compact ? 86 : 128;
    const panelX = cx - panelW / 2;
    const panelY = modeY + modeH + (compact ? 8 : 16);
    ctx.fillStyle = seasonPanelFill(0.56);
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = meta.accent;
    ctx.font = `800 ${compact ? 18 : 21}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText(`${meta.label.toUpperCase()} • ${selectedMode.toUpperCase()}`, cx, panelY + (compact ? 23 : 30));
    ctx.fillStyle = 'rgba(231,244,250,.84)';
    ctx.font = '500 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText(meta.subtitle, cx, panelY + (compact ? 44 : 52), panelW - 18);
    ctx.fillText(`${meta.normal} / ${meta.medium} / ${meta.strong} • ${meta.airborne} multiplier boost`, cx, panelY + (compact ? 66 : 75), panelW - 18);
    if (!compact)
        ctx.fillText('A/D or ←/→ changes season • W/S or ↑/↓ changes mode • L opens scores', cx, panelY + 98);
    const startY = panelY + panelH + (compact ? 8 : 14);
    titleStartRect = { x: cx - 136, y: startY, w: 272, h: compact ? 38 : 44 };
    ctx.fillStyle = meta.accent;
    ctx.beginPath();
    ctx.roundRect(titleStartRect.x, titleStartRect.y, titleStartRect.w, titleStartRect.h, 16);
    ctx.fill();
    ctx.fillStyle = '#0c1a24';
    ctx.font = '800 17px ui-rounded, system-ui, sans-serif';
    ctx.fillText(selectedArtLoading() ? 'LOADING ART' : 'START CLIMB', cx, startY + (compact ? 25 : 28));
    ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(231,244,250,.74)';
    const bestLabel = `Best ${formatScore(bestForMode())} • Space / Enter / click to start`;
    ctx.fillText(formatScore(bestForMode()).length <= 24 && ctx.measureText(bestLabel).width <= width - 30
        ? bestLabel : 'Best on score board • Space / Enter / click to start', cx, startY + (compact ? 56 : 64));
    ctx.restore();
}
function drawThemeIcon(theme, x, y, scale) {
    const art = interactionAssets[theme];
    if (art) {
        const frame = OBJECT_BOUNDS[theme][0];
        const iconH = 43 * scale;
        const iconW = iconH * frame.w / frame.h;
        ctx.drawImage(art.objects, frame.x, frame.y, frame.w, frame.h, x - iconW / 2, y - iconH / 2, iconW, iconH);
        return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (theme === 'winter') {
        ctx.fillStyle = '#f2d072';
        ctx.beginPath();
        ctx.moveTo(-10, -14);
        ctx.quadraticCurveTo(-18, -2, -14, 10);
        ctx.quadraticCurveTo(0, 18, 14, 10);
        ctx.quadraticCurveTo(18, -2, 10, -14);
        ctx.quadraticCurveTo(0, -19, -10, -14);
        ctx.fill();
        ctx.fillStyle = '#ffeec0';
        ctx.beginPath();
        ctx.arc(0, 12, 5, 0, TAU);
        ctx.fill();
    }
    else if (theme === 'spring') {
        ctx.fillStyle = '#77ccef';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(12, -4, 10, 10);
        ctx.quadraticCurveTo(0, 22, -10, 10);
        ctx.quadraticCurveTo(-12, -4, 0, -18);
        ctx.fill();
        ctx.fillStyle = '#ffd8ef';
        for (let i = 0; i < 5; i++) {
            const a = i / 5 * TAU;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 16, Math.sin(a) * 16, 6, 3.5, a, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#ffef8e';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, TAU);
        ctx.fill();
    }
    else if (theme === 'summer') {
        for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU;
            ctx.fillStyle = '#ffd34a';
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 13, Math.sin(a) * 13, 7, 3, a, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = '#6d4518';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, TAU);
        ctx.fill();
    }
    else {
        ctx.fillStyle = '#ec8b2f';
        ctx.beginPath();
        ctx.ellipse(0, 4, 18, 15, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#9a5419';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 6, -7);
            ctx.quadraticCurveTo(i * 3, 4, i * 6, 15);
            ctx.stroke();
        }
        ctx.fillStyle = '#131313';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.quadraticCurveTo(-24, -10, -32, -2);
        ctx.quadraticCurveTo(-20, 2, -10, -2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.quadraticCurveTo(-22, 12, -28, 10);
        ctx.quadraticCurveTo(-18, 6, -8, 2);
        ctx.fill();
    }
    ctx.restore();
}
function drawReady() {
    ctx.save();
    ctx.fillStyle = 'rgba(1,8,14,.22)';
    ctx.fillRect(0, 0, width, height);
    const cx = width / 2;
    const compact = height < 680;
    const cy = height * (compact ? 0.38 : 0.27);
    const meta = themeMeta();
    const panelW = Math.min(690, width - 36);
    ctx.fillStyle = 'rgba(3,15,27,.78)';
    ctx.beginPath();
    ctx.roundRect(cx - panelW / 2, cy - 43, panelW, selectedMode === 'classic' ? 190 : 212, 22);
    ctx.fill();
    ctx.strokeStyle = meta.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4fbff';
    ctx.font = `800 ${Math.min(compact ? 35 : 46, width * 0.05)}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText(`${meta.label.toUpperCase()} CLIMB READY`, cx, cy, panelW - 26);
    ctx.font = '600 16px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = meta.accent;
    ctx.fillText('Press SPACE / ENTER or click to make the first leap.', cx, cy + 38, panelW - 26);
    ctx.font = '500 13px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(218,241,249,.78)';
    ctx.fillText('Move before launch if you want to line up the first object.', cx, cy + 63, panelW - 26);
    ctx.fillText('During the run: A/D or ←/→, or simply steer with the mouse.', cx, cy + 86, panelW - 26);
    ctx.fillText(`${meta.normal} = normal • ${meta.medium} = boost • ${meta.strong} = stronger boost`, cx, cy + 109, panelW - 26);
    ctx.fillText(`${meta.airborne} raises the multiplier and gives a recovery launch.`, cx, cy + 132, panelW - 26);
    if (selectedMode === 'zen')
        ctx.fillText('ZEN MODE: land safely, keep your score, then launch again.', cx, cy + 155, panelW - 26);
    if (selectedMode === 'expedition')
        ctx.fillText('EXPEDITION: reach the summit. Two base camps save your climb.', cx, cy + 155, panelW - 26);
    ctx.restore();
}
function drawZenGrounded() {
    const panelW = Math.min(520, width - 40);
    const panelY = Math.max(125, height * 0.30);
    ctx.save();
    ctx.fillStyle = 'rgba(3,15,27,.82)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - panelW / 2, panelY, panelW, 100, 18);
    ctx.fill();
    ctx.strokeStyle = themeMeta().accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4fbff';
    ctx.font = '800 25px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${CHARACTER_META[selectedCharacter].name.toUpperCase()} LANDED`, width / 2, panelY + 37, panelW - 26);
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '600 14px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Score kept. Click, Space, or Enter to launch again.', width / 2, panelY + 70, panelW - 26);
    ctx.restore();
}
function drawExpeditionCheckpoint() {
    const w = Math.min(510, width - 36);
    const x = width / 2 - w / 2;
    const y = Math.max(135, height * 0.25);
    ctx.save();
    ctx.fillStyle = 'rgba(3,16,28,.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 124, 18);
    ctx.fill();
    ctx.strokeStyle = themeMeta().accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5fbff';
    ctx.font = '800 23px ui-rounded, system-ui, sans-serif';
    ctx.fillText(expeditionCheckpointY > 0 ? 'BASE CAMP REACHED' : 'BACK AT THE TRAILHEAD', width / 2, y + 35, w - 24);
    ctx.font = '600 13px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = themeMeta().accent;
    ctx.fillText(`Checkpoint ${Math.min(2, expeditionStage)} of 2  ·  ${expeditionGoalName()}`, width / 2, y + 65, w - 24);
    ctx.fillStyle = '#e8f7ff';
    ctx.fillText('Score kept. Multiplier restarts at x1.', width / 2, y + 89, w - 24);
    ctx.fillText('Click, Space, or Enter to climb again.', width / 2, y + 109, w - 24);
    ctx.restore();
}
function drawExpeditionComplete() {
    const endingAge = Math.max(0, elapsed - expeditionEndingAt);
    const reveal = Math.min(1, endingAge / 0.7);
    const w = Math.min(600, width - 40);
    const h = 250;
    const x = width / 2 - w / 2;
    const y = height / 2 - h / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(1,8,16,.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = reveal;
    ctx.fillStyle = 'rgba(5,21,35,.93)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 22);
    ctx.fill();
    ctx.strokeStyle = themeMeta().accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    const glow = ctx.createRadialGradient(width / 2, y + 70, 5, width / 2, y + 70, 120);
    glow.addColorStop(0, themeMeta().accent + '55');
    glow.addColorStop(1, themeMeta().accent + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4fbff';
    ctx.font = '800 30px ui-rounded, system-ui, sans-serif';
    ctx.fillText('EXPEDITION COMPLETE', width / 2, y + 50, w - 26);
    const finale = {
        winter: `${CHARACTER_META[selectedCharacter].name} reaches the Winter Crown beyond the aurora.`,
        spring: `${CHARACTER_META[selectedCharacter].name} reaches the Spring Crown beyond the blossom sky.`,
        summer: `${CHARACTER_META[selectedCharacter].name} reaches the Summer Crown beyond the sapphire clouds.`,
        autumn: `${CHARACTER_META[selectedCharacter].name} reaches the Autumn Crown beyond the copper stars.`,
    };
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '600 15px ui-rounded, system-ui, sans-serif';
    ctx.fillText(finale[selectedTheme], width / 2, y + 81, w - 28);
    ctx.fillStyle = '#f4fbff';
    const scoreEnd = drawDecimal(score, width / 2, y + 121, w - 40, formatScore(score).length > 48 ? '700 16px ui-rounded, system-ui, sans-serif' : '800 27px ui-rounded, system-ui, sans-serif', formatScore(score).length > 48 ? 20 : 31, 'center');
    ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${bellCount} objects  ·  x${multiplier} final multiplier  ·  ${expeditionRetries} retries`, width / 2, scoreEnd + 10, w - 28);
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '700 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText('SPACE / ENTER / CLICK TO TRY AGAIN  ·  L SCORES', width / 2, y + h - 23, w - 24);
    ctx.globalAlpha = 1;
    menuRect = { x: width - 101, y: 18, w: 83, h: 36 };
    ctx.fillStyle = '#f3fbff';
    ctx.beginPath();
    ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 10);
    ctx.fill();
    ctx.fillStyle = '#081c2c';
    ctx.font = '800 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText('MENU · Esc', menuRect.x + menuRect.w / 2, menuRect.y + 23);
    ctx.restore();
}
function drawPaused() {
    ctx.save();
    ctx.fillStyle = 'rgba(1,8,14,.48)';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4fbff';
    ctx.font = `800 ${Math.min(44, width * 0.05)}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText('PAUSED', width / 2, height / 2 - 10);
    ctx.font = '600 16px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(225,244,251,.85)';
    ctx.fillText('Press P to continue', width / 2, height / 2 + 24);
    ctx.restore();
}
function drawGameOver() {
    ctx.save();
    ctx.fillStyle = 'rgba(1,8,14,.58)';
    ctx.fillRect(0, 0, width, height);
    menuRect = { x: width - 101, y: 18, w: 83, h: 36 };
    ctx.fillStyle = '#f3fbff';
    ctx.beginPath();
    ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#081c2c';
    ctx.font = '800 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText('MENU · Esc', menuRect.x + menuRect.w / 2, menuRect.y + 23);
    const cx = width / 2;
    const cy = height / 2;
    const meta = themeMeta();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4fbff';
    ctx.font = `800 ${Math.min(54, width * 0.065)}px ui-rounded, system-ui, sans-serif`;
    ctx.fillText(`${CHARACTER_META[selectedCharacter].name.toUpperCase()} LANDED`, cx, cy - 102, width - 48);
    ctx.fillStyle = '#f4fbff';
    const longScore = formatScore(score).length > 55 || formatScore(bestForMode()).length > 55;
    let nextY = drawDecimal(score, cx, cy - 57, width - 64, longScore ? '700 17px ui-rounded, system-ui, sans-serif' : '800 30px ui-rounded, system-ui, sans-serif', longScore ? 21 : 34, 'center');
    ctx.fillStyle = 'rgba(225,244,251,.82)';
    ctx.font = '600 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${bellCount} objects  •  ${mothCount} ${meta.airborne.toLowerCase()}${mothCount === 1 ? '' : 's'}  •  multiplier x${multiplier}`, cx, nextY + 3);
    ctx.fillText(`${selectedMode.toUpperCase()} BEST${bestIsApproximate() ? ' · APPROX.' : ''}`, cx, nextY + 24);
    ctx.fillStyle = '#f4fbff';
    nextY = drawDecimal(bestForMode(), cx, nextY + 43, width - 64, longScore ? '600 13px ui-rounded, system-ui, sans-serif' : '600 15px ui-rounded, system-ui, sans-serif', longScore ? 16 : 18, 'center');
    ctx.font = '700 16px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = meta.accent;
    ctx.fillText('SPACE / ENTER / CLICK TO RETRY  ·  ESC FOR SEASONS', cx, nextY + 20, width - 40);
    ctx.restore();
}
function drawScoreboard() {
    ctx.save();
    const w = Math.min(820, width - 32);
    const h = Math.min(680, height - 24);
    const x = width / 2 - w / 2;
    const y = height / 2 - h / 2;
    ctx.fillStyle = 'rgba(3,10,18,.98)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 22);
    ctx.fill();
    ctx.strokeStyle = themeMeta().accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5fbff';
    ctx.font = '800 23px ui-rounded, system-ui, sans-serif';
    ctx.fillText('SCORE BOARD', x + 20, y + 35);
    scoreboardModeRects = [];
    const tabWidth = w < 650 ? 86 : 104;
    for (const [i, mode] of GAME_MODES.entries()) {
        const rect = { x: x + w - 20 - (tabWidth * 3 + 12) + i * (tabWidth + 6), y: y + 16, w: tabWidth, h: 29 };
        scoreboardModeRects.push({ mode, rect });
        ctx.fillStyle = scoreboardMode === mode ? themeMeta().accent : 'rgba(255,255,255,.10)';
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
        ctx.fill();
        ctx.fillStyle = scoreboardMode === mode ? '#071722' : '#eaf5fb';
        ctx.font = '700 12px ui-rounded, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mode.toUpperCase(), rect.x + rect.w / 2, rect.y + 20, rect.w - 8);
        ctx.textAlign = 'left';
    }
    ctx.fillStyle = 'rgba(225,240,248,.75)';
    ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${scoreboardMode.toUpperCase()} BEST${bestIsApproximate(scoreboardMode) ? ' · APPROXIMATE LEGACY VALUE' : ''}`, x + 22, y + 67);
    ctx.fillStyle = '#f4fbff';
    let contentY = drawDecimal(bestForMode(scoreboardMode), x + 22, y + 88, w - 44, '700 17px ui-rounded, system-ui, sans-serif', 20);
    if (scoreboardMode === selectedMode) {
        ctx.fillStyle = 'rgba(225,240,248,.75)';
        ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`CURRENT · ${selectedTheme.toUpperCase()} · ${bellCount} BOUNCES · x${multiplier}`, x + 22, contentY + 8);
        ctx.fillStyle = '#f4fbff';
        contentY = drawDecimal(score, x + 22, contentY + 29, w - 44, '600 15px ui-rounded, system-ui, sans-serif', 18);
    }
    if (legacyBest && legacyBest.score > 0n) {
        ctx.fillStyle = 'rgba(225,240,248,.68)';
        ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`LEGACY BEST · MODE UNKNOWN${legacyBest.approximate ? ' · APPROXIMATE' : ''}`, x + 22, contentY + 5);
        ctx.fillStyle = '#f4fbff';
        contentY = drawDecimal(legacyBest.score, x + 22, contentY + 23, w - 44, '600 13px ui-rounded, system-ui, sans-serif', 16);
    }
    const listTop = contentY + 20;
    const listHeight = Math.max(70, y + h - 58 - listTop);
    const rows = scoreHistory.filter(r => r.mode === scoreboardMode)
        .sort((a, b) => a.score === b.score ? b.at - a.at : a.score > b.score ? -1 : 1);
    const rowHeight = (r) => 49 + decimalLines(r.score, '700 17px ui-rounded, system-ui, sans-serif', w - 66).length * 20;
    const pages = [[]];
    let used = 0;
    rows.forEach((record, rank) => {
        const rh = rowHeight(record);
        if (used + rh > listHeight && pages.at(-1).length) {
            pages.push([]);
            used = 0;
        }
        pages.at(-1).push({ record, rank: rank + 1 });
        used += rh;
    });
    scoreboardPageCount = pages.length;
    scoreboardPage = Math.max(0, Math.min(scoreboardPage, pages.length - 1));
    let rowY = listTop;
    for (const { record, rank } of pages[scoreboardPage]) {
        const rh = rowHeight(record);
        ctx.fillStyle = rank === 1 ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,.06)';
        ctx.beginPath();
        ctx.roundRect(x + 18, rowY, w - 36, rh - 5, 10);
        ctx.fill();
        ctx.fillStyle = themeMeta().accent;
        ctx.font = '700 12px ui-rounded, system-ui, sans-serif';
        ctx.fillText(`#${rank}  ${record.theme.toUpperCase()}  ·  ${record.bounces} BOUNCES  ·  x${record.multiplier}${record.retries !== undefined ? `  ·  ${record.retries} RETRIES` : ''}${record.approximate ? '  ·  LEGACY APPROX.' : ''}`, x + 30, rowY + 19, w - 56);
        ctx.fillStyle = '#f5fbff';
        drawDecimal(record.score, x + 30, rowY + 43, w - 66, '700 17px ui-rounded, system-ui, sans-serif', 20);
        rowY += rh;
    }
    if (!rows.length) {
        ctx.fillStyle = 'rgba(225,240,248,.72)';
        ctx.font = '500 13px ui-rounded, system-ui, sans-serif';
        ctx.fillText('Finish a run to add a score for this mode.', x + 24, listTop + 27);
    }
    scoreboardPrevRect = { x: x + 18, y: y + h - 43, w: 55, h: 29 };
    scoreboardNextRect = { x: x + w - 73, y: y + h - 43, w: 55, h: 29 };
    for (const [label, rect] of [['◀', scoreboardPrevRect], ['▶', scoreboardNextRect]]) {
        ctx.fillStyle = 'rgba(255,255,255,.13)';
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
        ctx.fill();
        ctx.fillStyle = '#f5fbff';
        ctx.font = '700 16px ui-rounded, system-ui, sans-serif';
        ctx.fillText(label, rect.x + 20, rect.y + 21);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(225,240,248,.8)';
    ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`PAGE ${scoreboardPage + 1} / ${scoreboardPageCount}  ·  L CLOSE  ·  ↑/↓ PAGE  ·  ←/→ MODE`, width / 2, y + h - 23, w - 155);
    ctx.restore();
}
function drawSnow() {
    ctx.save();
    for (const s of snow) {
        ctx.globalAlpha = s.alpha;
        if (selectedTheme === 'winter') {
            ctx.fillStyle = '#effbff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, TAU);
            ctx.fill();
        }
        else if (selectedTheme === 'spring') {
            ctx.strokeStyle = 'rgba(205,232,255,.70)';
            ctx.lineWidth = Math.max(1, s.r * 0.8);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.drift * 0.16, s.y + s.speed * 0.12);
            ctx.stroke();
            if ((s.phase * 10) % 9 < 1.8) {
                ctx.fillStyle = 'rgba(255,221,238,.55)';
                ctx.beginPath();
                ctx.arc(s.x + 2, s.y + 1, Math.max(1.5, s.r * 0.7), 0, TAU);
                ctx.fill();
            }
        }
        else if (selectedTheme === 'summer') {
            ctx.fillStyle = 'rgba(255,245,165,.72)';
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, s.r * 1.3, s.r * 0.7, s.phase, 0, TAU);
            ctx.fill();
        }
        else {
            ctx.fillStyle = ['#f5b14c', '#c84d2d', '#d8a53e', '#9f6b2e'][Math.floor((s.phase / TAU) * 4) % 4];
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
function ensureAudio() {
    if (audioStarted)
        return;
    audioStarted = true;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.87 * musicLevel;
    musicGain.connect(masterGain);
    effectsGain = audioCtx.createGain();
    effectsGain.gain.value = 0.94 * effectsLevel;
    effectsGain.connect(masterGain);
    brushBuffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.13), audioCtx.sampleRate);
    const samples = brushBuffer.getChannelData(0);
    let noiseSeed = 0x62a5d;
    for (let i = 0; i < samples.length; i++) {
        noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
        samples[i] = (noiseSeed / 2147483648 - 1) * (1 - i / samples.length);
    }
    musicNext = audioCtx.currentTime + 0.18;
    musicBar = 0;
    musicChapterBand = -1;
}
function ping(freq, attack, duration, type) {
    if (!audioCtx || muted)
        return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(effectsGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
}
function midiToHz(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}
function schedulePiano(note, when, duration, level = 0.026) {
    if (!audioCtx || muted)
        return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(midiToHz(note), when);
    osc2.frequency.setValueAtTime(midiToHz(note) * 2.001, when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2900, when);
    filter.Q.value = 0.45;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(level * 0.38, when + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(musicGain);
    osc1.start(when);
    osc2.start(when);
    osc1.stop(when + duration + 0.04);
    osc2.stop(when + duration + 0.04);
}
function scheduleCello(note, when, duration, level = 0.018) {
    if (!audioCtx || muted)
        return;
    const osc = audioCtx.createOscillator();
    const sub = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'sawtooth';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(midiToHz(note), when);
    sub.frequency.setValueAtTime(midiToHz(note - 12), when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(720, when);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.18);
    gain.gain.setValueAtTime(level * 0.9, when + Math.max(0.22, duration - 0.22));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain).connect(musicGain);
    osc.start(when);
    sub.start(when);
    osc.stop(when + duration + 0.04);
    sub.stop(when + duration + 0.04);
}
function scheduleChime(note, when, duration, level = 0.015) {
    if (!audioCtx || muted)
        return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(midiToHz(note), when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(level * 0.28, when + duration * 0.42);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.03);
}
function scheduleWarmPad(note, when, duration, level = 0.006) {
    if (!audioCtx || muted)
        return;
    const voice = audioCtx.createOscillator();
    const overtone = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    voice.type = 'triangle';
    overtone.type = 'sine';
    voice.frequency.setValueAtTime(midiToHz(note), when);
    overtone.frequency.setValueAtTime(midiToHz(note + 12) * 1.002, when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1050, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.25);
    gain.gain.setValueAtTime(level * 0.75, when + duration * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    voice.connect(filter);
    overtone.connect(filter);
    filter.connect(gain).connect(musicGain);
    voice.start(when);
    overtone.start(when);
    voice.stop(when + duration + 0.03);
    overtone.stop(when + duration + 0.03);
}
function schedulePixelPluck(note, when, duration = 0.20, level = 0.006) {
    if (!audioCtx || muted)
        return;
    const voice = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    voice.type = 'square';
    voice.frequency.setValueAtTime(midiToHz(note), when);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    voice.connect(filter).connect(gain).connect(musicGain);
    voice.start(when);
    voice.stop(when + duration + 0.03);
}
function scheduleBrush(when, level = 0.0025) {
    if (!audioCtx || !brushBuffer || muted)
        return;
    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = brushBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.11);
    source.connect(filter).connect(gain).connect(musicGain);
    source.start(when);
    source.stop(when + 0.12);
}
function scheduleMallet(note, when, duration = 0.50, level = 0.010) {
    if (!audioCtx || muted)
        return;
    const fundamental = audioCtx.createOscillator();
    const overtone = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    fundamental.type = 'triangle';
    overtone.type = 'sine';
    fundamental.frequency.setValueAtTime(midiToHz(note), when);
    overtone.frequency.setValueAtTime(midiToHz(note) * 3.01, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(level * 0.30, when + duration * 0.32);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    fundamental.connect(gain);
    overtone.connect(gain);
    gain.connect(musicGain);
    fundamental.start(when);
    overtone.start(when);
    fundamental.stop(when + duration + 0.03);
    overtone.stop(when + duration + 0.03);
}
function scheduleChapterOrnaments(bar, when, length, chapter) {
    const phrase = Math.floor(bar / 8);
    const base = selectedTheme === 'winter' ? 62 : selectedTheme === 'spring' ? 67 : selectedTheme === 'summer' ? 69 : 64;
    const chapterNote = [0, 2, 5][chapter];
    const pulse = !musicDescending && phrase >= 1 && phrase < 3;
    if (pulse && bar % 2 === 0)
        scheduleBrush(when + length * 0.52, 0.0018 + musicLift * 0.0010);
    if (pulse && phrase === 2 && bar % 4 === 1)
        scheduleBrush(when + length * 0.76, 0.0015);
    if (!musicDescending && phrase === 1 && bar % 4 === 1)
        schedulePixelPluck(base + chapterNote + 12, when + length * 0.72, 0.16, 0.0036);
    if (phrase === 2 && bar % 4 === 2)
        scheduleMallet(base + chapterNote + 12, when + length * 0.62, 0.42, 0.007);
    if (phrase === 3 && bar % 4 === 0) {
        scheduleMallet(base + chapterNote + 12, when + length * 0.25, 0.48, 0.006);
        if (!musicDescending)
            schedulePixelPluck(base + chapterNote + 19, when + length * 0.80, 0.16, 0.0032);
    }
}
function scheduleWinterBar(bar, when) {
    const eighth = 0.34;
    const barLen = eighth * 6;
    const progression = [
        { root: 50, chord: [50, 53, 57, 62], melody: [69, 67] },
        { root: 46, chord: [46, 50, 53, 58], melody: [65, 62] },
        { root: 41, chord: [41, 45, 48, 53], melody: [64, 65] },
        { root: 48, chord: [48, 52, 55, 60], melody: [67, 64] },
        { root: 43, chord: [43, 46, 50, 55], melody: [62, 65] },
        { root: 50, chord: [50, 53, 57, 62], melody: [69, 72] },
        { root: 45, chord: [45, 49, 52, 57], melody: [73, 69] },
        { root: 50, chord: [50, 53, 57, 62], melody: [69, 65] },
    ];
    const p = progression[(bar + Math.floor(bar / 8) * 2) % progression.length];
    const arp = [0, 1, 2, 3, 2, 1];
    const phrase = Math.floor(bar / 8);
    for (let i = 0; i < 6; i++)
        if ((phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0))
            schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.6, i === 0 ? 0.025 : 0.017);
    if (bar % 4 !== 3)
        scheduleMallet(p.melody[0] + 12, when + eighth * 1.5, 0.65, 0.010);
    if (bar % 4 === 1 || bar % 4 === 2)
        scheduleMallet(p.melody[1] + 12, when + eighth * 4.1, 0.55, 0.008);
    scheduleCello(p.root, when, barLen * 0.96, phrase === 3 || musicDescending ? 0.010 : 0.014);
    if (phrase === 1 && bar % 2 === 0)
        scheduleCello(p.root + 7, when + eighth * 3, eighth * 2.8, 0.006);
    scheduleWarmPad(p.chord[2], when, barLen * 0.96, 0.006 + musicLift * 0.002);
    if (phrase === 2 && bar % 2 === 1)
        schedulePixelPluck(p.chord[3] + 12, when + eighth * 5, 0.18, 0.004);
    return barLen;
}
function scheduleSpringBar(bar, when) {
    const eighth = 0.32;
    const barLen = eighth * 6;
    const progression = [
        { root: 48, chord: [48, 52, 55, 60], melody: [72, 76, 74] },
        { root: 55, chord: [55, 59, 62, 67], melody: [74, 79, 76] },
        { root: 57, chord: [57, 60, 64, 69], melody: [76, 81, 79] },
        { root: 53, chord: [53, 57, 60, 65], melody: [74, 76, 72] },
    ];
    const p = progression[(bar + Math.floor(bar / 8)) % progression.length];
    const arp = [0, 1, 2, 3, 2, 1];
    const phrase = Math.floor(bar / 8);
    for (let i = 0; i < 6; i++)
        if (phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0)
            schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.25, 0.016);
    if (bar % 4 !== 3)
        scheduleChime(p.melody[0], when + 0.16, 0.42, 0.012);
    if (bar % 4 === 1 || bar % 4 === 2)
        scheduleMallet(p.melody[1], when + eighth * 2.2, 0.48, 0.009);
    if (bar % 4 === 2)
        scheduleChime(p.melody[2], when + eighth * 4.1, 0.40, 0.009);
    scheduleCello(p.root, when, barLen * 0.95, 0.009);
    scheduleWarmPad(p.chord[2], when, barLen * 0.94, 0.005 + musicLift * 0.002);
    if (phrase === 1 && bar % 2 === 1)
        schedulePixelPluck(p.chord[3] + 12, when + eighth * 4.5, 0.16, 0.004);
    return barLen;
}
function scheduleSummerBar(bar, when) {
    const eighth = 0.31;
    const barLen = eighth * 6;
    const progression = [
        { root: 53, chord: [53, 57, 60, 65], melody: [72, 76] },
        { root: 48, chord: [48, 52, 55, 60], melody: [71, 74] },
        { root: 55, chord: [55, 59, 62, 67], melody: [74, 79] },
        { root: 57, chord: [57, 60, 64, 69], melody: [76, 81] },
    ];
    const p = progression[(bar + Math.floor(bar / 8) * 2) % progression.length];
    const arp = [0, 2, 1, 3, 2, 1];
    const phrase = Math.floor(bar / 8);
    for (let i = 0; i < 6; i++)
        if (phrase === 1 || phrase === 2 ? i !== 1 && i !== 4 : i % 2 === 0)
            schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.2, i === 0 ? 0.023 : 0.016);
    if (bar % 4 !== 3)
        scheduleMallet(p.melody[0], when + eighth * 1.5, 0.50, 0.010);
    if (bar % 4 === 1 || bar % 4 === 2)
        scheduleChime(p.melody[1], when + eighth * 4.2, 0.52, 0.010);
    scheduleCello(p.root, when, barLen * 0.92, 0.010);
    if (phrase === 1 && bar % 2 === 0)
        scheduleCello(p.root + 7, when + eighth * 3, barLen * 0.42, 0.005);
    scheduleWarmPad(p.chord[2], when, barLen * 0.90, 0.005 + musicLift * 0.002);
    if (phrase === 2 && bar % 2 === 0)
        schedulePixelPluck(p.chord[3] + 12, when + eighth * 5, 0.18, 0.005);
    return barLen;
}
function scheduleAutumnBar(bar, when) {
    const eighth = 0.35;
    const barLen = eighth * 6;
    const progression = [
        { root: 50, chord: [50, 53, 57, 62], melody: [69, 65] },
        { root: 46, chord: [46, 50, 53, 58], melody: [65, 62] },
        { root: 41, chord: [41, 45, 48, 53], melody: [60, 64] },
        { root: 48, chord: [48, 52, 55, 60], melody: [67, 64] },
    ];
    const p = progression[(bar + Math.floor(bar / 8)) % progression.length];
    const arp = [0, 1, 2, 1, 3, 2];
    const phrase = Math.floor(bar / 8);
    for (let i = 0; i < 6; i++)
        if (phrase === 1 || phrase === 2 ? i !== 2 && i !== 5 : i % 2 === 0)
            schedulePiano(p.chord[arp[i]] + 12, when + i * eighth, eighth * 1.55, i === 0 ? 0.020 : 0.015);
    if (bar % 4 !== 3)
        scheduleMallet(p.melody[0] + 12, when + eighth * 2.2, 0.62, 0.009);
    if (bar % 4 === 1 || bar % 4 === 2)
        schedulePiano(p.melody[1] + 12, when + eighth * 4.6, 0.54, 0.009);
    scheduleCello(p.root, when, barLen * 0.98, phrase === 3 || musicDescending ? 0.009 : 0.013);
    scheduleWarmPad(p.chord[2], when, barLen * 0.96, 0.006 + musicLift * 0.001);
    if (phrase === 1 && bar % 2 === 1)
        schedulePixelPluck(p.chord[1] + 12, when + eighth * 2.5, 0.19, 0.004);
    return barLen;
}
function updateMusic() {
    if (!audioCtx || audioCtx.state !== 'running' || muted)
        return;
    const now = audioCtx.currentTime;
    if (musicNext < now - 0.5)
        musicNext = now + 0.08;
    while (musicNext < now + 0.65) {
        musicLift += (Math.max(0, Math.min(1, cameraY / 8200)) - musicLift) * 0.16;
        musicDescending = cat.vy < -220 && (state === 'falling'
            || (state === 'playing' && descentPeakY - cat.y > height * 0.7));
        let len = 2.0;
        if (selectedTheme === 'winter')
            len = scheduleWinterBar(musicBar, musicNext);
        else if (selectedTheme === 'spring')
            len = scheduleSpringBar(musicBar, musicNext);
        else if (selectedTheme === 'summer')
            len = scheduleSummerBar(musicBar, musicNext);
        else
            len = scheduleAutumnBar(musicBar, musicNext);
        const chapter = chapterBandAt(cameraY);
        scheduleChapterOrnaments(musicBar, musicNext, len, chapter);
        if (chapter !== musicChapterBand) {
            scheduleChime((selectedTheme === 'winter' ? 74 : selectedTheme === 'spring' ? 79 : selectedTheme === 'summer' ? 81 : 76) + chapter * 2, musicNext + len * 0.15, 0.34, 0.006);
            musicChapterBand = chapter;
        }
        musicNext += len;
        musicBar = (musicBar + 1) % 32;
    }
}
function queueLaunch() {
    if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') {
        launchBuffer = 0.12;
    }
}
function activate() {
    if (state === 'title' || state === 'gameover' || state === 'expeditionComplete') {
        if (selectedArtLoading())
            return;
        resetGame();
        return;
    }
    if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint') {
        queueLaunch();
        return;
    }
    ensureAudio();
    if (audioCtx?.state === 'suspended')
        void audioCtx.resume();
}
window.addEventListener('resize', resize);
canvas.addEventListener('pointermove', e => { mouseX = e.clientX; pointerActive = true; inputMode = 'mouse'; });
canvas.addEventListener('pointerleave', () => { pointerActive = false; if (inputMode === 'mouse')
    inputMode = 'none'; });
canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (scoreboardOpen) {
        const tab = scoreboardModeRects.find(item => pointInRect(e.clientX, e.clientY, item.rect));
        if (tab) {
            scoreboardMode = tab.mode;
            scoreboardPage = 0;
            return;
        }
        if (pointInRect(e.clientX, e.clientY, scoreboardPrevRect)) {
            scoreboardPage = Math.max(0, scoreboardPage - 1);
            return;
        }
        if (pointInRect(e.clientX, e.clientY, scoreboardNextRect)) {
            scoreboardPage = Math.min(scoreboardPageCount - 1, scoreboardPage + 1);
            return;
        }
        scoreboardOpen = false;
        return;
    }
    mouseX = e.clientX;
    if (state !== 'title' && pointInRect(e.clientX, e.clientY, menuRect)) {
        returnToTitle();
        return;
    }
    if (state === 'title') {
        const x = e.clientX;
        const y = e.clientY;
        for (const card of themeCardRects) {
            if (pointInRect(x, y, card.rect)) {
                setTheme(card.theme);
                return;
            }
        }
        for (const card of modeCardRects) {
            if (pointInRect(x, y, card.rect)) {
                setGameMode(card.mode);
                return;
            }
        }
        if (pointInRect(x, y, titleStartRect)) {
            activate();
            return;
        }
    }
    if (state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint')
        queueLaunch();
    else
        activate();
});
window.addEventListener('keydown', e => {
    const inUi = e.target?.closest?.('.ui-overlay');
    if (e.code === 'Escape') {
        e.preventDefault();
        if (scoreboardOpen)
            closeScoreboard();
        else
            returnToTitle();
        return;
    }
    if (scoreboardOpen && e.code === 'Tab' && boardOverlay) {
        const controls = Array.from(boardOverlay.querySelectorAll('button:not(:disabled), [tabindex="0"]'));
        if (controls.length) {
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
                return;
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
                return;
            }
        }
    }
    if (inUi && e.code !== 'KeyL')
        return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space'].includes(e.code))
        e.preventDefault();
    if (e.code === 'KeyL') {
        if (scoreboardOpen)
            closeScoreboard();
        else
            openScoreboard();
        return;
    }
    if (scoreboardOpen) {
        if (e.code === 'ArrowDown' || e.code === 'PageDown')
            scoreboardPage = Math.min(scoreboardPageCount - 1, scoreboardPage + 1);
        if (e.code === 'ArrowUp' || e.code === 'PageUp')
            scoreboardPage = Math.max(0, scoreboardPage - 1);
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            const index = GAME_MODES.indexOf(scoreboardMode);
            scoreboardMode = GAME_MODES[(index + (e.code === 'ArrowRight' ? 1 : GAME_MODES.length - 1)) % GAME_MODES.length];
            scoreboardPage = 0;
        }
        return;
    }
    keys.add(e.code);
    if (e.code === 'KeyP') {
        togglePause();
        return;
    }
    if (e.code === 'KeyM') {
        toggleMute();
        return;
    }
    if (e.code === 'KeyR') {
        if (state === 'playing' || state === 'falling' || state === 'zenGrounded')
            recordScore();
        resetGame();
        return;
    }
    if (state === 'title') {
        let idx = THEME_ORDER.indexOf(selectedTheme);
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            idx = (idx + THEME_ORDER.length - 1) % THEME_ORDER.length;
            setTheme(THEME_ORDER[idx]);
            return;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            idx = (idx + 1) % THEME_ORDER.length;
            setTheme(THEME_ORDER[idx]);
            return;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
            const index = GAME_MODES.indexOf(selectedMode);
            const delta = e.code === 'ArrowUp' || e.code === 'KeyW' ? GAME_MODES.length - 1 : 1;
            setGameMode(GAME_MODES[(index + delta) % GAME_MODES.length]);
            return;
        }
        if (['Space', 'Enter'].includes(e.code)) {
            activate();
            return;
        }
    }
    if (paused)
        return;
    if (['Space', 'Enter'].includes(e.code)) {
        activate();
    }
});
window.addEventListener('keyup', e => {
    keys.delete(e.code);
    if (!keys.has('ArrowLeft') && !keys.has('ArrowRight') && !keys.has('KeyA') && !keys.has('KeyD')) {
        if (inputMode === 'keyboard')
            inputMode = 'none';
    }
});
function frame(now) {
    const dt = Math.min(1 / 45, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    draw();
    syncDomUi();
    requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
