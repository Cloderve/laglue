/* ==========================================
   SYSTÈME DE PANIER - LA GLUE !
   Gestion complète du panier avec adresse de livraison
   ========================================== */

// Variables globales du panier
let cart = [];
let cartTotal = 0;
let cartCount = 0;

// Configuration
const DELIVERY_ZONES = {
    'yaounde_centre': { name: 'Centre-ville Yaoundé', price: 1000, time: '2-4h' },
    'yaounde_quartiers': { name: 'Quartiers de Yaoundé', price: 1500, time: '4-6h' },
    'douala': { name: 'Douala', price: 3000, time: '1-2 jours' },
    'autres': { name: 'Autres villes', price: 5000, time: '2-5 jours' }
};

const FREE_DELIVERY_THRESHOLD = 50000; // Livraison gratuite dès 50 000 FCFA

/* ==========================================
   INITIALISATION DU PANIER
   ========================================== */

function initializeCart() {
    // Charger le panier depuis localStorage
    loadCartFromStorage();
    
    // Initialiser les événements
    initializeCartEvents();
    
    // Initialiser l'affichage
    updateCartUI();
    
    console.log('🛒 Système de panier initialisé');
}

function initializeCartEvents() {
    // Bouton d'ouverture du panier
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }
    
    // Bouton de fermeture du modal
    const cartModalClose = document.getElementById('cartModalClose');
    if (cartModalClose) {
        cartModalClose.addEventListener('click', closeCart);
    }
    
    // Fermeture en cliquant sur l'overlay
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                closeCart();
            }
        });
    }
}

/* ==========================================
   GESTION DES PRODUITS DANS LE PANIER
   ========================================== */

function addToCart(productId) {
    console.log('🛒 Ajout au panier, productId:', productId);
    
    // Trouver le produit dans allProducts (vient de products.js)
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('❌ Produit non trouvé:', productId);
        showNotification('Produit non trouvé', 'error');
        return;
    }
    
    console.log('✅ Produit trouvé:', product.name);
    
    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        // Augmenter la quantité
        existingItem.quantity += 1;
        console.log('📈 Quantité augmentée:', existingItem.quantity);
        showNotification(`Quantité mise à jour : ${existingItem.name}`, 'success');
    } else {
        // Ajouter nouveau produit
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            original_price: product.original_price,
            discount_percent: product.discount_percent,
            image: product.main_image || product.images[0],
            category: product.category,
            quantity: 1
        };
        
        cart.push(cartItem);
        console.log('➕ Nouveau produit ajouté:', cartItem.name);
        showNotification(`${product.name} ajouté au panier !`, 'success');
    }
    
    // Mettre à jour l'interface et sauvegarder
    updateCartUI();
    saveCartToStorage();
    
    // Animation du bouton
    if (event && event.target) {
        animateAddToCartButton(event.target, product.name);
    }
    
    console.log('🛒 Total articles dans le panier:', cart.length);
}

function removeFromCart(productId) {
    console.log('🗑️ Suppression du panier, productId:', productId);
    
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        cart.splice(itemIndex, 1);
        
        showNotification(`${item.name} retiré du panier`, 'info');
        
        updateCartUI();
        saveCartToStorage();
        
        console.log(`🗑️ Produit retiré: ${item.name}`);
    }
}

function updateQuantity(productId, newQuantity) {
    console.log('📊 Mise à jour quantité:', productId, newQuantity);
    
    const item = cart.find(item => item.id === productId);
    
    if (!item) return;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    // Limite de quantité
    if (newQuantity > 10) {
        showNotification('Quantité maximale: 10 articles par produit', 'warning');
        newQuantity = 10;
    }
    
    item.quantity = newQuantity;
    
    updateCartUI();
    saveCartToStorage();
    
    console.log(`📊 Quantité mise à jour: ${item.name} x${newQuantity}`);
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
        cart = [];
        updateCartUI();
        saveCartToStorage();
        showNotification('Panier vidé', 'info');
        console.log('🗑️ Panier vidé');
    }
}

