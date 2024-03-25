const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { readFile } = require('fs/promises')
const showdown = require('showdown');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
    ipcMain.handle('dialog:openFile', handleMarkdownFile)
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// -----------------------------------
// Handle File Processing
// -----------------------------------
async function handleMarkdownFile() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [
            { name: 'Markdown Source File', extensions: ['md', 'markdown'] },
        ]
    })

    if (!canceled) {
        try {
            return readMarkdownData(filePaths[0])
        } catch(error) {
            console.error(`Could not convert markdown file: ${error.message}`)
        }
    } else {
        return new Error("Could not get file. Please enter a valid file to continue.")
    }
}

async function readMarkdownData(filePath) {
    try {
        const markdownData = await readFile(filePath, 'utf-8')
        return markdownData
    } catch(err) {
        console.error(`Could not read file data: ${err.message}`)
    }
}