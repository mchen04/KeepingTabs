// Theme Management
export function initializeTheme() {
    chrome.storage.sync.get('darkMode', ({ darkMode }) => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-switch').checked = true;
        }
    });
}

export function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');
    chrome.storage.sync.set({ darkMode: isDarkMode });
}

// Helper function to get current theme
export function getCurrentTheme() {
    return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
}
