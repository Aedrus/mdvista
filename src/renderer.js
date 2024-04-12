// -----------------------------------
// Renderer: Used to render web page 
// content and handle events.
// -----------------------------------
import './index.css';
const {capitalizeFirstLetter} = require('./utility')
const showdown = require('showdown');
import anime from 'animejs';

// -----------------------------------
// JavaScript Element Constants
// -----------------------------------
var root = document.documentElement;

const fileUpload = document.getElementById('upload-btn');
const fileUploadSection = document.getElementById('upload-btn-section');

const markdownContainer = document.getElementById('markdown-content');
const markdownContainerCover = document.querySelector('.markdown-content-cover')

const dropdownBtn = document.querySelector(".dropbtn");
const dropdownBtnContent = document.querySelector(".dropdown-content");

const optionsModal = document.getElementById('OptionsModal')
const optionsModalClose = document.querySelector('.modal-close')

const userOptionsGroup = document.querySelectorAll('a[data-prop]')

// -----------------------------------
// State Management
// -----------------------------------
// let appState = {
//     theme: "light",
//     textSize: "16",
//     setState(state, newValue) {
//         if (this.hasOwnProperty(state)) {
//             this[state] = newValue
//         } else {
//             console.log(`${state} does not exist on app state.`)
//         }
//     },
//     getState(state) {
//         if (this.hasOwnProperty(state)) {
//             return this[state]
//         } else {
//             throw new Error((`${state} does not exist on app state.`))
//         }
//     }
// }

const appStateManager = {
    updateTheme: function(option) {
        root.setAttribute('data-theme', option)
    }
}

// -----------------------------------
// HTML Fragments
// -----------------------------------
const checkmarkHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="checkmark" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M243.28,68.24l-24-23.56a16,16,0,0,0-22.59,0L104,136.23l-36.69-35.6a16,16,0,0,0-22.58.05l-24,24a16,16,0,0,0,0,22.61l71.62,72a16,16,0,0,0,22.63,0L243.33,90.91A16,16,0,0,0,243.28,68.24ZM103.62,208,32,136l24-24a.6.6,0,0,1,.08.08l42.35,41.09a8,8,0,0,0,11.19,0L208.06,56,232,79.6Z"></path></svg>`

// -----------------------------------
// Session Storage
// -----------------------------------
function addToSessionStorage(data) {
    sessionStorage.setItem("docContent", data)
}

// -----------------------------------
// User Preferences Loading
// -----------------------------------
async function loadUserPreferences() {
    try {
        // Load user preferences
        let preferences = await electronAPI.loadPreferences();
        preferences = JSON.parse(preferences);

        for (const prop in preferences) {
            const element = document.querySelector(`[data-${prop}]`)
            if (!element) {
                continue 
            }

            element.setAttribute(`data-${prop}`, preferences[prop])
 
            userOptionsGroup.forEach(element => {
                if (!element.innerHTML.includes('</svg>')) {
                    if (element.classList.contains(preferences[prop])) {
                        element.innerHTML += checkmarkHtml
                    }
                }
            })
        }
    } catch(error) {
        console.log(`Could not load prefs: ${error.message}`)
    }
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
        fileUploadSection.classList.add('hidden')

        // Animate cover
        if (markdownContainerCover.classList.contains('hidden')) {
            markdownContainerCover.classList.add('active')
            markdownContainerCover.classList.remove('hidden')
            anime({
                targets: markdownContainerCover,
                translateY: '100%',
                opacity: [
                    {value: 1, duration: 1500, delay: 100},
                    {value: 0, duration: 1500, delay: 0},
                ],
                easing: 'easeInOutQuart',
                delay: 10,
                loop: false
            })
        }
        
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
    fileUploadSection.classList.add('hidden')
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

function selectOption(option) {
    // Set page theme
    appStateManager.updateTheme(option.classList[0])

    // Send config setting to pref file.
    const prefVal = option.classList[0]
    const prefProp = option.getAttribute("data-prop")
    electronAPI.setPref([prefProp, prefVal])

    // Append active icon if none
    if (!option.innerHTML.includes('</svg>')) {
        for (let i = 0; i < dropdownBtnContent.children.length; i++) {
            // If the element we're on is our target, add checkmark.
            if (dropdownBtnContent.children[i].classList.contains(option.classList[0])) {
                option.innerHTML += checkmarkHtml
            } 

            // Any other elements that are not target, we remove checkmark.
            else {
                dropdownBtnContent.children[i].innerHTML = capitalizeFirstLetter(dropdownBtnContent.children[i].classList[0])
            }
        }
    }
}

// -----------------------------------
// Event Listeners
// -----------------------------------
/* Listener for refreshing changes and pulling file from backend. */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        if (sessionStorage.getItem('docContent')) {
            refreshContent('docContent')
        } else {
            const markdownFileData = await electronAPI.openDirectFile();
            renderMarkdownFile(markdownFileData);
        }
        loadUserPreferences()
    } catch (error) {
        console.error(`Error opening file: ${error.message}`);
    }

    /* Listener(s) for basic element functionality. */
    dropdownBtn.addEventListener('click', (e) => toggleDropdown(e))
    optionsModalClose.addEventListener('click', (e) => toggleModal(e))
    userOptionsGroup.forEach((option) => {
        option.addEventListener('click', (e) => selectOption(option))
    })

    // Animations
    anime({
        targets: '.upload-btn-background',
        keyframes: [
            {rotate: '0turn', opacity: 0, duration: 0},
            {rotate: '1turn', opacity: 1, duration: 4000},
            {rotate: '0turn', opacity: 0, duration: 4000},
        ],
        delay: anime.stagger(550, {from: 'last', easing: 'easeInOutQuart'}),
        easing: 'easeInOutQuart', 
        loop: true
    })
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
    if (!value) {
        return
    }
    if (optionsModal.classList.contains('hidden')) {
        optionsModal.classList.add('active');
        optionsModal.classList.remove('hidden');
    } else {
        optionsModal.classList.add('hidden');
        optionsModal.classList.remove('active');
    }
  })

window.electronAPI.onOpenNewFile( async (value) => {
    if (!value) {
        return
    }

    try {
        const markdownFileData = await electronAPI.openDialogFile();
        renderMarkdownFile(markdownFileData);
    } catch (error) {
        console.error(`Error opening new file: ${error.message}`);
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