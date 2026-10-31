const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#05050f',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  Menu.setApplicationMenu(null);

win.loadFile('index.html');

// DevTools é o de baixo, n mexer no de cima!!! 

win.webContents.openDevTools();

  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });