// Part of the single main.js extension bundle.

function decimalLines(value: bigint, font: string, maxWidth: number): string[] {
  ctx.save(); ctx.font = font;
  const groups = formatScore(value).split(',');
  const lines: string[] = [];
  let line = groups.shift() || '0';
  for (const group of groups) {
    const candidate = `${line},${group}`;
    if (ctx.measureText(candidate).width > maxWidth) { lines.push(`${line},`); line = group; }
    else line = candidate;
  }
  lines.push(line);
  ctx.restore();
  return lines;
}

function drawDecimal(value: bigint, x: number, y: number, maxWidth: number,
  font: string, lineHeight: number, align: CanvasTextAlign = 'left'): number {
  const lines = decimalLines(value, font, maxWidth);
  ctx.font = font; ctx.textAlign = align;
  for (const line of lines) { ctx.fillText(line, x, y); y += lineHeight; }
  return y;
}

function drawHUD(): void {
  ctx.save();
  const visibleWidth = Math.min(width, window.innerWidth);
  const compact = visibleWidth < 1100;
  const expedition = selectedMode === 'expedition';
  const panelX = 18, panelY = 18;
  const panelW = compact ? Math.max(260, visibleWidth - 36) : Math.min(visibleWidth - 250, expedition ? 850 : 650);
  const scoreFont = compact ? '700 16px ui-rounded, system-ui, sans-serif' : '700 18px ui-rounded, system-ui, sans-serif';
  const bestFont = compact ? '600 13px ui-rounded, system-ui, sans-serif' : '600 15px ui-rounded, system-ui, sans-serif';
  const scoreW = compact ? (panelW - 42) / 2 : expedition ? (panelW - 40) * .28 : (panelW - 40) * .34;
  const bestW = compact ? scoreW : scoreW;
  const lineCount = Math.max(decimalLines(score, scoreFont, scoreW - 8).length,
    decimalLines(bestForMode(), bestFont, bestW - 8).length);
  const panelH = (compact ? expedition ? 121 : 101 : 69) + Math.max(0, lineCount - 1) * 19;
  ctx.fillStyle = 'rgba(4,18,30,.72)';
  ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.stroke();
  const firstX = panelX + 15;
  const secondX = compact ? panelX + 27 + scoreW : firstX + scoreW + 12;
  ctx.textAlign = 'left';
  ctx.fillStyle = themeMeta().accent;
  ctx.font = '700 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`SCORE · ${themeMeta().label.toUpperCase()}`, firstX, panelY + 21, scoreW - 4);
  ctx.fillText(`${selectedMode.toUpperCase()} BEST${bestIsApproximate() ? ' · APPROX.' : ''}`, secondX, panelY + 21, bestW - 4);
  ctx.fillStyle = '#f2fbff';
  drawDecimal(score, firstX, panelY + 47, scoreW - 8, scoreFont, 19);
  drawDecimal(bestForMode(), secondX, panelY + 47, bestW - 8, bestFont, 19);
  const statY = panelY + 58 + Math.max(0, lineCount - 1) * 19;
  if (compact) {
    ctx.fillStyle = '#eaf7ff';
    ctx.font = '700 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`BOUNCES ${bellCount}   ·   MULTI x${multiplier}`, firstX, statY + 8, panelW - 30);
    if (expedition) {
      const goals = expeditionGoals();
      const target = goals[Math.min(2, expeditionStage)];
      ctx.fillStyle = themeMeta().accent;
      ctx.fillText(`STAGE ${Math.min(3, expeditionStage + 1)}/3   ·   ${Math.max(0, Math.ceil(target - highestY)).toLocaleString()} TO GO`, firstX, statY + 28, panelW - 30);
    }
  } else {
    const thirdX = secondX + bestW + 12;
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '700 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText('BOUNCES / MULTI', thirdX, panelY + 21, 145);
    ctx.fillStyle = '#f2fbff';
    ctx.font = '700 17px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`${bellCount} / x${multiplier}`, thirdX, panelY + 47, 145);
    if (expedition) {
      const fourthX = thirdX + 150;
      const goals = expeditionGoals();
      const target = goals[Math.min(2, expeditionStage)];
      const from = expeditionStage === 0 ? 0 : goals[expeditionStage - 1];
      const fraction = Math.max(0, Math.min(1, (highestY - from) / (target - from)));
      const trackW = Math.max(50, panelX + panelW - fourthX - 16);
      ctx.fillStyle = themeMeta().accent;
      ctx.font = '700 11px ui-rounded, system-ui, sans-serif';
      ctx.fillText(`STAGE ${Math.min(3, expeditionStage + 1)}/3 · ${expeditionGoalName()}`, fourthX, panelY + 21, trackW);
      ctx.fillStyle = '#eaf7ff';
      ctx.fillText(`${Math.max(0, Math.ceil(target - highestY)).toLocaleString()} TO GO · ${expeditionRetries} RETRIES`, fourthX, panelY + 47, trackW);
      ctx.fillStyle = 'rgba(255,255,255,.20)';
      ctx.beginPath(); ctx.roundRect(fourthX, panelY + 58, trackW, 6, 3); ctx.fill();
      ctx.fillStyle = themeMeta().accent;
      ctx.beginPath(); ctx.roundRect(fourthX, panelY + 58, Math.max(1, trackW * fraction), 6, 3); ctx.fill();
    }
  }
  if (messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, messageTimer * 1.8);
    ctx.textAlign = 'center';
    ctx.font = '800 24px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = themeMeta().accent;
    ctx.fillText(message, visibleWidth / 2, Math.max(170, height * 0.23), Math.max(230, visibleWidth - 32));
    ctx.globalAlpha = 1;
  }
  // The compact shortcut stays readable over every sky; the full guide is in Settings.
  const controlsX = visibleWidth - 18;
  const controlsY = compact ? panelY + panelH + 25 : 38;
  ctx.textAlign = 'right';
  ctx.font = '700 13px ui-rounded, system-ui, sans-serif';
  ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(2,12,22,.95)';
  ctx.shadowColor = 'rgba(1,9,18,.8)'; ctx.shadowBlur = 5;
  const controls = `${selectedMode.toUpperCase()} · N Settings`;
  ctx.strokeText(controls, controlsX, controlsY);
  ctx.fillStyle = '#fffdf5';
  ctx.fillText(controls, controlsX, controlsY);
  menuRect = { x: controlsX - Math.max(130, ctx.measureText(controls).width) - 5,
    y: controlsY - 17, w: Math.max(130, ctx.measureText(controls).width) + 5, h: 24 };
  ctx.restore();
}


