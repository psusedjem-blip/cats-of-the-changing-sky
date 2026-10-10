// Progression is stored independently from the legacy scoreboard. The save is
// deliberately small and versioned so future releases can migrate it safely.
type GearId = 'windstep' | 'softstep' | 'compass' | 'echo';
type EnchantmentId = 'bellwake' | 'softfall';
type SupplyId = 'catBed' | 'campProvision' | 'routeReroll';
type RewardId = GearId | EnchantmentId | SupplyId | 'fish';
type GearSlot = 'movement' | 'utility';
type ProgressSave = {
  version: 3; fish: number; owned: RewardId[]; unlockedFestivals: FestivalName[]; unlockedKittens: CharacterId[];
  movement: GearId | null; utility: GearId | null;
  enchantment: EnchantmentId | null;
  supplies: Record<SupplyId, number>;
};
type MysteryCrate = { x: number; y: number; born: number; opened: boolean; offered: RewardId[] };

const PROGRESS_KEY = 'cats-changing-sky-progression-v1';
const TEST_PROGRESS_BACKUP_KEY = 'cats-changing-sky-test-purchase-backup';
const PROGRESSION_ITEMS: { id: RewardId; name: string; cost: number; icon: string; slot?: GearSlot | 'enchantment'; description: string }[] = [
  { id: 'windstep', name: 'Windstep Boots', cost: 12, icon: 'windstep-boots.webp', slot: 'movement', description: 'Steer 8% faster in the air.' },
  { id: 'softstep', name: 'Softstep Boots', cost: 12, icon: 'softstep-boots.webp', slot: 'movement', description: 'Hold Shift to brake precisely in the air.' },
  { id: 'compass', name: 'Aurora Compass', cost: 10, icon: 'aurora-compass.webp', slot: 'utility', description: 'See the next airborne visitor sooner.' },
  { id: 'echo', name: 'Echo Charm', cost: 10, icon: 'echo-charm.webp', slot: 'utility', description: 'The first long fall per launch grants a brief steering cue.' },
  { id: 'bellwake', name: 'Bellwake', cost: 16, icon: 'bellwake.webp', slot: 'enchantment', description: 'First target contact after launch gains 5% bounce.' },
  { id: 'softfall', name: 'Softfall', cost: 16, icon: 'softfall.webp', slot: 'enchantment', description: 'Slow the first second of a long fall.' },
  { id: 'catBed', name: 'Cat Bed', cost: 8, icon: 'cat-bed.webp', description: 'Press 7 during a Classic run to arm one fall rescue. Returns near your last height at x1.' },
  { id: 'campProvision', name: 'Camp Provision', cost: 6, icon: 'camp-provision.webp', description: 'Press 8 at an Expedition camp to arm a stronger next launch.' },
  { id: 'routeReroll', name: 'Route Reroll', cost: 5, icon: 'route-reroll.webp', description: 'Press 9 at an Expedition camp to regenerate the next path immediately.' },
];
const GEAR_IDS: GearId[] = ['windstep', 'softstep', 'compass', 'echo'];
const ENCHANTMENT_IDS: EnchantmentId[] = ['bellwake', 'softfall'];
const SUPPLY_IDS: SupplyId[] = ['catBed', 'campProvision', 'routeReroll'];

