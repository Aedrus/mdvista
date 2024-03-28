// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const showdown = require('showdown')

const fileUpload = document.getElementById('upload-btn')
const markdownContainer = document.getElementById('markdown-content')

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
// Event Listeners
// -----------------------------------
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

fileUpload.addEventListener('click', async () => {
    try {
        const markdownFileData = await electronAPI.openDialogFile();
        renderMarkdownFile(markdownFileData);
    } catch (error) {
        console.error(`Error uploading file: ${error.message}`);
    }
});