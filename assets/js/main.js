/* ==========================================
   SCRIPT PRINCIPAL - LA GLUE !
   Navigation et fonctions de base (CORRIGÉ)
   ========================================== */

// Variables globales
let currentSection = 'home';
let isMobileMenuOpen = false;

/* ==========================================
   INITIALISATION
   ========================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 La Glue ! - Site initialisé');
    
    // Initialiser la navigation (SANS addEventListener pour éviter le conflit)
    initNavigation();
    
    // Initialiser le menu mobile
    initMobileMenu();
    
    // Afficher la section par défaut
    showSection('home');
    
    // Initialiser les formulaires
    initForms();
    
    console.log('✅ Tous les composants initialisés');
});

/* ==========================================
   NAVIGATION ENTRE SECTIONS (CORRIGÉE)
   ========================================== */

function showSection(sectionId) {
    console.log(`📄 Changement de section: ${currentSection} → ${sectionId}`);
    
    // Éviter les changements inutiles
    if (currentSection === sectionId) {
        console.log('⚠️ Section déjà active, pas de changement');
        return;
    }
    
    // Masquer toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Mettre à jour la navigation
        updateNavigation(sectionId);
        
        // Fermer le menu mobile s'il est ouvert
        if (isMobileMenuOpen) {
            closeMobileMenu();
        }
        
        // Scroller vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Animations spécifiques par section
        handleSectionAnimations(sectionId);
        
    } else {
        console.error(`❌ Section "${sectionId}" non trouvée`);
    }
}

function updateNavigation(activeSection) {
    // Retirer la classe active de tous les liens
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Ajouter la classe active au lien correspondant
    const activeLink = document.querySelector(`[onclick*="showSection('${activeSection}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function handleSectionAnimations(sectionId) {
    const section = document.getElementById(sectionId);
    
    // Ajouter animation d'entrée
    section.classList.add('fade-in-up');
    
    // Retirer l'animation après son exécution
    setTimeout(() => {
        section.classList.remove('fade-in-up');
    }, 600);
    
    // Animations spécifiques par section
    switch(sectionId) {
        case 'home':
            animateHeroSection();
            break;
        case 'products':
            // Sera géré par products.js
            break;
        case 'contact':
            animateContactSection();
            break;
        case 'profile':
            // Sera géré par auth.js
            break;
    }
}

function animateHeroSection() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroBtn = document.querySelector('.hero-btn');
    
    if (heroTitle) {
        setTimeout(() => heroTitle.classList.add('slide-in-left'), 100);
    }
    if (heroSubtitle) {
        setTimeout(() => heroSubtitle.classList.add('slide-in-right'), 300);
    }
    if (heroBtn) {
        setTimeout(() => heroBtn.classList.add('bounce'), 500);
    }
}

function animateContactSection() {
    const contactInfo = document.querySelector('.contact-info');
    const contactForm = document.querySelector('.contact-form');
    
    if (contactInfo) {
        setTimeout(() => contactInfo.classList.add('slide-in-left'), 100);
    }
    if (contactForm) {
        setTimeout(() => contactForm.classList.add('slide-in-right'), 300);
    }
}

/* ==========================================
   MENU MOBILE
   ========================================== */

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', toggleMobileMenu);
        
        // Fermer le menu quand on clique à l'extérieur
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    if (isMobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    
    if (navMenu && menuToggle) {
        navMenu.classList.add('active');
        menuToggle.classList.add('active');
        isMobileMenuOpen = true;
        
        // Animation des barres du hamburger
        animateHamburgerMenu(true);
        
        console.log('📱 Menu mobile ouvert');
    }
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    
    if (navMenu && menuToggle) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        isMobileMenuOpen = false;
        
        // Animation des barres du hamburger
        animateHamburgerMenu(false);
        
        console.log('📱 Menu mobile fermé');
    }
}

function animateHamburgerMenu(isOpen) {
    const menuToggle = document.getElementById('menuToggle');
    if (!menuToggle) return;
    
    const spans = menuToggle.querySelectorAll('span');
    
    if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

/* ==========================================
   INITIALISATION DE LA NAVIGATION (CORRIGÉE)
   ========================================== */

function initNavigation() {
    // NE PAS ajouter d'addEventListener pour éviter le conflit
    // Les liens utilisent déjà onclick dans le HTML
    console.log('🧭 Navigation initialisée (onclick uniquement)');
}

/* ==========================================
   GESTION DES FORMULAIRES
   ========================================== */

function initForms() {
    // Formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    console.log('📝 Formulaires initialisés');
}

function handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const whatsapp = document.getElementById('contactWhatsApp').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    // Validation
    if (!name || !whatsapp || !message) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!isValidPhoneNumber(whatsapp)) {
        showNotification('Numéro WhatsApp invalide', 'error');
        return;
    }
    
    // Envoyer via WhatsApp
    sendContactToWhatsApp(name, whatsapp, message);
}

function sendContactToWhatsApp(name, whatsapp, message) {
    const storeNumber = "237655912990";
    
    const whatsappMessage = `💬 *Nouveau message de contact - La Glue !*\n\n` +
                           `👤 Nom: ${name}\n` +
                           `📱 WhatsApp: ${whatsapp}\n\n` +
                           `📝 Message:\n${message}\n\n` +
                           `Merci de répondre rapidement pour un service de qualité.`;
    
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappURL = `https://wa.me/${storeNumber}?text=${encodedMessage}`;
    
    // Ouvrir WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Notification de succès
    showNotification('Message envoyé via WhatsApp !', 'success');
    
    // Vider le formulaire
    document.getElementById('contactForm').reset();
    
    console.log('📱 Message de contact envoyé via WhatsApp');
}

/* ==========================================
   SYSTÈME DE NOTIFICATIONS
   ========================================== */

function showNotification(message, type = 'success', duration = 4000) {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Créer la nouvelle notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icône selon le type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
        case 'warning':
            icon = '⚠️';
            break;
        case 'info':
            icon = 'ℹ️';
            break;
        default:
            icon = '📢';
    }
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après la durée spécifiée
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
    
    console.log(`🔔 Notification ${type}: ${message}`);
}