function freshProgress(): ProgressSave {
  return { version: 3, fish: 0, owned: [], unlockedFestivals: [], unlockedKittens: [], movement: null, utility: null,
    enchantment: null, supplies: { catBed: 0, campProvision: 0, routeReroll: 0 } };
}
function loadProgress(): ProgressSave {
  try {
    const backup = localStorage.getItem(TEST_PROGRESS_BACKUP_KEY);
    if (backup) {
      localStorage.setItem(PROGRESS_KEY, backup);
      localStorage.removeItem(TEST_PROGRESS_BACKUP_KEY);
    }
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
    if (!raw || (raw.version !== 1 && raw.version !== 2 && raw.version !== 3)) return freshProgress();
    const owned = Array.isArray(raw.owned) ? raw.owned.filter((id: unknown) =>
      GEAR_IDS.includes(id as GearId) || ENCHANTMENT_IDS.includes(id as EnchantmentId)) : [];
    const supplies = Object.fromEntries(SUPPLY_IDS.map(id => [id,
      Number.isSafeInteger(raw.supplies?.[id]) ? Math.max(0, Math.min(99, raw.supplies[id])) : 0])) as Record<SupplyId, number>;
    const unlockedFestivals = raw.version >= 2 && Array.isArray(raw.unlockedFestivals)
      ? raw.unlockedFestivals.filter((id: unknown): id is FestivalName =>
          ['starlight-eve', 'great-egg-hunt', 'fireworks-fair', 'moonlit-masquerade',
            'great-yarn-tangle', 'turtleback-world', 'cat-lockup-expedition', 'moonlit-aquarium'].includes(id as string)) : [];
    const unlockedKittens = raw.version === 3 && Array.isArray(raw.unlockedKittens)
      ? raw.unlockedKittens.filter((id: unknown): id is CharacterId =>
          ['zima', 'earl-grey', 'betty-davis', 'gracie-bell'].includes(id as string)) : [];
    return { version: 3, fish: Number.isSafeInteger(raw.fish) ? Math.max(0, raw.fish) : 0, unlockedFestivals, unlockedKittens,
      owned, movement: owned.includes(raw.movement) ? raw.movement : null,
      utility: owned.includes(raw.utility) ? raw.utility : null,
      enchantment: owned.includes(raw.enchantment) ? raw.enchantment : null, supplies };
  } catch { return freshProgress(); }
}
let progress = loadProgress();
function restoreTestPurchases(): void {
  if (!localStorage.getItem(TEST_PROGRESS_BACKUP_KEY)) return;
  progress = loadProgress();
  refreshProgressUi();
}
function festivalUnlocked(theme: ThemeName): boolean {
  return !isFestival(theme) || progress.unlockedFestivals.includes(theme) || (LOCAL_TEST_BUILD && devMode);
}
const KITTEN_COST: Record<CharacterId, number> = {
  zima: 60, 'earl-grey': 70, 'betty-davis': 80, 'gracie-bell': 90,
};
function kittenUnlocked(character: CharacterId): boolean {
  return progress.unlockedKittens.includes(character) || (LOCAL_TEST_BUILD && devMode);
}
function unlockKitten(character: CharacterId): boolean {
  if (kittenUnlocked(character)) return true;
  const cost = KITTEN_COST[character];
  if (progress.fish < cost) return false;
  progress.fish -= cost;
  progress.unlockedKittens.push(character);
  saveProgress();
  return true;
}
function unlockFestival(theme: FestivalName): boolean {
  if (progress.unlockedFestivals.includes(theme)) return true;
  if (LOCAL_TEST_BUILD && devMode) return true;
  const cost = FESTIVAL_COST[theme];
  if (progress.fish < cost) return false;
  progress.fish -= cost;
  progress.unlockedFestivals.push(theme);
  observeAchievement('worlds', progress.unlockedFestivals.length);
  saveProgress();
  return true;
}
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
let runDebugged = false;
let runBedUsed = false;
let runFirstBell = true;
let runEchoUsed = false;
let runSoftfallTime = 0;
let runEchoTime = 0;
let runBedFxTime = 0;
let runCampBoost = false;
let catBedArmed = false;
let campProvisionArmed = false;
let runCrates: MysteryCrate[] = [];
// Crates follow world height rather than target IDs. Route rebuilds can jump
// target IDs, so ordinal scheduling used to create a dense row of crates.
let nextCrateWorldY = 0;
const FIRST_CRATE_MIN_Y = 8000;
const FIRST_CRATE_MAX_Y = 10500;
const CRATE_GAP_MIN_Y = 12500;
const CRATE_GAP_MAX_Y = 17000;

