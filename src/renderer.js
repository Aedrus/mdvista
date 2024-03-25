// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const sd = require('showdown')

const fileUpload = document.getElementById('upload-btn')
const markdownContainer = document.getElementById('markdown-content')

// -----------------------------------
// Markdown File Handling
// -----------------------------------
async function openMarkdownFile() {
    try {
        // Request markdown file data from backend
        const markdownData = await electronAPI.openFile();

        // Parse markdownData to HTML
        const converter = new sd.Converter({ghCompatibleHeaderId: true});
        const parsedHtml = converter.makeHtml(markdownData);

        // Inject parsed HTML into the frontend.
        const htmlContainer = document.createElement('div')
        htmlContainer.innerHTML = parsedHtml
        markdownContainer.replaceChildren(htmlContainer)
    } catch (err) {
        console.error(`Data from backend could not be pulled: ${err.message}`)
    }
}

fileUpload.addEventListener('click', openMarkdownFile)
