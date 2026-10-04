chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

const CATS = new Set(['zima', 'earl-grey', 'betty-davis', 'gracie-bell']);
function iconPaths(cat) {
  return Object.fromEntries([16, 32, 48, 128].map(size =>
    [size, `icons/cats/${cat}-${size}.png`]));
}
async function restoreIcon() {
  const { toolbarCat } = await chrome.storage.local.get('toolbarCat');
  await chrome.action.setIcon({ path: iconPaths(CATS.has(toolbarCat) ? toolbarCat : 'zima') });
}
chrome.runtime.onInstalled.addListener(() => { restoreIcon().catch(console.error); });
chrome.runtime.onStartup.addListener(() => { restoreIcon().catch(console.error); });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || request?.type !== 'set-toolbar-cat' || !CATS.has(request.cat)) return;
  (async () => {
    await chrome.storage.local.set({ toolbarCat: request.cat });
    await chrome.action.setIcon({ path: iconPaths(request.cat) });
  })().then(() => sendResponse({ ok: true }), error => sendResponse({ ok: false, error: String(error) }));
  return true;
});