function drawTitle(): void {
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
    ctx.beginPath(); ctx.roundRect(x, themeY, cardW, cardH, 17); ctx.fill();
    ctx.strokeStyle = sel ? THEME_META[theme].accent : 'rgba(255,255,255,.16)';
    ctx.lineWidth = sel ? 3 : 1.2; ctx.stroke();
    drawThemeIcon(theme, x + cardW / 2, themeY + (compact ? 22 : 30), (sel ? 0.96 : 0.86) * (compact ? 0.76 : 1));
    ctx.fillStyle = '#fff'; ctx.font = '700 17px ui-rounded, system-ui, sans-serif';
    ctx.fillText(THEME_META[theme].label, x + cardW / 2, themeY + (compact ? 52 : 68));
    ctx.font = '500 11px ui-rounded, system-ui, sans-serif'; ctx.fillStyle = 'rgba(235,246,250,.80)';
    ctx.fillText(`${THEME_META[theme].normal} • ${THEME_META[theme].airborne}`, x + cardW / 2, themeY + (compact ? 72 : 89), cardW - 12);
  });

  const modeY = themeY + cardH + (compact ? 8 : 16);
  const modeW = Math.min(205, (width - 52 - 20) / 3);
  const modeH = compact ? 48 : 62;
  modeCardRects = [];
  const modes: { mode: GameMode; title: string; desc: string }[] = [
    { mode: 'classic', title: 'CLASSIC', desc: 'Miss the chain and eventually land.' },
    { mode: 'zen', title: 'ZEN', desc: 'Land safely and launch again. Keep your score.' },
    { mode: 'expedition', title: 'EXPEDITION', desc: 'Reach a seasonal summit with checkpoints.' },
  ];
  modes.forEach((m, i) => {
    const x = cx - (modeW * 3 + 20) / 2 + i * (modeW + 10);
    modeCardRects.push({ mode: m.mode, rect: { x, y: modeY, w: modeW, h: modeH } });
    const sel = selectedMode === m.mode;
    ctx.fillStyle = sel ? seasonPanelFill(0.72) : 'rgba(5,19,32,.42)';
    ctx.beginPath(); ctx.roundRect(x, modeY, modeW, modeH, 16); ctx.fill();
    ctx.strokeStyle = sel ? meta.accent : 'rgba(255,255,255,.14)'; ctx.lineWidth = sel ? 2.5 : 1; ctx.stroke();
    ctx.fillStyle = sel ? meta.accent : '#f0f7fa'; ctx.font = '800 16px ui-rounded, system-ui, sans-serif';
    ctx.fillText(m.title, x + modeW / 2, modeY + (compact ? 19 : 23));
    ctx.fillStyle = 'rgba(231,244,250,.78)'; ctx.font = '500 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(m.desc, x + modeW / 2, modeY + (compact ? 37 : 44), modeW - 14);
  });

  const panelW = Math.min(720, width - 70);
  const panelH = compact ? 86 : 128;
  const panelX = cx - panelW / 2;
  const panelY = modeY + modeH + (compact ? 8 : 16);
  ctx.fillStyle = seasonPanelFill(0.56);
  ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = meta.accent; ctx.font = `800 ${compact ? 18 : 21}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(`${meta.label.toUpperCase()} • ${selectedMode.toUpperCase()}`, cx, panelY + (compact ? 23 : 30));
  ctx.fillStyle = 'rgba(231,244,250,.84)'; ctx.font = '500 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText(meta.subtitle, cx, panelY + (compact ? 44 : 52), panelW - 18);
  ctx.fillText(`${meta.normal} / ${meta.medium} / ${meta.strong} • ${meta.airborne} multiplier boost`, cx, panelY + (compact ? 66 : 75), panelW - 18);
  if (!compact) ctx.fillText('A/D or ←/→ changes season • W/S or ↑/↓ changes mode • L opens scores', cx, panelY + 98);

  const startY = panelY + panelH + (compact ? 8 : 14);
  titleStartRect = { x: cx - 136, y: startY, w: 272, h: compact ? 38 : 44 };
  ctx.fillStyle = meta.accent;
  ctx.beginPath(); ctx.roundRect(titleStartRect.x, titleStartRect.y, titleStartRect.w, titleStartRect.h, 16); ctx.fill();
  ctx.fillStyle = '#0c1a24'; ctx.font = '800 17px ui-rounded, system-ui, sans-serif';
  ctx.fillText(selectedArtLoading() ? 'LOADING ART' : 'START CLIMB', cx, startY + (compact ? 25 : 28));
  ctx.font = '600 12px ui-rounded, system-ui, sans-serif'; ctx.fillStyle = 'rgba(231,244,250,.74)';
  const bestLabel = `Best ${formatScore(bestForMode())} • Space / Enter / click to start`;
  ctx.fillText(formatScore(bestForMode()).length <= 24 && ctx.measureText(bestLabel).width <= width - 30
    ? bestLabel : 'Best on score board • Space / Enter / click to start', cx, startY + (compact ? 56 : 64));
  ctx.restore();
}


function drawThemeIcon(theme: ThemeName, x: number, y: number, scale: number): void {
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
    ctx.fillStyle = '#f2d072'; ctx.beginPath(); ctx.moveTo(-10,-14); ctx.quadraticCurveTo(-18,-2,-14,10); ctx.quadraticCurveTo(0,18,14,10); ctx.quadraticCurveTo(18,-2,10,-14); ctx.quadraticCurveTo(0,-19,-10,-14); ctx.fill(); ctx.fillStyle='#ffeec0'; ctx.beginPath(); ctx.arc(0,12,5,0,TAU); ctx.fill();
  } else if (theme === 'spring') {
    ctx.fillStyle='#77ccef'; ctx.beginPath(); ctx.moveTo(0,-18); ctx.quadraticCurveTo(12,-4,10,10); ctx.quadraticCurveTo(0,22,-10,10); ctx.quadraticCurveTo(-12,-4,0,-18); ctx.fill(); ctx.fillStyle='#ffd8ef'; for(let i=0;i<5;i++){ const a=i/5*TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a)*16, Math.sin(a)*16, 6, 3.5, a,0,TAU); ctx.fill(); } ctx.fillStyle='#ffef8e'; ctx.beginPath(); ctx.arc(0,0,4,0,TAU); ctx.fill();
  } else if (theme === 'summer') {
    for(let i=0;i<12;i++){ const a=i/12*TAU; ctx.fillStyle='#ffd34a'; ctx.beginPath(); ctx.ellipse(Math.cos(a)*13, Math.sin(a)*13, 7, 3, a,0,TAU); ctx.fill(); } ctx.fillStyle='#6d4518'; ctx.beginPath(); ctx.arc(0,0,10,0,TAU); ctx.fill();
  } else {
    ctx.fillStyle='#ec8b2f'; ctx.beginPath(); ctx.ellipse(0,4,18,15,0,0,TAU); ctx.fill(); ctx.strokeStyle='#9a5419'; ctx.lineWidth=2; for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*6,-7); ctx.quadraticCurveTo(i*3,4,i*6,15); ctx.stroke(); } ctx.fillStyle='#131313'; ctx.beginPath(); ctx.moveTo(-10,-2); ctx.quadraticCurveTo(-24,-10,-32,-2); ctx.quadraticCurveTo(-20,2,-10,-2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8,2); ctx.quadraticCurveTo(-22,12,-28,10); ctx.quadraticCurveTo(-18,6,-8,2); ctx.fill();
  }
  ctx.restore();
}

function drawReady(): void {
  ctx.save();
  ctx.fillStyle = 'rgba(1,8,14,.22)';
  ctx.fillRect(0, 0, width, height);
  const cx = width / 2;
  const compact = height < 680;
  const cy = height * (compact ? 0.38 : 0.27);
  const meta = themeMeta();
  const panelW = Math.min(690, width - 36);
  ctx.fillStyle = 'rgba(3,15,27,.78)';
  ctx.beginPath(); ctx.roundRect(cx - panelW / 2, cy - 43, panelW, selectedMode === 'classic' ? 190 : 212, 22); ctx.fill();
  ctx.strokeStyle = meta.accent; ctx.lineWidth = 1.5; ctx.stroke();
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
  if (selectedMode === 'zen') ctx.fillText('ZEN MODE: land safely, keep your score, then launch again.', cx, cy + 155, panelW - 26);
  if (selectedMode === 'expedition') ctx.fillText('EXPEDITION: reach the summit. Two base camps save your climb.', cx, cy + 155, panelW - 26);
  ctx.restore();
}

function drawZenGrounded(): void {
  const panelW = Math.min(520, width - 40);
  const panelY = Math.max(125, height * 0.30);
  ctx.save();
  ctx.fillStyle = 'rgba(3,15,27,.82)';
  ctx.beginPath(); ctx.roundRect(width / 2 - panelW / 2, panelY, panelW, 100, 18); ctx.fill();
  ctx.strokeStyle = themeMeta().accent; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4fbff'; ctx.font = '800 25px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`${CHARACTER_META[selectedCharacter].name.toUpperCase()} LANDED`, width / 2, panelY + 37, panelW - 26);
  ctx.fillStyle = themeMeta().accent; ctx.font = '600 14px ui-rounded, system-ui, sans-serif';
  ctx.fillText('Score kept. Click, Space, or Enter to launch again.', width / 2, panelY + 70, panelW - 26);
  ctx.restore();
}

function drawExpeditionCheckpoint(): void {
  const w = Math.min(510, width - 36);
  const x = width / 2 - w / 2;
  const y = Math.max(135, height * 0.25);
  ctx.save();
  ctx.fillStyle = 'rgba(3,16,28,.88)';
  ctx.beginPath(); ctx.roundRect(x, y, w, 124, 18); ctx.fill();
  ctx.strokeStyle = themeMeta().accent; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#f5fbff';
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

function drawExpeditionComplete(): void {
  const endingAge = Math.max(0, elapsed - expeditionEndingAt);
  const reveal = Math.min(1, endingAge / 0.7);
  const w = Math.min(600, width - 40);
  const h = 250;
  const x = width / 2 - w / 2;
  const y = height / 2 - h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(1,8,16,.65)'; ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = reveal;
  ctx.fillStyle = 'rgba(5,21,35,.93)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill();
  ctx.strokeStyle = themeMeta().accent; ctx.lineWidth = 2; ctx.stroke();
  const glow = ctx.createRadialGradient(width / 2, y + 70, 5, width / 2, y + 70, 120);
  glow.addColorStop(0, themeMeta().accent + '55'); glow.addColorStop(1, themeMeta().accent + '00');
  ctx.fillStyle = glow; ctx.fillRect(x, y, w, 150);
  ctx.textAlign = 'center'; ctx.fillStyle = '#f4fbff';
  ctx.font = '800 30px ui-rounded, system-ui, sans-serif';
  ctx.fillText('EXPEDITION COMPLETE', width / 2, y + 50, w - 26);
  const finale: Record<ThemeName, string> = {
    winter: `${CHARACTER_META[selectedCharacter].name} reaches the Winter Crown beyond the aurora.`,
    spring: `${CHARACTER_META[selectedCharacter].name} reaches the Spring Crown beyond the blossom sky.`,
    summer: `${CHARACTER_META[selectedCharacter].name} reaches the Summer Crown beyond the sapphire clouds.`,
    autumn: `${CHARACTER_META[selectedCharacter].name} reaches the Autumn Crown beyond the copper stars.`,
    'starlight-eve': `${CHARACTER_META[selectedCharacter].name} reaches the Starlight Crown above the harbor.`,
    'great-egg-hunt': `${CHARACTER_META[selectedCharacter].name} reaches the Conservatory Crown beyond the clouds.`,
    'fireworks-fair': `${CHARACTER_META[selectedCharacter].name} reaches the Coastal Crown above the fair.`,
    'moonlit-masquerade': `${CHARACTER_META[selectedCharacter].name} reaches the Moonlit Crown beyond the oak.`,
    'great-yarn-tangle': `${CHARACTER_META[selectedCharacter].name} reaches the Starry Loom.`,
    'turtleback-world': `${CHARACTER_META[selectedCharacter].name} sees the great turtle and the horizon.`,
    'cat-lockup-expedition': `${CHARACTER_META[selectedCharacter].name} reaches the Freedom Gate.`,
    'moonlit-aquarium': `${CHARACTER_META[selectedCharacter].name} reaches the moonlit aquarium rim.`,
  };
  ctx.fillStyle = themeMeta().accent;
  ctx.font = '600 15px ui-rounded, system-ui, sans-serif';
  ctx.fillText(finale[selectedTheme], width / 2, y + 81, w - 28);
  ctx.fillStyle = '#f4fbff';
  const scoreEnd = drawDecimal(score, width / 2, y + 121, w - 40,
    formatScore(score).length > 48 ? '700 16px ui-rounded, system-ui, sans-serif' : '800 27px ui-rounded, system-ui, sans-serif',
    formatScore(score).length > 48 ? 20 : 31, 'center');
  ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`${bellCount} objects  ·  x${multiplier} final multiplier  ·  ${expeditionRetries} retries`, width / 2, scoreEnd + 10, w - 28);
  ctx.fillStyle = themeMeta().accent;
  ctx.font = '700 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText('SPACE / ENTER / CLICK TO TRY AGAIN  ·  L SCORES', width / 2, y + h - 23, w - 24);
  ctx.globalAlpha = 1;
  menuRect = { x: width - 101, y: 18, w: 83, h: 36 };
  ctx.fillStyle = '#f3fbff'; ctx.beginPath(); ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 10); ctx.fill();
  ctx.fillStyle = '#081c2c'; ctx.font = '800 12px ui-rounded, system-ui, sans-serif';
  ctx.fillText('MENU · Esc', menuRect.x + menuRect.w / 2, menuRect.y + 23);
  ctx.restore();
}


function drawPaused(): void {
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

function drawGameOver(): void {
  ctx.save();
  ctx.fillStyle = 'rgba(1,8,14,.58)';
  ctx.fillRect(0, 0, width, height);
  menuRect = { x: width - 101, y: 18, w: 83, h: 36 };
  ctx.fillStyle = '#f3fbff';
  ctx.beginPath(); ctx.roundRect(menuRect.x, menuRect.y, menuRect.w, menuRect.h, 10); ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#081c2c';
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
  let nextY = drawDecimal(score, cx, cy - 57, width - 64,
    longScore ? '700 17px ui-rounded, system-ui, sans-serif' : '800 30px ui-rounded, system-ui, sans-serif',
    longScore ? 21 : 34, 'center');
  ctx.fillStyle = 'rgba(225,244,251,.82)';
  ctx.font = '600 13px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`${bellCount} objects  •  ${mothCount} ${meta.airborne.toLowerCase()}${mothCount === 1 ? '' : 's'}  •  multiplier x${multiplier}`, cx, nextY + 3);
  ctx.fillText(`${selectedMode.toUpperCase()} BEST${bestIsApproximate() ? ' · APPROX.' : ''}`, cx, nextY + 24);
  ctx.fillStyle = '#f4fbff';
  nextY = drawDecimal(bestForMode(), cx, nextY + 43, width - 64,
    longScore ? '600 13px ui-rounded, system-ui, sans-serif' : '600 15px ui-rounded, system-ui, sans-serif',
    longScore ? 16 : 18, 'center');
  ctx.font = '700 16px ui-rounded, system-ui, sans-serif';
  ctx.fillStyle = meta.accent;
  ctx.fillText('SPACE / ENTER / CLICK TO RETRY  ·  ESC FOR SEASONS', cx, nextY + 20, width - 40);
  ctx.restore();
}


function drawScoreboard(): void {
  ctx.save();
  const w = Math.min(820, width - 32);
  const h = Math.min(680, height - 24);
  const x = width / 2 - w / 2;
  const y = height / 2 - h / 2;
  ctx.fillStyle = 'rgba(3,10,18,.98)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill();
  ctx.strokeStyle = themeMeta().accent; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#f5fbff'; ctx.font = '800 23px ui-rounded, system-ui, sans-serif';
  ctx.fillText('SCORE BOARD', x + 20, y + 35);
  scoreboardModeRects = [];
  const tabWidth = w < 650 ? 86 : 104;
  for (const [i, mode] of GAME_MODES.entries()) {
    const rect = { x: x + w - 20 - (tabWidth * 3 + 12) + i * (tabWidth + 6), y: y + 16, w: tabWidth, h: 29 };
    scoreboardModeRects.push({ mode, rect });
    ctx.fillStyle = scoreboardMode === mode ? themeMeta().accent : 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
    ctx.fillStyle = scoreboardMode === mode ? '#071722' : '#eaf5fb';
    ctx.font = '700 12px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(mode.toUpperCase(), rect.x + rect.w / 2, rect.y + 20, rect.w - 8); ctx.textAlign = 'left';
  }
  ctx.fillStyle = 'rgba(225,240,248,.75)';
  ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`${scoreboardMode.toUpperCase()} STANDARD BEST${bestIsApproximate(scoreboardMode) ? ' · APPROXIMATE LEGACY VALUE' : ''}`, x + 22, y + 67);
  ctx.fillStyle = '#f4fbff';
  let contentY = drawDecimal(bestForMode(scoreboardMode), x + 22, y + 88, w - 44,
    '700 17px ui-rounded, system-ui, sans-serif', 20);
  if (scoreboardMode === selectedMode) {
    ctx.fillStyle = 'rgba(225,240,248,.75)';
    ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`CURRENT · ${selectedTheme.toUpperCase()} · ${bellCount} BOUNCES · x${multiplier}`, x + 22, contentY + 8);
    ctx.fillStyle = '#f4fbff';
    contentY = drawDecimal(score, x + 22, contentY + 29, w - 44,
      '600 15px ui-rounded, system-ui, sans-serif', 18);
  }
  if (legacyBest && legacyBest.score > 0n) {
    ctx.fillStyle = 'rgba(225,240,248,.68)';
    ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`LEGACY BEST · MODE UNKNOWN${legacyBest.approximate ? ' · APPROXIMATE' : ''}`, x + 22, contentY + 5);
    ctx.fillStyle = '#f4fbff';
    contentY = drawDecimal(legacyBest.score, x + 22, contentY + 23, w - 44,
      '600 13px ui-rounded, system-ui, sans-serif', 16);
  }
  const listTop = contentY + 20;
  const listHeight = Math.max(70, y + h - 58 - listTop);
  const rows = scoreHistory.filter(r => r.mode === scoreboardMode)
    .sort((a, b) => a.score === b.score ? b.at - a.at : a.score > b.score ? -1 : 1);
  const rowHeight = (r: ScoreRecord) => 49 + decimalLines(r.score, '700 17px ui-rounded, system-ui, sans-serif', w - 66).length * 20;
  const pages: { record: ScoreRecord; rank: number }[][] = [[]];
  let used = 0;
  rows.forEach((record, rank) => {
    const rh = rowHeight(record);
    if (used + rh > listHeight && pages.at(-1)!.length) { pages.push([]); used = 0; }
    pages.at(-1)!.push({ record, rank: rank + 1 });
    used += rh;
  });
  scoreboardPageCount = pages.length;
  scoreboardPage = Math.max(0, Math.min(scoreboardPage, pages.length - 1));
  let rowY = listTop;
  for (const { record, rank } of pages[scoreboardPage]) {
    const rh = rowHeight(record);
    ctx.fillStyle = rank === 1 ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,.06)';
    ctx.beginPath(); ctx.roundRect(x + 18, rowY, w - 36, rh - 5, 10); ctx.fill();
    ctx.fillStyle = themeMeta().accent;
    ctx.font = '700 12px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`#${rank}  ${record.equipped ? 'EQUIPPED' : 'STANDARD'}  ·  ${record.theme.toUpperCase()}  ·  ${record.bounces} BOUNCES  ·  x${record.multiplier}${record.retries !== undefined ? `  ·  ${record.retries} RETRIES` : ''}${record.approximate ? '  ·  LEGACY APPROX.' : ''}`, x + 30, rowY + 19, w - 56);
    ctx.fillStyle = '#f5fbff';
    drawDecimal(record.score, x + 30, rowY + 43, w - 66,
      '700 17px ui-rounded, system-ui, sans-serif', 20);
    rowY += rh;
  }
  if (!rows.length) {
    ctx.fillStyle = 'rgba(225,240,248,.72)'; ctx.font = '500 13px ui-rounded, system-ui, sans-serif';
    ctx.fillText('Finish a run to add a score for this mode.', x + 24, listTop + 27);
  }
  scoreboardPrevRect = { x: x + 18, y: y + h - 43, w: 55, h: 29 };
  scoreboardNextRect = { x: x + w - 73, y: y + h - 43, w: 55, h: 29 };
  for (const [label, rect] of [['◀', scoreboardPrevRect], ['▶', scoreboardNextRect]] as [string, Rect][]) {
    ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
    ctx.fillStyle = '#f5fbff'; ctx.font = '700 16px ui-rounded, system-ui, sans-serif'; ctx.fillText(label, rect.x + 20, rect.y + 21);
  }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(225,240,248,.8)';
  ctx.font = '600 11px ui-rounded, system-ui, sans-serif';
  ctx.fillText(`PAGE ${scoreboardPage + 1} / ${scoreboardPageCount}  ·  L CLOSE  ·  ↑/↓ PAGE  ·  ←/→ MODE`, width / 2, y + h - 23, w - 155);
  ctx.restore();
}
