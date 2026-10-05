// Part of the single main.js extension bundle.

function drawSky(): void {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  if (selectedTheme === 'winter') {
    g.addColorStop(0, '#020912');
    g.addColorStop(0.46, '#09213a');
    g.addColorStop(1, '#17435a');
  } else if (selectedTheme === 'spring') {
    g.addColorStop(0, '#8fc8ef');
    g.addColorStop(0.40, '#bae6f4');
    g.addColorStop(0.82, '#d8f5e5');
    g.addColorStop(1, '#ecf8df');
  } else if (selectedTheme === 'summer') {
    g.addColorStop(0, '#3d9fe3');
    g.addColorStop(0.52, '#87d6ff');
    g.addColorStop(0.86, '#d8ef98');
    g.addColorStop(1, '#f7e39d');
  } else {
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



function drawStars(): void {
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
    ctx.beginPath(); ctx.arc(moonX, moonY, 62, 0, TAU); ctx.fill();
    ctx.fillStyle = '#eef8ff';
    ctx.beginPath(); ctx.arc(moonX, moonY, 23, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a1c30';
    ctx.beginPath(); ctx.arc(moonX + 10, moonY - 5, 23, 0, TAU); ctx.fill();
  } else if (selectedTheme === 'spring') {
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 4; i++) {
      const x = width * (0.16 + i * 0.22);
      const y = height * (0.18 + (i % 2) * 0.06);
      drawCloud(x, y, 0.9 + (i % 3) * 0.15);
    }
  } else if (selectedTheme === 'summer') {
    const sunX = width * 0.84;
    const sunY = height * 0.16;
    const rg = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 78);
    rg.addColorStop(0, 'rgba(255,248,196,.95)');
    rg.addColorStop(0.4, 'rgba(255,233,130,.38)');
    rg.addColorStop(1, 'rgba(255,233,130,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(sunX, sunY, 78, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff0a8';
    ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 3; i++) drawCloud(width * (0.18 + i * 0.28), height * (0.16 + (i % 2) * 0.07), 0.85 + i * 0.1);
  } else {
    const sunX = width * 0.80;
    const sunY = height * 0.18;
    ctx.fillStyle = 'rgba(255,235,176,.50)';
    ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 2; i++) drawCloud(width * (0.24 + i * 0.32), height * (0.18 + i * 0.06), 0.9);
  }
  ctx.globalAlpha = 1;
}


function drawAurora(): void {
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
  } else if (selectedTheme === 'spring') {
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#d9f7ff' : '#f7d4f1';
      ctx.lineWidth = 10 + i * 3;
      ctx.beginPath();
      const base = height * (0.22 + i * 0.03);
      ctx.moveTo(-20, base);
      for (let x = 0; x <= width + 20; x += 40) ctx.lineTo(x, base + Math.sin(x * 0.01 + elapsed * 0.6 + i) * (6 + i * 1.6));
      ctx.stroke();
    }
  } else if (selectedTheme === 'summer') {
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
  } else {
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = '#f6d59a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const base = height * (0.28 + i * 0.06);
      ctx.moveTo(-20, base);
      for (let x = 0; x <= width + 20; x += 50) ctx.lineTo(x, base + Math.sin(x * 0.008 + elapsed * 0.35 + i) * (10 + i * 2));
      ctx.lineWidth = 14;
      ctx.stroke();
    }
  }
  ctx.restore();
}


