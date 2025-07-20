/* ==========================================
   SYSTÈME D'AUTHENTIFICATION - LA GLUE !
   Gestion des profils clients et historique
   ========================================== */

// Variables globales d'authentification
let currentUser = null;
let isAuthenticated = false;
let userProfiles = {};
let userOrders = {};

// Configuration
const AUTH_STORAGE_KEY = 'laglue_auth';
const PROFILES_STORAGE_KEY = 'laglue_profiles';
const ORDERS_STORAGE_KEY = 'laglue_orders';

/* ==========================================
   INITIALISATION DU SYSTÈME D'AUTH
   ========================================== */

function initializeAuth() {
    // Charger les données depuis localStorage
    loadAuthFromStorage();
    
    // Initialiser les événements
    initializeAuthEvents();
    
    // Vérifier si un utilisateur est déjà connecté
    checkExistingAuth();
    
    console.log('🔐 Système d\'authentification initialisé');
}

function initializeAuthEvents() {
    // Formulaire d'authentification
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
    
    // Formulaire de profil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/* ==========================================
   GESTION DE L'AUTHENTIFICATION
   ========================================== */

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const whatsappInput = document.getElementById('authWhatsApp');
    const whatsappNumber = whatsappInput.value.trim();
    
    if (!whatsappNumber) {
        showNotification('Veuillez saisir votre numéro WhatsApp', 'warning');
        return;
    }
    
    // Valider le format du numéro
    if (!isValidWhatsAppNumber(whatsappNumber)) {
        showNotification('Format de numéro WhatsApp invalide', 'error');
        return;
    }
    
    // Nettoyer et formater le numéro
    const cleanNumber = cleanWhatsAppNumber(whatsappNumber);
    
    // Connexion réussie
    authenticateUser(cleanNumber);
}

function authenticateUser(whatsappNumber) {
    try {
        currentUser = whatsappNumber;
        isAuthenticated = true;
        
        console.log('🔐 Utilisateur connecté:', currentUser);
        
        // Sauvegarder l'état de connexion
        saveAuthToStorage();
        
        // Charger ou créer le profil utilisateur
        loadUserProfile(currentUser);
        
        // Charger l'historique des commandes
        loadUserOrders(currentUser);
        
        // Mettre à jour l'interface
        updateAuthUI();
        
        // Notification de succès
        showNotification('Connexion réussie !', 'success');
        
        console.log('✅ Authentification réussie pour:', currentUser);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'authentification:', error);
        showNotification('Erreur lors de la connexion', 'error');
    }
}

function logout() {
    if (!isAuthenticated) return;
    
    try {
        console.log('🚪 Déconnexion de:', currentUser);
        
        // Sauvegarder les données avant déconnexion
        saveUserProfile(currentUser);
        saveUserOrders(currentUser);
        
        // Reset des variables
        currentUser = null;
        isAuthenticated = false;
        
        // Nettoyer le localStorage
        localStorage.removeItem(AUTH_STORAGE_KEY);
        
        // Mettre à jour l'interface
        updateAuthUI();
        
        // Vider les formulaires
        clearAuthForms();
        
        showNotification('Déconnexion réussie', 'info');
        
        console.log('✅ Déconnexion réussie');
        
    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        showNotification('Erreur lors de la déconnexion', 'error');
    }
}

