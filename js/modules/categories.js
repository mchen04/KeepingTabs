// Default category colors
const DEFAULT_COLORS = [
    '#4A90E2', // Blue
    '#50E3C2', // Teal
    '#F5A623', // Orange
    '#D0021B', // Red
    '#7ED321', // Green
    '#9013FE', // Purple
    '#F8E71C', // Yellow
    '#8B572A', // Brown
];

// Category template
const categoryTemplate = document.getElementById('categoryTemplate');
const categoriesList = document.getElementById('categoriesList');

export async function initializeCategories() {
    const { categories = [] } = await chrome.storage.sync.get('categories');
    
    // Create default categories if none exist
    if (categories.length === 0) {
        const defaultCategories = [
            {
                id: Date.now().toString(),
                name: 'Homework',
                color: DEFAULT_COLORS[0],
                frozen: false
            },
            {
                id: (Date.now() + 1).toString(),
                name: 'Misc',
                color: DEFAULT_COLORS[1],
                frozen: false
            },
            {
                id: (Date.now() + 2).toString(),
                name: 'Extracurriculars',
                color: DEFAULT_COLORS[2],
                frozen: false
            },
            {
                id: (Date.now() + 3).toString(),
                name: 'Research',
                color: DEFAULT_COLORS[3],
                frozen: false
            }
        ];
        await chrome.storage.sync.set({ categories: defaultCategories });
        renderCategories(defaultCategories);
    } else {
        renderCategories(categories);
    }

    // Set up add category button
    document.getElementById('addCategory').addEventListener('click', () => {
        createNewCategory();
    });
}

function renderCategories(categories) {
    categoriesList.innerHTML = '';
    categories.forEach((category, index) => {
        const categoryElement = createCategoryElement(category, index);
        categoriesList.appendChild(categoryElement);
    });
}

function createCategoryElement(category, index) {
    const element = categoryTemplate.content.cloneNode(true);
    const categoryItem = element.querySelector('.category-item');
    
    // Set category data
    categoryItem.dataset.id = category.id;
    categoryItem.querySelector('.category-color').style.backgroundColor = category.color;
    categoryItem.querySelector('.category-name').textContent = category.name;

    // Set frozen state if applicable
    if (category.frozen) {
        categoryItem.classList.add('frozen');
        categoryItem.querySelector('.freeze-btn i').classList.add('active');
    }

    return element;
}

async function createNewCategory() {
    const { categories = [] } = await chrome.storage.sync.get('categories');
    
    const newCategory = {
        id: Date.now().toString(),
        name: 'New Category',
        color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
        frozen: false
    };

    categories.push(newCategory);
    await chrome.storage.sync.set({ categories });
    
    renderCategories(categories);
}

export async function handleCategoryActions(event) {
    const categoryItem = event.target.closest('.category-item');
    if (!categoryItem) return;

    const categoryId = categoryItem.dataset.id;
    const { categories = [] } = await chrome.storage.sync.get('categories');
    const categoryIndex = categories.findIndex(c => c.id === categoryId);

    if (event.target.closest('.freeze-btn')) {
        await toggleCategoryFreeze(categories, categoryIndex);
    } else if (event.target.closest('.edit-btn')) {
        await editCategory(categories, categoryIndex);
    } else if (event.target.closest('.delete-btn')) {
        await deleteCategory(categories, categoryIndex);
    }
}

async function toggleCategoryFreeze(categories, index) {
    categories[index].frozen = !categories[index].frozen;
    await chrome.storage.sync.set({ categories });
    renderCategories(categories);
}

async function editCategory(categories, index) {
    const category = categories[index];
    const newName = prompt('Enter new category name:', category.name);
    
    if (newName && newName.trim()) {
        category.name = newName.trim();
        await chrome.storage.sync.set({ categories });
        renderCategories(categories);
    }
}

async function deleteCategory(categories, index) {
    if (confirm('Are you sure you want to delete this category?')) {
        categories.splice(index, 1);
        await chrome.storage.sync.set({ categories });
        renderCategories(categories);
    }
}

// Helper functions for other modules
export async function getCategoryById(categoryId) {
    const { categories = [] } = await chrome.storage.sync.get('categories');
    return categories.find(c => c.id === categoryId);
}

export async function getAllCategories() {
    const { categories = [] } = await chrome.storage.sync.get('categories');
    return categories;
}