/* ==========================================
   CALCULS ET TOTAUX
   ========================================== */

function calculateCartTotals() {
    // Reset complet des totaux
    cartCount = 0;
    cartTotal = 0;
    
    // Calcul sécurisé article par article
    cart.forEach(item => {
        if (item && typeof item === 'object') {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            
            cartCount += quantity;
            cartTotal += (price * quantity);
        }
    });
    
    // Calcul de la livraison APRÈS avoir mis à jour cartTotal
    let deliveryFee = 0;
    if (cartTotal >= FREE_DELIVERY_THRESHOLD) {
        deliveryFee = 0;
    } else {
        deliveryFee = 1500; // Prix fixe pour Yaoundé
    }
    
    const finalTotal = cartTotal + deliveryFee;
    
    return {
        count: cartCount,
        subtotal: cartTotal,
        deliveryFee: deliveryFee,
        total: finalTotal,
        freeDeliveryRemaining: Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal)
    };
}

/* ==========================================
   INTERFACE UTILISATEUR
   ========================================== */

function updateCartUI() {
    const totals = calculateCartTotals();
    
    // Mettre à jour le compteur dans le header
    updateCartCounter(totals.count);
    
    // Mettre à jour le contenu du modal
    updateCartModal(totals);
}

function updateCartCounter(count) {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        
        // Animation du compteur
        if (count > 0) {
            cartCountElement.classList.add('updated');
            setTimeout(() => {
                cartCountElement.classList.remove('updated');
            }, 500);
        }
    }
}

function updateCartModal(totals) {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartFooter = document.getElementById('cartFooter');
    
    if (!cartItems) return;
    
    // Vider le conteneur
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        // Panier vide
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>🛒 Votre panier est vide</p>
                <button onclick="closeCart(); showSection('products');" class="shop-now-btn">
                    Découvrir nos produits
                </button>
            </div>
        `;
        
        if (cartTotal) cartTotal.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'none';
        
        return;
    }
    
    // Afficher les articles
    cart.forEach(item => {
        const cartItem = createCartItemElement(item);
        cartItems.appendChild(cartItem);
    });
    
    // Afficher le total
    if (cartTotal) {
        cartTotal.style.display = 'block';
        cartTotal.innerHTML = createCartTotalElement(totals);
    }
    
    // Afficher le footer avec message approprié selon l'état d'authentification
    if (cartFooter) {
        cartFooter.style.display = 'block';
        cartFooter.innerHTML = createCartFooterElement();
        
        // S'assurer que le footer est visible en ajustant la hauteur du modal-body
        const modalBody = document.querySelector('#cartModal .modal-body');
        if (modalBody) {
            modalBody.style.maxHeight = 'calc(70vh - 120px)'; // Réduire pour laisser place au footer
            modalBody.style.overflowY = 'auto';
        }
    }
}

function createCartItemElement(item) {
    const cartItemDiv = document.createElement('div');
    cartItemDiv.className = 'cart-item';
    cartItemDiv.setAttribute('data-id', item.id);
    
    // Prix avec promotion
    let priceDisplay = '';
    if (item.discount_percent > 0 && item.original_price) {
        priceDisplay = `
            <div>
                <span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">${formatPrice(item.original_price)}</span>
                <span style="color: #DC143C; font-weight: bold; margin-left: 0.5rem;">${formatPrice(item.price)}</span>
                <span style="background: #DC143C; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-left: 0.5rem;">-${item.discount_percent}%</span>
            </div>
        `;
    } else {
        priceDisplay = `<div style="font-weight: bold; color: var(--primary-blue);">${formatPrice(item.price)}</div>`;
    }
    
    cartItemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image"
             onerror="this.src='https://via.placeholder.com/60x60/667eea/white?text=IMG'">
        
        <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            ${priceDisplay}
            <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
                ${getCategoryName(item.category)}
            </div>
        </div>
        
        <div class="cart-item-controls">
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" 
                    ${item.quantity <= 1 ? 'style="opacity: 0.5;"' : ''}>−</button>
            
            <span class="quantity-display">${item.quantity}</span>
            
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})"
                    ${item.quantity >= 10 ? 'style="opacity: 0.5;"' : ''}>+</button>
            
            <button class="quantity-btn remove" onclick="removeFromCart(${item.id})" 
                    style="background: #DC143C; margin-left: 0.5rem;" title="Supprimer">×</button>
        </div>
    `;
    
    return cartItemDiv;
}