/* ==========================================
   FONCTIONS UTILITAIRES
   ========================================== */

function isValidPhoneNumber(phone) {
    // Regex simple pour numéros camerounais
    const phoneRegex = /^(237|6\d{8}|\+237\d{9}|\d{9})$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/* ==========================================
   GESTION DES ERREURS (AMÉLIORÉE)
   ========================================== */

// Gestionnaire d'erreurs global amélioré
window.addEventListener('error', function(e) {
    console.error('❌ Erreur JavaScript détectée:', e.error);
    console.error('Fichier:', e.filename);
    console.error('Ligne:', e.lineno);
    console.error('Message:', e.message);
    
    // Ne pas afficher de notification pour les erreurs liées aux images
    if (e.message && (
        e.message.includes('img') || 
        e.message.includes('image') ||
        e.message.includes('404') ||
        e.filename && e.filename.includes('images')
    )) {
        console.log('🖼️ Erreur d\'image ignorée pour les notifications');
        return;
    }
    
    // Ne pas afficher de notification pour les erreurs de réseau communes
    if (e.message && (
        e.message.includes('Loading chunk') ||
        e.message.includes('Network Error') ||
        e.message.includes('Failed to fetch')
    )) {
        console.log('🌐 Erreur réseau ignorée pour les notifications');
        return;
    }
    
    // Afficher notification seulement pour les vraies erreurs critiques
    if (e.error && e.error.name !== 'TypeError' && !e.message.includes('Non-Error promise rejection')) {
        showNotification('Une erreur technique est survenue', 'error');
    }
});

// Gestionnaire pour les promesses rejetées
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
    
    // Ne pas afficher de notification pour les rejets de promesses communes
    if (e.reason && (
        e.reason.toString().includes('Load failed') ||
        e.reason.toString().includes('Network request failed') ||
        e.reason.toString().includes('Image load error')
    )) {
        console.log('🚫 Rejet de promesse ignoré pour les notifications');
        e.preventDefault(); // Empêcher l'erreur dans la console
        return;
    }
    
    // Empêcher l'affichage automatique d'erreur pour les cas bénins
    e.preventDefault();
});

