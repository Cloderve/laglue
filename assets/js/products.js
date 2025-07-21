/* ==========================================
   GESTION DES PRODUITS - LA GLUE ! (VERSION AVEC CATÉGORIES DYNAMIQUES)
   SANS démo + Modal détails fonctionnelle + Catégories depuis admin
   ========================================== */

// Variables globales
let allProducts = [];
let filteredProducts = [];
let allCategories = {};
let isLoading = false;

// Variables pour la modal détails
let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];

/* ==========================================
   INITIALISATION
   ========================================== */

function initializeProducts() {
    if (isLoading) {
        console.log('⚠️ Initialisation déjà en cours...');
        return;
    }
    
    isLoading = true;
    console.log('🚀 Initialisation des produits avec catégories dynamiques...');
    
    try {
        // Charger d'abord les catégories, puis les produits
        loadCategoriesFromAdmin();
        const adminProducts = loadProductsFromAdmin();
        
        if (adminProducts && Array.isArray(adminProducts) && adminProducts.length > 0) {
            // Produits admin trouvés
            allProducts = adminProducts;
            filteredProducts = [...allProducts];
            
            console.log(`✅ ${allProducts.length} produits chargés depuis l'interface admin`);
            console.log(`✅ ${Object.keys(allCategories).length} catégories chargées depuis l'interface admin`);
            
            // Initialiser l'affichage avec les produits admin
            displayProductsByCategory();
            displayAllProducts();
            initializeFilters();
            initializeSearch();
            updateResultsCount();
            
        } else {
            // AUCUN produit admin trouvé
            console.log('❌ Aucun produit trouvé dans l\'interface admin');
            
            allProducts = [];
            filteredProducts = [];
            
            // Afficher message explicatif
            showEmptyStoreMessage();
            
            // Initialiser quand même les filtres et la recherche
            initializeFilters();
            initializeSearch();
            updateResultsCount();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement des produits', 'error');
        
        // En cas d'erreur, boutique vide
        allProducts = [];
        filteredProducts = [];
        allCategories = {};
        showEmptyStoreMessage();
    } finally {
        isLoading = false;
    }
}

/* ==========================================
   CHARGEMENT DES CATÉGORIES DEPUIS L'ADMIN
   ========================================== */

function loadCategoriesFromAdmin() {
    try {
        console.log('🏷️ Chargement des catégories depuis l\'interface admin...');
        
        // 1. Vérifier la clé des catégories
        const savedCategories = localStorage.getItem('laglue_categories');
        if (savedCategories) {
            try {
                allCategories = JSON.parse(savedCategories);
                console.log('✅ Catégories trouvées dans laglue_categories:', Object.keys(allCategories).length);
                updateCategoryFilters();
                return allCategories;
            } catch (parseError) {
                console.error('❌ Erreur parsing laglue_categories:', parseError);
            }
        }
        
        // 2. Vérifier l'ancien format de données
        const mainData = localStorage.getItem('laglue_main_data');
        if (mainData) {
            try {
                const data = JSON.parse(mainData);
                if (data.categories && typeof data.categories === 'object') {
                    allCategories = data.categories;
                    console.log('✅ Catégories trouvées dans laglue_main_data:', Object.keys(allCategories).length);
                    updateCategoryFilters();
                    return allCategories;
                }
            } catch (parseError) {
                console.error('❌ Erreur parsing laglue_main_data:', parseError);
            }
        }
        
        // 3. Catégories par défaut si aucune trouvée
        console.log('⚠️ Aucune catégorie admin trouvée, utilisation des catégories par défaut');
        allCategories = getDefaultCategories();
        updateCategoryFilters();
        return allCategories;
        
    } catch (error) {
        console.error('❌ Erreur générale lors du chargement des catégories:', error);
        allCategories = getDefaultCategories();
        updateCategoryFilters();
        return allCategories;
    }
}

function getDefaultCategories() {
    return {
        'smartphones': { name: 'Smartphones', icon: '📱', description: 'Téléphones intelligents de toutes marques' },
        'ordinateurs': { name: 'Ordinateurs', icon: '💻', description: 'Ordinateurs portables et de bureau' },
        'tablettes': { name: 'Tablettes', icon: '📋', description: 'Tablettes tactiles pour tous usages' },
        'audio': { name: 'Audio', icon: '🎧', description: 'Écouteurs, enceintes et accessoires audio' },
        'accessoires': { name: 'Accessoires', icon: '⌚', description: 'Montres connectées et accessoires tech' },
        'electromenager': { name: 'Électroménager', icon: '🏠', description: 'Appareils électroménagers pour la maison' },
        'alimentation': { name: 'Alimentation', icon: '🍽️', description: 'Produits alimentaires et boissons' },
        'maison': { name: 'Maison & Jardin', icon: '🏡', description: 'Décoration, mobilier et jardinage' },
        'mode': { name: 'Mode & Style', icon: '👕', description: 'Vêtements et accessoires de mode' },
        'beaute': { name: 'Beauté & Santé', icon: '🧴', description: 'Produits de beauté et de bien-être' },
        'gaming': { name: 'Gaming', icon: '🎮', description: 'Jeux vidéo et accessoires gaming' },
        'photo': { name: 'Photo/Vidéo', icon: '📷', description: 'Appareils photo et matériel vidéo' },
        'sport': { name: 'Sport & Loisirs', icon: '⚽', description: 'Équipements sportifs et loisirs' }
    };
}

/* ==========================================
   MISE À JOUR DES FILTRES DE CATÉGORIES
   ========================================== */

function updateCategoryFilters() {
    const filterButtonsContainer = document.querySelector('.filter-buttons[aria-label="Filtrer par catégorie"]');
    
    if (!filterButtonsContainer) {
        console.log('⚠️ Container des filtres de catégories non trouvé');
        return;
    }
    
    // Vider complètement le container
    filterButtonsContainer.innerHTML = '';
    
    // Ajouter le bouton "Tous"
    const allBtn = document.createElement('button');
    allBtn.className = 'category-filter-btn active';
    allBtn.setAttribute('data-category', 'all');
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.innerHTML = '<span class="show-mobile">📦</span> Tous';
    filterButtonsContainer.appendChild(allBtn);
    
    // Ajouter les catégories dynamiques
    Object.keys(allCategories).forEach(categoryKey => {
        const category = allCategories[categoryKey];
        
        const btn = document.createElement('button');
        btn.className = 'category-filter-btn';
        btn.setAttribute('data-category', categoryKey);
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `${category.icon} <span class="hide-mobile">${category.name}</span><span class="show-mobile">${category.name}</span>`;
        
        filterButtonsContainer.appendChild(btn);
    });
    
    // Réattacher les événements à TOUS les boutons
    const allCategoryButtons = filterButtonsContainer.querySelectorAll('.category-filter-btn');
    allCategoryButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            filterByCategory(category);
            updateActiveFilter(allCategoryButtons, this);
        });
    });
    
    console.log(`✅ ${Object.keys(allCategories).length} filtres de catégories mis à jour`);
}

