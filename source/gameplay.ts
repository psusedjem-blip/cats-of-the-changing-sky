// Part of the single main.js extension bundle.

function bellWorldY(bell: Bell): number {
  return bell.y - fieldDrop;
}

function firstBellAtOrAbove(worldY: number): number {
  const target = worldY + fieldDrop;
  let low = 0, high = bells.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (bells[middle].y < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function mothWorldY(moth: Moth): number {
  return moth.flightWorldY ?? moth.y - fieldDrop;
}

function bellTop(bell: Bell): number {
  return bellWorldY(bell) + bell.h * 0.58;
}

function jumpVelocityFor(fromY: number, fromX: number, target: Bell): number {
  const dy = Math.max(80, bellTop(target) - fromY);
  const dx = Math.abs(target.x - fromX);
  const desiredPeak = dy + 105 + Math.min(135, dx * 0.13);
  return Math.max(1100, Math.min(1480, Math.sqrt(2 * -PHYS.gravity * desiredPeak)));
}

function flightTimeToHeight(v0: number, dy: number): number {
  const g = -PHYS.gravity;
  const disc = Math.max(0, v0 * v0 - 2 * g * dy);
  return (v0 + Math.sqrt(disc)) / g;
}

function targetWidthFor(ordinal: number): number {
  let base = 84 + 10 * (1 - Math.cos((ordinal - 600) * 0.13));
  if (ordinal <= 100) base = 112 - (ordinal - 1) * (10 / 99);
  else if (ordinal <= 200) base = 102 - (ordinal - 100) * 0.06;
  else if (ordinal <= 600) base = 96 - (ordinal - 200) * 0.03;
  const viewportGain = 1 + Math.min(0.18, Math.max(0, (height - 768) / 672) * 0.18);
  const progress = Math.min(1, Math.max(0, (ordinal - 1) / 100));
  return base * (1 + (viewportGain - 1) * progress);
}

function generateInitialPath(startOrdinal = 1, startY = 205): void {
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
    } else {
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

function makeBell(x: number, y: number, w: number, ordinal: number): Bell {
  const roll = rand();
  const kind: BellKind = ordinal < 8 ? 'bronze' : roll < 0.08 ? 'crystal' : roll < 0.30 ? 'silver' : 'bronze';
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

function extendPath(): void {
  if (!bells.length) return;
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
    maybePlaceCrate(lastBell, next);
    if (ordinal >= nextBonusBell) {
      maybeSpawnMoth(lastBell.y + gap * rand(0.38, 0.68), ordinal);
      nextBonusBell += Math.floor(rand(ordinal < 120 ? 20 : 18, ordinal < 120 ? 27 : 24));
    }
    lastBell = next;
  }
  // Descended objects far below the ground cannot be seen or reused in Zen.
  let expired = 0;
  while (expired < bells.length - 1 && bellWorldY(bells[expired]) <= GROUND_Y - 180) expired++;
  if (expired) bells.splice(0, expired);
  const cutoff = cameraY - 300;
  moths = moths.filter(m => m.alive && mothWorldY(m) > cutoff - 160);
}

function maybeSpawnMoth(y: number, ordinal: number): void {
  const dir = rand() > 0.5 ? 1 : -1;
  const pace = Math.min(1, Math.max(0, (ordinal - 18) / 150));
  // Give the painted body a readable crossing at every viewport width.
  const crossingTime = 3.2 - 0.5 * pace;
  const speed = (width + 160) / crossingTime * rand(0.92, 1.02);
  const entryDistance = speed * 0.25 + 70;
  const roll = rand();
  const kind: BellKind = roll < 0.08 ? 'crystal' : roll < 0.30 ? 'silver' : 'bronze';
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

function descentSpeedLimit(y: number): number {
  // The ridge and village bands stay readable; only empty high sky accelerates.
  if (y <= 1400) return 650 + 350 * chapterEase(y / 1400);
  if (y <= 8000) return 1000;
  if (y <= 11000) return 1000 + 400 * chapterEase((y - 8000) / 3000);
  if (y <= 14000) return 1400 + 500 * chapterEase((y - 11000) / 3000);
  return Math.min(5200, 1900 + (y - 14000) * 0.10);
}

function keepFallingCatVisible(): void {
  // The camera may ease toward Zima, but it cannot leave him below the viewport.
  cameraY = Math.min(cameraY, Math.max(0, cat.y - height * 0.20));
}

function keepRisingCatVisible(): void {
  // A fast launch must not let the cat disappear under the top command panel.
  const lowestAllowedScreenY = Math.max(205, height * 0.34);
  cameraY = Math.max(cameraY, Math.max(0, cat.y - (height - 84 - lowestAllowedScreenY)));
}

function expeditionGoalName(stage = expeditionStage): string {
  const names: Record<ThemeName, readonly [string, string, string]> = {
    winter: ['Cross Aurora Heights', 'Cross Constellation Sea', 'Reach Winter Crown'],
    spring: ['Cross Blossom Heights', 'Cross Petal Constellations', 'Reach Spring Crown'],
    summer: ['Cross Sunlit Heights', 'Cross Sapphire Clouds', 'Reach Summer Crown'],
    autumn: ['Cross Ember Heights', 'Cross Copper Constellations', 'Reach Autumn Crown'],
    'starlight-eve': ['Cross Harbor Lights', 'Cross Astral Sea', 'Reach Starlight Crown'],
    'great-egg-hunt': ['Cross Garden Heights', 'Cross Cloud Blossoms', 'Reach Conservatory Crown'],
    'fireworks-fair': ['Cross Festival Pier', 'Cross Firework Sky', 'Reach Coastal Crown'],
    'moonlit-masquerade': ['Cross Oak Canopy', 'Cross Lantern Sky', 'Reach Moonlit Crown'],
  };
  return names[selectedTheme][Math.min(2, stage)];
}

function advanceExpedition(): void {
  if (selectedMode !== 'expedition' || state !== 'playing') return;
  const goals = expeditionGoals();
  while (expeditionStage < goals.length && highestY >= goals[expeditionStage]) {
    expeditionStage++;
    rewardExpeditionStage(expeditionStage);
    if (expeditionStage <= 2) expeditionCheckpointY = goals[expeditionStage - 1];
  }
  if (expeditionStage === 3) finishExpedition();
}

function settleExpeditionCheckpoint(): void {
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
  runCrates = [];
  nextBonusBell = nextOrdinal + 17;
  generateInitialPath(nextOrdinal, expeditionCheckpointY + 205);
  setAnimState('groundLand');
  ping(400, 0.03, 0.13, 'sine');
}

function finishExpedition(): void {
  if (state === 'expeditionComplete') return;
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

function settleZenGround(): void {
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
  runCrates = [];
  fieldDrop = 0;
  nextBonusBell = nextOrdinal + 17;
  generateInitialPath(nextOrdinal);
}

function registerBellHit(bell: Bell, fromBelow: boolean): void {
  const firstContact = runFirstBell;
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
    const automaticBoost = Math.max(
      cat.vy + baseTap,
      targetBounce * 0.84 + bell.boost * 0.55,
      1180 + bell.boost * 0.70,
    );
    cat.vy = Math.min(1680, automaticBoost);
    if (firstContact && progress.enchantment === 'bellwake') cat.vy = Math.min(1680, cat.vy * 1.05);
    setAnimState('undersideContact');
    contactAnimHold = 0.12;
  } else {
    cat.y = top;
    const targetBounce = nextBell ? jumpVelocityFor(top, bell.x, nextBell) : PHYS.bounce;
    pendingBounce = Math.min(1640, targetBounce + chainBoost + bell.boost);
    if (firstContact && progress.enchantment === 'bellwake') pendingBounce = Math.min(1640, pendingBounce * 1.05);
    cat.vy = 0;
    bounceHold = 0.045;
    cat.landedFlash = bounceHold;
    setAnimState('land');
    contactAnimHold = 0.12;
  }
  runFirstBell = false;
  if (firstContact && progress.enchantment === 'bellwake') addSeasonBurst(bell.x, top, 0.7);

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

type ContactNormal = { x: number; y: number };

function sweptEllipseContact(x0: number, y0: number, x1: number, y1: number,
  centerX: number, centerY: number, radiusX: number, radiusY: number, angle = 0): ContactNormal | null {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const local = (x: number, y: number) => ({
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
    if (aa < 1e-8) return null;
    const discriminant = bb * bb - 4 * aa * cc;
    if (discriminant < 0) return null;
    t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
    if (t < 0 || t > 1) return null;
  }
  const hitX = a.x + dx * t, hitY = a.y + dy * t;
  const nx = hitX * cos / radiusX - hitY * sin / radiusY;
  const ny = hitX * sin / radiusX + hitY * cos / radiusY;
  const length = Math.hypot(nx, ny);
  return length > 1e-8 ? { x: nx / length, y: ny / length } : { x: 0, y: 1 };
}

function checkBellContacts(): void {
  const bottom = Math.min(cat.prevY, cat.y) - 200;
  const top = Math.max(cat.prevY, cat.y) + 200;
  for (let index = firstBellAtOrAbove(bottom); index < bells.length; index++) {
    const bell = bells[index];
    if (bellWorldY(bell) > top) break;
    if (bell.touched) {
      if (selectedMode === 'zen' && elapsed - bell.lastHit > 1.15) bell.touched = false;
      else continue;
    }
    const frame = OBJECT_BOUNDS[selectedTheme][bell.kind === 'bronze' ? 0 : bell.kind === 'silver' ? 1 : 2];
    const scale = Math.min(bell.w * 1.05 / frame.w, bell.h * 1.65 / frame.h);
    const bob = Math.sin(elapsed * 1.55 + bell.phase) * 2.2;
    const angle = -Math.sin(elapsed * 1.95 + bell.phase) * 0.045;
    const normal = sweptEllipseContact(cat.prevX, cat.prevY + cat.h * 0.43,
      cat.x, cat.y + cat.h * 0.43, bell.x, bellWorldY(bell) - bob,
      frame.w * scale * 0.42 + cat.w * 0.28,
      frame.h * scale * 0.42 + cat.h * 0.34, angle);
    if (!normal) continue;
    const topLanding = cat.vy < 0 && normal.y > 0.4 && normal.y > Math.abs(normal.x) * 0.65;
    lastBellContactDirection = topLanding ? 'top' : Math.abs(normal.x) > 0.6 ? 'side' : 'underside';
    registerBellHit(bell, !topLanding);
    break;
  }
}

function beginLongFall(): void {
  if (state !== 'playing') return;
  state = 'falling';
  if (progress.enchantment === 'softfall') runSoftfallTime = 1;
  if (progress.utility === 'echo' && !runEchoUsed) {
    runEchoUsed = true; runEchoTime = 1.2;
    message = 'ECHO CHARM · STEER NOW'; messageTimer = 1.2;
  }
  bounceHold = 0;
  pendingBounce = 0;
  bounceChain = 0;
  if (runEchoTime <= 0) { message = 'MISSED — FALLING HOME'; messageTimer = 1.8; }
  setAnimState('fall');
  ping(260, 0.03, 0.18, 'sine');
}

function checkMoths(): void {
  const bodyY = cat.y + cat.h * 0.48;
  for (const moth of moths) {
    if (!moth.alive) continue;
    const my = mothWorldY(moth);
    if (sweptEllipseContact(cat.prevX - moth.prevX + moth.x, cat.prevY + cat.h * 0.48,
      cat.x, bodyY, moth.x, my, 88, 68)) {
      moth.alive = false;
      descentBlend = 0;
      mothCount++;
      rewardBirdCatch();
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

function finishGame(): void {
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
