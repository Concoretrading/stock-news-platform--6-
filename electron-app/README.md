# ConcoreNews Desktop (Electron)

A powerful desktop application for ConcoreNews with native screenshot capture, drag-and-drop, and clipboard integration.

## 🚀 Advanced Features

### 📸 **Native Screenshot Capture**
- **Global Shortcut**: `Cmd/Ctrl + Shift + S` to capture full screen
- **Automatic Analysis**: Screenshots are automatically sent to the OCR analyzer
- **High Quality**: Captures at 1920x1080 resolution

### 🖱️ **Drag & Drop Support**
- **File Drop**: Drag any image file directly onto the app window
- **Visual Feedback**: Beautiful drop zone with blur effect
- **Multiple Formats**: PNG, JPG, JPEG, GIF, BMP, WebP

### 📋 **Clipboard Integration**
- **Global Shortcut**: `Cmd/Ctrl + Shift + V` to paste from clipboard
- **Image Detection**: Automatically detects images in clipboard
- **Instant Analysis**: Pasted images are immediately analyzed

### ⌨️ **Native File Dialog**
- **File Picker**: Access to native file selection dialog
- **Filtered**: Only shows image files by default
- **Cross-platform**: Works on Mac, Windows, and Linux

### 🔧 **Developer Features**
- **Context Isolation**: Secure communication between main and renderer
- **Error Handling**: Graceful fallbacks for all native operations
- **Notifications**: Visual feedback for all operations

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   cd electron-app
   npm install
   ```

2. **Set the web app URL:**
   - By default, the app loads `http://localhost:3000`.
   - To load your deployed Vercel app, set the environment variable:
     ```bash
     export CONCORE_WEB_URL="https://your-vercel-app-url.vercel.app"
     npm start
     ```

3. **Run the app:**
   ```bash
   npm start
   ```

## 🏗️ Packaging

### **Development Package**
```bash
npm run package
```

### **Production Builds**
```bash
npm run make
```

This creates installers for:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer
- **Linux**: `.deb` and `.rpm` packages

### **Publishing**
```bash
npm run publish
```

## 🎯 **Usage Guide**

### **Taking Screenshots**
1. Press `Cmd/Ctrl + Shift + S` anywhere on your system
2. The screenshot is automatically captured and sent to ConcoreNews
3. Analysis begins immediately

### **Drag & Drop**
1. Drag any image file from your file manager
2. Drop it anywhere on the ConcoreNews window
3. The image is automatically uploaded and analyzed

### **Clipboard Paste**
1. Copy an image to your clipboard (screenshot, copied image, etc.)
2. Press `Cmd/Ctrl + Shift + V` in ConcoreNews
3. The image is pasted and analyzed

### **File Selection**
1. Use the file picker in the web app
2. Or use the native file dialog through the desktop integration

## 🔒 **Security Features**

- **Context Isolation**: Renderer process cannot access Node.js APIs
- **Secure IPC**: All communication goes through preload script
- **File Validation**: Only image files are processed
- **Error Boundaries**: Graceful handling of all errors

## 🐛 **Troubleshooting**

### **Screenshots Not Working**
- Ensure the app has screen recording permissions (macOS)
- Check that global shortcuts are not blocked by other apps

### **Drag & Drop Issues**
- Make sure you're dragging image files
- Check that the app window is focused

### **Clipboard Problems**
- Ensure images are properly copied to clipboard
- Try copying the image again

### **Build Issues**
- Make sure all dependencies are installed
- Check that Electron Forge is properly configured

## 📝 **Customization**

### **Adding New Features**
- Edit `main.js` for main process features
- Edit `preload.js` to expose new APIs
- Edit `renderer.js` for web app integration

### **Styling**
- Modify the drop zone styles in `renderer.js`
- Update notification styles and animations

### **Shortcuts**
- Add new global shortcuts in `main.js`
- Handle them in `renderer.js`

## 🔧 **Development**

### **Debug Mode**
```bash
# Enable DevTools
# Add this to main.js:
mainWindow.webContents.openDevTools();
```

### **Hot Reload**
```bash
# For development, you can use electron-reload
npm install electron-reload --save-dev
```

---

**Built with ❤️ using Electron and ConcoreNews** 