/* Intégration admin sécurisée avec synchronisation catégories */

function initializeProducts() {
    if (isLoading) return;
    
    isLoading = true;
    console.log('🚀 Initialisation avec catégories...');
    
    try {
        // Charger catégories puis produits
        loadCategoriesFromAdmin();
        allProducts = loadProductsFromAdmin() || [];
        filteredProducts = [...allProducts];
        
        if (allProducts.length > 0) {
            displayProductsByCategory();
            displayAllProducts();
            initializeFilters();
            initializeSearch();
            updateResultsCount();
        } else {
            showEmptyStoreMessage();
            initializeFilters();
            initializeSearch();
            updateResultsCount();
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        allProducts = [];
        filteredProducts = [];
        allCategories = {};
        showEmptyStoreMessage();
    } finally {
        isLoading = false;
    }
}

// Synchronisation automatique
setInterval(() => {
    if (typeof forceUpdateCategoriesDisplay === 'function') {
        const newCategories = localStorage.getItem('laglue_categories');
        const currentCategories = JSON.stringify(allCategories);
        
        if (newCategories && newCategories !== currentCategories) {
            console.log('🔄 Auto-sync: Nouvelles catégories détectées');
            forceUpdateCategoriesDisplay();
        }
    }
}, 5000);

console.log('📁 admin-integration.js (avec catégories) chargé');