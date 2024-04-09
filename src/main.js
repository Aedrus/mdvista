const { app, BrowserWindow, Menu, webContents, dialog, ipcMain } = require('electron');
const { readFile, existsSync, writeFile, readFileSync, writeFileSync } = require('fs');
const path = require('path');
const Ajv = require("ajv");

// -----------------------------------
// Constants & Schemas
// -----------------------------------
const FilePaths = {
    PREF_ROOT_PATH: path.join(app.getPath('userData'), 'UserPreferences.json'),
    TEMPLATE_PATH: path.join(__dirname, "defaultUserPreferences.json")
}

const userPrefsSchema = {
    type: "object",
    properties: {
        theme: {
            description: "The UI theme for the app; choose between light and dark.",
            type: "string",
            enum: ["light", "dark"],
            default: "light"
        }
    },
    required: ["theme"]
}
const ajv = new Ajv();
const jsonValidator = ajv.compile(userPrefsSchema)

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open File...',
                click: () => {
    
                }
            },
            {
                label: 'Open New Window',
                click: () => {
    
                }
            },
            {
                label: 'Options',
                accelerator: 'CmdOrCtrl+O',
                click: () => {
                    mainWindow.webContents.send('openOptions', true)
                }
            },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Cut',
                click: () => {
    
                }
            },
            {
                label: 'Copy',
                click: () => {
    
                }
            },
            {
                label: 'Paste',
                click: () => {
                    
                }
            },
            {
                label: 'Refresh',
                click: () => {
    
                }
            },
        ],
    },
    {
        label: 'View',
        submenu: [
            {
                label: 'Zoom In',
                click: () => {
    
                }
            },
            {
                label: 'Zoom Out',
                click: () => {
                    
                }
            },
            { type: 'separator' },
            {
                label: 'Developer Tools...',
                accelerator: 'F12',
                click: () => {
                    if (mainWindow.webContents.isDevToolsOpened()) {
                        mainWindow.webContents.closeDevTools()
                    } else {
                        mainWindow.webContents.openDevTools()
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Maximize',
                click: () => {
                    
                }
            },
            {
                label: 'Minimize',
                click: () => {
                    
                }
            }
        ],
    }
]

// -----------------------------------
// Create Main Window
// -----------------------------------
var mainWindow;
const createWindow = () => {
    mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 500,
    webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

    // Load the HTML page in window.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools at Render.
    mainWindow.webContents.openDevTools();

    return mainWindow
};

// -----------------------------------
// Prepare-to-Render Phase for App
// -----------------------------------
if (require('electron-squirrel-startup')) {
    app.quit();
}

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)

app.whenReady().then(() => {
    // Preliminaries
    checkUserPrefs()
    ipcMain.handle('loadPreferences', handleLoadPreferences)
    ipcMain.handle('dialog:openFile', handleDialogFile)
    ipcMain.handle('direct:openFile', handleDirectFile)
    ipcMain.on('json:setPref', handleSetPreference)

    // Render main window
    createWindow();
    
    // Render window if app is running with none
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // MacOS close-all windows feature
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
});

// -----------------------------------
// File Processing Handlers
// -----------------------------------
async function handleDirectFile() {
    try {
        const filePath = process.argv[1]
        if (filePath === undefined || filePath == ".") {
            return ""
        }
        else if (!hasExtension(filePath, ['.md', '.markdown'])) {
            console.log('File is not of type .md or .markdown.')
        }
        return readMarkdownData(filePath)
    } catch(error) {
        console.log(`Could not load markdown file: ${error.message}`)
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
            console.log(`Could not convert markdown file: ${error.message}`)
        }
    } else {
        console.log("Could not get file. Please enter a valid file to continue.")
    }
}

async function readMarkdownData(filePath) {
    try {
        const markdownData = await readFileSync(filePath, 'utf8', err => console.error(err))
        return markdownData
    } catch(error) {
        console.log(`Could not read file markdown data: ${error.message}`)
    }
}

function checkUserPrefs() {
    try {
        if (existsSync(FilePaths.PREF_ROOT_PATH)) {
            return;
        }
        else {
            buildUserPrefs();
        }
    } catch(error) {
        console.log(`Error: ${error.message}`);
    }
}

function buildUserPrefs() {
    const template = readFileSync(FilePaths.TEMPLATE_PATH, 'utf-8')
    writeFile(FilePaths.PREF_ROOT_PATH, template, err => {
        if (err) {
            console.error(err)
        } else {
            return
        }
    })
}

async function handleSetPreference(event, preference) {
    try {
        const fileData = await readFileSync(FilePaths.PREF_ROOT_PATH, "utf8")
        if (!fileData) {
            console.log(`Could not load file data in HandleSetPreference()`);
        }
        let parsedData = await JSON.parse(fileData);

        // Add the new preference to parsed json
        await updateObjectByKey(parsedData, preference[0], preference[1])
    
        // Validate new parsed json
        const validCheck = jsonValidator(parsedData)

        // If valid, write to config (pref) file
        if (!validCheck) {
            console.error("Could not validate json")
            return
        } else {
            let jsonData = await JSON.stringify(parsedData)
            writeFileSync(FilePaths.PREF_ROOT_PATH, jsonData)
        }
    } catch(error) {
        console.log(`Could not set preference: ${error.message}`)
    }
}

function handleLoadPreferences() {
    const preferenceData = readFileSync(FilePaths.PREF_ROOT_PATH, "utf8");
    return preferenceData
}
// -----------------------------------
// Helper Functions
// -----------------------------------
/**
 * Checks if a `file` has a certain extension `ext` and returns __true__ if it does. 
 * The `ext` argument must be a single string, or an array of strings, and include the period/fullstop seperator prefix.
 * 
 * If the file does not have any of the specified extensions, returns __false__.
 * @param {any} file - The file to check for extension
 * @param {string} ext - The extension to compare against file. e.g. .txt or .json
 * @returns Boolean
 */
function hasExtension(file, ext) {
    if (Array.isArray(ext)) {
        return ext.some((val) => {
            return path.extname(file).toLowerCase() == val.toLowerCase()
        })
    } else {
        return path.extname(file).toLowerCase() === ext.toLowerCase()
    }
}

/**
 * Checks if an object `obj` has a key `key` and if so, updates the key with the new value `newValue`. 
 * 
 * If the object does not have the key on it, then we return an error message.
 * @param {object} obj - The object to check and modify
 * @param {string} key - The key to check for in obj.
 * @param {string} newValue - The new value to inject if key exists.
 */
function updateObjectByKey(obj, key, newValue) {
    if (Object.hasOwn(obj, key)) {
        obj[key] = newValue;
    } else {
        console.log(`Key '${key}' does not exist in '${obj}'`);
    }
}