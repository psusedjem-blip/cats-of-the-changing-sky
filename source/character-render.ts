// Part of the single main.js extension bundle.

function currentAnimFrame(): SpriteFrame {
  const spec = animRanges[animState];
  if (animState === 'walk') return atlasFrame(spec.frames[Math.floor(groundTravel / 19) % spec.frames.length]);
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

function drawOneAtlasFrame(frame: SpriteFrame): void {
  const art = seasonalScarfArt(spriteImage, `atlas:${frame.sx}:${frame.sy}`, frame);
  const sourceX = art === spriteImage ? frame.sx : 0;
  const sourceY = art === spriteImage ? frame.sy : 0;
  const sourceWidth = art === spriteImage ? frame.sw : (art as HTMLCanvasElement).width;
  const sourceHeight = art === spriteImage ? frame.sh : (art as HTMLCanvasElement).height;
  ctx.drawImage(
    art,
    sourceX, sourceY, sourceWidth, sourceHeight,
    -frame.sw * SPRITE_SCALE * frame.ax,
    -frame.sh * SPRITE_SCALE * frame.ay,
    frame.sw * SPRITE_SCALE,
    frame.sh * SPRITE_SCALE,
  );
}

function drawZimaCutCell(image: HTMLImageElement, index: number, cacheKey: string, facing: number,
  anchor = 340 / 356, paintedHeight = 89): void {
  const frame = { sx: index * 500, sy: 0, sw: 500, sh: 356, ax: 0.5, ay: anchor };
  const art = seasonalScarfArt(image, cacheKey, frame);
  const sourceX = art === image ? frame.sx : 0;
  const sourceWidth = art === image ? frame.sw : (art as HTMLCanvasElement).width;
  const sourceHeight = art === image ? frame.sh : (art as HTMLCanvasElement).height;
  const paintedWidth = paintedHeight * frame.sw / frame.sh;
  ctx.scale(facing, 1);
  ctx.drawImage(art, sourceX, 0, sourceWidth, sourceHeight,
    -paintedWidth / 2, -paintedHeight * frame.ay, paintedWidth, paintedHeight);
}

const COMPANION_HEIGHT: Record<CompanionId, number> = {
  'earl-grey': 89,
  'betty-davis': 76,
  'gracie-bell': 84,
};
const COMPANION_GROUND_ANCHOR: Record<CompanionId, Record<'idle' | 'walk' | 'land' | 'contact', number>> = {
  'earl-grey': { idle: 1019 / 1079, walk: 1007 / 1080, land: 949 / 1080, contact: 964 / 1079 },
  'betty-davis': { idle: 1031 / 1079, walk: 1007 / 1080, land: 965 / 1079, contact: 1021 / 1079 },
  'gracie-bell': { idle: 1021 / 1079, walk: 1009 / 1079, land: 946 / 1079, contact: 920 / 1079 },
};
const COMPANION_EVENT_ANCHOR: Record<CompanionId, { launch: number; recover: number; topContact: number; turn: number }> = {
  'earl-grey': { launch: 0.95158, recover: 0.90316, topContact: 0.93053, turn: 0.94316 },
  'betty-davis': { launch: 0.91561, recover: 0.89873, topContact: 0.96211, turn: 0.95148 },
  'gracie-bell': { launch: 0.92, recover: 0.91543, topContact: 0.96842, turn: 0.95359 },
};

function drawCompanionSprite(character: CompanionId, x: number, y: number, facing: number, vx: number, vy: number): void {
  const grounded = state === 'title' || state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint'
    || animState === 'groundLand' || animState === 'land';
  let pose: CompanionPose;
  if (state === 'title' || (state === 'ready' && animState !== 'walk' && animState !== 'crouch')) pose = 'idle';
  else if (animState === 'groundLand' || animState === 'crouch') pose = 'land';
  else if (animState === 'boostContact' || animState === 'undersideContact' || animState === 'land') pose = 'contact';
  else if (animState === 'fall') pose = 'fall';
  else if (animState === 'rise' || animState === 'launch' || animState === 'apex') pose = 'rise';
  else pose = animState === 'walk' ? 'walk' : 'idle';
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
  let companionEvent: { image: HTMLImageElement; tintPose: CompanionPose; anchor: number } | null = null;
  {
    if (grounded && turnProgress >= 0.28 && turnProgress <= 0.72) {
      companionEvent = { image: eventImages.turn, tintPose: 'walk', anchor: eventAnchors.turn };
    } else if (animState === 'land') {
      companionEvent = { image: eventImages.topContact, tintPose: 'contact', anchor: eventAnchors.topContact };
    } else if (animState === 'undersideContact' && animStateTime < 0.085) {
      companionEvent = { image: lastBellContactDirection === 'side' ? eventImages.sideContact : eventImages.undersideContact,
        tintPose: 'contact', anchor: 0.72 };
    } else if (animState === 'boostContact' && animStateTime < 0.085) {
      companionEvent = { image: eventImages.boostContact, tintPose: 'contact', anchor: 0.72 };
    } else if (animState === 'launch' && animStateTime < 0.12) {
      companionEvent = { image: eventImages.launch, tintPose: 'rise',
        anchor: eventAnchors.launch + (0.72 - eventAnchors.launch) * Math.min(1, animStateTime / 0.12) };
    } else if (animState === 'apex' && animStateTime < 0.07) {
      companionEvent = { image: eventImages.apex, tintPose: 'rise', anchor: 0.72 };
    } else if (animState === 'fall' && character !== 'earl-grey' && Math.floor(animStateTime * 6) % 2 === 1) {
      companionEvent = { image: eventImages.fallTuck, tintPose: 'fall', anchor: 0.72 };
    } else if (animState === 'groundLand' && animStateTime >= 0.11) {
      companionEvent = { image: eventImages.recover, tintPose: 'land', anchor: eventAnchors.recover };
    }
    if (companionEvent && !companionEvent.image.naturalWidth) companionEvent = null;
  }
  const image = companionArt[character][displayedPose];
  if (!image?.naturalWidth) return;
  const height = COMPANION_HEIGHT[character];
  const width = height * image.naturalWidth / image.naturalHeight;
  const anchor = grounded && (displayedPose === 'idle' || displayedPose === 'walk' || displayedPose === 'land' || displayedPose === 'contact')
    ? COMPANION_GROUND_ANCHOR[character][displayedPose] : 0.72;
  const tilt = grounded ? 0 : Math.max(-0.13, Math.min(0.13, vx / 2500)) + Math.max(-0.08, Math.min(0.08, -vy / 6500));
  const gait = grounded && pose === 'walk' && !useWalkKeys ? Math.sin(groundTravel / 38 * TAU) * 0.018 : 0;
  const motionFamily: CompanionMotionFamily | null =
    (animState === 'crouch' || animState === 'launch' || animState === 'rise'
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
    ctx.drawImage(seasonalCompanionArt(character, companionEvent.tintPose, companionEvent.image),
      -paintedWidth / 2, -height * companionEvent.anchor, paintedWidth, height);
  } else if (useMotionKeys && motionImage && motionFamily) {
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
    ctx.drawImage(seasonalCompanionArt(character, displayedPose, motionImage),
      frame * 500, 0, 500, 356, -paintedWidth / 2, -paintedHeight * anchor, paintedWidth, paintedHeight);
  } else if (useWalkKeys || useSixteenIdle) {
    const cellWidth = 500, cellHeight = 356;
    const idleStep = Math.floor(elapsed * 4) % 30;
    const frame = useSixteenIdle ? (idleStep <= 15 ? idleStep : 30 - idleStep)
      : useSixteenWalk ? Math.floor(groundTravel / 4.5) % 16 : Math.floor(groundTravel / 18) % 4;
    const paintedWidth = height * cellWidth / cellHeight;
    ctx.drawImage(seasonalCompanionArt(character, useSixteenIdle ? 'idle' : 'walk', useSixteenIdle ? idleKeysImage : walkKeysImage),
      frame * cellWidth, 0, cellWidth, cellHeight,
      -paintedWidth / 2, -height * (340 / cellHeight), paintedWidth, height);
  } else {
    ctx.drawImage(seasonalCompanionArt(character, displayedPose), -width / 2, -height * anchor, width, height);
  }
  ctx.restore();
}

function drawSpriteFrame(x: number, y: number, facing: number, vx: number, vy: number): void {
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
  } else if (showUndersideContact) {
    const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
    const poseWidth = poseHeight * undersideContactImage.naturalWidth / undersideContactImage.naturalHeight;
    ctx.scale(facing, 1);
    ctx.drawImage(seasonalScarfArt(undersideContactImage, 'underside'), -poseWidth / 2, -poseHeight, poseWidth, poseHeight);
  } else if (showAirborneBoost) {
    const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
    const poseWidth = poseHeight * airborneBoostImage.naturalWidth / airborneBoostImage.naturalHeight;
    ctx.scale(facing, 1);
    ctx.drawImage(seasonalScarfArt(airborneBoostImage, 'boost'), -poseWidth / 2, -poseHeight, poseWidth, poseHeight);
  } else if (showFallPose) {
    const fallFrame = fallTuckImage.naturalWidth && Math.floor(animStateTime * 6) % 2 === 1 ? fallTuckImage : fallPoseImage;
    const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.96;
    const poseWidth = poseHeight * fallFrame.naturalWidth / fallFrame.naturalHeight;
    ctx.scale(drawFacing, 1);
    ctx.rotate(Math.sin(animStateTime * 6) * 0.025);
    ctx.drawImage(seasonalScarfArt(fallFrame, fallFrame === fallPoseImage ? 'fall' : 'fallTuck'),
      -poseWidth / 2, -poseHeight * 0.72, poseWidth, poseHeight);
  } else if (showTurnPose) {
    if (hasTurnMiddle && (turnProgress < 0.42 || turnProgress > 0.58)) {
      drawZimaCutCell(zimaTurnMiddleImage, 0, 'zima-turn-middle', drawFacing, 340 / 356, 95);
    } else if (hasTurnFront) {
      drawZimaCutCell(zimaTurnFrontImage, 0, 'zima-turn-front', drawFacing, 340 / 356, 95);
    } else {
      const poseHeight = ATLAS_CELL_H * SPRITE_SCALE * 0.70;
      const poseWidth = poseHeight * turnPoseImage.naturalWidth / turnPoseImage.naturalHeight;
      const midPhase = (turnProgress - 0.28) / 0.44;
      const poseScale = 0.80 + 0.15 * Math.sin(Math.PI * midPhase);
      ctx.scale(drawFacing * poseScale, 1);
      ctx.drawImage(seasonalScarfArt(turnPoseImage, 'turn'), -poseWidth / 2, -poseHeight * (991 / 1079), poseWidth, poseHeight);
    }
  } else if (useMotion && motionImage && motionFamily) {
    let index: number;
    if (motionFamily === 'crouch') index = Math.min(15, Math.floor(animStateTime / 0.12 * 16));
    else if (motionFamily === 'launch') index = Math.min(15, Math.floor(animStateTime * 50));
    else if (motionFamily === 'rise') index = Math.max(1, Math.min(15, 1 + Math.floor((620 - vy) / 450 * 15)));
    else if (motionFamily === 'apex') index = Math.max(0, Math.min(15, Math.floor((170 - vy) / 290 * 16)));
    else if (motionFamily === 'fall') index = Math.floor(animStateTime * 10) % 16;
    else if (motionFamily === 'land') {
      const settle = [6, 7, 9, 11, 13, 15, 8, 10, 12, 14];
      index = settle[Math.min(settle.length - 1, Math.floor(animStateTime / 0.25 * settle.length))];
    }
    else index = Math.min(15, Math.floor(animStateTime / 0.16 * 16));
    const anchor = motionFamily === 'crouch' || motionFamily === 'land' && grounded
      ? 340 / 356 : motionFamily === 'launch'
        ? 340 / 356 + (0.72 - 340 / 356) * Math.min(1, animStateTime / 0.12)
        : 0.72;
    const paintedHeight = motionFamily === 'fall' ? 105 : motionFamily === 'land' ? 102 : 89;
    drawZimaCutCell(motionImage, index, `zima-${motionFamily}:16:${index}`, drawFacing, anchor, paintedHeight);
  } else if (grounded && animState === 'walk' && zimaWalkSixteenImage.naturalWidth === 8000
    && zimaWalkSixteenImage.naturalHeight === 356) {
    const index = Math.floor(groundTravel / 8) % 16;
    drawZimaCutCell(zimaWalkSixteenImage, index, `zima-walk:16:${index}`, drawFacing);
  } else if (grounded && animState === 'idle' && (
    (zimaIdleSixteenImage.naturalWidth === 8000 && zimaIdleSixteenImage.naturalHeight === 356)
    || (zimaIdleKeysImage.naturalWidth === 2000 && zimaIdleKeysImage.naturalHeight === 356))) {
    const useSixteen = zimaIdleSixteenImage.naturalWidth === 8000 && zimaIdleSixteenImage.naturalHeight === 356;
    const idleImage = useSixteen ? zimaIdleSixteenImage : zimaIdleKeysImage;
    const idleStep = Math.floor(elapsed * 4) % 30;
    const fourCycle = [0, 0, 1, 0, 2, 2, 3, 0];
    const index = useSixteen ? (idleStep <= 15 ? idleStep : 30 - idleStep)
      : fourCycle[Math.floor(elapsed * 2) % fourCycle.length];
    drawZimaCutCell(idleImage, index, `zima-idle:${useSixteen ? '16' : '4'}:${index}`, drawFacing);
  } else {
    const gaitWeight = grounded && animState === 'walk' ? Math.sin(groundTravel / 38 * TAU) * 0.012 : 0;
    ctx.scale(drawFacing * turnWidth * (1 + gaitWeight), (1 + 0.03 * Math.sin(Math.PI * turnProgress)) * (1 - gaitWeight * 0.5));
    drawOneAtlasFrame(current);
  }
  ctx.restore();
}