function forceUpdateCategoriesDisplay() {
    console.log('🔄 Mise à jour forcée des catégories dans l\'interface...');
    
    // Recharger les catégories
    loadCategoriesFromAdmin();
    
    // Mettre à jour les filtres
    updateCategoryFilters();
    
    // Réafficher les produits pour appliquer les nouveaux noms
    displayProductsByCategory();
    displayAllProducts();
    
    console.log('✅ Interface boutique mise à jour avec les nouvelles catégories');
}
/* ==========================================
   CHARGEMENT DEPUIS L'INTERFACE ADMIN
   ========================================== */

function loadProductsFromAdmin() {
    try {
        console.log('🔍 Recherche des produits depuis l\'interface admin...');
        
        // 1. Vérifier la clé principale de l'admin
        const adminData = localStorage.getItem('laglue_products');
        if (adminData) {
            try {
                const products = JSON.parse(adminData);
                if (Array.isArray(products) && products.length > 0) {
                    console.log('✅ Produits trouvés dans laglue_products:', products.length);
                    return validateAndCleanProducts(products);
                }
            } catch (parseError) {
                console.error('❌ Erreur parsing laglue_products:', parseError);
            }
        }
        
        // 2. Vérifier l'ancien format de données
        const mainData = localStorage.getItem('laglue_main_data');
        if (mainData) {
            try {
                const data = JSON.parse(mainData);
                if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                    console.log('✅ Produits trouvés dans laglue_main_data:', data.products.length);
                    return validateAndCleanProducts(data.products);
                }
            } catch (parseError) {
                console.error('❌ Erreur parsing laglue_main_data:', parseError);
            }
        }
        
        // 3. Recherche dans toutes les clés liées à l'admin
        const allKeys = Object.keys(localStorage);
        console.log('🔍 Recherche dans toutes les clés localStorage...');
        
        const possibleKeys = allKeys.filter(key => 
            key.includes('laglue') && 
            key.includes('product') && 
            !key.includes('demo') && 
            !key.includes('test')
        );
        
        for (const key of possibleKeys) {
            try {
                const data = localStorage.getItem(key);
                const parsed = JSON.parse(data);
                
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log(`✅ Produits trouvés dans ${key}:`, parsed.length);
                    return validateAndCleanProducts(parsed);
                }
                
                if (parsed && typeof parsed === 'object' && parsed.products && Array.isArray(parsed.products)) {
                    console.log(`✅ Produits trouvés dans ${key}.products:`, parsed.products.length);
                    return validateAndCleanProducts(parsed.products);
                }
            } catch (parseError) {
                console.log(`⚠️ Impossible de parser ${key}`);
            }
        }
        
        console.log('❌ Aucun produit admin trouvé dans localStorage');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur générale lors du chargement:', error);
        return null;
    }
}

