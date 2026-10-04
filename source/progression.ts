// Progression is stored independently from the legacy scoreboard. The save is
// deliberately small and versioned so future releases can migrate it safely.
type GearId = 'windstep' | 'softstep' | 'compass' | 'echo';
type EnchantmentId = 'bellwake' | 'softfall';
type SupplyId = 'catBed' | 'campProvision' | 'routeReroll';
type RewardId = GearId | EnchantmentId | SupplyId | 'fish';
type GearSlot = 'movement' | 'utility';
type ProgressSave = {
  version: 1; fish: number; owned: RewardId[];
  movement: GearId | null; utility: GearId | null;
  enchantment: EnchantmentId | null;
  supplies: Record<SupplyId, number>;
};
type MysteryCrate = { x: number; y: number; born: number; opened: boolean; offered: RewardId[] };

const PROGRESS_KEY = 'cats-changing-sky-progression-v1';
const PROGRESSION_ITEMS: { id: RewardId; name: string; cost: number; icon: string; slot?: GearSlot | 'enchantment'; description: string }[] = [
  { id: 'windstep', name: 'Windstep Boots', cost: 12, icon: 'windstep-boots.webp', slot: 'movement', description: 'Steer 8% faster in the air.' },
  { id: 'softstep', name: 'Softstep Boots', cost: 12, icon: 'softstep-boots.webp', slot: 'movement', description: 'Hold Shift to brake precisely in the air.' },
  { id: 'compass', name: 'Aurora Compass', cost: 10, icon: 'aurora-compass.webp', slot: 'utility', description: 'See the next airborne visitor sooner.' },
  { id: 'echo', name: 'Echo Charm', cost: 10, icon: 'echo-charm.webp', slot: 'utility', description: 'The first long fall per launch grants a brief steering cue.' },
  { id: 'bellwake', name: 'Bellwake', cost: 16, icon: 'bellwake.webp', slot: 'enchantment', description: 'First target contact after launch gains 5% bounce.' },
  { id: 'softfall', name: 'Softfall', cost: 16, icon: 'softfall.webp', slot: 'enchantment', description: 'Slow the first second of a long fall.' },
  { id: 'catBed', name: 'Cat Bed', cost: 8, icon: 'cat-bed.webp', description: 'One Classic fall rescue. Returns near your last height at x1.' },
  { id: 'campProvision', name: 'Camp Provision', cost: 6, icon: 'camp-provision.webp', description: 'One stronger opening launch from an Expedition camp.' },
  { id: 'routeReroll', name: 'Route Reroll', cost: 5, icon: 'route-reroll.webp', description: 'Regenerate the next path at an Expedition camp.' },
];
const GEAR_IDS: GearId[] = ['windstep', 'softstep', 'compass', 'echo'];
const ENCHANTMENT_IDS: EnchantmentId[] = ['bellwake', 'softfall'];
const SUPPLY_IDS: SupplyId[] = ['catBed', 'campProvision', 'routeReroll'];

function freshProgress(): ProgressSave {
  return { version: 1, fish: 0, owned: [], movement: null, utility: null,
    enchantment: null, supplies: { catBed: 0, campProvision: 0, routeReroll: 0 } };
}
function loadProgress(): ProgressSave {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!raw || raw.version !== 1) return freshProgress();
    const owned = Array.isArray(raw.owned) ? raw.owned.filter((id: unknown) =>
      GEAR_IDS.includes(id as GearId) || ENCHANTMENT_IDS.includes(id as EnchantmentId)) : [];
    const supplies = Object.fromEntries(SUPPLY_IDS.map(id => [id,
      Number.isSafeInteger(raw.supplies?.[id]) ? Math.max(0, Math.min(99, raw.supplies[id])) : 0])) as Record<SupplyId, number>;
    return { version: 1, fish: Number.isSafeInteger(raw.fish) ? Math.max(0, raw.fish) : 0,
      owned, movement: owned.includes(raw.movement) ? raw.movement : null,
      utility: owned.includes(raw.utility) ? raw.utility : null,
      enchantment: owned.includes(raw.enchantment) ? raw.enchantment : null, supplies };
  } catch { return freshProgress(); }
}
let progress = loadProgress();
function saveProgress(): void {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }
  catch (error) { console.warn('Progress could not be saved.', error); }
  refreshProgressUi();
}
let runHighestBand = 0;
let runHighBand = 0;
let runBirdRewards = 0;
let runCampRewards = 0;
let runEquipped = false;
let runBedUsed = false;
let runFirstBell = true;
let runEchoUsed = false;
let runSoftfallTime = 0;
let runEchoTime = 0;
let runBedFxTime = 0;
let runCampBoost = false;
let runCrates: MysteryCrate[] = [];
let nextCrateOrdinal = 12;

