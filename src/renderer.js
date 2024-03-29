// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const showdown = require('showdown')

// -----------------------------------
// JavaScript Element Constants
// -----------------------------------
var root = document.documentElement;

const fileUpload = document.getElementById('upload-btn');
const markdownContainer = document.getElementById('markdown-content');

const dropdownBtn = document.querySelector(".dropbtn");
const dropdownBtnContent = document.querySelector(".dropdown-content");

const optionsModal = document.getElementById('OptionsModal')
const optionsModalClose = document.querySelector('.modal-close')

const lightThemeOption = document.getElementById('light')
const darkThemeOption = document.getElementById('dark')

// -----------------------------------
// Session Storage Process
// -----------------------------------
function addToSessionStorage(data) {
    sessionStorage.setItem("docContent", data)
}

// -----------------------------------
// Markdown File Rendering
// -----------------------------------
function renderMarkdownFile(markdownData) {
    try {
        // Check for false values
        if (!markdownData) {
            return
        }

        // Open markdown data as preview
        const parsedHtml = parseMarkdownFile(markdownData)
    
        // Create HTML container for parsed markdown data
        const htmlContent = document.createElement('div')
        htmlContent.innerHTML = parsedHtml

        // Inject HTML into parent container + add to storage
        markdownContainer.replaceChildren(htmlContent)
        addToSessionStorage(htmlContent.outerHTML)

        // Hide upload button
        fileUpload.classList.add('hidden')

    } catch(error) {
        console.error(`Could not render markdown data: ${err.message}`)
    }
}

function parseMarkdownFile(markdownData) {
    try {
        const converter = new showdown.Converter({ 
            ghCompatibleHeaderId: true,
            disableForced4SpacesIndentedSublists: true,
            strikethrough: true,
            tables: true,
        })
        return converter.makeHtml(markdownData)
    } catch (error) {
        throw new Error(`Markdown data from backend could not be parsed: ${error.message}`)
    }
}

function refreshContent(sessionKey) {
    markdownContainer.innerHTML = sessionStorage.getItem(sessionKey)
    fileUpload.classList.add('hidden')
}

// -----------------------------------
// Base Component Functionality
// -----------------------------------
function toggleDropdown() {
    if (dropdownBtnContent.classList.contains('active')) {
        dropdownBtnContent.classList.add('hidden');
        dropdownBtnContent.classList.remove('active');
    } else {
        dropdownBtnContent.classList.add('active');
        dropdownBtnContent.classList.remove('hidden');
    }
}

function toggleModal() {
    if (optionsModal.classList.contains('active')) {
        optionsModal.classList.add('hidden');
        optionsModal.classList.remove('active');
    } else {
        optionsModal.classList.add('active');
        optionsModal.classList.remove('hidden');
    }
}

function selectTheme(option) {
    root.setAttribute('data-theme', option.id)
  }

// -----------------------------------
// Event Listeners
// -----------------------------------
/* Listener for refreshing changes and direct file from backend. */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        if (sessionStorage.getItem('docContent')) {
            refreshContent('docContent')
        } else {
            const markdownFileData = await electronAPI.openDirectFile();
            renderMarkdownFile(markdownFileData);
        }
    } catch (error) {
        console.error(`Error opening file: ${error.message}`);
    }
});

/* Listener for opening file dialog from frontend. */
fileUpload.addEventListener('click', async () => {
    try {
        const markdownFileData = await electronAPI.openDialogFile();
        renderMarkdownFile(markdownFileData);
    } catch (error) {
        console.error(`Error uploading file: ${error.message}`);
    }
});

/* Listener for opening options menu. */
window.electronAPI.onOpenOptions((value) => {
    if (value) {
        optionsModal.classList.add('active');
        optionsModal.classList.remove('hidden');
    }
  })

/* Listener for general click events. */
window.addEventListener('click', (event) => {
    if (!event.target.matches('.dropbtn')) {
        if (dropdownBtnContent.classList.contains('active')) {
            dropdownBtnContent.classList.add('hidden');
            dropdownBtnContent.classList.remove('active');
        }
    }
})

/* Listener(s) for toggling of elements. */
dropdownBtn.addEventListener('click', (e) => toggleDropdown(e))
optionsModalClose.addEventListener('click', (e) => toggleModal(e))
lightThemeOption.addEventListener('click', (e) => selectTheme(e.target))
darkThemeOption.addEventListener('click', (e) => selectTheme(e.target))