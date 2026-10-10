// Achievement tracks are monotonic and stored independently from the score board.
type AchievementTier = 0 | 1 | 2 | 3;
type AchievementDefinition = { id: string; title: string; detail: string; targets: readonly [number, number, number] };
const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'bells', title: 'Bell Ringer', detail: 'Bells struck', targets: [25, 250, 1500] },
  { id: 'chain', title: 'One Long Song', detail: 'Bells in one launch', targets: [3, 6, 12] },
  { id: 'score', title: 'Sky Star', detail: 'Best run score', targets: [10000, 100000, 1000000] },
  { id: 'height', title: 'Cloud Climber', detail: 'Highest altitude', targets: [1000, 14000, 42000] },
  { id: 'airborne', title: 'Airborne Friends', detail: 'Airborne catches', targets: [5, 50, 250] },
  { id: 'crates', title: 'Curious Paws', detail: 'Mystery crates opened', targets: [1, 10, 50] },
  { id: 'cats', title: 'Cat Company', detail: 'Different cats played', targets: [2, 3, 4] },
  { id: 'fish', title: 'Fish Finder', detail: 'Fish earned', targets: [25, 250, 1000] },
  { id: 'wallet', title: 'Fish Keeper', detail: 'Most fish held', targets: [25, 100, 500] },
  { id: 'runs', title: 'Nine Lives', detail: 'Runs started', targets: [1, 25, 100] },
  { id: 'yarn', title: 'Yarn Explorer', detail: 'Yarn Tangle runs', targets: [1, 10, 50] },
  { id: 'turtle', title: 'Turtleback Traveler', detail: 'Turtleback runs', targets: [1, 10, 50] },
  { id: 'lockup', title: 'Freedom Finder', detail: 'Cat Lockup runs', targets: [1, 10, 50] },
  { id: 'aquarium', title: 'Moonlit Diver', detail: 'Aquarium runs', targets: [1, 10, 50] },
  { id: 'worlds', title: 'World Collector', detail: 'Worlds unlocked with fish', targets: [1, 4, 8] },
  { id: 'winter', title: 'Snow Walker', detail: 'Winter runs', targets: [1, 10, 50] },
  { id: 'spring', title: 'Blossom Walker', detail: 'Spring runs', targets: [1, 10, 50] },
  { id: 'summer', title: 'Sun Walker', detail: 'Summer runs', targets: [1, 10, 50] },
  { id: 'autumn', title: 'Leaf Walker', detail: 'Autumn runs', targets: [1, 10, 50] },
  { id: 'launches', title: 'Constellation Trail', detail: 'Launches', targets: [10, 100, 500] },
  { id: 'gear', title: 'Well Equipped', detail: 'Permanent gear owned', targets: [1, 3, 6] },
  { id: 'zen', title: 'Soft Landing', detail: 'Safe Zen landings', targets: [1, 25, 100] },
  { id: 'camps', title: 'Camp Light', detail: 'Expedition camps reached', targets: [1, 10, 50] },
  { id: 'modes', title: 'Many Paths', detail: 'Different modes played', targets: [1, 2, 3] },
  { id: 'summits', title: 'Summit Crown', detail: 'Expeditions finished', targets: [1, 5, 25] },
];
const ACHIEVEMENT_KEY = 'cats-changing-sky-achievements-v1';
type AchievementSave = { version: 1; values: Record<string, number>; seenCats: string[]; seenModes: string[] };
function loadAchievements(): AchievementSave {
  try {
    const raw = JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY) || 'null');
    if (!raw || raw.version !== 1 || typeof raw.values !== 'object' || raw.values === null) throw Error('No achievement save');
    const values: Record<string, number> = {};
    for (const def of ACHIEVEMENTS) {
      const value = raw.values[def.id];
      values[def.id] = Number.isSafeInteger(value) && value >= 0 ? value : 0;
    }
    return { version: 1, values, seenCats: Array.isArray(raw.seenCats) ? raw.seenCats.filter((id: unknown) => typeof id === 'string') : [],
      seenModes: Array.isArray(raw.seenModes) ? raw.seenModes.filter((id: unknown) => typeof id === 'string') : [] };
  } catch { return { version: 1, values: {}, seenCats: [], seenModes: [] }; }
}
const achievements = loadAchievements();
const achievementQueue: { title: string; tier: AchievementTier; index: number }[] = [];
let achievementShowing = false;
const TIER_NAMES = ['Locked', 'Bronze', 'Silver', 'Gold'] as const;
// The painted atlas places the cloud/runs, bird, cat, crate, fish, and wallet
// panels in a different order from the tracking definitions.
const ACHIEVEMENT_ICON_INDEX = [0, 1, 2, 3, 5, 7, 6, 8, 9, 4,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24] as const;
function achievementIconPosition(index: number): string {
  const cell = ACHIEVEMENT_ICON_INDEX[index];
  return `${(cell % 5) * 25}% ${Math.floor(cell / 5) * 25}%`;
}
function achievementTier(def: AchievementDefinition, value: number): AchievementTier {
  return value >= def.targets[2] ? 3 : value >= def.targets[1] ? 2 : value >= def.targets[0] ? 1 : 0;
}
function showNextAchievement(): void {
  const next = achievementQueue.shift();
  const toast = document.querySelector<HTMLElement>('#achievement-toast');
  if (!next || !toast) { achievementShowing = false; return; }
  achievementShowing = true;
  toast.replaceChildren();
  const icon = document.createElement('span'); icon.className = 'achievement-icon';
  icon.style.backgroundPosition = achievementIconPosition(next.index);
  const label = document.createElement('span');
  label.textContent = `${TIER_NAMES[next.tier]} achievement: ${next.title}`;
  toast.append(icon, label);
  toast.dataset.tier = TIER_NAMES[next.tier].toLowerCase();
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => { toast.hidden = true; showNextAchievement(); }, 450);
  }, 3600);
}
function observeAchievement(id: string, value: number): void {
  if (typeof runDebugged !== 'undefined' && runDebugged) return;
  const index = ACHIEVEMENTS.findIndex(def => def.id === id);
  if (index < 0 || !Number.isFinite(value)) return;
  const def = ACHIEVEMENTS[index];
  const previous = achievements.values[id] || 0;
  const next = Math.max(previous, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)));
  if (next === previous) return;
  achievements.values[id] = next;
  try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(achievements)); }
  catch (error) { console.warn('Achievements could not be saved.', error); }
  const oldTier = achievementTier(def, previous), newTier = achievementTier(def, next);
  for (let tier = oldTier + 1; tier <= newTier; tier++) achievementQueue.push({ title: def.title, tier: tier as AchievementTier, index });
  if (!achievementShowing) showNextAchievement();
}
function incrementAchievement(id: string, amount = 1): void {
  observeAchievement(id, (achievements.values[id] || 0) + amount);
}
function noteAchievementChoice(kind: 'cats' | 'modes', value: string): void {
  if (typeof runDebugged !== 'undefined' && runDebugged) return;
  const seen = kind === 'cats' ? achievements.seenCats : achievements.seenModes;
  if (seen.includes(value)) return;
  seen.push(value);
  observeAchievement(kind, seen.length);
}
function renderAchievements(): void {
  const list = document.querySelector<HTMLElement>('#achievement-list');
  if (!list) return;
  list.replaceChildren();
  ACHIEVEMENTS.forEach((def, index) => {
    const value = achievements.values[def.id] || 0;
    const tier = achievementTier(def, value);
    const card = document.createElement('article'); card.className = 'achievement-card'; card.dataset.tier = TIER_NAMES[tier].toLowerCase();
    const icon = document.createElement('span'); icon.className = 'achievement-icon'; icon.style.backgroundPosition = achievementIconPosition(index);
    const body = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = def.title;
    const detail = document.createElement('span'); detail.textContent = `${def.detail} · ${value.toLocaleString()}`;
    const next = document.createElement('small');
    next.textContent = tier === 3 ? 'Gold complete' : `Next: ${TIER_NAMES[tier + 1]} at ${def.targets[tier].toLocaleString()}`;
    body.append(title, detail, next);
    const badge = document.createElement('b'); badge.textContent = TIER_NAMES[tier];
    card.append(icon, body, badge); list.append(card);
  });
}
