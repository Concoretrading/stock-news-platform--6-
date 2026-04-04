// Renderer script to be injected into the web app
// This script bridges the web app with native Electron features

(function() {
  'use strict';

  // Check if we're running in Electron
  if (!window.concore) {
    console.log('Not running in Electron - native features disabled');
    return;
  }

  console.log('ConcoreNews Desktop App loaded with native features');

  // Initialize native features
  let isInitialized = false;

  function initializeNativeFeatures() {
    if (isInitialized) return;
    isInitialized = true;

    // Listen for file drops from native OS
    window.concore.onFileDropped((filePath) => {
      console.log('File dropped:', filePath);
      handleNativeFile(filePath);
    });

    // Listen for screenshot captures
    window.concore.onScreenshotCaptured((filePath) => {
      console.log('Screenshot captured:', filePath);
      handleNativeFile(filePath);
    });

    // Listen for clipboard images
    window.concore.onClipboardImage((filePath) => {
      console.log('Clipboard image:', filePath);
      handleNativeFile(filePath);
    });

    // Add global keyboard shortcuts
    document.addEventListener('keydown', handleGlobalShortcuts);

    // Add native file drop zone
    addNativeDropZone();

    console.log('Native features initialized');
  }

  function handleNativeFile(filePath) {
    // Convert file path to File object
    fetch(`file://${filePath}`)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], filePath.split('/').pop(), { type: 'image/png' });
        
        // Trigger the screenshot analyzer
        triggerScreenshotAnalyzer(file);
      })
      .catch(error => {
        console.error('Error handling native file:', error);
        // Fallback: try to open file dialog
        window.concore.selectFile().then(selectedPath => {
          if (selectedPath) {
            handleNativeFile(selectedPath);
          }
        });
      });
  }

  function triggerScreenshotAnalyzer(file) {
    // Find the screenshot analyzer component and trigger file upload
    const fileInput = document.querySelector('input[type="file"][accept*="image"]');
    if (fileInput) {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Trigger change event
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
      
      // Show notification
      showNotification('File loaded from desktop', 'success');
    } else {
      showNotification('Screenshot analyzer not found', 'error');
    }
  }

  function handleGlobalShortcuts(event) {
    // Cmd/Ctrl + Shift + S: Capture screenshot
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      window.concore.captureScreenshot();
    }
    
    // Cmd/Ctrl + Shift + V: Paste from clipboard
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'V') {
      event.preventDefault();
      window.concore.pasteClipboard();
    }
  }

  function addNativeDropZone() {
    // Create a floating drop zone that appears when dragging files
    const dropZone = document.createElement('div');
    dropZone.id = 'concore-native-drop-zone';
    dropZone.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.9);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      font-size: 24px;
      font-weight: bold;
      backdrop-filter: blur(4px);
    `;
    dropZone.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📸</div>
        <div>Drop image here to analyze</div>
        <div style="font-size: 14px; margin-top: 8px; opacity: 0.8;">
          Supports: PNG, JPG, GIF, BMP, WebP
        </div>
      </div>
    `;
    
    document.body.appendChild(dropZone);

    // Show drop zone when dragging files over the window
    document.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        dropZone.style.display = 'flex';
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (!e.relatedTarget || !document.body.contains(e.relatedTarget)) {
        dropZone.style.display = 'none';
      }
    });

    document.addEventListener('drop', (e) => {
      dropZone.style.display = 'none';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          triggerScreenshotAnalyzer(file);
        }
      }
    });
  }

  function showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      ${type === 'success' ? 'background: #10b981;' : ''}
      ${type === 'error' ? 'background: #ef4444;' : ''}
      ${type === 'info' ? 'background: #3b82f6;' : ''}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNativeFeatures);
  } else {
    initializeNativeFeatures();
  }

  // Also initialize when the page loads (for SPA navigation)
  window.addEventListener('load', initializeNativeFeatures);

})(); 