function startProgressRun(): void {
  runHighestBand = 0; runHighBand = 0; runBirdRewards = 0; runCampRewards = 0;
  runEquipped = !!(progress.movement || progress.utility || progress.enchantment);
  runBedUsed = false; runFirstBell = true; runEchoUsed = false; runSoftfallTime = 0;
  runEchoTime = 0; runBedFxTime = 0;
  runCampBoost = false; runCrates = []; nextCrateOrdinal = 12;
}
function awardFish(amount: number, reason: string): void {
  if (amount <= 0) return;
  progress.fish = Math.min(Number.MAX_SAFE_INTEGER, progress.fish + amount);
  saveProgress();
  message = `+${amount} FISH · ${reason.toUpperCase()}`;
  messageTimer = 1.6;
}
function updateAltitudeRewards(): void {
  const regular = Math.min(42, Math.floor(Math.max(0, highestY) / 1000));
  const high = Math.floor(Math.max(0, highestY - 42000) / 2500);
  let earned = 0;
  if (regular > runHighestBand) { earned += regular - runHighestBand; runHighestBand = regular; }
  if (high > runHighBand) { earned += high - runHighBand; runHighBand = high; }
  if (earned) awardFish(earned, 'new height');
}
function rewardBirdCatch(): void {
  if (runBirdRewards < 3) { runBirdRewards++; awardFish(1, 'airborne catch'); }
}
function rewardExpeditionStage(stage: number): void {
  if (stage <= runCampRewards) return;
  runCampRewards = stage;
  awardFish(stage === 3 ? 8 : 2, stage === 3 ? 'summit' : 'base camp');
}
function beginLaunchProgress(): void {
  runFirstBell = true; runEchoUsed = false; runSoftfallTime = 0; runEchoTime = 0;
  if (selectedMode === 'expedition' && expeditionCheckpointY > 0 && progress.supplies.campProvision > 0) {
    progress.supplies.campProvision--;
    runCampBoost = true; runEquipped = true; saveProgress();
  } else runCampBoost = false;
}
function purchaseItem(id: RewardId): boolean {
  const item = PROGRESSION_ITEMS.find(entry => entry.id === id);
  if (!item || id === 'fish' || progress.fish < item.cost) return false;
  if (item.slot && progress.owned.includes(id)) return false;
  if (SUPPLY_IDS.includes(id as SupplyId) && progress.supplies[id as SupplyId] >= 9) return false;
  progress.fish -= item.cost;
  if (item.slot) {
    progress.owned.push(id);
    if (item.slot === 'movement') progress.movement = id as GearId;
    else if (item.slot === 'utility') progress.utility = id as GearId;
    else progress.enchantment = id as EnchantmentId;
  } else progress.supplies[id as SupplyId]++;
  saveProgress();
  return true;
}
function equipItem(id: RewardId): void {
  const item = PROGRESSION_ITEMS.find(entry => entry.id === id);
  if (!item?.slot || !progress.owned.includes(id)) return;
  if (item.slot === 'movement') progress.movement = progress.movement === id ? null : id as GearId;
  else if (item.slot === 'utility') progress.utility = progress.utility === id ? null : id as GearId;
  else progress.enchantment = progress.enchantment === id ? null : id as EnchantmentId;
  saveProgress();
}
function grantCrateReward(id: RewardId): void {
  if (id === 'fish') { awardFish(4, 'crate'); return; }
  if (SUPPLY_IDS.includes(id as SupplyId)) {
    progress.supplies[id as SupplyId] = Math.min(9, progress.supplies[id as SupplyId] + 1);
    saveProgress();
  } else if (!progress.owned.includes(id)) {
    progress.owned.push(id); saveProgress();
  } else { awardFish(4, 'duplicate'); return; }
  message = `${PROGRESSION_ITEMS.find(item => item.id === id)?.name.toUpperCase()} FOUND`;
  messageTimer = 2;
}
function maybePlaceCrate(previous: Bell, next: Bell): void {
  if (next.id < nextCrateOrdinal) return;
  nextCrateOrdinal += Math.floor(rand(13, 20));
  const candidates: RewardId[] = [...GEAR_IDS, ...ENCHANTMENT_IDS, ...SUPPLY_IDS, 'fish'];
  const offered = [0, 1, 2, 3].map(() => candidates[Math.floor(rand(0, candidates.length))]);
  runCrates.push({ x: Math.max(75, Math.min(width - 75, previous.x + rand(-65, 65))),
    y: previous.y - fieldDrop + (next.y - previous.y) * rand(0.45, 0.65), born: elapsed, opened: false, offered });
}
function crateOffer(crate: MysteryCrate): RewardId {
  return crate.offered[crateOfferIndex(crate)];
}
function crateOfferIndex(crate: MysteryCrate): number {
  const age = Math.max(0, elapsed - crate.born);
  // The spin period shortens smoothly from 2 seconds to 0.32 seconds.
  const ramp = Math.min(age, 35);
  const turns = ramp / 2 + ramp * ramp / 80 + Math.max(0, age - 35) * 1.375;
  return Math.floor(turns) % crate.offered.length;
}
function updateCrates(): void {
  for (const crate of runCrates) {
    if (crate.opened) continue;
    const y = crate.y;
    if (Math.abs(y - cat.y) > 80) continue;
    if (!sweptEllipseContact(cat.prevX, cat.prevY + cat.h * 0.45,
      cat.x, cat.y + cat.h * 0.45, crate.x, y, 59, 55)) continue;
    crate.opened = true;
    const offered = crateOffer(crate);
    grantCrateReward(offered);
    addSparkBurst(crate.x, y, 18, themeMeta().accent);
  }
  const missed = runCrates.filter(crate => !crate.opened && crate.y < cameraY - 400);
  if (missed.length) awardFish(missed.length * 2, 'missed crate');
  runCrates = runCrates.filter(crate => !crate.opened && crate.y > cameraY - 400);
}