/* ==========================================
   VALIDATION ET NETTOYAGE DES PRODUITS
   ========================================== */

function validateAndCleanProducts(products) {
    if (!Array.isArray(products)) {
        console.error('❌ Les données ne sont pas un tableau:', typeof products);
        return [];
    }
    
    const validProducts = products.filter(product => {
        return product && 
               typeof product === 'object' && 
               product.id && 
               product.name && 
               product.price && 
               typeof product.price === 'number' && 
               product.price > 0;
    });
    
    console.log(`🧹 Nettoyage: ${products.length} → ${validProducts.length} produits valides`);
    
    const cleanedProducts = validProducts.map(product => {
        return {
            id: product.id,
            name: product.name || 'Produit sans nom',
            category: product.category || 'autre',
            price: product.price,
            original_price: product.original_price || null,
            discount_percent: product.discount_percent || 0,
            description: product.description || 'Description non disponible',
            full_description: product.full_description || product.description || 'Description complète non disponible',
            features: product.features || [],
            images: product.images || [],
            main_image: product.main_image || product.images?.[0] || 'https://via.placeholder.com/300x200/667eea/white?text=Image',
            stock: product.stock || { quantity: 0, status: 'out_of_stock' },
            tags: product.tags || [],
            rating: product.rating || 0,
            reviews_count: product.reviews_count || 0,
            display_priority: product.display_priority || 'normal'
        };
    });
    
    return cleanedProducts;
}

/* ==========================================
   AFFICHAGE BOUTIQUE VIDE
   ========================================== */

function showEmptyStoreMessage() {
    console.log('📭 Affichage du message boutique vide');
    
    const emptyStoreHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: rgba(255,255,255,0.1); border-radius: 20px; margin: 2rem 0; border: 2px dashed rgba(255,255,255,0.3);">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🏪</div>
            <h3 style="color: white; margin-bottom: 1rem; font-size: 1.8rem;">Boutique en Préparation</h3>
            <p style="color: rgba(255,255,255,0.9); margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6;">
                Nous préparons actuellement notre catalogue de produits.<br>
                Nos articles seront bientôt disponibles !
            </p>
            
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 15px; margin: 1.5rem 0; backdrop-filter: blur(10px);">
                <h4 style="color: white; margin-bottom: 1rem; font-size: 1.2rem;">📞 Contactez-nous dès maintenant</h4>
                <div style="display: flex; flex-direction: column; gap: 0.8rem; align-items: center;">
                    <a href="https://wa.me/237655912990" target="_blank" 
                       style="background: #25D366; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; display: flex; align-items: center; gap: 8px; transition: transform 0.2s;">
                        <span>📱</span> WhatsApp: +237 655 912 990
                    </a>
                    <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.9rem;">
                        📍 <strong>Localisation :</strong> Yaoundé, Cameroun<br>
                        🕒 <strong>Horaires :</strong> Lun - Sam, 8h - 18h
                    </p>
                </div>
            </div>
            
            <div style="background: rgba(74, 144, 226, 0.2); padding: 1rem; border-radius: 10px; margin-top: 1.5rem;">
                <p style="color: white; margin: 0; font-size: 0.9rem;">
                    💡 <strong>Pour les administrateurs :</strong><br>
                    Utilisez l'interface d'administration pour ajouter vos produits et catégories
                </p>
            </div>
        </div>
    `;
    
    const containers = ['recentProducts', 'popularProducts', 'allProducts'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = emptyStoreHTML;
        }
    });
    
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.innerHTML = '<span style="color: rgba(255,255,255,0.8);">Aucun produit disponible actuellement</span>';
    }
}

/* ==========================================
   AFFICHAGE DES PRODUITS
   ========================================== */

function displayProductsByCategory() {
    if (!allProducts || allProducts.length === 0) {
        showEmptyStoreMessage();
        return;
    }
    
    // Produits récents
    const recentProducts = allProducts.filter(product => 
        product.display_priority === 'recent' || 
        product.tags?.includes('nouveau')
    ).slice(0, 6);
    
    displayProducts('recentProducts', recentProducts);
    
    // Produits populaires  
    const popularProducts = allProducts.filter(product => 
        product.display_priority === 'popular' || 
        product.tags?.includes('populaire')
    ).slice(0, 6);
    
    displayProducts('popularProducts', popularProducts);
}

function displayAllProducts() {
    if (!filteredProducts || filteredProducts.length === 0) {
        const container = document.getElementById('allProducts');
        if (container) {
            if (allProducts.length === 0) {
                showEmptyStoreMessage();
            } else {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.8); padding: 2rem;">
                        <h3 style="color: white; margin-bottom: 1rem;">🔍 Aucun résultat</h3>
                        <p>Aucun produit ne correspond à vos critères de recherche.</p>
                        <button onclick="clearAllFilters()" style="background: var(--primary-blue); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; margin-top: 1rem;">
                            Réinitialiser les filtres
                        </button>
                    </div>
                `;
            }
        }
        return;
    }
    
    displayProducts('allProducts', filteredProducts);
}

