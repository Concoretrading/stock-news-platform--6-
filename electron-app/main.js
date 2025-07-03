const { app, BrowserWindow, shell, ipcMain, dialog, globalShortcut, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { desktopCapturer } = require('electron');

// Change this to your deployed Vercel URL or local dev server
const WEB_APP_URL = process.env.CONCORE_WEB_URL || 'http://localhost:3000';

let mainWindow;
let pendingFileToOpen = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow loading local files for drag-drop
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'ConcoreNews Desktop',
    show: false, // Don't show until ready
  });

  mainWindow.loadURL(WEB_APP_URL);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    processPendingFile();
  });

  // Inject the renderer script after page load
  mainWindow.webContents.on('did-finish-load', () => {
    const rendererScript = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
    mainWindow.webContents.executeJavaScript(rendererScript);
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Enable drag and drop for files
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // If it's a file URL, handle it
    if (parsedUrl.protocol === 'file:') {
      event.preventDefault();
      const filePath = decodeURIComponent(parsedUrl.pathname);
      handleFileDrop(filePath);
    }
  });

  // Register global shortcuts
  registerGlobalShortcuts();
}

// Handle file drops
function handleFileDrop(filePath) {
  if (mainWindow && mainWindow.webContents) {
    // Check if it's an image file
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (imageExtensions.includes(ext)) {
      mainWindow.webContents.send('file-dropped', filePath);
    }
  }
}

// Register global shortcuts
function registerGlobalShortcuts() {
  // Screenshot shortcut (Cmd/Ctrl + Shift + S)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    captureScreenshot();
  });

  // Paste from clipboard shortcut (Cmd/Ctrl + Shift + V)
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    pasteFromClipboard();
  });
}

// Capture screenshot
async function captureScreenshot() {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length > 0) {
      const source = sources[0];
      const image = source.thumbnail;
      
      // Save to temp file
      const tempPath = path.join(app.getPath('temp'), `screenshot-${Date.now()}.png`);
      fs.writeFileSync(tempPath, image.toPNG());
      
      // Send to renderer
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('screenshot-captured', tempPath);
      }
    }
  } catch (error) {
    console.error('Screenshot capture failed:', error);
  }
}

// Paste from clipboard
async function pasteFromClipboard() {
  try {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      // Save to temp file
      const tempPath = path.join(app.getPath('temp'), `clipboard-${Date.now()}.png`);
      fs.writeFileSync(tempPath, image.toPNG());
      
      // Send to renderer
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('clipboard-image', tempPath);
      }
    }
  } catch (error) {
    console.error('Clipboard paste failed:', error);
  }
}

// IPC handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('capture-screenshot', async () => {
  await captureScreenshot();
});

ipcMain.handle('paste-clipboard', async () => {
  await pasteFromClipboard();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// macOS: handle files dropped onto the dock icon
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow && mainWindow.webContents) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    handleFileDrop(filePath);
  } else {
    pendingFileToOpen = filePath;
  }
});

// Windows: handle files passed as arguments
if (process.platform === 'win32' && process.argv.length >= 2) {
  const possibleFile = process.argv[1];
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
  if (imageExtensions.includes(path.extname(possibleFile).toLowerCase())) {
    pendingFileToOpen = possibleFile;
  }
}

// After window is ready, process any pending file
function processPendingFile() {
  if (pendingFileToOpen) {
    if (mainWindow && mainWindow.webContents) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      handleFileDrop(pendingFileToOpen);
      pendingFileToOpen = null;
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
}); 