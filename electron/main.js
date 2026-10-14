const { app, BrowserWindow, Menu } = require('electron');
// Use the graphics card for drawing even on machines Chromium is cautious about, and prefer the faster GPU on laptops with two
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('force_high_performance_gpu');
function create() {
  const win = new BrowserWindow({ width: 1440, height: 900, backgroundColor: '#11100e', title: 'Last Colony', autoHideMenuBar: true });
  win.loadFile('index.html');
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });
}
Menu.setApplicationMenu(null);
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
