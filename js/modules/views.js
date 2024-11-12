const defaultViewBtn = document.getElementById('defaultView');
const whiteboardViewBtn = document.getElementById('whiteboardView');
const tabDisplay = document.querySelector('.tab-display');

export function initializeViewToggle() {
    // Load saved view preference
    chrome.storage.sync.get('viewMode', ({ viewMode = 'default' }) => {
        setViewMode(viewMode);
    });

    // Set up event listeners
    defaultViewBtn.addEventListener('click', () => switchView('default'));
    whiteboardViewBtn.addEventListener('click', () => switchView('whiteboard'));
}

function switchView(mode) {
    setViewMode(mode);
    chrome.storage.sync.set({ viewMode: mode });
}

function setViewMode(mode) {
    // Update button states
    defaultViewBtn.classList.toggle('active', mode === 'default');
    whiteboardViewBtn.classList.toggle('active', mode === 'whiteboard');

    // Update display mode
    tabDisplay.classList.remove('default-view', 'whiteboard-view');
    tabDisplay.classList.add(`${mode}-view`);

    // Apply specific view styles
    if (mode === 'whiteboard') {
        applyWhiteboardLayout();
    } else {
        applyDefaultLayout();
    }
}

function applyDefaultLayout() {
    // Reset to default grid layout
    tabDisplay.style.display = 'block';
    
    // Make sure all category sections use grid layout
    const categorySections = tabDisplay.querySelectorAll('.category-tabs');
    categorySections.forEach(section => {
        section.style.display = 'grid';
        section.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        section.style.gap = '16px';
    });

    // Reset any whiteboard-specific styles
    const tabCards = tabDisplay.querySelectorAll('.tab-card');
    tabCards.forEach(card => {
        card.style.position = '';
        card.style.left = '';
        card.style.top = '';
    });
}

function applyWhiteboardLayout() {
    // Convert to absolute positioning for free-form layout
    tabDisplay.style.display = 'block';
    tabDisplay.style.position = 'relative';
    tabDisplay.style.height = '100%';

    // Make category sections stack vertically but allow free positioning of cards
    const categorySections = tabDisplay.querySelectorAll('.category-tabs');
    categorySections.forEach(section => {
        section.style.display = 'block';
        section.style.position = 'relative';
        section.style.minHeight = '200px';
    });

    // Enable draggable cards
    const tabCards = tabDisplay.querySelectorAll('.tab-card');
    tabCards.forEach(card => {
        makeCardDraggable(card);
    });

    // Load saved positions
    loadCardPositions();
}

function makeCardDraggable(card) {
    card.draggable = true;
    
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.tabId);
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        
        // Save new position
        const rect = card.getBoundingClientRect();
        const containerRect = tabDisplay.getBoundingClientRect();
        
        const position = {
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top
        };

        saveCardPosition(card.dataset.tabId, position);
    });
}

async function loadCardPositions() {
    const { cardPositions = {} } = await chrome.storage.sync.get('cardPositions');
    
    Object.entries(cardPositions).forEach(([tabId, position]) => {
        const card = tabDisplay.querySelector(`.tab-card[data-tab-id="${tabId}"]`);
        if (card) {
            card.style.position = 'absolute';
            card.style.left = `${position.left}px`;
            card.style.top = `${position.top}px`;
        }
    });
}

async function saveCardPosition(tabId, position) {
    const { cardPositions = {} } = await chrome.storage.sync.get('cardPositions');
    cardPositions[tabId] = position;
    await chrome.storage.sync.set({ cardPositions });
}

// Handle drag and drop events on the container
tabDisplay.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingCard = document.querySelector('.dragging');
    if (draggingCard) {
        const rect = tabDisplay.getBoundingClientRect();
        draggingCard.style.position = 'absolute';
        draggingCard.style.left = `${e.clientX - rect.left - draggingCard.offsetWidth / 2}px`;
        draggingCard.style.top = `${e.clientY - rect.top - draggingCard.offsetHeight / 2}px`;
    }
});
