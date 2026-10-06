// Inventory, shop, and settings interface.

function hideInventoryTooltip(): void {
  const tooltip = document.querySelector<HTMLElement>('#powerup-tooltip');
  if (tooltip) tooltip.hidden = true;
}
function showInventoryTooltip(cell: HTMLElement, heading: string, detail: string): void {
  const tooltip = document.querySelector<HTMLElement>('#powerup-tooltip');
  if (!tooltip) return;
  const title = document.createElement('strong'); title.textContent = heading;
  const copy = document.createElement('span'); copy.textContent = detail;
  tooltip.replaceChildren(title, copy);
  tooltip.style.setProperty('--accent', themeMeta().accent);
  tooltip.hidden = false;
  const rect = cell.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - tooltip.offsetWidth - 8,
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${Math.max(8, rect.top - tooltip.offsetHeight - 8)}px`;
}

let lastInventorySignature = '';
function refreshProgressUi(): void {
  const balance = document.querySelector<HTMLElement>('#fish-balance');
  if (balance) balance.textContent = progress.fish.toLocaleString();
  const shopBalance = document.querySelector<HTMLElement>('#shop-balance');
  if (shopBalance) shopBalance.textContent = `${progress.fish.toLocaleString()}${devFish ? ` + ${devFish} test` : ''}`;
  const shop = document.querySelector<HTMLElement>('#shop-items');
  if (shop && !document.querySelector<HTMLElement>('#shop-overlay')?.hidden) renderShop();
  const inventory = document.querySelector<HTMLElement>('#powerup-bar');
  const inventorySignature = `${selectedTheme}|${selectedMode}|${state}|${progress.fish}|${devFish}|${progress.owned.join(',')}|${progress.movement}|${progress.utility}|${progress.enchantment}|${SUPPLY_IDS.map(id => progress.supplies[id]).join(',')}|${catBedArmed}|${campProvisionArmed}|${runBedUsed}`;
  if (inventory && inventorySignature !== lastInventorySignature) {
    lastInventorySignature = inventorySignature;
    hideInventoryTooltip();
    inventory.replaceChildren();
    inventory.style.setProperty('--accent', themeMeta().accent);
    for (const [index, item] of PROGRESSION_ITEMS.entries()) {
      const id = item.id;
      const amount = item.slot ? Number(progress.owned.includes(id)) : progress.supplies[id as SupplyId];
      const active = progress.movement === id || progress.utility === id || progress.enchantment === id
        || (id === 'catBed' && catBedArmed) || (id === 'campProvision' && campProvisionArmed);
      const key = index + 1;
      const cell = document.createElement('button'); cell.type = 'button';
      cell.className = `powerup-cell${amount ? ' owned' : ''}${active ? ' active' : ''}`;
      const action = item.slot ? (active ? 'unequip' : 'equip') : id === 'catBed' ? (active ? 'disarm' : 'arm for rescue')
        : id === 'campProvision' ? (active ? 'disarm' : 'arm for next camp launch') : 'use at camp';
      const guidance = item.slot ? `${item.description} Press ${key} or click to ${action}.`
        : id === 'catBed' ? `Press 7 or click to ${active ? 'disarm' : 'arm'} during Classic. An armed Bed rescues one fatal fall at x1.`
          : id === 'campProvision' ? `Press 8 or click to ${active ? 'disarm' : 'arm'} at an Expedition camp. It boosts the next launch.`
            : 'Press 9 or click at an Expedition camp to reroll the next path.';
      const detail = `${guidance} ${amount ? `${amount} available.` : 'None available; buy one with fish or find one in a crate.'}`;
      cell.setAttribute('aria-label', `${item.name}. ${detail}`);
      cell.setAttribute('aria-keyshortcuts', String(key));
      cell.setAttribute('aria-pressed', String(active));
      cell.setAttribute('aria-describedby', 'powerup-tooltip');
      const badge = document.createElement('kbd'); badge.textContent = String(key);
      const icon = document.createElement('img'); icon.src = `assets/progression/${item.icon}`; icon.alt = '';
      const count = document.createElement('span'); count.className = 'powerup-count'; count.textContent = `${amount}`;
      cell.append(badge, icon, count);
      cell.addEventListener('click', () => activateInventorySlot(key));
      cell.addEventListener('mouseenter', () => showInventoryTooltip(cell, item.name, detail));
      cell.addEventListener('mouseleave', hideInventoryTooltip);
      cell.addEventListener('focus', () => showInventoryTooltip(cell, item.name, detail));
      cell.addEventListener('blur', hideInventoryTooltip);
      inventory.append(cell);
    }
    const fish = document.createElement('button'); fish.type = 'button'; fish.className = 'powerup-cell fish-cell owned';
    const fishDetail = `Press 0 or click to view your balance. ${progress.fish.toLocaleString()} earned fish${devFish ? ` plus ${devFish} temporary test fish` : ''}. Spend fish in Gear & supplies on the title screen.`;
    fish.setAttribute('aria-label', `Fish. ${fishDetail}`);
    fish.setAttribute('aria-keyshortcuts', '0');
    fish.setAttribute('aria-describedby', 'powerup-tooltip');
    const fishKey = document.createElement('kbd'); fishKey.textContent = '0';
    const fishIcon = document.createElement('img'); fishIcon.src = 'assets/progression/fish.webp'; fishIcon.alt = '';
    const fishCount = document.createElement('span'); fishCount.className = 'powerup-count'; fishCount.textContent = (progress.fish + devFish).toLocaleString();
    fish.append(fishKey, fishIcon, fishCount);
    fish.addEventListener('click', () => activateInventorySlot(0));
    fish.addEventListener('mouseenter', () => showInventoryTooltip(fish, 'Fish', fishDetail));
    fish.addEventListener('mouseleave', hideInventoryTooltip);
    fish.addEventListener('focus', () => showInventoryTooltip(fish, 'Fish', fishDetail));
    fish.addEventListener('blur', hideInventoryTooltip);
    inventory.append(fish);
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
    button.disabled = !owned && (progress.fish + devFish < item.cost ||
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
  syncMasterAudio(paused);
  canvas.focus();
}
function openProgressDialog(id: 'shop-overlay' | 'settings-overlay'): void {
  const alreadyOpen = ['shop-overlay', 'settings-overlay'].some(dialogId => !document.getElementById(dialogId)?.hidden);
  const wasPaused = alreadyOpen ? pauseBeforeDialog : paused;
  closeProgressDialogs();
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.hidden = false;
  refreshProgressUi();
  if (state !== 'title') { pauseBeforeDialog = wasPaused; paused = true; }
  syncMasterAudio(paused);
  if (id === 'shop-overlay') renderShop();
  overlay.querySelector<HTMLButtonElement>('button')?.focus();
}
let pauseBeforeDialog = false;
type ToolbarChrome = {
  runtime?: { sendMessage: (message: object) => Promise<{ ok: boolean; error?: string }> };
  storage?: { local?: { get: (key: string) => Promise<Record<string, unknown>> } };
};
function toolbarChrome(): ToolbarChrome | undefined {
  return (globalThis as typeof globalThis & { chrome?: ToolbarChrome }).chrome;
}
const TOOLBAR_CAT_KEY = 'zima-skybells-toolbar-cat';
let selectedToolbarCat: CharacterId = 'zima';
let toolbarChoiceChanged = false;
function refreshToolbarIconOptions(): void {
  document.querySelectorAll<HTMLButtonElement>('#toolbar-icon-options button[data-cat]').forEach(button =>
    button.setAttribute('aria-pressed', String(button.dataset.cat === selectedToolbarCat)));
}
function toolbarIconFeedback(text: string): void {
  const status = document.querySelector<HTMLElement>('#toolbar-icon-feedback');
  if (status) status.textContent = text;
}
async function chooseToolbarIcon(cat: CharacterId): Promise<void> {
  toolbarChoiceChanged = true;
  selectedToolbarCat = cat;
  localStorage.setItem(TOOLBAR_CAT_KEY, cat);
  refreshToolbarIconOptions();
  const api = toolbarChrome();
  if (!api?.runtime?.sendMessage) {
    toolbarIconFeedback('Preview only. Install the extension to change its browser icon.');
    return;
  }
  try {
    const response = await api.runtime.sendMessage({ type: 'set-toolbar-cat', cat });
    if (!response?.ok) throw new Error(response?.error || 'Icon update failed');
    toolbarIconFeedback(`${CHARACTER_META[cat].name} is now the browser toolbar icon.`);
  } catch (error) {
    toolbarIconFeedback(`Could not change the toolbar icon: ${String(error)}`);
  }
}
function initToolbarIconOptions(): void {
  const options = document.querySelector<HTMLElement>('#toolbar-icon-options');
  if (!options) return;
  const stored = localStorage.getItem(TOOLBAR_CAT_KEY) as CharacterId;
  selectedToolbarCat = CHARACTER_ORDER.includes(stored) ? stored : 'zima';
  for (const cat of CHARACTER_ORDER) {
    const button = document.createElement('button'); button.type = 'button';
    button.dataset.cat = cat;
    button.setAttribute('aria-label', `Use ${CHARACTER_META[cat].name} as the extension icon`);
    const image = document.createElement('img'); image.src = `icons/cats/${cat}-128.png`; image.alt = '';
    const name = document.createElement('span'); name.textContent = CHARACTER_META[cat].name;
    button.append(image, name);
    button.addEventListener('click', () => { void chooseToolbarIcon(cat); });
    options.append(button);
  }
  refreshToolbarIconOptions();
  const storage = toolbarChrome()?.storage?.local;
  if (storage) void storage.get('toolbarCat').then(result => {
    if (!toolbarChoiceChanged && CHARACTER_ORDER.includes(result.toolbarCat as CharacterId)) {
      selectedToolbarCat = result.toolbarCat as CharacterId;
      localStorage.setItem(TOOLBAR_CAT_KEY, selectedToolbarCat);
      refreshToolbarIconOptions();
    }
  }).catch(error => console.warn('Toolbar icon preference could not be read.', error));
}
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
  initToolbarIconOptions();
  document.getElementById('powerup-bar')?.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.code === 'Enter') event.stopPropagation();
  });
  document.getElementById('open-shop')?.addEventListener('click', () => openProgressDialog('shop-overlay'));
  document.getElementById('settings-button')?.addEventListener('click', () => openProgressDialog('settings-overlay'));
  document.getElementById('close-shop')?.addEventListener('click', closeProgressDialogs);
  document.getElementById('close-settings')?.addEventListener('click', closeProgressDialogs);
  document.getElementById('export-save')?.addEventListener('click', exportGameData);
  document.getElementById('reroll-route')?.addEventListener('click', () => activateInventorySlot(9));
  document.getElementById('dev-seed-fish')?.addEventListener('click', () => {
    if (!LOCAL_TEST_BUILD || !devMode) return;
    devFish += 100;
    if (state !== 'title') runDebugged = true;
    refreshProgressUi();
  });
  document.getElementById('dev-flight-button')?.addEventListener('click', () => {
    if (!LOCAL_TEST_BUILD || !devMode) return;
    devFlight = !devFlight;
    runDebugged = true;
    bounceHold = 0; pendingBounce = 0;
    if (devFlight && state === 'falling') state = 'playing';
    closeProgressDialogs();
  });
  document.addEventListener('keydown', event => {
    const dialog = ['shop-overlay', 'settings-overlay']
      .map(id => document.getElementById(id)).find(overlay => overlay && !overlay.hidden);
    const hotkey = /^Digit([0-9])$/.exec(event.code);
    const target = event.target as HTMLElement | null;
    if (event.code === 'KeyN' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey
      && !target?.closest('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (dialog?.id === 'settings-overlay') closeProgressDialogs();
      else { if (scoreboardOpen) closeScoreboard(); openProgressDialog('settings-overlay'); }
      return;
    }
    if (hotkey && (state !== 'title' || hotkey[1] === '0') && !dialog && !scoreboardOpen
      && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey
      && !target?.closest('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateInventorySlot(Number(hotkey[1]));
      return;
    }
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
