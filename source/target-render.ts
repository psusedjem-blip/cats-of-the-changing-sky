// Part of the single main.js extension bundle.

function drawObjectSprite(x: number, y: number, bell: Bell, t: number, atlas: HTMLImageElement): void {
  const index = bell.kind === 'bronze' ? 0 : bell.kind === 'silver' ? 1 : 2;
  const frame = OBJECT_BOUNDS[selectedTheme][index];
  const bob = Math.sin(t * 1.55 + bell.phase) * 2.2;
  const scale = Math.min(bell.w * 1.05 / frame.w, bell.h * 1.65 / frame.h);
  const drawWidth = frame.w * scale;
  const drawHeight = frame.h * scale;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(t * 1.95 + bell.phase) * 0.045);
  if (bell.touched) ctx.globalAlpha = touchedObjectAlpha(bell);
  if (bell.kind === 'crystal') { ctx.shadowColor = themeMeta().accent; ctx.shadowBlur = 12; }
  ctx.drawImage(atlas, frame.x, frame.y, frame.w, frame.h,
    -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

function touchedObjectAlpha(bell: Bell): number {
  return Math.max(0.14, 0.82 - Math.max(0, elapsed - bell.lastHit) * 2.4);
}

function drawAirborneSprite(x: number, y: number, phase: number, vx: number, kind: BellKind, atlas: HTMLImageElement, drawSize = 140): void {
  const frame = Math.floor(phase * 1.35) % 6;
  const cellWidth = atlas.naturalWidth / 3;
  const cellHeight = atlas.naturalHeight / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(vx < 0 ? -1 : 1, 1);
  ctx.shadowColor = kind === 'crystal' ? 'rgba(113,235,255,.85)' : kind === 'silver' ? 'rgba(222,241,255,.70)' : 'rgba(255,201,115,.68)';
  ctx.shadowBlur = kind === 'crystal' ? 24 : kind === 'silver' ? 19 : 15;
  // The painted head and body sit right of the atlas cell center. Center them on the hitbox.
  ctx.drawImage(atlas, (frame % 3) * cellWidth, Math.floor(frame / 3) * cellHeight,
    cellWidth, cellHeight, -drawSize * 0.78, -drawSize / 2, drawSize, drawSize);
  ctx.restore();
}

function drawBell(x: number, y: number, bell: Bell, t: number): void {
  const art = interactionAssets[selectedTheme];
  if (art) { drawObjectSprite(x, y, bell, t, art.objects); return; }
  const bob = Math.sin(t * 1.55 + bell.phase) * 2.2;
  y += bob;
  ctx.save();
  if (bell.touched) ctx.globalAlpha = touchedObjectAlpha(bell);
  const glowColor = bell.kind === 'crystal' ? 'rgba(173,243,255,.25)' : bell.kind === 'silver' ? 'rgba(246,248,255,.22)' : 'rgba(255,235,157,.22)';
  const glow = ctx.createRadialGradient(x, y, 4, x, y, bell.w * 0.95);
  glow.addColorStop(0, glowColor); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, bell.w * 0.95, 0, TAU); ctx.fill();
  ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;

  if (selectedTheme === 'winter') {
    const sway = Math.sin(t * 1.95 + bell.phase) * 0.055;
    ctx.rotate(sway + Math.sin(t * 6.2 + bell.phase) * 0.018);
    const h = bell.h, w = bell.w;
    ctx.strokeStyle = '#a9711d';
    ctx.lineWidth = Math.max(2, w * 0.045);
    ctx.beginPath(); ctx.ellipse(0, -h * 0.61, w * 0.12, h * 0.12, 0, Math.PI, 0); ctx.stroke();
    const body = ctx.createLinearGradient(-w * 0.25, -h * 0.48, w * 0.32, h * 0.38);
    if (bell.kind === 'crystal') { body.addColorStop(0, '#e9fdff'); body.addColorStop(0.28, '#a9eef8'); body.addColorStop(0.72, '#62bed4'); body.addColorStop(1, '#2d7289'); ctx.strokeStyle = '#225d72'; }
    else if (bell.kind === 'silver') { body.addColorStop(0, '#ffffff'); body.addColorStop(0.28, '#e7edf3'); body.addColorStop(0.72, '#aebbc8'); body.addColorStop(1, '#667684'); ctx.strokeStyle = '#566773'; }
    else { body.addColorStop(0, '#fff0a9'); body.addColorStop(0.28, '#f3cd62'); body.addColorStop(0.72, '#d49b32'); body.addColorStop(1, '#9c6818'); ctx.strokeStyle = '#8f5c14'; }
    ctx.fillStyle = body; ctx.lineWidth = Math.max(1.8, w * 0.028);
    ctx.beginPath(); ctx.moveTo(-w * 0.12, -h * 0.50); ctx.quadraticCurveTo(-w * 0.31, -h * 0.42, -w * 0.34, -h * 0.16); ctx.quadraticCurveTo(-w * 0.36, h * 0.10, -w * 0.48, h * 0.27); ctx.quadraticCurveTo(-w * 0.52, h * 0.34, -w * 0.42, h * 0.38); ctx.quadraticCurveTo(0, h * 0.51, w * 0.42, h * 0.38); ctx.quadraticCurveTo(w * 0.52, h * 0.34, w * 0.48, h * 0.27); ctx.quadraticCurveTo(w * 0.36, h * 0.10, w * 0.34, -h * 0.16); ctx.quadraticCurveTo(w * 0.31, -h * 0.42, w * 0.12, -h * 0.50); ctx.quadraticCurveTo(0, -h * 0.56, -w * 0.12, -h * 0.50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,221,.45)'; ctx.beginPath(); ctx.ellipse(-w * 0.16, -h * 0.08, w * 0.075, h * 0.24, -0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a4c12'; ctx.beginPath(); ctx.ellipse(0, h * 0.36, w * 0.40, h * 0.105, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffe7a0'; ctx.lineWidth = Math.max(2, w * 0.032); ctx.beginPath(); ctx.ellipse(0, h * 0.32, w * 0.44, h * 0.10, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#6e4310'; ctx.lineWidth = Math.max(1.5, w * 0.025); ctx.beginPath(); ctx.moveTo(0, h * 0.12); ctx.lineTo(0, h * 0.42); ctx.stroke();
    ctx.fillStyle = bell.kind === 'crystal' ? '#d8fbff' : bell.kind === 'silver' ? '#edf4fb' : '#d69f36'; ctx.beginPath(); ctx.arc(0, h * 0.45, Math.max(3, w * 0.065), 0, TAU); ctx.fill();
  } else if (selectedTheme === 'spring') {
    const size = bell.w * 0.48;
    ctx.lineWidth = 2.1;
    if (bell.kind === 'bronze') {
      ctx.strokeStyle = '#3d94aa';
      const drop = ctx.createLinearGradient(0, -size, 0, size);
      drop.addColorStop(0, '#c7f0ff'); drop.addColorStop(0.35, '#6cccf5'); drop.addColorStop(1, '#2f96d8');
      ctx.fillStyle = drop;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.12);
      ctx.bezierCurveTo(size * 0.52, -size * 0.64, size * 0.64, 0, 0, size * 0.86);
      ctx.bezierCurveTo(-size * 0.64, 0, -size * 0.52, -size * 0.64, 0, -size * 1.12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.58)'; ctx.beginPath(); ctx.ellipse(-size*0.18, -size*0.20, size*0.10, size*0.26, -0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.40)'; ctx.beginPath(); ctx.arc(0, size*0.54, size*0.24, Math.PI*0.1, Math.PI*0.9); ctx.stroke();
    } else if (bell.kind === 'silver') {
      const petals = 5;
      ctx.strokeStyle = '#c98aa6';
      for (let i=0;i<petals;i++){ const a=i/petals*TAU; ctx.fillStyle='#ffd6eb'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*size*0.28, Math.sin(a)*size*0.28, size*0.34, size*0.17, a, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#fff0ab'; ctx.beginPath(); ctx.arc(0,0,size*0.20,0,TAU); ctx.fill(); ctx.strokeStyle='#f1d56d'; ctx.stroke();
    } else {
      ctx.strokeStyle = '#6e9f4b';
      ctx.fillStyle = '#f5f0c3';
      for (let i=0;i<4;i++){ ctx.beginPath(); ctx.ellipse((i-1.5)*size*0.18, Math.abs(i-1.5)*size*0.10, size*0.18, size*0.34, 0.2*(i-1.5), 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = '#729b47'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,-size*0.70); ctx.quadraticCurveTo(size*0.08,-size*0.95,size*0.28,-size*0.95); ctx.stroke();
      ctx.fillStyle = '#81b756'; ctx.beginPath(); ctx.ellipse(size*0.30, -size*0.98, size*0.12, size*0.08, 0.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff8d6'; ctx.beginPath(); ctx.arc(0, size*0.18, size*0.10, 0, TAU); ctx.fill();
    }
  } else if (selectedTheme === 'summer') {
    const size = bell.w * 0.50;
    ctx.lineWidth = 2.1;
    if (bell.kind === 'bronze') {
      ctx.strokeStyle = '#8f6425';
      for (let i=0;i<14;i++){ const a=i/14*TAU; ctx.fillStyle='#ffd34c'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*size*0.50, Math.sin(a)*size*0.50, size*0.34, size*0.12, a, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#6d4518'; ctx.beginPath(); ctx.arc(0,0,size*0.31,0,TAU); ctx.fill();
      ctx.fillStyle = '#8ba939'; ctx.beginPath(); ctx.ellipse(0,size*0.80,size*0.12,size*0.20,0,0,TAU); ctx.fill();
    } else if (bell.kind === 'silver') {
      ctx.strokeStyle = '#ad7a20';
      for (let i=0;i<10;i++){ const a=i/10*TAU; ctx.fillStyle='#ffcf57'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*size*0.36, Math.sin(a)*size*0.36, size*0.26, size*0.12, a, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#f1a63b'; ctx.beginPath(); ctx.arc(0,0,size*0.24,0,TAU); ctx.fill();
    } else {
      ctx.strokeStyle = '#c99929';
      for (let i=0;i<8;i++){ const a=i/8*TAU; ctx.fillStyle='#fff1b5'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*size*0.30, Math.sin(a)*size*0.28, size*0.28, size*0.11, a, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#ffe9a1'; ctx.beginPath(); ctx.arc(0,0,size*0.20,0,TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,232,155,.36)'; ctx.beginPath(); ctx.arc(0,0,size*0.76,0,TAU); ctx.fill();
    }
  } else {
    const rx = bell.kind === 'crystal' ? bell.w * 0.42 : bell.kind === 'silver' ? bell.w * 0.39 : bell.w * 0.44;
    const ry = bell.kind === 'crystal' ? bell.h * 0.46 : bell.kind === 'silver' ? bell.h * 0.34 : bell.h * 0.38;
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#8f4f1d';
    ctx.fillStyle = bell.kind === 'crystal' ? '#ffad47' : bell.kind === 'silver' ? '#dcb15b' : '#ec8b2f';
    ctx.beginPath(); ctx.ellipse(0, 4, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * rx * 0.45, -ry * 0.84 + 4); ctx.quadraticCurveTo(i * rx * 0.25, 4, i * rx * 0.45, ry * 0.82 + 4); ctx.stroke(); }
    ctx.fillStyle = '#6e8b34'; ctx.beginPath(); ctx.ellipse(0, -ry + 1, rx * 0.20, ry * 0.12, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#476825'; ctx.stroke(); ctx.fillStyle = '#4c7d2d'; ctx.fillRect(-2, -ry * 1.15, 4, 10);
    if (bell.kind === 'crystal') { ctx.fillStyle = '#23140d'; ctx.beginPath(); ctx.arc(-rx*0.18,-2,3,0,TAU); ctx.arc(rx*0.18,-2,3,0,TAU); ctx.fill(); ctx.strokeStyle='#23140d'; ctx.beginPath(); ctx.arc(0,8,12,0.12*Math.PI,0.88*Math.PI); ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-rx*0.18, -ry*0.15, rx*0.10, ry*0.20, -0.2, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}




function drawMoth(x: number, y: number, phase: number, vx: number, kind: BellKind): void {
  const art = interactionAssets[selectedTheme];
  if (art) { drawAirborneSprite(x, y, phase, vx, kind, art.airborne); return; }
  const tierColor = kind === 'crystal' ? '#9df3ff' : kind === 'silver' ? '#eff5ff' : '#ffd17a';
  ctx.save();
  ctx.strokeStyle = tierColor;
  ctx.globalAlpha = 0.58 + Math.sin(phase * 0.7) * 0.14;
  ctx.lineWidth = kind === 'crystal' ? 3.2 : kind === 'silver' ? 2.6 : 2;
  ctx.shadowColor = tierColor;
  ctx.shadowBlur = kind === 'crystal' ? 19 : 12;
  ctx.beginPath(); ctx.ellipse(x, y, 51, 38, 0, 0, TAU); ctx.stroke();
  const pips = kind === 'crystal' ? 3 : kind === 'silver' ? 2 : 1;
  ctx.fillStyle = tierColor;
  for (let i = 0; i < pips; i++) { ctx.beginPath(); ctx.arc(x + (i - (pips - 1) / 2) * 12, y - 43, 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(vx < 0 ? -1 : 1, 1);
  ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  if (selectedTheme === 'winter') {
    const flap = Math.sin(phase) * 0.72;
    const pulse = 0.78 + Math.sin(phase * 0.5) * 0.16;
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 54);
    glow.addColorStop(0, `rgba(139,255,235,${0.50 * pulse})`); glow.addColorStop(1, 'rgba(139,255,235,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.fill();
    ctx.rotate(Math.sin(phase * 0.35) * 0.06);
    ctx.fillStyle = 'rgba(151,244,231,.90)'; ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-34, -5); ctx.lineTo(-28, 7); ctx.lineTo(-37, 14); ctx.lineTo(-16, 10); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.rotate(-0.10 - flap * 0.48); ctx.fillStyle = 'rgba(217,255,249,.95)'; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.quadraticCurveTo(-14, -25, -35, -28); ctx.quadraticCurveTo(-25, -7, -8, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(0.08 + flap * 0.36); ctx.fillStyle = 'rgba(180,250,238,.88)'; ctx.beginPath(); ctx.moveTo(-1, 2); ctx.quadraticCurveTo(-8, 22, -27, 27); ctx.quadraticCurveTo(-21, 7, -5, -4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#dffff8'; ctx.beginPath(); ctx.ellipse(5, 2, 18, 10, -0.08, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(19, -3, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#7ee5d2'; ctx.beginPath(); ctx.moveTo(26, -3); ctx.lineTo(35, 0); ctx.lineTo(26, 3); ctx.closePath(); ctx.fill();
  } else if (selectedTheme === 'spring') {
    const wing = Math.sin(phase * 1.7) * 0.6;
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 42);
    glow.addColorStop(0, 'rgba(179,232,255,.32)'); glow.addColorStop(1, 'rgba(179,232,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0,0,42,0,TAU); ctx.fill();
    ctx.strokeStyle = '#4d94a0'; ctx.lineWidth = 1.2;
    ctx.fillStyle = 'rgba(177,235,246,.85)';
    ctx.beginPath(); ctx.ellipse(-12, -5, 15, 7 + wing * 3, -0.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(12, -5, 15, 7 - wing * 3, 0.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(151,214,242,.85)';
    ctx.beginPath(); ctx.ellipse(-10, 8, 12, 6 + wing * 2, -0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10, 8, 12, 6 - wing * 2, 0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3f8aa0'; ctx.fillRect(-1.5, -12, 3, 26); ctx.beginPath(); ctx.arc(0, -14, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle='#7fcaee'; ctx.beginPath(); ctx.moveTo(0,-14); ctx.quadraticCurveTo(-8,-24,-12,-24); ctx.moveTo(0,-14); ctx.quadraticCurveTo(8,-24,12,-24); ctx.stroke();
  } else if (selectedTheme === 'summer') {
    const flap = Math.sin(phase * 1.9) * 0.26;
    ctx.rotate(flap);
    ctx.fillStyle = '#29365a';
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.quadraticCurveTo(-8, -12, 7, -2); ctx.quadraticCurveTo(-4, 2, -24, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, 4); ctx.quadraticCurveTo(-6, 16, 9, 6); ctx.quadraticCurveTo(-5, 7, -20, 4); ctx.fill();
    ctx.fillStyle = '#f4f6fb'; ctx.beginPath(); ctx.ellipse(8, 0, 18, 8, 0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(24, -2, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d86f2e'; ctx.beginPath(); ctx.ellipse(8, -2, 8, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d08d27'; ctx.beginPath(); ctx.moveTo(29,-2); ctx.lineTo(38,1); ctx.lineTo(29,4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,155,.36)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(6,0,32,-0.3,1.5); ctx.stroke();
  } else {
    const flap = Math.sin(phase * 1.5) * 0.34;
    ctx.fillStyle = '#1b1a1f';
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-28, -18 - flap*10, -42, -6); ctx.quadraticCurveTo(-26, 2, -8, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(-24, 18 + flap*10, -36, 14); ctx.quadraticCurveTo(-20, 8, -6, 4); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, 1, 18, 9, 0.08, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(24, -2, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9b65c'; ctx.beginPath(); ctx.arc(25,-4,1.2,0,TAU); ctx.fill();
    ctx.fillStyle = '#c58b35'; ctx.beginPath(); ctx.moveTo(30,-2); ctx.lineTo(39,1); ctx.lineTo(30,4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