function drawFarMountains(): void {
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
  ctx.beginPath(); ctx.moveTo(0, height);
  for (let x = 0; x <= width + 150; x += 150) {
    ctx.lineTo(x, base - 76 - (x / 150 % 3) * 20);
    ctx.lineTo(x + 80, base + 20);
  }
  ctx.lineTo(width, height); ctx.closePath();
  ctx.fillStyle = selectedTheme === 'winter' ? '#183d56' : selectedTheme === 'spring' ? '#8eb4be' : selectedTheme === 'summer' ? '#9db783' : '#b08261';
  ctx.fill();

  // mid range
  ctx.globalAlpha = 0.16;
  ctx.beginPath(); ctx.moveTo(0, height);
  for (let x = 0; x <= width + 120; x += 120) {
    ctx.lineTo(x, base - 42 - (x / 120 % 3) * 22);
    ctx.lineTo(x + 65, base + 20);
  }
  ctx.lineTo(width, height); ctx.closePath();
  ctx.fillStyle = selectedTheme === 'winter' ? '#113047' : selectedTheme === 'spring' ? '#749ca6' : selectedTheme === 'summer' ? '#78956d' : '#94694a';
  ctx.fill();

  // seasonal landmarks for depth
  if (selectedTheme === 'winter') {
    drawStoneBridge(width * 0.18, base + 18, 1.25, '#718bad', '#547092');
    drawVillageSilhouette(width * 0.62, base + 6, 0.9, '#ffd79d', '#314965');
  } else if (selectedTheme === 'spring') {
    drawStoneBridge(width * 0.20, base + 16, 1.1, '#7898a6', '#6f8896');
    drawVillageSilhouette(width * 0.70, base + 8, 0.85, '#ffd6b5', '#7697a4');
    drawWaterRibbon(base + 4, 0.22, 'rgba(201,235,245,.40)', 'rgba(255,255,255,.0)');
  } else if (selectedTheme === 'summer') {
    drawWaterRibbon(base + 18, 0.18, 'rgba(126,190,236,.42)', 'rgba(255,255,255,0)');
    drawVillageSilhouette(width * 0.62, base + 14, 0.92, '#f7cda1', '#7f9a75');
    drawWindmill(width * 0.80, base - 18, 0.9, 0.28);
  } else {
    drawBarn(width * 0.16, base + 18, 0.92, 0.30);
    drawWindmill(width * 0.74, base - 10, 0.85, 0.26);
    drawWaterRibbon(base + 20, 0.12, 'rgba(253,209,149,.26)', 'rgba(255,255,255,0)');
  }
  ctx.restore();
}




function drawPines(): void {
  if (cameraY > height * 1.2) return;
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
  } else if (selectedTheme === 'spring') {
    for (let i = -1; i < Math.ceil(width / 95) + 2; i++) if (i % 2 === 0) drawBlossomTree(i * 95 + ((i % 2) * 24), baseY + 6, 0.72 + (i % 3) * 0.05);
    drawWisteriaPergola(width * 0.83, baseY - 4, 0.94);
    drawFlowerMeadow(width * 0.18, baseY + 10, 1.1, ['#f7c0de', '#ffffff', '#b68ef0']);
    drawFlowerMeadow(width * 0.52, baseY + 12, 1.25, ['#f9d4eb', '#ffffff', '#ffd36d']);
    drawStreamBank(width * 0.14, baseY + 14, width * 0.20);
    const groundG = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 70);
    groundG.addColorStop(0, 'rgba(194,236,172,.14)');
    groundG.addColorStop(0.55, 'rgba(138,199,125,.12)');
    groundG.addColorStop(1, 'rgba(111,168,103,.16)');
    ctx.fillStyle = groundG;
  } else if (selectedTheme === 'summer') {
    for (let i = -1; i < Math.ceil(width / 88) + 2; i++) if (i % 2 === 0) drawSunflowerCluster(i * 88 + ((i % 2) * 16), baseY + 2, 0.74 + (i % 3) * 0.05);
    drawStoneWall(width * 0.18, baseY + 8, 0.95);
    drawFlowerMeadow(width * 0.24, baseY + 12, 1.15, ['#ffffff', '#ffd54f', '#9ed0ff']);
    drawFlowerMeadow(width * 0.70, baseY + 12, 1.05, ['#ffffff', '#ffd54f', '#b88bd6']);
    drawWoodenBanner(width * 0.82, baseY - 2, 0.88, '#5c7c2f');
    const groundG = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 75);
    groundG.addColorStop(0, 'rgba(199,233,119,.13)');
    groundG.addColorStop(0.55, 'rgba(124,182,78,.12)');
    groundG.addColorStop(1, 'rgba(85,140,60,.16)');
    ctx.fillStyle = groundG;
  } else {
    for (let i = -1; i < Math.ceil(width / 90) + 2; i++) if (i % 3 === 0) drawCornStalk(i * 44, baseY + 10, 0.74 + (i % 4) * 0.03);
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
  for (let x = 0; x <= width; x += 80) ctx.quadraticCurveTo(x + 40, baseY - 5 + Math.sin(x * 0.01) * 4, x + 80, baseY + 2);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
  drawGroundDetail(baseY + 8);
  ctx.restore();
}




function drawPine(x: number, baseY: number, h: number, alpha: number): void {
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
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawCloud(x: number, y: number, scale: number): void {
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

function drawStoneBridge(x: number, y: number, scale: number, fill: string, stroke: string): void {
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
  ctx.fill(); ctx.stroke();
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 18, -4); ctx.lineTo(i * 18, -17 + Math.abs(i) * 2); ctx.stroke(); }
  ctx.restore();
}