function drawShadow(radius: number, alpha: number, yOffset: number): void {
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

function drawGroundMarks(): void {
  const surfaceY = worldToScreenY(GROUND_Y) + 2;
  if (surfaceY < -20 || surfaceY > height + 20) return;
  ctx.save();
  for (const mark of groundMarks) {
    ctx.globalAlpha = Math.max(0, 1 - mark.age / mark.life) * 0.72;
    ctx.save(); ctx.translate(mark.x, surfaceY);
    if (mark.theme === 'winter') {
      ctx.fillStyle = '#b7d6e8'; ctx.beginPath(); ctx.ellipse(0, 1, 11, 3.7, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f3fbff'; ctx.lineWidth = 1.1; ctx.stroke();
    } else if (mark.theme === 'spring') {
      ctx.strokeStyle = '#6eb779'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (const offset of [-7, 0, 7]) { ctx.beginPath(); ctx.moveTo(offset, 2); ctx.quadraticCurveTo(offset + mark.side * 3, -7, offset + mark.side * 6, -9); ctx.stroke(); }
      ctx.strokeStyle = '#b5e4dc'; ctx.beginPath(); ctx.ellipse(0, 3, 12, 2.6, 0, 0, Math.PI); ctx.stroke();
    } else if (mark.theme === 'summer') {
      ctx.strokeStyle = '#d9ad69'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 2, 12, 3, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = '#f5d99f'; for (const offset of [-9, 0, 9]) { ctx.beginPath(); ctx.arc(offset, -2, 1.3, 0, TAU); ctx.fill(); }
    } else {
      ctx.fillStyle = '#bd6837'; ctx.beginPath(); ctx.ellipse(mark.side * 3, 0, 8, 3.8, mark.side * 0.25, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e5ae67'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-7, 3); ctx.lineTo(8, 3); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawFallbackCat(x: number, y: number, vx: number, vy: number): void {
  ctx.save();
  ctx.translate(x, y);
  const speedTilt = Math.max(-0.28, Math.min(0.28, vx / 950));
  ctx.rotate(speedTilt);
  ctx.scale(cat.facing, 1);
  const squash = cat.landedFlash > 0 ? 1.14 : 1;
  const stretch = vy > 300 ? 1.07 : vy < -300 ? 0.98 : 1;
  ctx.scale(1 / squash, squash * stretch);
  ctx.strokeStyle = '#f6fbff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, 13);
  ctx.bezierCurveTo(-39, 18, -37, -10, -24, -16 + Math.sin(elapsed * 8) * 3);
  ctx.stroke();
  ctx.strokeStyle = '#c9dbe6'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#f7fbff'; ctx.strokeStyle = '#bfd0dc'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 7, 20, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5bbbd5';
  ctx.beginPath(); ctx.roundRect(-17, -7, 33, 7, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -2); ctx.quadraticCurveTo(-22, 10, -14, 20); ctx.lineTo(-7, 16); ctx.quadraticCurveTo(-14, 8, -4, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f8fcff'; ctx.strokeStyle = '#bfd0dc';
  ctx.beginPath();
  ctx.moveTo(-17, -25); ctx.lineTo(-13, -43); ctx.lineTo(-3, -32);
  ctx.quadraticCurveTo(8, -34, 16, -26);
  ctx.lineTo(20, -43); ctx.lineTo(28, -24);
  ctx.quadraticCurveTo(31, -5, 9, 0);
  ctx.quadraticCurveTo(-12, 3, -24, -10);
  ctx.quadraticCurveTo(-29, -18, -17, -25);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

const kittenFrameCache = new Map<string, HTMLCanvasElement>();
const kittenFootBaseline = new WeakMap<HTMLCanvasElement, number>();
function cleanKittenFrame(image: HTMLImageElement, frame: number): HTMLCanvasElement {
  const key = `${image.src}:${frame}`;
  const cached = kittenFrameCache.get(key);
  if (cached) return cached;
  const cellWidth = image.naturalWidth / 4, cellHeight = image.naturalHeight / 4;
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(cellWidth + 52); canvas.height = Math.floor(cellHeight + 82);
  const paint = canvas.getContext('2d', { willReadFrequently: true })!;
  // Several kittens extend a muzzle or paw into the next atlas cell. Read a
  // small overlap, then keep only the connected silhouette of this pose.
  const left = frame % 4 * cellWidth + 4;
  const top = Math.max(0, Math.floor(frame / 4) * cellHeight - 60);
  const sourceWidth = Math.min(cellWidth + 52, image.naturalWidth - left);
  const sourceHeight = Math.min(cellHeight + 82, image.naturalHeight - top);
  paint.drawImage(image, left, top, sourceWidth, sourceHeight,
    0, 0, sourceWidth, sourceHeight);
  const pixels = paint.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] < 80) pixels.data[i] = 0;
  // Retain the connected kitten silhouette. A few source poses spill a paw
  // from the following atlas cell into this one; those islands are separate
  // from the actual cat and must not flash during animation.
  const count = canvas.width * canvas.height;
  const seen = new Uint8Array(count);
  const queue = new Int32Array(count);
  let largest: number[] = [];
  for (let start = 0; start < count; start++) {
    if (seen[start] || pixels.data[start * 4 + 3] === 0) continue;
    const component: number[] = [];
    let head = 0, tail = 1;
    queue[0] = start; seen[start] = 1;
    while (head < tail) {
      const point = queue[head++]; component.push(point);
      const px = point % canvas.width, py = Math.floor(point / canvas.width);
      const neighbors = [px > 0 ? point - 1 : -1, px + 1 < canvas.width ? point + 1 : -1,
        py > 0 ? point - canvas.width : -1, py + 1 < canvas.height ? point + canvas.width : -1];
      for (const next of neighbors) if (next >= 0 && !seen[next] && pixels.data[next * 4 + 3] > 0) {
        seen[next] = 1; queue[tail++] = next;
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(count);
  let lowestOpaqueRow = 0;
  for (const point of largest) {
    keep[point] = 1;
    lowestOpaqueRow = Math.max(lowestOpaqueRow, Math.floor(point / canvas.width));
  }
  for (let point = 0; point < count; point++) if (!keep[point]) pixels.data[point * 4 + 3] = 0;
  paint.putImageData(pixels, 0, 0);
  kittenFootBaseline.set(canvas, (lowestOpaqueRow + 1) / canvas.height);
  kittenFrameCache.set(key, canvas);
  return canvas;
}
function drawKittenFrame(x: number, y: number, vx: number, vy: number, grounded: boolean): void {
  const useAir = animState === 'launch' || animState === 'rise' || animState === 'apex'
    || animState === 'fall' || animState === 'undersideContact' || animState === 'boostContact'
    || animState === 'land';
  const image = useAir ? kittenAirArt[selectedCharacter] : kittenPoseArt[selectedCharacter];
  if (!image.complete || !image.naturalWidth) return;
  const idleFrame = Math.floor(elapsed * 5) % 4;
  const walkFrame = Math.floor(groundTravel / 9) % 4;
  let frame: number;
  if (state === 'title' || state === 'ready' && animState !== 'walk' && animState !== 'crouch') frame = idleFrame;
  else if (animState === 'walk') frame = 4 + walkFrame;
  else if (animState === 'crouch') frame = 8 + Math.floor(animStateTime * 9) % 2;
  else if (animState === 'launch') frame = Math.min(3, Math.floor(animStateTime * 22));
  else if (animState === 'rise') frame = 4 + Math.min(3, Math.max(0, Math.floor((620 - cat.vy) / 150)));
  else if (animState === 'apex') frame = 7;
  else if (animState === 'fall') frame = 8 + Math.floor(animStateTime * 11) % 4;
  else if (animState === 'land') frame = 12;
  else if (animState === 'groundLand') frame = 15;
  else if (animState === 'boostContact') frame = 14;
  else if (animState === 'undersideContact') frame = lastBellContactDirection === 'side' ? 12 : 13;
  else frame = grounded ? idleFrame : 11;
  const sprite = cleanKittenFrame(image, frame);
  const paintedSize = 96;
  // The generated atlas leaves different amounts of transparent space below
  // each pose. Anchor the visible paws to world ground, not the canvas edge.
  const top = grounded ? -paintedSize * (kittenFootBaseline.get(sprite) ?? 0.78) + 1 : -paintedSize * 0.72;
  const tilt = grounded ? 0 : Math.max(-0.13, Math.min(0.13, vx / 2500))
    + Math.max(-0.08, Math.min(0.08, -vy / 6500));
  const turnProgress = turnTime / TURN_DURATION;
  const facing = grounded && turnProgress < 0.5 ? turnFrom : cat.facing;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(facing, 1);
  ctx.drawImage(sprite, -paintedSize / 2, top, paintedSize, paintedSize);
  ctx.restore();
}

function drawCat(x: number, y: number, vx: number, vy: number): void {
  const grounded = state === 'title' || state === 'ready' || state === 'zenGrounded' || state === 'expeditionCheckpoint' || animState === 'groundLand' || (animState === 'land' && bounceHold > 0);
  if (grounded) {
    ctx.save();
    ctx.translate(x, y);
    const alpha = baseSeason(selectedTheme) === 'winter' ? 0.30 : baseSeason(selectedTheme) === 'spring' ? 0.25 : baseSeason(selectedTheme) === 'summer' ? 0.27 : 0.28;
    drawShadow(25 + Math.abs(vx) * 0.012, alpha, 4);
    ctx.restore();
  }
  if (selectedForm === 'kitten' && kittenPoseArt[selectedCharacter].naturalWidth) {
    drawKittenFrame(x, y, vx, vy, grounded);
    return;
  }
  if (spriteImage.complete && spriteImage.naturalWidth > 0) {
    drawSpriteFrame(x, y, cat.facing, vx, vy);
  } else {
    drawFallbackCat(x, y, vx, vy);
  }
}
