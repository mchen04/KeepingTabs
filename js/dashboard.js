import { initializeTheme, toggleTheme } from './modules/theme.js';
import { initializeCategories, handleCategoryActions } from './modules/categories.js';
import { initializeTabs, handleTabActions } from './modules/tabs.js';
import { initializeViewToggle } from './modules/views.js';

// DOM Elements
const themeSwitch = document.getElementById('theme-switch');
const settingsButton = document.getElementById('settingsButton');
const helpButton = document.getElementById('helpButton');

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    initializeTheme();
    
    // Initialize categories and tabs
    await Promise.all([
        initializeCategories(),
        initializeTabs(),
        initializeViewToggle()
    ]);

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Theme toggle
    themeSwitch.addEventListener('change', toggleTheme);

    // Category actions (add, edit, delete, freeze)
    document.querySelector('.categories-list').addEventListener('click', handleCategoryActions);

    // Tab actions (edit name, change category, freeze, delete)
    document.querySelector('.tab-display').addEventListener('click', handleTabActions);

    // Settings and Help navigation
    settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement settings modal
    });

    helpButton.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement help modal
    });
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'tabUpdated') {
        initializeTabs(); // Refresh tabs when changes occur
    }
});
