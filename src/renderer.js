// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const fileUpload = document.getElementById("upload");
const fileUpload2 = document.getElementById("upload-btn")

// -----------------------------------
// Markdown File Handling
// -----------------------------------
function loadFile() {
    let file = fileUpload.files[0];
    let fileExt = file.name.split('.').at(-1)

    // Preliminary Error Check
    if (!file.name.includes('.md') || fileExt !== 'md') {
        alert("Improper file type. Please upload a .md file.")
        throw new Error("Improper file type. Please upload a .md file.")
    }
    
    // Convert file to FormData
    let formData = new FormData();
    formData.append('file', file)

    // Send off to backend
}

async function runDialog() {
    const filePath = await electronAPI.openFile();
    console.log(filePath);
}

fileUpload.addEventListener('change', loadFile)
fileUpload2.addEventListener('click', runDialog)
