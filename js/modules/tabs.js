import { getCategoryById, getAllCategories } from './categories.js';

const tabCardTemplate = document.getElementById('tabCardTemplate');
const tabDisplay = document.querySelector('.tab-display');

export async function initializeTabs() {
    const tabs = await chrome.tabs.query({});
    const { tabCategories = {} } = await chrome.storage.sync.get('tabCategories');
    
    // Group tabs by category
    const categorizedTabs = await categorizeTabs(tabs, tabCategories);
    renderTabs(categorizedTabs);
}

async function categorizeTabs(tabs, tabCategories) {
    const categories = await getAllCategories();
    const categorizedTabs = {};

    // Initialize categories
    categories.forEach(category => {
        categorizedTabs[category.id] = {
            category,
            tabs: []
        };
    });

    // Add uncategorized category
    categorizedTabs['uncategorized'] = {
        category: { id: 'uncategorized', name: 'Uncategorized', color: '#6B7C93' },
        tabs: []
    };

    // Sort tabs into categories
    tabs.forEach(tab => {
        const categoryId = tabCategories[tab.id] || 'uncategorized';
        if (categorizedTabs[categoryId]) {
            categorizedTabs[categoryId].tabs.push(tab);
        } else {
            categorizedTabs['uncategorized'].tabs.push(tab);
        }
    });

    return categorizedTabs;
}

function renderTabs(categorizedTabs) {
    tabDisplay.innerHTML = '';

    Object.values(categorizedTabs).forEach(({ category, tabs }) => {
        if (tabs.length === 0) return;

        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `
            <h2 class="category-title" style="color: ${category.color}">
                ${category.name} (${tabs.length})
            </h2>
            <div class="category-tabs"></div>
        `;

        // Add tabs to category section
        const tabsContainer = categorySection.querySelector('.category-tabs');
        tabs.forEach(tab => {
            const tabElement = createTabElement(tab, category);
            tabsContainer.appendChild(tabElement);
        });

        tabDisplay.appendChild(categorySection);
    });
}

function createTabElement(tab, category) {
    const element = tabCardTemplate.content.cloneNode(true);
    const tabCard = element.querySelector('.tab-card');
    
    // Set tab data
    tabCard.dataset.tabId = tab.id;
    tabCard.dataset.categoryId = category.id;

    // Set tab content
    const tabIcon = tabCard.querySelector('.tab-icon');
    tabIcon.style.backgroundImage = `url(${tab.favIconUrl || 'assets/default-favicon.png'})`;
    
    tabCard.querySelector('.tab-title').textContent = tab.title;

    // Set frozen state if category is frozen
    if (category.frozen) {
        tabCard.classList.add('frozen');
    }

    return element;
}

export async function handleTabActions(event) {
    const tabCard = event.target.closest('.tab-card');
    if (!tabCard) return;

    const tabId = parseInt(tabCard.dataset.tabId);
    const categoryId = tabCard.dataset.categoryId;

    if (event.target.closest('.edit-name')) {
        await editTabName(tabId);
    } else if (event.target.closest('.change-category')) {
        await changeTabCategory(tabId, categoryId);
    } else if (event.target.closest('.freeze-tab')) {
        await toggleTabFreeze(tabId, categoryId);
    } else if (event.target.closest('.delete-tab')) {
        await deleteTab(tabId);
    } else {
        // Navigate to tab if clicking on the card itself
        chrome.tabs.update(tabId, { active: true });
    }
}

async function editTabName(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const newName = prompt('Enter new tab name:', tab.title);
    
    if (newName && newName.trim()) {
        const { customTabNames = {} } = await chrome.storage.sync.get('customTabNames');
        customTabNames[tabId] = newName.trim();
        await chrome.storage.sync.set({ customTabNames });
        initializeTabs();
    }
}

async function changeTabCategory(tabId, currentCategoryId) {
    const categories = await getAllCategories();
    const categoryOptions = categories
        .map(c => `<option value="${c.id}"${c.id === currentCategoryId ? ' selected' : ''}>${c.name}</option>`)
        .join('');
    
    const newCategoryId = prompt('Select new category:\n' + categories.map((c, i) => `${i + 1}: ${c.name}`).join('\n'));
    
    if (newCategoryId && categories[newCategoryId - 1]) {
        const { tabCategories = {} } = await chrome.storage.sync.get('tabCategories');
        tabCategories[tabId] = categories[newCategoryId - 1].id;
        await chrome.storage.sync.set({ tabCategories });
        initializeTabs();
    }
}

async function toggleTabFreeze(tabId, categoryId) {
    const category = await getCategoryById(categoryId);
    if (!category) return;

    const { frozenTabs = {} } = await chrome.storage.sync.get('frozenTabs');
    frozenTabs[tabId] = !frozenTabs[tabId];
    await chrome.storage.sync.set({ frozenTabs });
    
    if (frozenTabs[tabId]) {
        chrome.tabs.discard(tabId);
    }
    
    initializeTabs();
}

async function deleteTab(tabId) {
    if (confirm('Are you sure you want to close this tab?')) {
        await chrome.tabs.remove(tabId);
        const { tabCategories = {} } = await chrome.storage.sync.get('tabCategories');
        delete tabCategories[tabId];
        await chrome.storage.sync.set({ tabCategories });
        initializeTabs();
    }
}