const progressionImages = {} as Record<string, HTMLImageElement>;
const themedBedArt: Partial<Record<ThemeName, HTMLCanvasElement>> = {};
for (const item of [...PROGRESSION_ITEMS, { id: 'fish', icon: 'fish.webp' }, { id: 'crate', icon: 'crate.webp' }]) {
  const image = new Image(); image.src = `assets/progression/${item.icon}`;
  progressionImages[item.id] = image;
}
function drawCrates(): void {
  for (const crate of runCrates) {
    const y = worldToScreenY(crate.y);
    if (crate.opened || y < -90 || y > height + 90) continue;
    const image = progressionImages.crate;
    if (!image.complete || !image.naturalWidth) continue;
    ctx.save();
    ctx.shadowColor = themeMeta().accent; ctx.shadowBlur = 17;
    ctx.drawImage(image, crate.x - 39, y - 39, 78, 78);
    const offer = crateOffer(crate);
    const icon = progressionImages[offer];
    if (icon?.complete && icon.naturalWidth) {
      ctx.globalAlpha = 0.92;
      ctx.drawImage(icon, crate.x - 17, y - 9, 28, 28);
    }
    const side = progressionImages[crate.offered[(crateOfferIndex(crate) + 1) % crate.offered.length]];
    if (side?.complete && side.naturalWidth) {
      ctx.globalAlpha = 0.70;
      ctx.drawImage(side, crate.x + 21, y - 1, 13, 19);
    }
    ctx.restore();
  }
}
function tryCatBedRescue(): boolean {
  if (selectedMode !== 'classic' || runBedUsed || progress.supplies.catBed < 1 || highestY < 350) return false;
  progress.supplies.catBed--; runBedUsed = true; runEquipped = true; saveProgress();
  multiplier = 1; bounceChain = 0;
  const foothold = [...bells].reverse().find(bell => bell.touched && bellWorldY(bell) <= highestY);
  if (foothold) cat.x = foothold.x;
  cat.prevX = cat.x; cat.vx = 0;
  cat.y = foothold ? Math.max(250, bellTop(foothold) + 75) : Math.max(250, highestY - 360);
  cat.prevY = cat.y;
  cat.vy = 1080; cameraY = Math.max(0, cat.y - height * 0.43);
  state = 'playing'; descentPeakY = cat.y;
  runBedFxTime = 2.2;
  message = `${THEME_META[selectedTheme].label.toUpperCase()} CAT BED RESCUE`;
  messageTimer = 2.3;
  addSeasonBurst(cat.x, cat.y, 2);
  return true;
}
function updateProgressEffects(dt: number): void {
  runEchoTime = Math.max(0, runEchoTime - dt);
  runBedFxTime = Math.max(0, runBedFxTime - dt);
  if (runSoftfallTime > 0) runSoftfallTime = Math.max(0, runSoftfallTime - dt);
}
function drawProgressEffects(): void {
  const x = cat.x, y = worldToScreenY(cat.y);
  if (runBedFxTime > 0 && progressionImages.catBed?.naturalWidth) {
    let bed = themedBedArt[selectedTheme];
    if (!bed) {
      bed = document.createElement('canvas'); bed.width = bed.height = 256;
      const paint = bed.getContext('2d')!;
      paint.drawImage(progressionImages.catBed, 0, 0, 256, 256);
      paint.globalCompositeOperation = 'source-atop';
      paint.globalAlpha = selectedTheme === 'winter' ? 0.22 : selectedTheme === 'spring' ? 0.18 : 0.16;
      paint.fillStyle = themeMeta().accent; paint.fillRect(0, 0, 256, 256);
      themedBedArt[selectedTheme] = bed;
    }
    ctx.save(); ctx.globalAlpha = Math.min(0.8, runBedFxTime / 1.5);
    ctx.shadowColor = themeMeta().accent; ctx.shadowBlur = 23;
    ctx.drawImage(bed, x - 54, y + 30, 108, 68);
    ctx.restore();
  }
  if (progress.movement || progress.utility || progress.enchantment || runEchoTime > 0) {
    ctx.save();
    ctx.strokeStyle = themeMeta().accent;
    ctx.globalAlpha = runEchoTime > 0 ? 0.65 : 0.19;
    ctx.lineWidth = runEchoTime > 0 ? 3 : 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, 45 + Math.sin(elapsed * 5) * 3, 53, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  if (progress.movement === 'windstep' && Math.abs(cat.vx) > 100) {
    ctx.save(); ctx.strokeStyle = themeMeta().accent; ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2; ctx.beginPath();
    const tail = cat.vx > 0 ? -1 : 1;
    for (let i = 0; i < 3; i++) { ctx.moveTo(x + tail * 22, y + 12 + i * 8); ctx.lineTo(x + tail * (47 + i * 7), y + 12 + i * 8); }
    ctx.stroke(); ctx.restore();
  }
  if (progress.movement === 'softstep' && (keys.has('ShiftLeft') || keys.has('ShiftRight'))) {
    ctx.save(); ctx.fillStyle = themeMeta().accent; ctx.globalAlpha = 0.38;
    ctx.beginPath(); ctx.ellipse(x, y + 45, 37, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (runSoftfallTime > 0) {
    ctx.save(); ctx.strokeStyle = '#e9d8ff'; ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 56, 0.2, 2.9); ctx.stroke(); ctx.restore();
  }
  if (progress.utility === 'compass') {
    const next = moths.find(m => m.alive && mothWorldY(m) > cat.y - 200 && mothWorldY(m) < cat.y + height * 1.5);
    if (next) {
      ctx.save(); ctx.font = '800 16px ui-rounded, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#061927';
      const cue = next.x < cat.x ? '◀' : '▶';
      ctx.strokeText(cue, x, y - 67); ctx.fillStyle = themeMeta().accent; ctx.fillText(cue, x, y - 67);
      ctx.restore();
    }
  }
}
function rerollCampRoute(): boolean {
  if (state !== 'expeditionCheckpoint' || progress.supplies.routeReroll < 1) return false;
  progress.supplies.routeReroll--; runEquipped = true; saveProgress();
  bells = []; moths = []; runCrates = [];
  generateInitialPath((bellCount || 1) + 1, expeditionCheckpointY + 205);
  message = 'NEW ROUTE'; messageTimer = 1.5;
  return true;
}

let lastInventorySignature = '';
function refreshProgressUi(): void {
  const balance = document.querySelector<HTMLElement>('#fish-balance');
  if (balance) balance.textContent = progress.fish.toLocaleString();
  const shopBalance = document.querySelector<HTMLElement>('#shop-balance');
  if (shopBalance) shopBalance.textContent = progress.fish.toLocaleString();
  const shop = document.querySelector<HTMLElement>('#shop-items');
  if (shop && !document.querySelector<HTMLElement>('#shop-overlay')?.hidden) renderShop();
  const inventory = document.querySelector<HTMLElement>('#powerup-bar');
  const inventorySignature = `${selectedTheme}|${progress.owned.join(',')}|${progress.movement}|${progress.utility}|${progress.enchantment}|${SUPPLY_IDS.map(id => progress.supplies[id]).join(',')}`;
  if (inventory && inventorySignature !== lastInventorySignature) {
    lastInventorySignature = inventorySignature;
    inventory.replaceChildren();
    inventory.style.setProperty('--accent', themeMeta().accent);
    for (const item of PROGRESSION_ITEMS) {
      const id = item.id;
      const amount = item.slot ? Number(progress.owned.includes(id)) : progress.supplies[id as SupplyId];
      const active = progress.movement === id || progress.utility === id || progress.enchantment === id;
      const cell = document.createElement('div'); cell.className = `powerup-cell${amount ? ' owned' : ''}${active ? ' active' : ''}`;
      cell.title = `${item.name}: ${amount}${active ? ' · equipped' : ''}`;
      const icon = document.createElement('img'); icon.src = `assets/progression/${item.icon}`; icon.alt = item.name;
      const count = document.createElement('span'); count.textContent = `${amount}`;
      cell.append(icon, count); inventory.append(cell);
    }
  }
  const reroll = document.querySelector<HTMLButtonElement>('#reroll-route');
  if (reroll) reroll.disabled = state !== 'expeditionCheckpoint' || progress.supplies.routeReroll === 0;
}
function renderShop(): void {
  const list = document.querySelector<HTMLElement>('#shop-items');
  if (!list) return;
  list.replaceChildren();
  for (const item of PROGRESSION_ITEMS) {
    const owned = item.slot ? progress.owned.includes(item.id) : false;
    const equipped = item.slot === 'movement' ? progress.movement === item.id
      : item.slot === 'utility' ? progress.utility === item.id
        : item.slot === 'enchantment' ? progress.enchantment === item.id : false;
    const card = document.createElement('div'); card.className = 'shop-card';
    const icon = document.createElement('img'); icon.src = `assets/progression/${item.icon}`; icon.alt = '';
    const detail = document.createElement('div');
    const heading = document.createElement('strong'); heading.textContent = item.name;
    const desc = document.createElement('p'); desc.textContent = item.description;
    detail.append(heading, desc);
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = equipped ? 'Unequip' : owned ? 'Equip' : `Buy · ${item.cost} fish`;
    button.disabled = !owned && (progress.fish < item.cost ||
      (!item.slot && progress.supplies[item.id as SupplyId] >= 9));
    button.addEventListener('click', () => { if (owned) equipItem(item.id); else purchaseItem(item.id); });
    card.append(icon, detail, button); list.append(card);
  }
}
function closeProgressDialogs(): void {
  for (const id of ['shop-overlay', 'settings-overlay']) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.hidden = true;
  }
  if (typeof paused !== 'undefined' && state !== 'title') paused = pauseBeforeDialog;
  syncMasterAudio();
  canvas.focus();
}
function openProgressDialog(id: 'shop-overlay' | 'settings-overlay'): void {
  const wasPaused = paused;
  closeProgressDialogs();
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.hidden = false;
  refreshProgressUi();
  if (state !== 'title') { pauseBeforeDialog = wasPaused; paused = true; }
  syncMasterAudio();
  if (id === 'shop-overlay') renderShop();
  overlay.querySelector<HTMLButtonElement>('button')?.focus();
}
let pauseBeforeDialog = false;
function exportGameData(): void {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('zima-skybells-') || key === PROGRESS_KEY)) data[key] = localStorage.getItem(key) || '';
  }
  const blob = new Blob([JSON.stringify({ game: 'Cats of the Changing Sky', exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url;
  link.download = `cats-of-the-changing-sky-save-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initProgressionUi(): void {
  document.getElementById('open-shop')?.addEventListener('click', () => openProgressDialog('shop-overlay'));
  document.getElementById('settings-button')?.addEventListener('click', () => openProgressDialog('settings-overlay'));
  document.getElementById('close-shop')?.addEventListener('click', closeProgressDialogs);
  document.getElementById('close-settings')?.addEventListener('click', closeProgressDialogs);
  document.getElementById('export-save')?.addEventListener('click', exportGameData);
  document.getElementById('reroll-route')?.addEventListener('click', () => rerollCampRoute());
  document.addEventListener('keydown', event => {
    const dialog = ['shop-overlay', 'settings-overlay']
      .map(id => document.getElementById(id)).find(overlay => overlay && !overlay.hidden);
    if (!dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeProgressDialogs(); }
    if (event.key === 'Tab') {
      const controls = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }, true);
  refreshProgressUi();
}
