// 불멍 위젯: 투명·테두리 없는 작은 창을 화면 오른쪽 아래(작업표시줄 위)에 띄운다.
const { app, BrowserWindow, Menu, Tray, screen, ipcMain, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZES = [[420, 310], [580, 430], [780, 580]];
let win = null, tray = null;
let cfg = { size: 1, pit: 0, sound: false, top: true, through: false, autostart: false, x: null, y: null };
const PIT_NAMES = ['접이식 육각 스테인리스', '타공 박스형', '팔각 타공형', '창 달린 박스형', '지붕 달린 정원 난로형'];
const cfgPath = () => path.join(app.getPath('userData'), 'settings.json');
function loadCfg() { try { Object.assign(cfg, JSON.parse(fs.readFileSync(cfgPath(), 'utf8'))); } catch (e) {} }
function saveCfg() { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) {} }

function defaultPos() {
  const wa = screen.getPrimaryDisplay().workArea, [w, h] = SIZES[cfg.size];
  return { x: wa.x + wa.width - w - 24, y: wa.y + wa.height - h };
}
function applyBounds(reset) {
  const [w, h] = SIZES[cfg.size];
  let p = (reset || cfg.x === null) ? defaultPos() : { x: cfg.x, y: cfg.y };
  const d = screen.getDisplayMatching({ x: p.x, y: p.y, width: w, height: h }).workArea;   // 화면 밖으로 나가지 않게
  p.x = Math.min(Math.max(p.x, d.x), d.x + d.width - w);
  p.y = Math.min(Math.max(p.y, d.y), d.y + d.height - h);
  cfg.x = p.x; cfg.y = p.y;
  win.setBounds({ x: p.x, y: p.y, width: w, height: h });
}
function applyAll() {
  win.setAlwaysOnTop(cfg.top, 'floating');
  win.setIgnoreMouseEvents(cfg.through, { forward: true });
  app.setLoginItemSettings({ openAtLogin: cfg.autostart, path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath });
  win.webContents.send('settings', cfg);
  if (tray) tray.setContextMenu(buildMenu());
  saveCfg();
}
function buildMenu() {
  const set = (k, v) => () => { cfg[k] = v; if (k === 'size') applyBounds(false); applyAll(); };
  return Menu.buildFromTemplate([
    { label: '장작 넣기', click: () => win.webContents.send('wood') },
    { type: 'separator' },
    { label: '화로대 모양', submenu: PIT_NAMES.map((l, i) => ({ label: l, type: 'radio', checked: cfg.pit === i, click: set('pit', i) })) },
    { label: '크기', submenu: ['작게', '보통', '크게'].map((l, i) => ({ label: l, type: 'radio', checked: cfg.size === i, click: set('size', i) })) },
    { label: '장작 타는 소리', type: 'checkbox', checked: cfg.sound, click: set('sound', !cfg.sound) },
    { label: '항상 위에 두기', type: 'checkbox', checked: cfg.top, click: set('top', !cfg.top) },
    { label: '클릭 통과 (트레이 아이콘에서 해제)', type: 'checkbox', checked: cfg.through, click: set('through', !cfg.through) },
    { label: '윈도우 시작 시 자동 실행', type: 'checkbox', checked: cfg.autostart, click: set('autostart', !cfg.autostart) },
    { label: '오른쪽 아래로 되돌리기', click: () => { applyBounds(true); saveCfg(); } },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() }
  ]);
}
function createWindow() {
  const [w, h] = SIZES[cfg.size];
  win = new BrowserWindow({
    width: w, height: h, frame: false, transparent: true, resizable: false, hasShadow: false,
    skipTaskbar: true, alwaysOnTop: cfg.top, fullscreenable: false, maximizable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required', additionalArguments: process.argv.filter(a => a.startsWith('--shot=')) }
  });
  applyBounds(false);
  if (process.argv.some(a => a.startsWith('--shot='))) win.webContents.on('console-message', (e, lvl, msg) => console.log('[page]', msg));
  win.loadFile('index.html');
  win.once('ready-to-show', () => { win.showInactive(); applyAll(); });
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'build', 'tray.png')));
    tray.setToolTip('불멍 위젯');
    tray.setContextMenu(buildMenu());
  } catch (e) { tray = null; }
}

ipcMain.on('ignore', (e, v) => { if (!cfg.through) win.setIgnoreMouseEvents(!!v, { forward: true }); });   // 불·장작 밖은 클릭이 바탕화면으로 통과
ipcMain.on('menu', () => buildMenu().popup({ window: win }));
ipcMain.on('drag', (e, dx, dy) => { const b = win.getBounds(); cfg.x = b.x + dx; cfg.y = b.y + dy; win.setPosition(cfg.x, cfg.y); });
ipcMain.on('drag-end', () => { applyBounds(false); saveCfg(); });
ipcMain.handle('settings', () => cfg);
ipcMain.on('shot', async (e, file) => { const img = await win.webContents.capturePage(); fs.writeFileSync(file, img.toPNG()); app.quit(); });

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.whenReady().then(() => { loadCfg(); const pa = process.argv.find(a => a.startsWith('--pit=')); if (pa) cfg.pit = +pa.slice(6); createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
