// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const sd = require('showdown')

const fileUpload = document.getElementById('upload-btn')
const markdownContainer = document.getElementById('markdown-content')

// -----------------------------------
// Markdown File Rendering
// -----------------------------------
function renderMarkdownFile(markdownData) {
    try {
        if (!markdownData) {
            return
        }
        // Open markdown data as preview
        const parsedHtml = parseMarkdownFile(markdownData)
    
        // Inject parsed HTML into the frontend.
        const htmlContainer = document.createElement('div')
        htmlContainer.innerHTML = parsedHtml
        markdownContainer.replaceChildren(htmlContainer)
    } catch(error) {
        console.error(`Could not render markdown data: ${err.message}`)
    }
}

function parseMarkdownFile(markdownData) {
    try {
        // Parse markdownData to HTML
        const converter = new sd.Converter({ghCompatibleHeaderId: true})
        return converter.makeHtml(markdownData)
    } catch (err) {
        throw new Error(`Data from backend could not be pulled: ${err.message}`)
    }
}

// -----------------------------------
// Event Listeners
// -----------------------------------
fileUpload.addEventListener('click', async () => {
    try {
        const markdownFileData = await electronAPI.openDialogFile();
        renderMarkdownFile(markdownFileData);
    } catch (error) {
        console.error(`Error uploading file: ${error.message}`);
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const markdownFileData = await electronAPI.openDirectFile();
        renderMarkdownFile(markdownFileData);
    } catch (error) {
        console.error(`Error opening file: ${error.message}`);
    }
});