function displayProducts(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

/* ==========================================
   CRÉATION DE CARTE PRODUIT (avec catégories dynamiques)
   ========================================== */

function createProductCard(product) {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-card';
    
    // Calcul de la promotion
    let discountPercent = 0;
    if (product.original_price && product.original_price > product.price) {
        discountPercent = Math.round((1 - product.price / product.original_price) * 100);
    }
    
    // Prix avec style
    let priceHTML = '';
    if (discountPercent > 0) {
        priceHTML = `
            <div class="product-price-container">
                <div class="price-original">${formatPrice(product.original_price)}</div>
                <div class="price-current">${formatPrice(product.price)}</div>
                <div class="discount-badge">-${discountPercent}%</div>
            </div>
        `;
    } else {
        priceHTML = `
            <div class="product-price-container">
                <div class="price-current">${formatPrice(product.price)}</div>
            </div>
        `;
    }
    
    // Badges produit
    let badges = '';
    if (product.tags && product.tags.includes('nouveau')) {
        badges += '<div class="product-badge badge-new">NOUVEAU</div>';
    }
    if (product.tags && product.tags.includes('promo')) {
        badges += '<div class="product-badge badge-promo">PROMO</div>';
    }
    if (discountPercent >= 20) {
        badges += '<div class="product-badge badge-hot">🔥 HOT</div>';
    }
    
    // Indicateur de stock
    let stockHTML = '';
    if (product.stock) {
        let stockText = 'En stock';
        let stockColor = '#25D366';
        let stockIcon = '✅';
        
        if (product.stock.status === 'low_stock') {
            stockText = 'Stock limité';
            stockColor = '#FF6B6B';
            stockIcon = '⚠️';
        } else if (product.stock.status === 'out_of_stock') {
            stockText = 'Rupture';
            stockColor = '#DC143C';
            stockIcon = '❌';
        }
        
        stockHTML = `
            <div class="stock-indicator" style="color: ${stockColor};">
                <span>${stockIcon}</span>
                <span>${stockText}</span>
            </div>
        `;
    }
    
    // Évaluation/Note
    let ratingHTML = '';
    if (product.rating && product.rating > 0) {
        const stars = '⭐'.repeat(Math.floor(product.rating));
        ratingHTML = `
            <div class="rating-container">
                <span class="stars">${stars}</span>
                <span class="rating-text">${product.rating}</span>
                <span class="reviews-count">(${product.reviews_count || 0})</span>
            </div>
        `;
    }
    
    // Construction de la carte complète
    productDiv.innerHTML = `
        <div class="product-image-container">
            ${badges}
            <img src="${product.main_image}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300x200/667eea/white?text=Image+Non+Disponible'">
        </div>
        
        <div class="product-category">
            ${getCategoryIcon(product.category)} ${getCategoryName(product.category)}
        </div>
        
        <h3 class="product-name">${product.name}</h3>
        
        <p class="product-description">${truncateText(product.description, 80)}</p>
        
        ${stockHTML}
        ${ratingHTML}
        ${priceHTML}
        
        <div class="product-actions">
            <button class="details-btn" onclick="openProductDetails(${product.id})" title="Voir les détails">
                <span class="btn-icon">👁️</span>
                <span class="btn-text">Détails</span>
            </button>
            
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})" title="Ajouter au panier">
                <span class="btn-icon">🛒</span>
                <span class="btn-text">Ajouter</span>
            </button>
        </div>
    `;
    
    return productDiv;
}

/* ==========================================
   MODAL DÉTAILS PRODUIT - VERSION COMPLÈTE
   ========================================== */

function openProductDetails(productId) {
    console.log('🔍 Ouverture détails produit:', productId);
    
    // Trouver le produit
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        console.error('❌ Produit non trouvé avec ID:', productId);
        showNotification('Produit non trouvé', 'error');
        return;
    }
    
    currentProduct = product;
    currentImageIndex = 0;
    
    // Préparer les images (principal + images multiples s'il y en a)
    productImages = [];
    if (product.main_image) {
        productImages.push(product.main_image);
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach(img => {
            if (img && img !== product.main_image) {
                productImages.push(img);
            }
        });
    }
    
    // Si aucune image, ajouter placeholder
    if (productImages.length === 0) {
        productImages.push('https://via.placeholder.com/400x400/667eea/white?text=Image+Non+Disponible');
    }
    
    console.log('🖼️ Images préparées:', productImages.length);
    
    // Remplir le modal
    populateProductModal(product);
    
    // Afficher le modal
    const modal = document.getElementById('productDetailsModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        
        // Animation d'ouverture
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('zoom-in');
            }
        }, 10);
        
        console.log('✅ Modal détails ouverte pour:', product.name);
    } else {
        console.error('❌ Modal productDetailsModal non trouvée dans le DOM');
    }
}

