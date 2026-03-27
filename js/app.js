/* ============================================
   NAVETTE EXPRESS - ESPACE ENTREPRISE
   JavaScript Principal PWA
   W2K-Digital 2025
   ============================================ */

(function() {
    'use strict';

    /* ----------------------------------------
       CONFIGURATION GLOBALE
       ---------------------------------------- */
    const CONFIG = {
        appName: 'Navette Express Entreprise',
        storagePrefix: 'ne_entreprise_',
        apiBaseUrl: 'https://api.jaebets-holding.com',
        whatsappNumber: '+2250703285359',
        transitionDuration: 300
    };

    /* ----------------------------------------
       UTILITAIRES
       ---------------------------------------- */
    const Utils = {
        // Sélecteur simplifié
        $(selector, context = document) {
            return context.querySelector(selector);
        },
        
        $$(selector, context = document) {
            return [...context.querySelectorAll(selector)];
        },

        // Stockage local avec préfixe
        storage: {
            get(key) {
                try {
                    const item = localStorage.getItem(CONFIG.storagePrefix + key);
                    return item ? JSON.parse(item) : null;
                } catch (e) {
                    console.error('Erreur lecture storage:', e);
                    return null;
                }
            },
            
            set(key, value) {
                try {
                    localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('Erreur écriture storage:', e);
                    return false;
                }
            },
            
            remove(key) {
                localStorage.removeItem(CONFIG.storagePrefix + key);
            },
            
            clear() {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(CONFIG.storagePrefix))
                    .forEach(key => localStorage.removeItem(key));
            }
        },

        // Formater montant FCFA
        formatFCFA(amount) {
            return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
        },

        // Formater date
        formatDate(date, options = {}) {
            const defaultOptions = { day: '2-digit', month: 'long', year: 'numeric' };
            return new Date(date).toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
        },

        // Debounce
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Générer ID unique
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };

    /* ----------------------------------------
       NAVIGATION
       ---------------------------------------- */
    const Navigation = {
        currentPage: null,
        
        init() {
            this.setupNavigation();
            this.setupSidebar();
            this.highlightCurrentPage();
            this.setupBackButtons();
        },

        setupNavigation() {
            // Navigation mobile bottom bar
            Utils.$$('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.handleNavClick(item);
                });
            });

            // Navigation desktop sidebar
            Utils.$$('.sidebar-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.handleNavClick(item);
                });
            });
        },

        handleNavClick(item) {
            // Retire la classe active de tous les items
            Utils.$$('.nav-item, .sidebar-item').forEach(i => i.classList.remove('active'));
            // Ajoute la classe active à l'item cliqué
            item.classList.add('active');
        },

        setupSidebar() {
            const menuToggle = Utils.$('.header-menu-toggle');
            const sidebar = Utils.$('.nav-desktop');
            
            if (menuToggle && sidebar) {
                menuToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                });
            }
        },

        highlightCurrentPage() {
            const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
            
            Utils.$$('.nav-item, .sidebar-item').forEach(item => {
                const href = item.getAttribute('href');
                if (href === currentPath) {
                    item.classList.add('active');
                }
            });
        },

        setupBackButtons() {
            Utils.$$('.btn-back').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (!btn.getAttribute('href')) {
                        e.preventDefault();
                        window.history.back();
                    }
                });
            });
        },

        navigateTo(url) {
            // Transition de sortie
            const main = Utils.$('.app-main');
            if (main) {
                main.classList.add('page-exit-active');
                setTimeout(() => {
                    window.location.href = url;
                }, CONFIG.transitionDuration);
            } else {
                window.location.href = url;
            }
        }
    };

    /* ----------------------------------------
       FORMULAIRES
       ---------------------------------------- */
    const Forms = {
        init() {
            this.setupPasswordToggle();
            this.setupFormValidation();
            this.setupInputAnimations();
        },

        setupPasswordToggle() {
            Utils.$$('.input-toggle').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const input = toggle.parentElement.querySelector('input');
                    const eyeOpen = toggle.querySelector('.eye-open');
                    const eyeClosed = toggle.querySelector('.eye-closed');
                    
                    if (input.type === 'password') {
                        input.type = 'text';
                        if (eyeOpen) eyeOpen.style.display = 'none';
                        if (eyeClosed) eyeClosed.style.display = 'block';
                    } else {
                        input.type = 'password';
                        if (eyeOpen) eyeOpen.style.display = 'block';
                        if (eyeClosed) eyeClosed.style.display = 'none';
                    }
                });
            });
        },

        setupFormValidation() {
            Utils.$$('form').forEach(form => {
                form.addEventListener('submit', (e) => {
                    if (!this.validateForm(form)) {
                        e.preventDefault();
                    }
                });
            });
        },

        validateForm(form) {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                const errorEl = input.parentElement.querySelector('.form-error');
                
                if (!input.value.trim()) {
                    input.classList.add('error');
                    if (errorEl) errorEl.textContent = 'Ce champ est requis';
                    isValid = false;
                } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                    input.classList.add('error');
                    if (errorEl) errorEl.textContent = 'Adresse email invalide';
                    isValid = false;
                } else {
                    input.classList.remove('error');
                    if (errorEl) errorEl.textContent = '';
                }
            });
            
            return isValid;
        },

        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        setupInputAnimations() {
            Utils.$$('.form-input').forEach(input => {
                input.addEventListener('focus', () => {
                    input.parentElement.classList.add('focused');
                });
                
                input.addEventListener('blur', () => {
                    input.parentElement.classList.remove('focused');
                });
            });
        }
    };

    /* ----------------------------------------
       WIZARD (Création corridor)
       ---------------------------------------- */
    const Wizard = {
        currentStep: 1,
        totalSteps: 5,
        data: {},

        init() {
            const wizardContainer = Utils.$('.wizard-container');
            if (!wizardContainer) return;

            this.setupStepNavigation();
            this.setupOptions();
            this.updateCostEstimate();
        },

        setupStepNavigation() {
            // Boutons suivant/précédent
            Utils.$$('.wizard-next').forEach(btn => {
                btn.addEventListener('click', () => this.nextStep());
            });

            Utils.$$('.wizard-prev').forEach(btn => {
                btn.addEventListener('click', () => this.prevStep());
            });
        },

        nextStep() {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateUI();
            }
        },

        prevStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateUI();
            }
        },

        goToStep(step) {
            if (step >= 1 && step <= this.totalSteps) {
                this.currentStep = step;
                this.updateUI();
            }
        },

        updateUI() {
            // Mise à jour des indicateurs d'étape
            Utils.$$('.wizard-step').forEach((stepEl, index) => {
                stepEl.classList.remove('active', 'completed');
                if (index + 1 < this.currentStep) {
                    stepEl.classList.add('completed');
                } else if (index + 1 === this.currentStep) {
                    stepEl.classList.add('active');
                }
            });

            // Mise à jour des lignes de connexion
            Utils.$$('.wizard-line').forEach((line, index) => {
                if (index + 1 < this.currentStep) {
                    line.classList.add('active');
                } else {
                    line.classList.remove('active');
                }
            });

            // Affichage du contenu de l'étape
            Utils.$$('.wizard-step-content').forEach((content, index) => {
                content.style.display = index + 1 === this.currentStep ? 'block' : 'none';
            });

            // Mise à jour des boutons
            const prevBtn = Utils.$('.wizard-prev');
            const nextBtn = Utils.$('.wizard-next');
            const submitBtn = Utils.$('.wizard-submit');

            if (prevBtn) prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
            if (nextBtn) nextBtn.style.display = this.currentStep < this.totalSteps ? 'flex' : 'none';
            if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
        },

        setupOptions() {
            Utils.$$('.option-card').forEach(card => {
                card.addEventListener('click', () => {
                    const group = card.closest('.option-grid');
                    const isMultiple = group && group.dataset.multiple === 'true';
                    
                    if (!isMultiple) {
                        group.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                    }
                    
                    card.classList.toggle('selected');
                    this.updateCostEstimate();
                });
            });
        },

        updateCostEstimate() {
            const costDisplay = Utils.$('.cost-value');
            if (!costDisplay) return;

            // Calcul basé sur la distance sélectionnée
            const distanceOption = Utils.$('.option-card.selected[data-distance]');
            let baseCost = 150000; // 10km par défaut

            if (distanceOption) {
                const distance = parseInt(distanceOption.dataset.distance);
                if (distance <= 10) baseCost = 150000;
                else if (distance <= 20) baseCost = 250000;
                else baseCost = 350000;
            }

            // Options supplémentaires
            const premiumBus = Utils.$('.option-card.selected[data-premium]');
            if (premiumBus) baseCost += 50000;

            costDisplay.textContent = Utils.formatFCFA(baseCost);
        }
    };

    /* ----------------------------------------
       IMPORT EXCEL
       ---------------------------------------- */
    const ImportExcel = {
        init() {
            const uploadZone = Utils.$('.upload-zone');
            if (!uploadZone) return;

            this.setupDragDrop(uploadZone);
            this.setupFileInput();
        },

        setupDragDrop(zone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                zone.addEventListener(eventName, () => zone.classList.add('dragover'));
            });

            ['dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, () => zone.classList.remove('dragover'));
            });

            zone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length) {
                    this.handleFile(files[0]);
                }
            });

            zone.addEventListener('click', () => {
                Utils.$('#file-input')?.click();
            });
        },

        setupFileInput() {
            const fileInput = Utils.$('#file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length) {
                        this.handleFile(e.target.files[0]);
                    }
                });
            }
        },

        handleFile(file) {
            // Vérification du type de fichier
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
                alert('Format non supporté. Veuillez utiliser un fichier Excel (.xlsx)');
                return;
            }

            // Vérification de la taille (max 5 Mo)
            if (file.size > 5 * 1024 * 1024) {
                alert('Fichier trop volumineux. Taille maximale : 5 Mo');
                return;
            }

            // Affichage de la preview (simulation)
            this.showPreview(file);
        },

        showPreview(file) {
            const previewSection = Utils.$('.import-preview');
            if (previewSection) {
                previewSection.style.display = 'block';
                
                // Simulation de données preview
                const previewCount = Utils.$('.preview-count');
                if (previewCount) {
                    previewCount.textContent = '15 lignes détectées';
                }
            }
        }
    };

    /* ----------------------------------------
       RECHERCHE ET FILTRES
       ---------------------------------------- */
    const SearchFilter = {
        init() {
            this.setupSearch();
            this.setupFilters();
        },

        setupSearch() {
            const searchInput = Utils.$('.search-input-wrapper input');
            if (!searchInput) return;

            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterItems(e.target.value);
            }, 300));
        },

        filterItems(query) {
            const items = Utils.$$('.employe-card, .corridor-card');
            const normalizedQuery = query.toLowerCase().trim();

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(normalizedQuery) ? '' : 'none';
            });

            // Afficher état vide si aucun résultat
            this.updateEmptyState(items);
        },

        setupFilters() {
            const filterSelect = Utils.$('.filter-dropdown select, .form-select[data-filter]');
            if (!filterSelect) return;

            filterSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                this.applyFilter(value);
            });
        },

        applyFilter(filterValue) {
            const items = Utils.$$('.employe-card, .corridor-card');

            items.forEach(item => {
                if (filterValue === 'all') {
                    item.style.display = '';
                } else {
                    const status = item.dataset.status || item.querySelector('.employe-status, .corridor-status')?.textContent.toLowerCase();
                    item.style.display = status?.includes(filterValue) ? '' : 'none';
                }
            });

            this.updateEmptyState(items);
        },

        updateEmptyState(items) {
            const visibleItems = [...items].filter(item => item.style.display !== 'none');
            const emptyState = Utils.$('.empty-state');
            
            if (emptyState) {
                emptyState.style.display = visibleItems.length === 0 ? 'block' : 'none';
            }
        }
    };

    /* ----------------------------------------
       NOTIFICATIONS
       ---------------------------------------- */
    const Notifications = {
        init() {
            this.setupNotificationBadge();
            this.setupMarkAsRead();
        },

        setupNotificationBadge() {
            const badge = Utils.$('.notification-badge');
            const unreadCount = Utils.storage.get('unread_notifications') || 0;
            
            if (badge && unreadCount > 0) {
                badge.classList.add('has-notifications');
            }
        },

        setupMarkAsRead() {
            Utils.$$('.notification-card').forEach(card => {
                card.addEventListener('click', () => {
                    card.classList.remove('unread');
                    this.updateUnreadCount();
                });
            });
        },

        updateUnreadCount() {
            const unreadCards = Utils.$$('.notification-card.unread');
            Utils.storage.set('unread_notifications', unreadCards.length);
        },

        addNotification(type, title, message) {
            const notification = {
                id: Utils.generateId(),
                type,
                title,
                message,
                timestamp: new Date().toISOString(),
                read: false
            };

            const notifications = Utils.storage.get('notifications') || [];
            notifications.unshift(notification);
            Utils.storage.set('notifications', notifications);

            return notification;
        }
    };

    /* ----------------------------------------
       GESTION AUTHENTIFICATION
       ---------------------------------------- */
    const Auth = {
        init() {
            this.setupLoginForm();
            this.setupLogout();
        },

        setupLoginForm() {
            const loginForm = Utils.$('#login-form');
            if (!loginForm) return;

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = loginForm.querySelector('[name="email"]').value;
                const password = loginForm.querySelector('[name="password"]').value;
                
                // Simulation de connexion (à remplacer par appel Supabase)
                this.login({ email, password });
            });
        },

        async login(credentials) {
            try {
                // TODO: Intégrer Supabase Auth
                // Simulation pour le moment
                Utils.storage.set('token', 'demo_token_' + Date.now());
                Utils.storage.set('user', { email: credentials.email, entreprise: 'Entreprise Demo' });
                
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Erreur connexion:', error);
                alert('Erreur de connexion. Veuillez réessayer.');
            }
        },

        setupLogout() {
            Utils.$$('.btn-logout, .profil-action.danger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            });
        },

        logout() {
            Utils.storage.clear();
            window.location.href = 'connexion.html';
        },

        isAuthenticated() {
            return !!Utils.storage.get('token');
        },

        getUser() {
            return Utils.storage.get('user');
        }
    };

    /* ----------------------------------------
       WHATSAPP FAB
       ---------------------------------------- */
    const WhatsAppFab = {
        init() {
            const fab = Utils.$('.whatsapp-fab');
            if (!fab) return;

            fab.href = `https://wa.me/${CONFIG.whatsappNumber.replace(/\+/g, '')}?text=Bonjour, je souhaite des informations sur Navette Express Espace Entreprise.`;
        }
    };

    /* ----------------------------------------
       TRANSITIONS DE PAGE
       ---------------------------------------- */
    const PageTransitions = {
        init() {
            // Animation d'entrée
            const main = Utils.$('.app-main');
            if (main) {
                main.classList.add('page-enter');
                requestAnimationFrame(() => {
                    main.classList.add('page-enter-active');
                    main.classList.remove('page-enter');
                });
            }
        }
    };

    /* ----------------------------------------
       SERVICE WORKER (PWA)
       ---------------------------------------- */
    const PWA = {
        init() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW enregistré:', registration.scope);
                        })
                        .catch(error => {
                            console.error('Erreur SW:', error);
                        });
                });
            }

            this.setupInstallPrompt();
        },

        setupInstallPrompt() {
            let deferredPrompt;

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;

                // Afficher bouton d'installation si nécessaire
                const installBtn = Utils.$('.btn-install-app');
                if (installBtn) {
                    installBtn.style.display = 'flex';
                    installBtn.addEventListener('click', () => {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'accepted') {
                                console.log('PWA installée');
                            }
                            deferredPrompt = null;
                        });
                    });
                }
            });
        }
    };

    /* ----------------------------------------
       INITIALISATION GLOBALE
       ---------------------------------------- */
    const App = {
        init() {
            // Modules communs
            Navigation.init();
            Forms.init();
            Notifications.init();
            Auth.init();
            WhatsAppFab.init();
            PageTransitions.init();
            PWA.init();

            // Modules spécifiques selon la page
            const page = window.location.pathname.split('/').pop();

            switch (page) {
                case 'creer-corridor.html':
                    Wizard.init();
                    break;
                case 'import-excel.html':
                    ImportExcel.init();
                    break;
                case 'employes.html':
                case 'corridors.html':
                    SearchFilter.init();
                    break;
            }

            console.log('Navette Express Entreprise initialisée');
        }
    };

    // Démarrage de l'application
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Export pour usage externe si nécessaire
    window.NavetteExpressApp = {
        Utils,
        Navigation,
        Auth,
        Notifications
    };

})();
