// The desktop app: one window around the game (index.html), saves kept as plain files in the user's data folder (so Steam Cloud can carry
// them), the Steam overlay and achievements when Steam is running, and nothing Steam-specific otherwise (itch.io and direct downloads).
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('force_high_performance_gpu');

// ---- Steam (optional): steamworks.js is bundled in the Steam build; without it, or without Steam running, the game runs as normal
let steam = null;
function startSteam() {
  if (process.argv.includes('--no-steam') || process.env.LC_NO_STEAM) return;
  let sw;
  try { sw = require('steamworks.js'); } catch (e) { return; }
  let id;
  for (const dir of [path.dirname(process.execPath), process.cwd(), __dirname]) {
    try { id = parseInt(fs.readFileSync(path.join(dir, 'steam_appid.txt'), 'utf8'), 10); if (id) break; } catch (e) {}
  }
  try { steam = sw.init(id || undefined); sw.electronEnableSteamOverlay(); }
  catch (e) { steam = null; console.log('Steam is not running; continuing without it.'); }
}
startSteam();

if (!app.requestSingleInstanceLock()) { app.quit(); }

// ---- saves: <user data>/saves/<key>.json, written to a temporary file and renamed so a crash never leaves half a save
const saveDir = () => path.join(app.getPath('userData'), 'saves');
const saveFile = (k) => {
  if (typeof k !== 'string' || !/^[A-Za-z0-9_.~-]{1,120}$/.test(k) || k.startsWith('.')) throw new Error('bad save name');
  return path.join(saveDir(), k + '.json');
};
ipcMain.handle('saves:get', async (_e, k) => {
  try { return await fs.promises.readFile(saveFile(k), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
});
ipcMain.handle('saves:set', async (_e, k, v) => {
  if (typeof v !== 'string') throw new Error('bad save data');
  const f = saveFile(k), tmp = f + '.tmp';
  await fs.promises.mkdir(saveDir(), { recursive: true });
  await fs.promises.writeFile(tmp, v, 'utf8');
  await fs.promises.rename(tmp, f);
  return true;
});
ipcMain.handle('saves:del', async (_e, k) => { try { await fs.promises.unlink(saveFile(k)); } catch (e) {} return true; });

// ---- window size and full screen, remembered between runs (full screen on the first run)
const winFile = () => path.join(app.getPath('userData'), 'window.json');
function loadWin() { try { return JSON.parse(fs.readFileSync(winFile(), 'utf8')); } catch (e) { return { full: true }; } }
function saveWin(win) {
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(winFile(), JSON.stringify({ x: b.x, y: b.y, width: b.width, height: b.height, max: win.isMaximized(), full: win.isFullScreen() }));
  } catch (e) {}
}

let win = null;
function create() {
  const s = loadWin();
  win = new BrowserWindow({
    width: s.width || 1440, height: s.height || 900, x: s.x, y: s.y, minWidth: 960, minHeight: 600,
    backgroundColor: '#11100e', title: 'Last Colony', autoHideMenuBar: true, fullscreen: !!s.full, show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), additionalArguments: ['--lc-version=' + app.getVersion()], contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  if (s.max && !s.full) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile('index.html');
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  // links in the game open nothing inside the window
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.on('close', () => saveWin(win));
}

ipcMain.handle('app:quit', () => { if (win) saveWin(win); app.quit(); });
ipcMain.handle('app:fullscreen', (_e, on) => { if (win) win.setFullScreen(!!on); return win ? win.isFullScreen() : false; });
ipcMain.handle('app:isFullscreen', () => (win ? win.isFullScreen() : false));
ipcMain.handle('app:achieve', (_e, name) => {
  if (!steam || typeof name !== 'string' || !/^[A-Z0-9_]{1,64}$/.test(name)) return false;
  try { return steam.achievement.activate(name); } catch (e) { return false; }
});

Menu.setApplicationMenu(null);
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