function populateProductModal(product) {
    if (!product) return;
    
    console.log('📝 Remplissage modal pour:', product.name);
    
    // Titre
    const titleEl = document.getElementById('productDetailsTitle');
    if (titleEl) {
        titleEl.textContent = product.name;
    }
    
    // Prix
    const currentPriceEl = document.getElementById('productCurrentPrice');
    const originalPriceEl = document.getElementById('productOriginalPrice');
    const discountEl = document.getElementById('productDiscount');
    
    if (currentPriceEl) {
        currentPriceEl.textContent = formatPrice(product.price);
    }
    
    if (product.original_price && product.original_price > product.price) {
        if (originalPriceEl) {
            originalPriceEl.textContent = formatPrice(product.original_price);
            originalPriceEl.style.display = 'inline';
        }
        
        if (discountEl) {
            const discount = Math.round((1 - product.price / product.original_price) * 100);
            discountEl.textContent = `-${discount}%`;
            discountEl.style.display = 'inline';
        }
    } else {
        if (originalPriceEl) originalPriceEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
    }
    
    // Catégorie (avec catégories dynamiques)
    const categoryBadge = document.getElementById('productCategoryBadge');
    if (categoryBadge) {
        categoryBadge.textContent = `${getCategoryIcon(product.category)} ${getCategoryName(product.category)}`;
    }
    
    // Note
    const ratingEl = document.getElementById('productRating');
    if (ratingEl && product.rating && product.rating > 0) {
        const stars = '⭐'.repeat(Math.floor(product.rating));
        ratingEl.innerHTML = `${stars} ${product.rating} (${product.reviews_count || 0} avis)`;
        ratingEl.style.display = 'block';
    } else if (ratingEl) {
        ratingEl.style.display = 'none';
    }
    
    // Stock
    const stockEl = document.getElementById('productStock');
    if (stockEl && product.stock) {
        let stockClass = 'in-stock';
        let stockText = `✅ En stock (${product.stock.quantity || 0} disponibles)`;
        
        if (product.stock.status === 'low_stock') {
            stockClass = 'low-stock';
            stockText = `⚠️ Stock limité (${product.stock.quantity || 0} restants)`;
        } else if (product.stock.status === 'out_of_stock') {
            stockClass = 'out-of-stock';
            stockText = '❌ Rupture de stock';
        }
        
        stockEl.className = `stock-info ${stockClass}`;
        stockEl.textContent = stockText;
        stockEl.style.display = 'block';
    } else if (stockEl) {
        stockEl.style.display = 'none';
    }
    
    // Description complète
    const fullDescEl = document.getElementById('productFullDescription');
    if (fullDescEl) {
        fullDescEl.textContent = product.full_description || product.description || 'Description non disponible.';
    }
    
    // Caractéristiques
    const featuresEl = document.getElementById('productFeatures');
    const featuresListEl = document.getElementById('productFeaturesList');
    
    if (featuresEl && featuresListEl) {
        if (product.features && Array.isArray(product.features) && product.features.length > 0) {
            featuresListEl.innerHTML = '';
            product.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresListEl.appendChild(li);
            });
            featuresEl.style.display = 'block';
        } else {
            featuresEl.style.display = 'none';
        }
    }
    
    // Tags
    const tagsContainer = document.getElementById('productTagsContainer');
    const tagsListEl = document.getElementById('productTagsList');
    
    if (tagsContainer && tagsListEl) {
        if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
            tagsListEl.innerHTML = '';
            product.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag-item';
                span.textContent = tag;
                tagsListEl.appendChild(span);
            });
            tagsContainer.style.display = 'block';
        } else {
            tagsContainer.style.display = 'none';
        }
    }
    
    // Images
    loadProductImages();
    
    // Reset quantité
    const quantityEl = document.getElementById('productQuantity');
    if (quantityEl) {
        quantityEl.value = 1;
    }
    
    console.log('✅ Modal remplie avec succès');
}

