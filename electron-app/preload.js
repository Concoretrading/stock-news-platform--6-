// Preload script for Electron context isolation
// You can expose APIs to the renderer here if needed
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('concore', {
  // App info
  version: () => ipcRenderer.invoke('get-app-version'),
  platform: () => ipcRenderer.invoke('get-platform'),
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // Screenshot and clipboard
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  pasteClipboard: () => ipcRenderer.invoke('paste-clipboard'),
  
  // Event listeners for native operations
  onFileDropped: (callback) => {
    ipcRenderer.on('file-dropped', (event, filePath) => callback(filePath));
  },
  
  onScreenshotCaptured: (callback) => {
    ipcRenderer.on('screenshot-captured', (event, filePath) => callback(filePath));
  },
  
  onClipboardImage: (callback) => {
    ipcRenderer.on('clipboard-image', (event, filePath) => callback(filePath));
  },
  
  // Remove event listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 