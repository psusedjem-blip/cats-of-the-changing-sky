// Part of the single main.js extension bundle.

function drawCoverImage(img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, w: number, h: number, alpha = 1, focusY = 0.5, target: CanvasRenderingContext2D = ctx): void {
  if (img instanceof HTMLImageElement && !img.complete) return;
  const sourceWidth = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const sourceHeight = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  if (sourceWidth <= 0 || sourceHeight <= 0) return;
  const srcAspect = sourceWidth / sourceHeight;
  const dstAspect = w / h;
  let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  if (srcAspect > dstAspect) {
    sw = sourceHeight * dstAspect;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / dstAspect;
    sy = Math.max(0, Math.min(sourceHeight - sh, sourceHeight * focusY - sh * focusY));
  }
  target.save();
  target.globalAlpha = alpha;
  target.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  target.restore();
}

function drawPaintedBackdrop(): void {
  const art = THEME_ART[selectedTheme]?.bg;
  const top = height * 0.06;
  const h = Math.max(340, height * 0.64);
  if (art) drawCoverImage(art, 0, top, width, h, baseSeason(selectedTheme) === 'winter' ? 0.72 : 0.78);
  const wash = ctx.createLinearGradient(0, top, 0, top + h);
  wash.addColorStop(0, baseSeason(selectedTheme) === 'winter' ? 'rgba(4,15,29,.22)' : 'rgba(255,255,255,.04)');
  wash.addColorStop(0.72, 'rgba(255,255,255,0)');
  wash.addColorStop(1, baseSeason(selectedTheme) === 'winter' ? 'rgba(9,29,43,.28)' : baseSeason(selectedTheme) === 'spring' ? 'rgba(82,136,123,.14)' : baseSeason(selectedTheme) === 'summer' ? 'rgba(102,128,57,.12)' : 'rgba(116,65,30,.16)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, top, width, h);
}

function drawPaintedGround(baseY: number): void {
  if (cameraY > height * 0.95) return;
  const art = THEME_ART[selectedTheme]?.ground;
  const h = Math.min(285, Math.max(210, height * 0.31));
  const y = baseY - h + 34;
  if (art) drawCoverImage(art, 0, y, width, h, 0.92);
  const fade = ctx.createLinearGradient(0, y, 0, y + h);
  fade.addColorStop(0, 'rgba(255,255,255,0)');
  fade.addColorStop(0.82, 'rgba(255,255,255,0)');
  fade.addColorStop(1, baseSeason(selectedTheme) === 'winter' ? 'rgba(177,207,221,.30)' : baseSeason(selectedTheme) === 'spring' ? 'rgba(84,146,86,.22)' : baseSeason(selectedTheme) === 'summer' ? 'rgba(85,139,59,.20)' : 'rgba(129,78,34,.24)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, y, width, h);
}

function drawSceneLayer(layer: SceneLayer, opacity = 1): void {
  // Each band moves independently. The ground itself stays tied to world Y = 0.
  if (opacity <= 0) return;
  const y = height * layer.top + backdropCameraY * layer.depth;
  drawCoverImage(layer.image, 0, y, width, height * layer.height, opacity);
}

function drawNearSceneLayer(layer: SceneLayer): void {
  // Transparent edge art needs its complete silhouettes. Fit it without
  // cropping, then anchor the two sides to the viewport when space opens up.
  const sourceWidth = layer.image instanceof HTMLImageElement ? layer.image.naturalWidth : layer.image.width;
  const sourceHeight = layer.image instanceof HTMLImageElement ? layer.image.naturalHeight : layer.image.height;
  if (!sourceWidth || !sourceHeight) return;
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

function drawSceneBackdrop(art: SceneAssets): void {
  ctx.fillStyle = baseSeason(selectedTheme) === 'winter' ? '#081e40' : baseSeason(selectedTheme) === 'spring' ? '#849be0' : baseSeason(selectedTheme) === 'summer' ? '#3a94e9' : '#4a2c50';
  ctx.fillRect(0, 0, width, height);
  // The one painted sky travels below the camera as altitude increases.
  // A softened top edge leaves the atmosphere open without repeating clouds
  // or celestial objects at every height.
  // Stretch the single sky downward as the camera rises while keeping its top
  // in frame. Translating the whole image exposed a flat-colored top strip.
  const skyTravel = Math.max(0, backdropCameraY - 3000) * 0.025;
  const skyOpacity = 1 - chapterEase((backdropCameraY - 9000) / 11000);
  if (skyOpacity > 0) drawCoverImage(art.sky, 0, 0, width, height + skyTravel, skyOpacity);
}

function drawSceneGround(art: SceneAssets): void {
  const groundY = worldToScreenY(GROUND_Y);
  const layerHeight = Math.max(270, height * art.groundHeight);
  // Align the painted center walking surface with Zima's world-space feet.
  drawCoverImage(art.ground, 0, groundY - layerHeight * art.groundSurface, width, layerHeight, 1, art.groundSurface);
  if (!isNewWorld(selectedTheme) && (baseSeason(selectedTheme) === 'winter' || baseSeason(selectedTheme) === 'spring')) drawGroundCutouts(groundY, false);
}

function drawGroundCutouts(groundY: number, inFront: boolean): void {
  const detail = baseSeason(selectedTheme) === 'winter' ? winterReeds : springFlowerBank;
  if (!detail.complete || !detail.naturalWidth || groundY < -120 || groundY > height + 130) return;
  const spots = inFront ? [0.07, 0.93] : [0.25, 0.75];
  const w = Math.min(132, Math.max(72, width * (inFront ? 0.105 : 0.075)));
  const h = w * detail.naturalHeight / detail.naturalWidth;
  for (let i = 0; i < spots.length; i++) {
    const x = width * spots[i];
    const sway = Math.sin(elapsed * 1.25 + i * 2.1) * 0.012;
    ctx.save();
    ctx.translate(x, groundY + (inFront ? 17 : 13));
    ctx.rotate(sway);
    if (i === 1) ctx.scale(-1, 1);
    ctx.globalAlpha = inFront ? 0.95 : 0.76;
    ctx.drawImage(detail, -w / 2, -h, w, h);
    ctx.restore();
  }
}

function groundFrontImage(art: SceneAssets): HTMLCanvasElement {
  const layerHeight = Math.max(270, height * art.groundHeight);
  const key = `${selectedTheme}:${width}:${layerHeight}`;
  if (groundFrontCache?.key === key) return groundFrontCache.image;
  const image = document.createElement('canvas');
  image.width = width;
  image.height = Math.ceil(layerHeight);
  const paint = image.getContext('2d')!;
  drawCoverImage(art.ground, 0, 0, width, layerHeight, 1, art.groundSurface, paint);

  // Use registered pixels from the existing painting for a few nearby props.
  // Replaying the entire edge image would hide Zima, so each front shape has
  // a soft, bounded mask and the central play lane stays unobstructed.
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = Math.ceil(layerHeight);
  const m = mask.getContext('2d')!;
  const surface = layerHeight * art.groundSurface;
  const props: Record<SeasonName, [number, number, number, number][]> = {
    winter: [[0.12, -4, 0.05, 25], [0.88, -4, 0.05, 25]],
    spring: [[0.11, -6, 0.05, 30], [0.89, -6, 0.05, 30]],
    summer: [[0.13, -5, 0.085, 40], [0.87, -5, 0.085, 40]],
    autumn: [[0.09, -2, 0.075, 32], [0.91, -2, 0.075, 32]],
  };
  for (const [cx, cy, rx, ry] of props[baseSeason(selectedTheme)]) {
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
  const winter = baseSeason(selectedTheme) === 'winter';
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

function drawSceneFront(art: SceneAssets): void {
  const groundY = worldToScreenY(GROUND_Y);
  const layerHeight = Math.max(270, height * art.groundHeight);
  const top = groundY - layerHeight * art.groundSurface;
  if (top > height || top + layerHeight < 0) return;
  ctx.drawImage(groundFrontImage(art), 0, top);
  if (!isNewWorld(selectedTheme) && (baseSeason(selectedTheme) === 'winter' || baseSeason(selectedTheme) === 'spring')) drawGroundCutouts(groundY, true);
}

function drawSceneProp(art: SceneAssets): void {
  if (!art.prop) return;
  const isSummer = baseSeason(selectedTheme) === 'summer';
  const propHeight = height * (isSummer ? 0.25 : 0.20);
  const propWidth = propHeight * art.prop.naturalWidth / art.prop.naturalHeight;
  const x = width * (isSummer ? 0.33 : 0.73);
  const baseY = worldToScreenY(GROUND_Y);
  // Landmarks share the ground's world anchor and fade as their bases leave view.
  const visibleBase = Math.max(0, Math.min(1, (height + 40 - baseY) / (propHeight * 0.45)));
  if (visibleBase <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.94 * visibleBase;
  ctx.drawImage(art.prop, x - propWidth / 2, baseY - propHeight, propWidth, propHeight);
  ctx.restore();
}
