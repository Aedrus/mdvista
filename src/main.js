const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { readFile } = require('fs/promises');
const path = require('path');

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
    ipcMain.handle('dialog:openFile', handleDialogFile)
    ipcMain.handle('direct:openFile', handleDirectFile)
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
async function handleDirectFile() {
    try {
        const filePath = process.argv[1]
        if (filePath === undefined) {
            return ""
        }
        else if (!hasExtension(filePath, ['.md', '.markdown'])) {
            throw new Error('File is not of type .md or .markdown.')
        }
        return readMarkdownData(filePath)
    } catch(error) {
        throw new Error(`Could not load markdown file: ${error.message}`)
    }
}

async function handleDialogFile() {
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

// -----------------------------------
// Helper Functions
// -----------------------------------

function hasExtension(file, ext) {
    if (Array.isArray(ext)) {
        return ext.some((val) => {
            return path.extname(file).toLowerCase() == val.toLowerCase()
        })
    } else {
        return path.extname(file).toLowerCase() === ext.toLowerCase()
    }
}