function createCartTotalElement(totals) {
    let deliveryInfo = '';
    
    if (totals.freeDeliveryRemaining > 0) {
        deliveryInfo = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #856404;">
                <div style="font-weight: bold; margin-bottom: 0.5rem;">🚚 Livraison</div>
                <div style="font-size: 0.9rem;">
                    Encore <strong>${formatPrice(totals.freeDeliveryRemaining)}</strong> pour la livraison gratuite !
                </div>
            </div>
        `;
    } else {
        deliveryInfo = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #155724;">
                <div style="font-weight: bold;">🎉 Livraison gratuite !</div>
                <div style="font-size: 0.9rem;">Votre commande bénéficie de la livraison gratuite</div>
            </div>
        `;
    }
    
    return `
        ${deliveryInfo}
        
        <div style="border-top: 2px solid var(--primary-blue); padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Sous-total (${totals.count} article${totals.count > 1 ? 's' : ''})</span>
                <span>${formatPrice(totals.subtotal)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Livraison</span>
                <span>${totals.deliveryFee > 0 ? formatPrice(totals.deliveryFee) : 'Gratuite'}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: bold; color: var(--primary-blue); border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem;">
                <span>Total</span>
                <span>${formatPrice(totals.total)}</span>
            </div>
        </div>
    `;
}