function startProgressRun(): void {
  runHighestBand = 0; runHighBand = 0; runBirdRewards = 0; runCampRewards = 0;
  runEquipped = !!(progress.movement || progress.utility || progress.enchantment);
  runDebugged = LOCAL_TEST_BUILD && devMode;
  runBedUsed = false; runFirstBell = true; runEchoUsed = false; runSoftfallTime = 0;
  runEchoTime = 0; runBedFxTime = 0;
  runCampBoost = false; catBedArmed = false; campProvisionArmed = false;
  runCrates = []; nextCrateWorldY = rand(FIRST_CRATE_MIN_Y, FIRST_CRATE_MAX_Y);
}
function awardFish(amount: number, reason: string): void {
  if (amount <= 0 || runDebugged) return;
  progress.fish = Math.min(Number.MAX_SAFE_INTEGER, progress.fish + amount);
  incrementAchievement('fish', amount);
  observeAchievement('wallet', progress.fish);
  saveProgress();
  message = `+${amount} FISH · ${reason.toUpperCase()}`;
  messageTimer = 1.6;
}
function updateAltitudeRewards(): void {
  observeAchievement('height', highestY);
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
  const useProvision = selectedMode === 'expedition' && expeditionCheckpointY > 0 && campProvisionArmed && progress.supplies.campProvision > 0;
  campProvisionArmed = false;
  if (useProvision) {
    progress.supplies.campProvision--;
    runCampBoost = true; runEquipped = true; saveProgress();
  } else runCampBoost = false;
  if (useProvision) showPowerupFeedback('Camp Provision used. This launch has a stronger opening jump.');
  refreshProgressUi();
}
function purchaseItem(id: RewardId): boolean {
  const item = PROGRESSION_ITEMS.find(entry => entry.id === id);
  if (!item || id === 'fish' || progress.fish + devFish < item.cost) return false;
  if (item.slot && progress.owned.includes(id)) return false;
  if (SUPPLY_IDS.includes(id as SupplyId) && progress.supplies[id as SupplyId] >= 9) return false;
  const testSpent = Math.min(devFish, item.cost);
  if (testSpent > 0 && !localStorage.getItem(TEST_PROGRESS_BACKUP_KEY)) {
    localStorage.setItem(TEST_PROGRESS_BACKUP_KEY, JSON.stringify(progress));
  }
  devFish -= testSpent;
  progress.fish -= item.cost - testSpent;
  if (item.slot) {
    progress.owned.push(id);
    observeAchievement('gear', progress.owned.length);
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
  if (state !== 'title' && (progress.movement === id || progress.utility === id || progress.enchantment === id)) runEquipped = true;
  saveProgress();
}
function grantCrateReward(id: RewardId): void {
  if (id === 'fish') { awardFish(4, 'crate'); return; }
  if (SUPPLY_IDS.includes(id as SupplyId)) {
    progress.supplies[id as SupplyId] = Math.min(9, progress.supplies[id as SupplyId] + 1);
    saveProgress();
  } else if (!progress.owned.includes(id)) {
    progress.owned.push(id);
    observeAchievement('gear', progress.owned.length);
    saveProgress();
  } else { awardFish(4, 'duplicate'); return; }
  message = `${PROGRESSION_ITEMS.find(item => item.id === id)?.name.toUpperCase()} FOUND`;
  messageTimer = 2;
}
function maybePlaceCrate(previous: Bell, next: Bell): void {
  const previousY = bellWorldY(previous);
  const nextY = bellWorldY(next);
  if (nextY < nextCrateWorldY) return;
  // A route can resume above a scheduled height. Advance from the actual
  // placement so the next target cannot also receive a crate.
  const y = previousY + (nextY - previousY) * rand(0.44, 0.59);
  nextCrateWorldY = y + rand(CRATE_GAP_MIN_Y, CRATE_GAP_MAX_Y);
  const expeditionSupply: SupplyId = progress.supplies.campProvision <= progress.supplies.routeReroll
    ? 'campProvision' : 'routeReroll';
  const supply: RewardId = selectedMode === 'classic' && progress.supplies.catBed < 2 ? 'catBed'
    : selectedMode === 'expedition' && progress.supplies[expeditionSupply] < 2 ? expeditionSupply : 'fish';
  const unowned = [...GEAR_IDS, ...ENCHANTMENT_IDS].filter(id => !progress.owned.includes(id));
  const gear: RewardId = unowned.length > 0 && rand() < 0.25 ? unowned[Math.floor(rand(0, unowned.length))] : 'fish';
  const offered: RewardId[] = ['fish', 'fish', supply, gear];
  runCrates.push({ x: Math.max(75, Math.min(width - 75, previous.x + (next.x - previous.x) * 0.5 + rand(-35, 35))),
    y, born: elapsed, opened: false, offered });
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
    incrementAchievement('crates');
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
const festivalBedArt: Partial<Record<FestivalName, HTMLImageElement>> = {};
function loadFestivalBed(theme: ThemeName): void {
  if (!isFestival(theme) || festivalBedArt[theme]) return;
  const image = new Image();
  image.src = `assets/themes/${theme}/cat-bed.${isNewWorld(theme) ? 'webp' : 'png'}`;
  festivalBedArt[theme] = image;
}
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
  if (selectedMode !== 'classic' || !catBedArmed || runBedUsed || progress.supplies.catBed < 1 || highestY < 350) return false;
  progress.supplies.catBed--; catBedArmed = false; runBedUsed = true; runEquipped = true; saveProgress();
  showPowerupFeedback('Cat Bed used. One rescue has returned you to the climb.');
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
    let bed: CanvasImageSource | undefined = isFestival(selectedTheme) && festivalBedArt[selectedTheme]?.naturalWidth
      ? festivalBedArt[selectedTheme] : themedBedArt[selectedTheme];
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
  const firstOrdinal = bells[0]?.id ?? Math.max(1, bellCount + 1);
  progress.supplies.routeReroll--; runEquipped = true; saveProgress();
  bells = []; moths = []; runCrates = [];
  nextBonusBell = firstOrdinal + 17;
  generateInitialPath(firstOrdinal, expeditionCheckpointY + 205);
  message = 'NEW ROUTE'; messageTimer = 1.5;
  return true;
}

function showPowerupFeedback(text: string): void {
  const status = document.querySelector<HTMLElement>('#powerup-status');
  if (status) status.textContent = text;
  if (state !== 'title') { message = text; messageTimer = 2.2; }
}
function activateInventorySlot(slot: number): void {
  if (slot === 0) {
    if (state === 'title') openProgressDialog('shop-overlay');
    else showPowerupFeedback(`${progress.fish.toLocaleString()} earned fish${devFish ? ` plus ${devFish} temporary test fish` : ''}. Spend them in Gear & supplies on the title screen.`);
    return;
  }
  const item = PROGRESSION_ITEMS[slot - 1];
  if (!item) return;
  if (item.slot) {
    if (!progress.owned.includes(item.id)) {
      showPowerupFeedback(`${item.name} is empty. Buy it with fish or find it in a crate.`);
      return;
    }
    equipItem(item.id);
    const equipped = progress.movement === item.id || progress.utility === item.id || progress.enchantment === item.id;
    showPowerupFeedback(`${item.name} ${equipped ? 'equipped' : 'unequipped'}.`);
    return;
  }
  if (item.id === 'catBed') {
    if (selectedMode !== 'classic' || state === 'title' || state === 'expeditionComplete') {
      showPowerupFeedback('Cat Bed can be armed during a Classic climb.'); return;
    }
    if (runBedUsed) { showPowerupFeedback('Cat Bed has already rescued this run.'); return; }
    if (!progress.supplies.catBed) { showPowerupFeedback('No Cat Beds. Buy one with fish or find one in a crate.'); return; }
    catBedArmed = !catBedArmed;
    showPowerupFeedback(`Cat Bed ${catBedArmed ? 'armed for a fall rescue' : 'disarmed'}.`);
  } else if (item.id === 'campProvision') {
    if (selectedMode !== 'expedition' || state !== 'expeditionCheckpoint') {
      showPowerupFeedback('Camp Provision can be armed at an Expedition camp.'); return;
    }
    if (!progress.supplies.campProvision) { showPowerupFeedback('No Camp Provisions. Buy one with fish or find one in a crate.'); return; }
    campProvisionArmed = !campProvisionArmed;
    showPowerupFeedback(`Camp Provision ${campProvisionArmed ? 'armed for the next launch' : 'disarmed'}.`);
  } else if (item.id === 'routeReroll') {
    if (selectedMode !== 'expedition' || state !== 'expeditionCheckpoint') {
      showPowerupFeedback('Route Reroll can be used at an Expedition camp.'); return;
    }
    if (!progress.supplies.routeReroll) { showPowerupFeedback('No Route Rerolls. Buy one with fish or find one in a crate.'); return; }
    if (rerollCampRoute()) showPowerupFeedback('Route Reroll used. A new path is ready.');
  }
  refreshProgressUi();
}
