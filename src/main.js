const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const { existsSync, writeFile, readFileSync, writeFileSync } = require('fs');
const path = require('path');
const Ajv = require("ajv");

// Close app if using squirrel startup (windows)
if (require('electron-squirrel-startup')) {
    app.quit();
}

// -----------------------------------
// Constants & Schemas
// -----------------------------------
const THEME_DEFAULTS = {
    COLOR_LIGHT: '#ffffff',
    COLOR_DARK: '#202124'
}

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
                accelerator: 'CmdOrCtrl+F',
                click: () => {
                    const currentWindow = BrowserWindow.getFocusedWindow();
                    currentWindow.webContents.send('dialog:openNewFile', true)
                }
            },
            {
                label: 'Open New Window',
                accelerator: 'CmdOrCtrl+Shift+N',
                click: () => {
                    createWindow()
                }
            },
            {
                label: 'Close Window',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                label: 'Preferences',
                accelerator: 'CmdOrCtrl+O',
                click: () => {
                    const currentWindow = BrowserWindow.getFocusedWindow();
                    currentWindow.webContents.send('openOptions', true)
                }
            },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'copy' },
            { role: 'paste' },
            { type: 'separator' },
            { role: 'reload' },
            { role: 'forceReload' },
        ],
    },
    {
        label: 'View',
        submenu: [
            { role: 'zoomIn', accelerator: 'CmdOrCtrl++' },
            { role: 'zoomOut' },
            { role: 'resetZoom' },
            { type: 'separator' },
            {
                label: 'Developer Tools...',
                accelerator: 'F12',
                click: () => {
                    const currentWindow = BrowserWindow.getFocusedWindow();
                    if (currentWindow.webContents.isDevToolsOpened()) {
                        currentWindow.webContents.closeDevTools()
                    } else {
                        currentWindow.webContents.openDevTools()
                    }
                }
            },
        ],
    }
];

// -----------------------------------
// Create Main Window
// -----------------------------------
// Array/Set of currently open windows.
let windows = new Set();

var newWindow
const createWindow = () => {
    newWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 500,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: 'white',
            symbolColor: 'black',
        },
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // Load the HTML page in window.
    newWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    
    newWindow.once('ready-to-show', () => {
        newWindow.webContents.setZoomFactor(1.0)
        newWindow.setTitleBarOverlay({
            color: getThemePref(),
            symbolColor: getThemePref(true),
        })
        newWindow.show()
    });

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null
    });

    windows.add(newWindow);
    return newWindow;
};

// -----------------------------------
// Prepare-to-Render Phase for App
// -----------------------------------

// Build Menu Bar
const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)

app.whenReady().then(() => {
    // Squirrel
    if (process.argv.includes('--squirrel-firstrun')) {
        app.quit()
    }

    // Preliminaries & Handlers
    checkUserPrefs()
    ipcMain.handle('loadPreferences', handleLoadPreferences)
    ipcMain.handle('dialog:openFile', handleDialogFile)
    ipcMain.handle('direct:openFile', handleDirectFile)
    ipcMain.on('json:setPref', handleSetPreference)
    ipcMain.on('titleBar:color', handleUpdateTitleBar)
    ipcMain.on('menu:openMenu', handleOpenMenu)

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
            return undefined
        }
        else if (!hasExtension(filePath, ['.md', '.markdown'])) {
            console.log('File is not of type .md or .markdown.')
        }

        let fileName = path.basename(filePath)
        fileName = fileName.split('.')[0]

        return {
            data: readMarkdownData(filePath),
            name: fileName
        }
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
            let fileName = path.basename(filePaths[0])
            fileName = fileName.split('.')[0]
            return {
                data: readMarkdownData(filePaths[0]),
                name: fileName
            }
        } catch(error) {
            console.log(`Could not convert markdown file: ${error.message}`)
        }
    } else {
        console.log("Could not get file. Please enter a valid file to continue.")
    }
}

function readMarkdownData(filePath) {
    try {
        const markdownData = readFileSync(filePath, 'utf8')
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

async function handleUpdateTitleBar(event, value) {
    if (!value) {
        console.log("error: could not update title bar.");
    }
    else if (value === 'light') {
        newWindow.setTitleBarOverlay({
            color: THEME_DEFAULTS.COLOR_LIGHT,
            symbolColor: THEME_DEFAULTS.COLOR_DARK
        })
    } else if (value === 'dark') {
        newWindow.setTitleBarOverlay({
            color: THEME_DEFAULTS.COLOR_DARK,
            symbolColor: THEME_DEFAULTS.COLOR_LIGHT
        })
    }
}

async function handleLoadPreferences() {
    return await readFileSync(FilePaths.PREF_ROOT_PATH, "utf8");
}

async function handleOpenMenu() {
    if (newWindow) {
        await menu.popup(newWindow)
    }
}

// -----------------------------------
// Helper Functions
// -----------------------------------
/**
 * Gets the value associated with the theme property in the preferences file.
 * 
 * If a boolean value is passed for the `invert` parameter, then returns the
 * opposite value associated with the property.
 * @param {boolean} invert - Optional parameter to invert the return value.
 * @returns string
**/
function getThemePref(invert) {
    const preferenceData = readFileSync(FilePaths.PREF_ROOT_PATH, "utf8");
    const preferences = JSON.parse(preferenceData);
    for (const key in preferences) {
        if (key === 'theme') {
            if (invert) {
                return (preferences[key] === 'light')
                ? THEME_DEFAULTS.COLOR_DARK
                : THEME_DEFAULTS.COLOR_LIGHT;
            }
            return (preferences[key] === 'light')
            ? THEME_DEFAULTS.COLOR_LIGHT
            : THEME_DEFAULTS.COLOR_DARK;
        }
    }
    return THEME_DEFAULTS.COLOR_LIGHT
}

/**
 * Checks if a `file` has a certain extension `ext` and returns __true__ 
 * if it does. 
 * The `ext` argument must be a single string, or an array of strings, and 
 * include the period/fullstop seperator prefix.
 * 
 * If the file does not have any of the specified extensions, return __false__.
 * @param {any} file - The file to check for extension
 * @param {string} ext - The extension to compare against file. e.g. .txt
 * @returns Boolean
**/
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
 * Checks if an object `obj` has a key `key` and if so, updates the key 
 * with the new value `newValue`. 
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