function drawVillageSilhouette(x: number, y: number, scale: number, glow: string, fill: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = fill;
  for (const [dx,w,h,r] of [[-44,30,24,0],[-8,24,20,0],[22,28,18,0],[52,26,22,0]]) {
    ctx.fillRect(dx, -h, w, h);
    ctx.beginPath(); ctx.moveTo(dx - 2, -h); ctx.lineTo(dx + w/2, -h - 12 - r); ctx.lineTo(dx + w + 2, -h); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(5, -42, 8, 42);
  ctx.beginPath(); ctx.moveTo(1, -42); ctx.lineTo(9, -58); ctx.lineTo(17, -42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.32;
  for (const [dx,dy] of [[-34,-12],[-22,-12],[-2,-10],[28,-10],[58,-12]]) ctx.fillRect(dx, dy, 6, 7);
  ctx.restore();
}

function drawWaterRibbon(y: number, alpha: number, fill1: string, fill2: string): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 36);
  g.addColorStop(0, fill1); g.addColorStop(1, fill2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(width * 0.05, y + 10);
  for (let x = width * 0.05; x <= width * 0.95; x += 80) ctx.quadraticCurveTo(x + 40, y - 5 + Math.sin(x*0.02)*4, x + 80, y + 10);
  ctx.lineTo(width * 0.95, y + 24);
  for (let x = width * 0.95; x >= width * 0.05; x -= 80) ctx.quadraticCurveTo(x - 40, y + 30 + Math.cos(x*0.02)*3, x - 80, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWindmill(x: number, y: number, scale: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f0e1b9'; ctx.fillRect(-10, -36, 20, 36);
  ctx.fillStyle = '#7d6242'; ctx.fillRect(-2, -56, 4, 24);
  ctx.strokeStyle = '#7d6242'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2 + 0.4); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -26); ctx.lineTo(4, -4); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

function drawBarn(x: number, y: number, scale: number, alpha: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#a84d32'; ctx.fillRect(-24, -20, 48, 20);
  ctx.beginPath(); ctx.moveTo(-28, -20); ctx.lineTo(0, -38); ctx.lineTo(28, -20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ede3d2'; ctx.fillRect(-4, -12, 8, 12); ctx.fillRect(12, -12, 6, 6);
  ctx.restore();
}

function drawLanternPost(x: number, y: number, scale: number, glowColor: string): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = '#6c5136'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -44); ctx.lineTo(18, -44); ctx.stroke();
  ctx.fillStyle = glowColor; ctx.shadowColor = glowColor; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.roundRect(12, -36, 14, 18, 3); ctx.fill();
  ctx.restore();
}

function drawFlowerMeadow(x: number, y: number, scale: number, colors: string[]): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  for (let i = 0; i < 16; i++) {
    const px = -70 + i * 9 + (i % 3) * 3;
    const py = (i % 4) * 2;
    ctx.strokeStyle = '#5d8d4c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px, 8); ctx.lineTo(px, -8 - (i % 3) * 5); ctx.stroke();
    const c = colors[i % colors.length];
    ctx.fillStyle = c;
    const fy = -10 - (i % 3) * 5;
    for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ctx.beginPath(); ctx.ellipse(px + Math.cos(a)*3.2, fy + Math.sin(a)*3.2, 2.6, 1.7, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f7de79'; ctx.beginPath(); ctx.arc(px, fy, 1.5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawStreamBank(x: number, y: number, w: number): void {
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 18, 0, y + 24); g.addColorStop(0, 'rgba(193,233,244,.70)'); g.addColorStop(1, 'rgba(145,194,215,.15)');
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

function drawWisteriaPergola(x: number, y: number, scale: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = '#8b6d50'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-34, 10); ctx.lineTo(-34, -38); ctx.lineTo(26, -38); ctx.lineTo(26, 10); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const gx = -24 + i * 12;
    const gy = -36 + (i % 2) * 3;
    ctx.fillStyle = i % 2 === 0 ? '#9c6de0' : '#c9a0f2';
    for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(gx + Math.sin(j)*2, gy + 8 + j*6, 4.5 - j*0.4, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

function drawStoneWall(x: number, y: number, scale: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = '#c6b39a'; ctx.strokeStyle = '#917f68'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-52, -16, 104, 24, 6); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i++) { ctx.strokeRect(-48 + i*16, -14 + (i%2)*2, 14, 8); }
  ctx.fillStyle = '#6da85a';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-42 + i*18, -18 + (i%3)*2, 4, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawWoodenBanner(x: number, y: number, scale: number, color: string): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = '#7b5a31'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -44); ctx.lineTo(28, -44); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(24, -39); ctx.lineTo(44, -35); ctx.lineTo(24, -16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c08c2a'; ctx.beginPath(); ctx.arc(28, -44, 8, 0, TAU); ctx.stroke();
  ctx.restore();
}

function drawPumpkinCart(x: number, y: number, scale: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = '#7b4f2a'; ctx.lineWidth = 3; ctx.strokeRect(-34, -18, 54, 18);
  ctx.beginPath(); ctx.arc(-20, 4, 8, 0, TAU); ctx.arc(10, 4, 8, 0, TAU); ctx.stroke();
  for (const [px,py,r,c] of [[-18,-10,11,'#ef9333'],[-2,-12,9,'#f4cc9d'],[12,-10,10,'#6f8f3d']]) { ctx.fillStyle = c as string; ctx.beginPath(); ctx.arc(px as number, py as number, r as number, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawPumpkinPatch(x: number, y: number, scale: number): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  for (let i = 0; i < 8; i++) {
    const px = -80 + i * 22;
    const col = i % 3 === 0 ? '#f0a043' : i % 3 === 1 ? '#f5d8a8' : '#6d8f42';
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(px, 4 + (i % 2) * 3, 11, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#597d35'; ctx.fillRect(px - 1, -8 + (i % 2) * 3, 2, 7);
  }
  ctx.restore();
}

function drawSnowBankDetail(baseY: number): void {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(width * (0.1 + i*0.13), baseY + (i%2)*4, 26, 9, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawGroundDetail(baseY: number): void {
  ctx.save();
  if (selectedTheme === 'winter') {
    ctx.fillStyle = 'rgba(214,239,248,.72)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(width * (0.12 + i*0.14), baseY + 10 + (i%2)*4, 28, 8, 0, 0, TAU); ctx.fill(); }
  } else if (selectedTheme === 'spring') {
    drawFlowerMeadow(width * 0.84, baseY + 20, 1.1, ['#f3b9de', '#ffffff', '#8dbbff']);
  } else if (selectedTheme === 'summer') {
    drawFlowerMeadow(width * 0.50, baseY + 20, 1.15, ['#ffffff', '#ffe06d', '#b183d0']);
  } else {
    ctx.fillStyle = 'rgba(166,104,38,.65)';
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(width * 0.06 + i*60, baseY + 16 + (i%3)*4, 10, 3, Math.sin(i), 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}

function drawBlossomTree(x: number, baseY: number, scale: number): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#6e4d35';
  ctx.fillRect(-4, -54, 8, 56);
  ctx.fillStyle = '#f7c7df';
  for (const [dx,dy,r] of [[0,-62,20],[-16,-50,16],[16,-48,17],[-4,-36,15],[13,-31,12]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffdff0';
  for (const [dx,dy,r] of [[-8,-59,6],[14,-54,6],[-20,-46,5],[10,-34,5]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawSunflowerCluster(x: number, baseY: number, scale: number): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#5a7f1f';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -48); ctx.stroke();
  ctx.fillStyle = '#6e9927';
  ctx.beginPath(); ctx.ellipse(-9, -26, 10, 5, -0.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -18, 11, 5, 0.5, 0, TAU); ctx.fill();
  for (let i=0;i<10;i++){ const a=i/10*TAU; ctx.fillStyle='#ffd44f'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*15, -48+Math.sin(a)*15, 8, 4.5, a, 0, TAU); ctx.fill(); }
  ctx.fillStyle='#6d4518'; ctx.beginPath(); ctx.arc(0,-48,11,0,TAU); ctx.fill();
  ctx.restore();
}

function drawCornStalk(x: number, baseY: number, scale: number): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#b58d36';
  ctx.fillRect(-1.5, -42, 3, 44);
  ctx.fillStyle = '#7da438';
  ctx.beginPath(); ctx.ellipse(-7, -28, 13, 4, -0.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, -18, 14, 4, 0.45, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6, -10, 12, 4, -0.25, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawScarecrow(x: number, baseY: number, scale: number): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#6c4e2d';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -52); ctx.moveTo(-18, -34); ctx.lineTo(18, -34); ctx.stroke();
  ctx.fillStyle = '#e4c17e'; ctx.beginPath(); ctx.arc(0,-60,10,0,TAU); ctx.fill();
  ctx.fillStyle = '#7b4d25'; ctx.beginPath(); ctx.moveTo(-12,-68); ctx.lineTo(12,-68); ctx.lineTo(5,-78); ctx.lineTo(-5,-78); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8c5e34'; ctx.fillRect(-10,-46,20,14);
  ctx.restore();
}