function createCartFooterElement() {
    const isAuthenticated = window.authUser ? window.authUser.isAuthenticated() : false;
    const userProfile = window.authUser ? window.authUser.getUserProfile() : null;
    
    let formSection = '';
    
    if (!isAuthenticated) {
        // Formulaire pour client non connecté
        formSection = `
            <div style="background: #f8f9fa; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem;">
                <h4 style="color: #333; margin-bottom: 1rem; text-align: center;">📝 Informations de livraison</h4>
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #555;">Nom complet *</label>
                        <input type="text" id="orderName" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;" placeholder="Votre nom complet">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #555;">WhatsApp *</label>
                        <input type="tel" id="orderWhatsApp" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;" placeholder="+237 6XX XXX XXX">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #555;">Adresse de livraison *</label>
                        <textarea id="orderAddress" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; min-height: 60px;" placeholder="Adresse complète pour la livraison"></textarea>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Formulaire pré-rempli pour client connecté
        const name = userProfile?.name || '';
        const address = userProfile?.address || '';
        const whatsapp = window.authUser.getCurrentUser();
        
        formSection = `
            <div style="background: #d4edda; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #c3e6cb;">
                <h4 style="color: #155724; margin-bottom: 1rem; text-align: center;">✅ Connecté - Informations pré-remplies</h4>
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #155724;">Nom complet *</label>
                        <input type="text" id="orderName" required value="${name}" style="width: 100%; padding: 10px; border: 2px solid #28a745; border-radius: 8px; font-size: 1rem; background: rgba(40,167,69,0.1);">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #155724;">WhatsApp *</label>
                        <input type="tel" id="orderWhatsApp" required value="${whatsapp}" readonly style="width: 100%; padding: 10px; border: 2px solid #28a745; border-radius: 8px; font-size: 1rem; background: rgba(40,167,69,0.1);">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #155724;">Adresse de livraison *</label>
                        <textarea id="orderAddress" required style="width: 100%; padding: 10px; border: 2px solid #28a745; border-radius: 8px; font-size: 1rem; min-height: 60px; background: rgba(40,167,69,0.1);">${address}</textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        ${formSection}
        <button class="checkout-btn" onclick="processOrderWithDetails()">
            <span class="btn-icon">📱</span>
            Finaliser la commande
        </button>
    `;
}

function processOrderWithDetails() {
    console.log('📝 Traitement de la commande avec détails...');
    
    // Vérifier le panier
    if (!cart || cart.length === 0) {
        showNotification('Votre panier est vide !', 'warning');
        return;
    }
    
    // Récupérer les informations du formulaire
    const name = document.getElementById('orderName')?.value?.trim();
    const whatsapp = document.getElementById('orderWhatsApp')?.value?.trim();
    const address = document.getElementById('orderAddress')?.value?.trim();
    
    // Validation
    if (!name || !whatsapp || !address) {
        showNotification('Veuillez remplir tous les champs obligatoires !', 'error');
        return;
    }
    
    // Valider le numéro WhatsApp
    if (!isValidWhatsAppNumber(whatsapp)) {
        showNotification('Numéro WhatsApp invalide !', 'error');
        return;
    }
    
    try {
        const totals = calculateCartTotals();
        const orderCode = generateSecureOrderCode();
        
        // Créer l'objet commande complet
        const orderData = {
            code: orderCode,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            customer: {
                name: name,
                whatsapp: cleanWhatsAppNumber(whatsapp),
                address: address,
                isAuthenticated: window.authUser ? window.authUser.isAuthenticated() : false
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            totals: {
                subtotal: totals.subtotal,
                deliveryFee: totals.deliveryFee,
                total: totals.total,
                itemsCount: totals.count
            },
            status: 'pending'
        };
        
        // Enregistrer la commande côté admin
        saveOrderToAdmin(orderData);
        
        // Générer le message WhatsApp
        const whatsappMessage = generateOrderWhatsAppMessage(orderData);
        
        // Envoyer vers WhatsApp
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://wa.me/237655912990?text=${encodedMessage}`;
        
        window.open(whatsappURL, '_blank');
        
        // Sauvegarder dans l'historique utilisateur si connecté
        if (window.authUser && window.authUser.isAuthenticated()) {
            window.authUser.addOrderToHistory(orderData);
        }
        
        showNotification('Commande envoyée avec succès !', 'success');
        
        // Proposer de vider le panier
        setTimeout(() => {
            if (confirm('Commande envoyée !\n\nVoulez-vous vider votre panier ?')) {
                cart = [];
                updateCartUI();
                saveCartToStorage();
                closeCart();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur traitement commande:', error);
        showNotification('Erreur lors du traitement: ' + error.message, 'error');
    }
}

function saveOrderToAdmin(orderData) {
    try {
        // Récupérer les commandes existantes
        let adminOrders = JSON.parse(localStorage.getItem('laglue_admin_orders') || '[]');
        
        // Ajouter la nouvelle commande en première position
        adminOrders.unshift(orderData);
        
        // Limiter à 1000 commandes max
        if (adminOrders.length > 1000) {
            adminOrders = adminOrders.slice(0, 1000);
        }
        
        // Sauvegarder
        localStorage.setItem('laglue_admin_orders', JSON.stringify(adminOrders));
        
        console.log('✅ Commande sauvegardée côté admin:', orderData.code);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde commande admin:', error);
    }
}

function generateOrderWhatsAppMessage(orderData) {
    let message = `🛒 *Nouvelle commande - La Glue !*\n\n`;
    message += `📄 *CODE: ${orderData.code}*\n`;
    message += `📅 ${orderData.date} à ${orderData.time}\n\n`;
    
    // Informations client
    message += `👤 *CLIENT:*\n`;
    message += `• Nom: ${orderData.customer.name}\n`;
    message += `• WhatsApp: ${orderData.customer.whatsapp}\n`;
    message += `• Adresse: ${orderData.customer.address}\n\n`;
    
    // Produits
    message += `📦 *PRODUITS:*\n`;
    orderData.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   ${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(item.total)}\n\n`;
    });
    
    // Total
    message += `💰 *TOTAL: ${formatPrice(orderData.totals.total)}*\n\n`;
    message += `⚠️ Code requis pour toute réclamation\n`;
    message += `La Glue ! - Votre boutique de confiance`;
    
    return message;
}

function isValidWhatsAppNumber(number) {
    const cleaned = number.replace(/[\s\-\+\(\)]/g, '');
    const cameroonPatterns = [
        /^237[6-9]\d{8}$/,
        /^[6-9]\d{8}$/,
        /^\+237[6-9]\d{8}$/
    ];
    return cameroonPatterns.some(pattern => pattern.test(cleaned));
}

function cleanWhatsAppNumber(number) {
    let cleaned = number.replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.length === 9 && /^[6-9]/.test(cleaned)) {
        cleaned = '237' + cleaned;
    }
    return cleaned;
}
/* ==========================================
   GESTION DU MODAL
   ========================================== */

function openCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.add('active');
        cartModal.style.display = 'flex';
        
        // Mettre à jour le contenu
        updateCartUI();
        
        // Animation d'ouverture
        setTimeout(() => {
            cartModal.querySelector('.modal-content').classList.add('zoom-in');
        }, 10);
        
        console.log('🛒 Modal panier ouvert');
    }
}

function closeCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('active');
        
        // Animation de fermeture
        setTimeout(() => {
            cartModal.style.display = 'none';
        }, 300);
        
        console.log('🛒 Modal panier fermé');
    }
}

/* ==========================================
   GÉNÉRATION DU MESSAGE WHATSAPP AVEC ADRESSE
   ========================================== */

function generateOrderMessageWithAddress() {
    try {
        const totals = calculateCartTotals();
        const orderCode = generateSecureOrderCode(); // Utiliser le nouveau système
        
        // Informations utilisateur
        const isAuthenticated = window.authUser ? window.authUser.isAuthenticated() : false;
        const userProfile = window.authUser ? window.authUser.getUserProfile() : null;
        const currentUser = window.authUser ? window.authUser.getCurrentUser() : null;
        
        console.log('📝 Génération du message avec code:', orderCode);
        
        let message = `🛒 *Nouvelle commande - La Glue !*\n\n`;
        message += `📄 *CODE COMMANDE: ${orderCode}*\n`;
        message += `📅 ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
        
        // PRODUITS COMMANDÉS (toujours affiché)
        message += `📦 *PRODUITS COMMANDÉS:*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        cart.forEach((item, index) => {
            try {
                const quantity = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const itemTotal = price * quantity;
                
                message += `${index + 1}. *${item.name}*\n`;
                message += `   ${formatPrice(price)} x ${quantity} = ${formatPrice(itemTotal)}\n\n`;
            } catch (itemError) {
                console.error('❌ Erreur sur l\'item:', item, itemError);
                message += `${index + 1}. ${item.name || 'Produit'}\n\n`;
            }
        });
        
        // TOTAL SIMPLE
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💰 *TOTAL: ${formatPrice(totals.total)}*\n\n`;
        
        // ADRESSE DE LIVRAISON (seulement si authentifié avec adresse)
        if (isAuthenticated && userProfile && userProfile.address && userProfile.address.trim()) {
            message += `📍 *ADRESSE DE LIVRAISON:*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            if (userProfile.name && userProfile.name.trim()) {
                message += `👤 ${userProfile.name}\n`;
            }
            message += `📱 ${currentUser}\n`;
            message += `🏠 ${userProfile.address}\n\n`;
        }
        
        message += `⚠️ *Code commande requis pour toute réclamation*\n\n`;
        message += `Merci de votre confiance ! 🙏\n`;
        message += `*La Glue ! - Votre boutique de confiance*`;
        
        console.log('✅ Message généré avec code sécurisé');
        return message;
        
    } catch (error) {
        console.error('❌ Erreur dans generateOrderMessageWithAddress:', error);
        
        // Message de fallback simple avec code basique
        const fallbackCode = `LAGLUE${Date.now().toString().slice(-8)}`;
        let fallbackMessage = `🛒 Nouvelle commande La Glue !\n\n`;
        fallbackMessage += `📄 Code: ${fallbackCode}\n\n`;
        
        cart.forEach((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            fallbackMessage += `${index + 1}. ${item.name}\n`;
            fallbackMessage += `   ${price.toLocaleString()} FCFA x ${qty}\n\n`;
        });
        
        // Calcul simple du total
        let total = 0;
        cart.forEach(item => {
            total += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        });
        
        fallbackMessage += `Total: ${total.toLocaleString()} FCFA\n\n`;
        fallbackMessage += `La Glue ! - +237 655 912 990`;
        
        return fallbackMessage;
    }
}

/* ==========================================
   ENVOI WHATSAPP AVEC ADRESSE
   ========================================== */

// Fonction principale pour WhatsApp (appelée depuis HTML)
window.sendOrderToWhatsApp = function() {
    console.log('📱 Fonction sendOrderToWhatsApp appelée directement');
    
    // Vérifier le panier
    if (!cart || cart.length === 0) {
        showNotification('Votre panier est vide !', 'warning');
        return;
    }
    
    try {
        // Générer le message avec adresse
        const message = generateOrderMessageWithAddress();
        
        // Envoyer vers WhatsApp
        const storeNumber = "237655912990";
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${storeNumber}?text=${encodedMessage}`;
        
        console.log('📱 Ouverture WhatsApp...');
        window.open(whatsappURL, '_blank');
        
        // Sauvegarder dans l'historique si l'utilisateur est connecté
        if (window.authUser && window.authUser.isAuthenticated()) {
            const totals = calculateCartTotals();
            const orderData = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal: totals.subtotal,
                deliveryFee: totals.deliveryFee,
                total: totals.total
            };
            
            window.authUser.addOrderToHistory(orderData);
            console.log('📦 Commande ajoutée à l\'historique utilisateur');
        }
        
        showNotification('Commande envoyée vers WhatsApp !', 'success');
        
        // Proposer de vider le panier
        setTimeout(() => {
            if (confirm('Commande envoyée avec succès !\n\nVoulez-vous vider votre panier ?')) {
                cart = [];
                updateCartUI();
                saveCartToStorage();
                closeCart();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification('Erreur lors de l\'envoi: ' + error.message, 'error');
    }
};

/* ==========================================
   SAUVEGARDE ET CHARGEMENT
   ========================================== */

function saveCartToStorage() {
    try {
        localStorage.setItem('laglue_cart', JSON.stringify(cart));
        console.log('💾 Panier sauvegardé');
    } catch (error) {
        console.error('❌ Erreur sauvegarde panier:', error);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('laglue_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            console.log(`📂 Panier chargé: ${cart.length} articles`);
        }
    } catch (error) {
        console.error('❌ Erreur chargement panier:', error);
        cart = [];
    }
}

/* ==========================================
   ANIMATIONS ET EFFETS VISUELS
   ========================================== */

function animateAddToCartButton(button, productName) {
    if (!button) return;
    
    const originalText = button.textContent;
    
    // Animation d'ajout
    button.classList.add('adding');
    button.textContent = 'Ajout...';
    button.disabled = true;
    
    setTimeout(() => {
        button.classList.remove('adding');
        button.classList.add('added');
        button.textContent = '✓ Ajouté !';
        
        setTimeout(() => {
            button.classList.remove('added');
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }, 800);
}

/* ==========================================
   GÉNÉRATION SÉCURISÉE DE CODE COMMANDE
   ========================================== */

function generateSecureOrderCode() {
    try {
        const prefix = "LAGLUE";
        
        // 1. Date et heure actuelle
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        
        // 2. Calcul d'une clé basée sur les produits du panier
        let productKey = 0;
        cart.forEach(item => {
            productKey += (item.id * item.quantity * item.price);
        });
        
        // 3. Clé secrète (connue seulement de vous) - CHANGEZ CETTE VALEUR
        const SECRET_KEY = 2407; // ⚠️ IMPORTANT: Changez cette valeur et gardez-la secrète !
        
        // 4. Calcul du hash personnalisé
        const rawValue = (productKey + SECRET_KEY + parseInt(day + hour + minute)) % 999999;
        const hashValue = rawValue.toString().padStart(6, '0');
        
        // 5. Code de vérification basé sur l'année et le mois
        const checksum = ((year % 100) * 13 + parseInt(month) * 7) % 100;
        const checksumStr = checksum.toString().padStart(2, '0');
        
        // 6. Assemblage final du code
        const orderCode = `${prefix}${year % 100}${month}${day}-${hashValue}${checksumStr}`;
        
        console.log('🔐 Code commande généré:', orderCode);
        
        // 7. Sauvegarde pour vérification (optionnel)
        const orderInfo = {
            code: orderCode,
            timestamp: now.toISOString(),
            productCount: cart.length,
            totalAmount: calculateCartTotals().total,
            generatedAt: now.getTime()
        };
        
        // Sauvegarder dans localStorage pour historique (optionnel)
        let orderCodes = JSON.parse(localStorage.getItem('laglue_order_codes') || '[]');
        orderCodes.push(orderInfo);
        
        // Garder seulement les 100 derniers codes
        if (orderCodes.length > 100) {
            orderCodes = orderCodes.slice(-100);
        }
        
        localStorage.setItem('laglue_order_codes', JSON.stringify(orderCodes));
        
        return orderCode;
        
    } catch (error) {
        console.error('❌ Erreur génération code:', error);
        
        // Code de fallback simple mais unique
        const timestamp = Date.now().toString().slice(-8);
        return `LAGLUE${timestamp}`;
    }
}

/* ==========================================
   FONCTION DE VÉRIFICATION (pour votre usage)
   ========================================== */

function verifyOrderCode(orderCode) {
    try {
        // Cette fonction vous permet de vérifier si un code est valide
        if (!orderCode.startsWith('LAGLUE')) {
            return { valid: false, reason: 'Préfixe invalide' };
        }
        
        // Extraire les composants
        const codeBody = orderCode.substring(6); // Enlever "LAGLUE"
        
        if (codeBody.length < 12) {
            return { valid: false, reason: 'Format invalide' };
        }
        
        // Extraire date et vérifier la cohérence
        const yearCode = codeBody.substring(0, 2);
        const monthCode = codeBody.substring(2, 4);
        const dayCode = codeBody.substring(4, 6);
        
        const year = 2000 + parseInt(yearCode);
        const month = parseInt(monthCode);
        const day = parseInt(dayCode);
        
        // Vérifications basiques
        if (month < 1 || month > 12) {
            return { valid: false, reason: 'Mois invalide' };
        }
        
        if (day < 1 || day > 31) {
            return { valid: false, reason: 'Jour invalide' };
        }
        
        // Vérifier que la date n'est pas dans le futur
        const orderDate = new Date(year, month - 1, day);
        const today = new Date();
        
        if (orderDate > today) {
            return { valid: false, reason: 'Date future' };
        }
        
        return { 
            valid: true, 
            date: orderDate.toLocaleDateString('fr-FR'),
            year: year,
            month: month,
            day: day
        };
        
    } catch (error) {
        return { valid: false, reason: 'Erreur de vérification' };
    }
}

/* ==========================================
   FONCTION UTILITAIRE SIMPLIFIÉE
   ========================================== */

function generateOrderNumber() {
    // Utiliser la nouvelle fonction sécurisée
    return generateSecureOrderCode();
}

function formatPrice(price) {
    const validPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR').format(validPrice) + ' FCFA';
}

function getCategoryName(category) {
    const names = {
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
        'sport': 'Sport & Loisirs'
    };
    return names[category] || 'Autre';
}

/* ==========================================
   FONCTIONS GLOBALES (pour HTML) - VERSION SÉCURISÉE
   ========================================== */

// Autres fonctions essentielles
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openCart = openCart;
window.closeCart = closeCart;

/* ==========================================
   INITIALISATION
   ========================================== */

// Initialiser le panier au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation du système de panier...');
    initializeCart();
});

console.log('📁 cart.js chargé avec succès');