function loadProductImages() {
    console.log('🖼️ Chargement des images, total:', productImages.length);
    
    const mainImageEl = document.getElementById('productMainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    const navigation = document.querySelector('.image-navigation');
    
    // Image principale
    if (mainImageEl && productImages.length > 0) {
        mainImageEl.src = productImages[currentImageIndex];
        mainImageEl.onerror = function() {
            this.src = 'https://via.placeholder.com/400x400/667eea/white?text=Image+Non+Disponible';
        };
        console.log('🖼️ Image principale chargée:', productImages[currentImageIndex]);
    }
    
    // Miniatures
    if (thumbnailGallery) {
        thumbnailGallery.innerHTML = '';
        productImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image;
            img.className = `thumbnail-image ${index === currentImageIndex ? 'active' : ''}`;
            img.onclick = () => switchToImage(index);
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/60x60/667eea/white?text=IMG';
            };
            thumbnailGallery.appendChild(img);
        });
        console.log('🖼️ Miniatures créées:', productImages.length);
    }
    
    // Boutons navigation
    if (prevBtn) {
        prevBtn.disabled = currentImageIndex === 0;
        prevBtn.style.display = productImages.length > 1 ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.disabled = currentImageIndex === productImages.length - 1;
        nextBtn.style.display = productImages.length > 1 ? 'flex' : 'none';
    }
    
    // Cacher navigation si une seule image
    if (navigation) {
        navigation.style.display = productImages.length > 1 ? 'flex' : 'none';
    }
    
    console.log('✅ Images chargées, index actuel:', currentImageIndex);
}

function switchToImage(index) {
    if (index >= 0 && index < productImages.length) {
        console.log('🔄 Changement d\'image:', currentImageIndex, '→', index);
        currentImageIndex = index;
        loadProductImages();
    }
}

function previousImage() {
    if (currentImageIndex > 0) {
        switchToImage(currentImageIndex - 1);
    }
}

function nextImage() {
    if (currentImageIndex < productImages.length - 1) {
        switchToImage(currentImageIndex + 1);
    }
}

function adjustQuantity(change) {
    const input = document.getElementById('productQuantity');
    if (!input) return;
    
    let newValue = parseInt(input.value) + change;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 10) newValue = 10;
    
    input.value = newValue;
    console.log('📊 Quantité ajustée:', newValue);
}

function addToCartFromModal() {
    if (!currentProduct) {
        console.error('❌ Aucun produit actuel pour ajout au panier');
        return;
    }
    
    const quantityInput = document.getElementById('productQuantity');
    const quantity = parseInt(quantityInput?.value) || 1;
    
    console.log('🛒 Ajout au panier depuis modal:', currentProduct.name, 'x', quantity);
    
    // Vérifier si cart.js est disponible
    if (typeof window.addToCart === 'function') {
        // Ajouter la quantité demandée
        for (let i = 0; i < quantity; i++) {
            window.addToCart(currentProduct.id);
        }
        
        console.log('✅ Produit ajouté via cart.js');
    } else {
        console.warn('⚠️ cart.js non disponible, utilisation de la fonction locale');
        
        // Fallback local
        localAddToCart(currentProduct.id, quantity);
    }
    
    // Fermer le modal après ajout
    setTimeout(() => {
        closeProductDetails();
    }, 500);
    
    // Notification
    if (typeof showNotification === 'function') {
        showNotification(`${quantity} × ${currentProduct.name} ajouté(s) au panier !`, 'success');
    }
}

function localAddToCart(productId, quantity = 1) {
    // Fonction de fallback si cart.js n'est pas disponible
    console.log('🛒 Ajout local au panier:', productId, 'quantité:', quantity);
    
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;
    
    // Animation visuelle simple
    const button = document.querySelector('.add-to-cart-btn.primary');
    if (button) {
        const originalText = button.innerHTML;
        
        button.style.background = '#2ECC71';
        button.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Ajouté !</span>';
        
        setTimeout(() => {
            button.style.background = '';
            button.innerHTML = originalText;
        }, 2000);
    }
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Animation de fermeture
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('zoom-in');
        }
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        console.log('🔒 Modal détails fermée');
    }
    
    // Reset des variables
    currentProduct = null;
    currentImageIndex = 0;
    productImages = [];
}

/* ==========================================
   FONCTIONS DE FILTRAGE ET RECHERCHE (avec catégories dynamiques)
   ========================================== */

function initializeFilters() {
    // Filtres de catégorie (déjà mis à jour par updateCategoryFilters)
    
    // Filtres d'affichage
    const displayButtons = document.querySelectorAll('.filter-btn[data-type="display"]');
    displayButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const display = this.getAttribute('data-filter');
            filterByDisplay(display);
            updateActiveFilter(displayButtons, this);
        });
    });
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            performSearch(this.value);
        });
    }
}

