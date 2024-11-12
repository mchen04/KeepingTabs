// DOM Elements
const themeSwitch = document.getElementById('theme-switch');
const tabCountElement = document.getElementById('tabCount');
const categoryCountElement = document.getElementById('categoryCount');
const openDashboardButton = document.getElementById('openDashboard');

// Theme Management
function initializeTheme() {
    chrome.storage.sync.get('darkMode', ({ darkMode }) => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');
    chrome.storage.sync.set({ darkMode: isDarkMode });
}

// Tab Statistics
async function updateTabStats() {
    // Get current tab count
    const tabs = await chrome.tabs.query({});
    tabCountElement.textContent = tabs.length;

    // Get category count from storage
    chrome.storage.sync.get('categories', ({ categories = [] }) => {
        categoryCountElement.textContent = categories.length;
    });
}

// Dashboard Navigation
function openDashboard() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html')
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    updateTabStats();
});

themeSwitch.addEventListener('change', toggleTheme);
openDashboardButton.addEventListener('click', openDashboard);

// Update stats when popup opens
chrome.tabs.onCreated.addListener(updateTabStats);
chrome.tabs.onRemoved.addListener(updateTabStats);
chrome.storage.onChanged.addListener((changes) => {
    if (changes.categories) {
        updateTabStats();
    }
});