/* ==========================================
   GESTION DU REDIMENSIONNEMENT
   ========================================== */

window.addEventListener('resize', debounce(function() {
    // Fermer le menu mobile si on passe en desktop
    if (window.innerWidth > 768 && isMobileMenuOpen) {
        closeMobileMenu();
    }
}, 250));

/* ==========================================
   FONCTIONS GLOBALES POUR HTML (VERSION SIMPLE)
   ========================================== */

// Fonction appelée depuis le HTML (version simplifiée et robuste)
window.showSection = showSection;

// Fonction alternative au cas où il y aurait encore un conflit
window.navigateToSection = function(sectionId) {
    console.log('🔄 Navigation alternative vers:', sectionId);
    showSection(sectionId);
};

/* ==========================================
   FONCTIONS SPÉCIFIQUES AU COMMERCE
   ========================================== */

// Catégories de produits avec emojis
const productCategories = {
    'smartphones': { name: 'Smartphones', icon: '📱', color: '#4A90E2' },
    'ordinateurs': { name: 'Ordinateurs', icon: '💻', color: '#7B68EE' },
    'tablettes': { name: 'Tablettes', icon: '📋', color: '#98FB98' },
    'audio': { name: 'Audio', icon: '🎧', color: '#FF6B6B' },
    'accessoires': { name: 'Accessoires', icon: '⌚', color: '#FFD93D' },
    'electromenager': { name: 'Électroménager', icon: '🏠', color: '#7B68EE' },
    'alimentation': { name: 'Alimentation', icon: '🍽️', color: '#FF6B35' },
    'maison': { name: 'Maison & Jardin', icon: '🏡', color: '#4ECDC4' },
    'mode': { name: 'Mode & Style', icon: '👕', color: '#FF6B9D' },
    'beaute': { name: 'Beauté & Santé', icon: '🧴', color: '#C44569' },
    'gaming': { name: 'Gaming', icon: '🎮', color: '#6C5CE7' },
    'photo': { name: 'Photo/Vidéo', icon: '📷', color: '#A29BFE' },
    'sport': { name: 'Sport & Loisirs', icon: '⚽', color: '#00D2FF' }
};

// Messages de livraison selon les zones
const deliveryZones = {
    'yaounde-centre': { zone: 'Centre-ville', time: '2-4h', price: 1000 },
    'yaounde-nord': { zone: 'Yaoundé Nord', time: '4-6h', price: 1500 },
    'yaounde-sud': { zone: 'Yaoundé Sud', time: '4-6h', price: 1500 },
    'douala': { zone: 'Douala', time: '1-2 jours', price: 3000 },
    'autres': { zone: 'Autres villes', time: '2-5 jours', price: 5000 }
};

// Messages promotionnels
const promotionalMessages = [
    "🎉 Livraison gratuite dès 50 000 FCFA d'achat !",
    "⚡ Produits 100% authentiques garantis",
    "🚚 Livraison express dans Yaoundé",
    "💰 Meilleurs prix du marché",
    "🔄 Échange possible sous 7 jours"
];

// Fonction pour obtenir un message promotionnel aléatoire
function getRandomPromotionalMessage() {
    const randomIndex = Math.floor(Math.random() * promotionalMessages.length);
    return promotionalMessages[randomIndex];
}

// Fonction pour calculer les frais de livraison
function calculateDeliveryFee(zone) {
    return deliveryZones[zone] || deliveryZones['autres'];
}

// Fonction pour formater les devises
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// Fonction pour calculer une réduction
function calculateDiscount(originalPrice, discountPercent) {
    const discountAmount = (originalPrice * discountPercent) / 100;
    return {
        originalPrice: originalPrice,
        discountAmount: discountAmount,
        finalPrice: originalPrice - discountAmount,
        discountPercent: discountPercent
    };
}

console.log('📁 main.js chargé avec succès');