function checkExistingAuth() {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (savedAuth) {
        try {
            const authData = JSON.parse(savedAuth);
            
            if (authData.whatsapp && authData.timestamp) {
                // Vérifier que la session n'est pas trop ancienne (30 jours)
                const now = Date.now();
                const sessionAge = now - authData.timestamp;
                const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
                
                if (sessionAge < maxAge) {
                    console.log('🔐 Session existante trouvée, reconnexion automatique...');
                    authenticateUser(authData.whatsapp);
                } else {
                    console.log('⏰ Session expirée, nettoyage...');
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la vérification de session:', error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }
}

/* ==========================================
   GESTION DES PROFILS UTILISATEUR
   ========================================== */

function loadUserProfile(whatsappNumber) {
    try {
        const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
        
        if (savedProfiles) {
            userProfiles = JSON.parse(savedProfiles);
        }
        
        // Créer un profil par défaut si inexistant
        if (!userProfiles[whatsappNumber]) {
            userProfiles[whatsappNumber] = {
                whatsapp: whatsappNumber,
                name: '',
                address: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                orderCount: 0,
                totalSpent: 0,
                preferredCategories: []
            };
        } else {
            // Mettre à jour la dernière connexion
            userProfiles[whatsappNumber].lastLogin = new Date().toISOString();
        }
        
        console.log('👤 Profil utilisateur chargé:', userProfiles[whatsappNumber]);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du profil:', error);
        userProfiles[whatsappNumber] = { whatsapp: whatsappNumber, name: '', address: '' };
    }
}

function saveUserProfile(whatsappNumber) {
    if (!whatsappNumber || !userProfiles[whatsappNumber]) return;
    
    try {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(userProfiles));
        console.log('💾 Profil utilisateur sauvegardé');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du profil:', error);
    }
}

function handleProfileSubmit(e) {
    e.preventDefault();
    
    if (!isAuthenticated) {
        showNotification('Vous devez être connecté pour modifier votre profil', 'warning');
        return;
    }
    
    const nameInput = document.getElementById('profileName');
    const addressInput = document.getElementById('profileAddress');
    
    const name = nameInput.value.trim();
    const address = addressInput.value.trim();
    
    if (!name) {
        showNotification('Veuillez saisir votre nom', 'warning');
        return;
    }
    
    // Mettre à jour le profil
    userProfiles[currentUser].name = name;
    userProfiles[currentUser].address = address;
    userProfiles[currentUser].updatedAt = new Date().toISOString();
    
    // Sauvegarder
    saveUserProfile(currentUser);
    
    showNotification('Profil mis à jour avec succès !', 'success');
    
    console.log('✅ Profil mis à jour:', userProfiles[currentUser]);
}

/* ==========================================
   GESTION DE L'HISTORIQUE DES COMMANDES
   ========================================== */

function loadUserOrders(whatsappNumber) {
    try {
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        
        if (savedOrders) {
            userOrders = JSON.parse(savedOrders);
        }
        
        if (!userOrders[whatsappNumber]) {
            userOrders[whatsappNumber] = [];
        }
        
        console.log(`📦 ${userOrders[whatsappNumber].length} commandes chargées pour ${whatsappNumber}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des commandes:', error);
        userOrders[whatsappNumber] = [];
    }
}

function saveUserOrders(whatsappNumber) {
    if (!whatsappNumber) return;
    
    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(userOrders));
        console.log('💾 Commandes utilisateur sauvegardées');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des commandes:', error);
    }
}

function addOrderToHistory(orderData) {
    if (!isAuthenticated || !currentUser) {
        console.log('⚠️ Commande non sauvegardée - utilisateur non connecté');
        return;
    }
    
    try {
        const order = {
            id: generateOrderNumber(),
            date: new Date().toISOString(),
            items: [...orderData.items],
            subtotal: orderData.subtotal,
            deliveryFee: orderData.deliveryFee,
            total: orderData.total,
            status: 'sent_whatsapp',
            customerInfo: {
                name: userProfiles[currentUser].name,
                address: userProfiles[currentUser].address,
                whatsapp: currentUser
            }
        };
        
        // Ajouter à l'historique
        if (!userOrders[currentUser]) {
            userOrders[currentUser] = [];
        }
        
        userOrders[currentUser].unshift(order); // Ajouter au début
        
        // Limiter à 50 commandes par utilisateur
        if (userOrders[currentUser].length > 50) {
            userOrders[currentUser] = userOrders[currentUser].slice(0, 50);
        }
        
        // Mettre à jour les statistiques du profil
        userProfiles[currentUser].orderCount = userOrders[currentUser].length;
        userProfiles[currentUser].totalSpent += orderData.total;
        
        // Sauvegarder
        saveUserOrders(currentUser);
        saveUserProfile(currentUser);
        
        // Mettre à jour l'affichage
        displayOrderHistory();
        
        console.log('📦 Commande ajoutée à l\'historique:', order.id);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la commande:', error);
    }
}

function displayOrderHistory() {
    const orderHistoryContainer = document.getElementById('orderHistory');
    
    if (!orderHistoryContainer || !isAuthenticated || !currentUser) return;
    
    const orders = userOrders[currentUser] || [];
    
    if (orders.length === 0) {
        orderHistoryContainer.innerHTML = `
            <div class="no-orders">
                <p>Aucun achat trouvé.</p>
                <button onclick="showSection('products')" class="shop-now-btn">
                    Découvrir nos produits
                </button>
            </div>
        `;
        return;
    }
    
    let historyHTML = '';
    
    orders.forEach(order => {
        const orderDate = new Date(order.date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let itemsList = '';
        order.items.forEach(item => {
            itemsList += `<div class="order-item-detail">• ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}</div>`;
        });
        
        historyHTML += `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-date">📅 ${orderDate}</div>
                    <div class="order-id">Commande ${order.id}</div>
                </div>
                <div class="order-items">
                    ${itemsList}
                </div>
                <div class="order-footer">
                    <div class="order-total">💰 Total: ${formatPrice(order.total)}</div>
                    <div class="order-status">📱 Envoyée via WhatsApp</div>
                </div>
            </div>
        `;
    });
    
    orderHistoryContainer.innerHTML = historyHTML;
}

/* ==========================================
   INTERFACE UTILISATEUR
   ========================================== */

function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    const connectedUserSpan = document.getElementById('connectedUser');
    
    if (isAuthenticated && currentUser) {
        // Afficher la section profil
        if (authSection) authSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
        
        // Afficher le numéro de l'utilisateur connecté
        if (connectedUserSpan) {
            connectedUserSpan.textContent = currentUser;
        }
        
        // Remplir les champs du profil
        fillProfileForm();
        
        // Afficher l'historique des commandes
        displayOrderHistory();
        
    } else {
        // Afficher la section d'authentification
        if (authSection) authSection.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
    }
}

function fillProfileForm() {
    if (!isAuthenticated || !currentUser || !userProfiles[currentUser]) return;
    
    const nameInput = document.getElementById('profileName');
    const addressInput = document.getElementById('profileAddress');
    
    const profile = userProfiles[currentUser];
    
    if (nameInput) nameInput.value = profile.name || '';
    if (addressInput) addressInput.value = profile.address || '';
}

function clearAuthForms() {
    const authWhatsApp = document.getElementById('authWhatsApp');
    const profileName = document.getElementById('profileName');
    const profileAddress = document.getElementById('profileAddress');
    
    if (authWhatsApp) authWhatsApp.value = '';
    if (profileName) profileName.value = '';
    if (profileAddress) profileAddress.value = '';
}

/* ==========================================
   UTILITAIRES ET VALIDATION
   ========================================== */

function isValidWhatsAppNumber(number) {
    // Supprimer tous les espaces et caractères spéciaux
    const cleaned = number.replace(/[\s\-\+\(\)]/g, '');
    
    // Vérifier les formats valides pour le Cameroun
    const cameroonPatterns = [
        /^237[6-9]\d{8}$/, // Format international complet
        /^[6-9]\d{8}$/, // Format local (9 chiffres)
        /^\+237[6-9]\d{8}$/ // Format avec +
    ];
    
    return cameroonPatterns.some(pattern => pattern.test(cleaned));
}

function cleanWhatsAppNumber(number) {
    // Nettoyer le numéro
    let cleaned = number.replace(/[\s\-\+\(\)]/g, '');
    
    // Ajouter le préfixe 237 si nécessaire
    if (cleaned.length === 9 && /^[6-9]/.test(cleaned)) {
        cleaned = '237' + cleaned;
    }
    
    // Supprimer le préfixe + s'il existe
    if (cleaned.startsWith('237')) {
        return cleaned;
    }
    
    return cleaned;
}

function generateOrderNumber() {
    const prefix = 'LG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
}

function formatPrice(price) {
    const validPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('fr-FR').format(validPrice) + ' FCFA';
}

/* ==========================================
   SAUVEGARDE ET CHARGEMENT
   ========================================== */

function saveAuthToStorage() {
    if (!currentUser) return;
    
    try {
        const authData = {
            whatsapp: currentUser,
            timestamp: Date.now()
        };
        
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        console.log('💾 État d\'authentification sauvegardé');
    } catch (error) {
        console.error('❌ Erreur sauvegarde auth:', error);
    }
}

function loadAuthFromStorage() {
    try {
        const savedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        
        if (savedProfiles) {
            userProfiles = JSON.parse(savedProfiles);
        }
        
        if (savedOrders) {
            userOrders = JSON.parse(savedOrders);
        }
        
        console.log('📂 Données d\'authentification chargées');
    } catch (error) {
        console.error('❌ Erreur chargement auth:', error);
        userProfiles = {};
        userOrders = {};
    }
}

/* ==========================================
   FONCTIONS GLOBALES
   ========================================== */

// Fonctions accessibles depuis d'autres fichiers
window.authUser = {
    isAuthenticated: () => isAuthenticated,
    getCurrentUser: () => currentUser,
    getUserProfile: () => currentUser ? userProfiles[currentUser] : null,
    addOrderToHistory: addOrderToHistory
};

/* ==========================================
   INITIALISATION
   ========================================== */

// Initialiser l'authentification au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation du système d\'authentification...');
    initializeAuth();
});

console.log('📁 auth.js chargé avec succès');