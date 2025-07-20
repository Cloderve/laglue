/* ==========================================
   INTÉGRATION ADMIN - LA GLUE ! (VERSION SÉCURISÉE)
   Connecteur sans bouton public
   ========================================== */

// SUPPRESSION DU BOUTON ADMIN PUBLIC POUR LA SÉCURITÉ

/* ==========================================
   MODIFICATION DU FICHIER PRODUCTS.JS
   ========================================== */

function initializeProducts() {
    if (isLoading) {
        console.log('⚠️ Initialisation déjà en cours...');
        return;
    }
    
    isLoading = true;
    console.log('🚀 Initialisation des produits...');
    
    try {
        // Charger les produits depuis l'interface admin si disponible
        allProducts = loadProductsFromAdmin() || DEMO_PRODUCTS;
        filteredProducts = [...allProducts];
        
        console.log(`✅ ${allProducts.length} produits chargés`);
        
        // Initialiser l'affichage
        displayProductsByCategory();
        displayAllProducts();
        initializeFilters();
        initializeSearch();
        updateResultsCount();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement', 'error');
    } finally {
        isLoading = false;
    }
}

/* ==========================================
   FONCTIONS DE CHARGEMENT SÉCURISÉES
   ========================================== */

function loadProductsFromAdmin() {
    try {
        const adminData = localStorage.getItem('laglue_products');
        
        if (adminData) {
            const products = JSON.parse(adminData);
            console.log('📦 Produits chargés depuis l\'interface admin:', products.length);
            return products;
        }
        
        const mainData = localStorage.getItem('laglue_main_data');
        if (mainData) {
            const data = JSON.parse(mainData);
            if (data.products) {
                console.log('📦 Produits chargés depuis l\'ancien format:', data.products.length);
                return data.products;
            }
        }
        
        console.log('📦 Aucun produit admin trouvé, utilisation des données de démonstration');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur chargement produits admin:', error);
        return null;
    }
}

function refreshProductsFromAdmin() {
    console.log('🔄 Actualisation des produits depuis l\'interface admin...');
    
    const newProducts = loadProductsFromAdmin();
    if (newProducts) {
        allProducts = newProducts;
        filteredProducts = [...allProducts];
        
        displayProductsByCategory();
        displayAllProducts();
        updateResultsCount();
        
        showNotification('Produits actualisés !', 'success');
        console.log('✅ Produits actualisés avec succès');
    }
}

function syncWithAdminData() {
    const lastSync = localStorage.getItem('laglue_last_sync');
    const now = Date.now();
    
    if (!lastSync || (now - parseInt(lastSync)) > 30000) {
        const adminData = localStorage.getItem('laglue_products');
        const currentData = JSON.stringify(allProducts);
        
        if (adminData && adminData !== currentData) {
            console.log('🔄 Nouvelles données détectées, synchronisation...');
            refreshProductsFromAdmin();
        }
        
        localStorage.setItem('laglue_last_sync', now.toString());
    }
}

/* ==========================================
   ⚠️ BOUTON ADMIN SUPPRIMÉ POUR LA SÉCURITÉ
   ========================================== */

// ANCIENNE FONCTION SUPPRIMÉE :
// function addAdminAccessButton() { ... }

// ACCÈS ADMIN MAINTENANT UNIQUEMENT PAR URL DIRECTE

/* ==========================================
   SYNCHRONISATION SANS INTERFACE PUBLIQUE
   ========================================== */

function setupAdminDataListener() {
    window.addEventListener('storage', function(e) {
        if (e.key === 'laglue_products') {
            console.log('📡 Changement détecté dans les données produits');
            refreshProductsFromAdmin();
        }
    });
    
    setInterval(syncWithAdminData, 10000);
}

/* ==========================================
   INITIALISATION SÉCURISÉE
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔗 Initialisation intégration admin (mode sécurisé)...');
        
        // PAS de bouton admin public
        // setupAdminDataListener seulement
        setupAdminDataListener();
        syncWithAdminData();
        
        console.log('✅ Intégration admin sécurisée initialisée');
    }, 1000);
});

/* ==========================================
   FONCTIONS UTILITAIRES CONSERVÉES
   ========================================== */

function getProductStats() {
    return {
        total: allProducts.length,
        categories: [...new Set(allProducts.map(p => p.category))],
        totalValue: allProducts.reduce((sum, product) => sum + (product.price * (product.stock?.quantity || 0)), 0),
        lowStock: allProducts.filter(product => (product.stock?.quantity || 0) < 5),
        outOfStock: allProducts.filter(product => (product.stock?.quantity || 0) === 0)
    };
}

window.adminIntegration = {
    refreshProducts: refreshProductsFromAdmin,
    getStats: getProductStats,
    syncData: syncWithAdminData
};

console.log('📁 admin-integration.js (version sécurisée) chargé');

/* ==========================================
   ACCÈS ADMIN SÉCURISÉ
   ========================================== */

/*
🔐 ACCÈS ADMIN MAINTENANT UNIQUEMENT PAR :

1. URL DIRECTE : votre-site.com/admin-gestion-xyz123.html
2. AUCUN LIEN PUBLIC sur le site
3. AUCUN BOUTON visible
4. URL secrète à garder confidentielle

PROCHAINES ÉTAPES SÉCURITÉ :
- Renommer admin.html
- Ajouter protection .htaccess
- Changer mot de passe par défaut
*/