function filterByCategory(category) {
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.category === category);
    }
    displayProducts('allProducts', filteredProducts);
    updateResultsCount();
}

function filterByDisplay(display) {
    if (display === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.display_priority === display);
    }
    displayProducts('allProducts', filteredProducts);
    updateResultsCount();
}

function performSearch(searchTerm) {
    if (!searchTerm.trim()) {
        filteredProducts = [...allProducts];
    } else {
        const term = searchTerm.toLowerCase();
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            (product.full_description && product.full_description.toLowerCase().includes(term)) ||
            getCategoryName(product.category).toLowerCase().includes(term)
        );
    }
    
    displayProducts('allProducts', filteredProducts);
    updateResultsCount();
}

function clearAllFilters() {
    // Réinitialiser tous les filtres
    filteredProducts = [...allProducts];
    
    // Réinitialiser les boutons actifs
    document.querySelectorAll('.filter-btn, .category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    // Activer le bouton "Tous"
    const allCategoryBtn = document.querySelector('[data-category="all"]');
    if (allCategoryBtn) {
        allCategoryBtn.classList.add('active');
        allCategoryBtn.setAttribute('aria-pressed', 'true');
    }
    
    const allDisplayBtn = document.querySelector('[data-filter="all"]');
    if (allDisplayBtn) {
        allDisplayBtn.classList.add('active');
        allDisplayBtn.setAttribute('aria-pressed', 'true');
    }
    
    // Vider la recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    displayProducts('allProducts', filteredProducts);
    updateResultsCount();
}

/* ==========================================
   SYNCHRONISATION AVEC ADMIN (avec catégories)
   ========================================== */

function refreshProductsFromAdmin() {
    console.log('🔄 Actualisation des produits et catégories depuis l\'interface admin...');
    
    // Recharger les catégories
    loadCategoriesFromAdmin();
    
    // Recharger les produits
    const newProducts = loadProductsFromAdmin();
    if (newProducts && newProducts.length > 0) {
        allProducts = newProducts;
        filteredProducts = [...allProducts];
        
        displayProductsByCategory();
        displayAllProducts();
        updateResultsCount();
        
        showNotification('Produits et catégories actualisés !', 'success');
        console.log('✅ Produits et catégories actualisés avec succès');
    } else {
        console.log('❌ Aucun nouveau produit trouvé lors de l\'actualisation');
        showNotification('Aucun produit trouvé dans l\'admin', 'warning');
    }
}

function syncWithAdminData() {
    const lastSync = localStorage.getItem('laglue_last_sync');
    const now = Date.now();
    
    if (!lastSync || (now - parseInt(lastSync)) > 30000) {
        const adminData = localStorage.getItem('laglue_products');
        const adminCategories = localStorage.getItem('laglue_categories');
        const currentData = JSON.stringify(allProducts);
        const currentCategories = JSON.stringify(allCategories);
        
        let shouldRefresh = false;
        
        if (adminData && adminData !== currentData) {
            console.log('🔄 Nouveaux produits détectés, synchronisation...');
            shouldRefresh = true;
        }
        
        if (adminCategories && adminCategories !== currentCategories) {
            console.log('🔄 Nouvelles catégories détectées, synchronisation...');
            shouldRefresh = true;
        }
        
        if (shouldRefresh) {
            refreshProductsFromAdmin();
        }
        
        localStorage.setItem('laglue_last_sync', now.toString());
    }
}

function setupAdminDataListener() {
    window.addEventListener('storage', function(e) {
        if (e.key === 'laglue_products') {
            console.log('📡 Changement détecté dans les données produits');
            refreshProductsFromAdmin();
        } else if (e.key === 'laglue_categories') {
            console.log('📡 Changement détecté dans les catégories');
            forceUpdateCategoriesDisplay(); // ← CETTE LIGNE EST NOUVELLE
        } else if (e.key === 'laglue_main_data') {
            console.log('📡 Changement détecté dans les données principales');
            refreshProductsFromAdmin();
            forceUpdateCategoriesDisplay(); // ← CETTE LIGNE EST NOUVELLE
        }
    });
    
    setInterval(syncWithAdminData, 10000);
}

/* ==========================================
   FONCTIONS UTILITAIRES (avec catégories dynamiques)
   ========================================== */

function updateActiveFilter(buttons, activeButton) {
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
}

function getCategoryIcon(category) {
    if (allCategories[category] && allCategories[category].icon) {
        return allCategories[category].icon;
    }
    
    // Fallback pour les icônes par défaut
    const defaultIcons = {
        'smartphones': '📱',
        'ordinateurs': '💻',
        'tablettes': '📋',
        'audio': '🎧',
        'accessoires': '⌚',
        'electromenager': '🏠',
        'alimentation': '🍽️',
        'maison': '🏡',
        'mode': '👕',
        'beaute': '🧴',
        'gaming': '🎮',
        'photo': '📷',
        'sport': '⚽',
        'autre': '📦'
    };
    
    return defaultIcons[category] || '📦';
}

function getCategoryName(category) {
    if (allCategories[category] && allCategories[category].name) {
        return allCategories[category].name;
    }
    
    // Fallback pour les noms par défaut
    const defaultNames = {
        'smartphones': 'Smartphones',
        'ordinateurs': 'Ordinateurs',
        'tablettes': 'Tablettes',
        'audio': 'Audio',
        'accessoires': 'Accessoires',
        'electromenager': 'Électroménager',
        'alimentation': 'Alimentation',
        'maison': 'Maison & Jardin',
        'mode': 'Mode & Style',
        'beaute': 'Beauté & Santé',
        'gaming': 'Gaming',
        'photo': 'Photo/Vidéo',
        'sport': 'Sport & Loisirs',
        'autre': 'Autre'
    };
    
    return defaultNames[category] || 'Catégorie inconnue';
}

function formatPrice(price) {
    const validPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR').format(validPrice) + ' FCFA';
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        if (allProducts.length === 0) {
            resultsCount.innerHTML = '<span style="color: rgba(255,255,255,0.8);">Aucun produit disponible</span>';
        } else {
            resultsCount.textContent = `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''} trouvé${filteredProducts.length > 1 ? 's' : ''}`;
        }
    }
}

