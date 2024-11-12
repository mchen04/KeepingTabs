// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Notify dashboard of tab updates
    chrome.runtime.sendMessage({
        type: 'tabUpdated',
        tabId,
        changeInfo,
        tab
    });
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    // Clean up storage when tabs are closed
    chrome.storage.sync.get(['tabCategories', 'frozenTabs', 'customTabNames', 'cardPositions'], 
        ({ tabCategories = {}, frozenTabs = {}, customTabNames = {}, cardPositions = {} }) => {
            // Remove tab from categories
            delete tabCategories[tabId];
            // Remove frozen state
            delete frozenTabs[tabId];
            // Remove custom name
            delete customTabNames[tabId];
            // Remove saved position
            delete cardPositions[tabId];

            // Update storage
            chrome.storage.sync.set({
                tabCategories,
                frozenTabs,
                customTabNames,
                cardPositions
            });
    });
});

// Handle tab creation
chrome.tabs.onCreated.addListener((tab) => {
    // Check if the tab was created from a frozen tab/category
    chrome.storage.sync.get(['frozenTabs', 'tabCategories'], ({ frozenTabs = {}, tabCategories = {} }) => {
        if (tab.openerTabId && frozenTabs[tab.openerTabId]) {
            // Inherit frozen state and category from opener tab
            frozenTabs[tab.id] = true;
            tabCategories[tab.id] = tabCategories[tab.openerTabId];

            chrome.storage.sync.set({ frozenTabs, tabCategories });
        }
    });
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set up default categories
        const defaultCategories = [
            { id: 'research', name: 'Research', color: '#4A90E2', frozen: false },
            { id: 'study', name: 'Study Materials', color: '#50E3C2', frozen: false },
            { id: 'references', name: 'References', color: '#F5A623', frozen: false }
        ];

        // Initialize storage with default settings
        chrome.storage.sync.set({
            categories: defaultCategories,
            darkMode: false,
            viewMode: 'default',
            tabCategories: {},
            frozenTabs: {},
            customTabNames: {},
            cardPositions: {}
        });
    }
});

// Memory management for frozen tabs
chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.storage.sync.get('frozenTabs', ({ frozenTabs = {} }) => {
        if (frozenTabs[tabId]) {
            // Unfreeze tab when it becomes active
            delete frozenTabs[tabId];
            chrome.storage.sync.set({ frozenTabs });
        }
    });
});

// Optional: Periodic cleanup of stale data
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        cleanupStaleData();
    }
});

async function cleanupStaleData() {
    const tabs = await chrome.tabs.query({});
    const tabIds = new Set(tabs.map(tab => tab.id));

    chrome.storage.sync.get([
        'tabCategories',
        'frozenTabs',
        'customTabNames',
        'cardPositions'
    ], (data) => {
        // Remove data for tabs that no longer exist
        Object.keys(data.tabCategories || {}).forEach(id => {
            if (!tabIds.has(parseInt(id))) delete data.tabCategories[id];
        });
        Object.keys(data.frozenTabs || {}).forEach(id => {
            if (!tabIds.has(parseInt(id))) delete data.frozenTabs[id];
        });
        Object.keys(data.customTabNames || {}).forEach(id => {
            if (!tabIds.has(parseInt(id))) delete data.customTabNames[id];
        });
        Object.keys(data.cardPositions || {}).forEach(id => {
            if (!tabIds.has(parseInt(id))) delete data.cardPositions[id];
        });

        // Update storage with cleaned data
        chrome.storage.sync.set(data);
    });
}