/* ==========================================
   FONCTION ADDTOCART (FALLBACK)
   ========================================== */

function addToCart(productId) {
    // Cette fonction sera remplacée par celle de cart.js si disponible
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        console.error('❌ Produit non trouvé pour ajout panier:', productId);
        return;
    }
    
    console.log('🛒 Ajout au panier depuis products.js:', product.name);
    
    // Si cart.js est chargé, utiliser sa fonction
    if (window.addToCart && window.addToCart !== addToCart) {
        window.addToCart(productId);
        return;
    }
    
    // Sinon, animation basique et simulation locale
    const button = event?.target?.closest?.('.add-to-cart-btn');
    if (button) {
        const originalText = button.innerHTML;
        
        button.style.background = '#2ECC71';
        button.innerHTML = '<span class="btn-icon">✓</span><span class="btn-text">Ajouté !</span>';
        button.disabled = true;
        
        setTimeout(() => {
            button.style.background = '';
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
    
    // Notification
    if (typeof showNotification === 'function') {
        showNotification(`${product.name} ajouté au panier !`, 'success');
    }
    
    // Simulation d'ajout au localStorage (basique)
    try {
        const existingCart = JSON.parse(localStorage.getItem('laglue_cart') || '[]');
        const existingItem = existingCart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            existingCart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.main_image,
                quantity: 1
            });
        }
        
        localStorage.setItem('laglue_cart', JSON.stringify(existingCart));
        
        // Mettre à jour le compteur panier si disponible
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = existingCart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.classList.add('updated');
            setTimeout(() => cartCount.classList.remove('updated'), 500);
        }
        
        console.log('🛒 Produit ajouté au panier local');
    } catch (error) {
        console.error('❌ Erreur ajout panier local:', error);
    }
}

/* ==========================================
   ÉVÉNEMENTS GLOBAUX
   ========================================== */

// Fermeture modal avec Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (currentProduct) {
            closeProductDetails();
        }
    }
});

// Gestion des erreurs d'images
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/300x200/667eea/white?text=Image+Non+Disponible';
    }
}, true);

/* ==========================================
   INITIALISATION
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Démarrage du système de produits avec catégories dynamiques...');
    
    setTimeout(() => {
        initializeProducts();
        setupAdminDataListener();
    }, 100);
});

// Fonctions globales pour l'HTML
window.openProductDetails = openProductDetails;
window.closeProductDetails = closeProductDetails;
window.clearAllFilters = clearAllFilters;
window.switchToImage = switchToImage;
window.previousImage = previousImage;
window.nextImage = nextImage;
window.adjustQuantity = adjustQuantity;
window.addToCartFromModal = addToCartFromModal;

// Expose pour debugging
window.debugProducts = {
    refresh: refreshProductsFromAdmin,
    sync: syncWithAdminData,
    getProducts: () => allProducts,
    getCategories: () => allCategories,
    getFiltered: () => filteredProducts,
    getCurrentProduct: () => currentProduct,
    getImages: () => productImages,
    updateFilters: updateCategoryFilters
};

console.log('📁 products.js (VERSION AVEC CATÉGORIES DYNAMIQUES) chargé avec succès');