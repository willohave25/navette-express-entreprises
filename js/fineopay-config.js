/**
 * Configuration FineoPay — Navette Express Espace Entreprise
 * Placeholder — Clés API à renseigner lors de l'intégration
 * W2K-Digital 2025
 */

const FineoPayConfig = {
  /* Clés API FineoPay (à remplir) */
  publicKey: 'VOTRE_CLE_PUBLIQUE_FINEOPAY',
  merchantId: 'VOTRE_MERCHANT_ID',
  
  /* Mode sandbox ou production */
  sandbox: true,
  
  /* URLs de callback */
  callbackUrl: 'https://entreprise.jaebets-holding.com/api/payment-callback',
  returnUrl: 'https://entreprise.jaebets-holding.com/facturation.html',
  cancelUrl: 'https://entreprise.jaebets-holding.com/facturation.html?status=cancelled',
  
  /* Devise */
  currency: 'XOF',
  
  /* Méthodes de paiement acceptées */
  paymentMethods: [
    { id: 'mobile_money', label: 'Mobile Money', icon: 'mobile' },
    { id: 'orange_money', label: 'Orange Money', icon: 'orange' },
    { id: 'mtn_momo', label: 'MTN Mobile Money', icon: 'mtn' },
    { id: 'moov_money', label: 'Moov Money', icon: 'moov' },
    { id: 'wave', label: 'Wave', icon: 'wave' },
    { id: 'card', label: 'Carte Bancaire (Visa/Mastercard)', icon: 'card' }
  ],
  
  /**
   * Initialiser le paiement
   * @param {Object} facture - Données facture à payer
   * @param {string} methode - Méthode de paiement choisie
   * @returns {Promise} Résultat initialisation
   */
  initPayment: async function(facture, methode) {
    console.log('[FineoPay] Initialisation paiement...');
    
    /* Validation des données */
    if (!facture || !facture.id || !facture.montant) {
      return { 
        success: false, 
        error: 'Données facture invalides' 
      };
    }
    
    if (!methode) {
      return { 
        success: false, 
        error: 'Méthode de paiement non sélectionnée' 
      };
    }
    
    /* Construire la requête de paiement */
    const paymentData = {
      merchant_id: this.merchantId,
      amount: facture.montant,
      currency: this.currency,
      description: `Facture ${facture.reference} - Navette Express`,
      reference: facture.reference,
      customer: {
        email: facture.entreprise_email,
        name: facture.entreprise_nom,
        phone: facture.entreprise_telephone
      },
      payment_method: methode,
      callback_url: this.callbackUrl,
      return_url: this.returnUrl,
      cancel_url: this.cancelUrl,
      metadata: {
        facture_id: facture.id,
        entreprise_id: facture.entreprise_id,
        periode: facture.periode
      }
    };
    
    try {
      /* Placeholder : simuler appel API FineoPay */
      console.log('[FineoPay] Envoi requête paiement:', paymentData);
      
      /* En production, remplacer par vrai appel API */
      /*
      const response = await fetch('https://api.fineopay.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.publicKey}`
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erreur paiement');
      }
      
      return { 
        success: true, 
        paymentUrl: result.payment_url,
        transactionId: result.transaction_id 
      };
      */
      
      /* Simulation pour développement */
      return {
        success: true,
        paymentUrl: `https://pay.fineopay.com/checkout?ref=${facture.reference}&sandbox=${this.sandbox}`,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
    } catch (error) {
      console.error('[FineoPay] Erreur initialisation:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Vérifier le statut d'un paiement
   * @param {string} transactionId - ID transaction FineoPay
   * @returns {Promise} Statut paiement
   */
  checkPaymentStatus: async function(transactionId) {
    console.log('[FineoPay] Vérification statut paiement:', transactionId);
    
    try {
      /* Placeholder : simuler appel API FineoPay */
      /*
      const response = await fetch(`https://api.fineopay.com/v1/payments/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.publicKey}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erreur vérification');
      }
      
      return { 
        success: true, 
        status: result.status,
        paid_at: result.paid_at,
        amount: result.amount
      };
      */
      
      /* Simulation pour développement */
      const statuses = ['pending', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        success: true,
        status: randomStatus,
        paid_at: randomStatus === 'completed' ? new Date().toISOString() : null,
        amount: 0
      };
      
    } catch (error) {
      console.error('[FineoPay] Erreur vérification:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Ouvrir la page de paiement
   * @param {string} paymentUrl - URL de paiement FineoPay
   */
  openPaymentPage: function(paymentUrl) {
    console.log('[FineoPay] Redirection vers:', paymentUrl);
    
    /* Stocker l'état avant redirection */
    sessionStorage.setItem('navette_payment_pending', 'true');
    
    /* Redirection vers page de paiement */
    window.location.href = paymentUrl;
  },
  
  /**
   * Traiter le retour de paiement
   * @returns {Object} Résultat retour
   */
  handlePaymentReturn: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionId = urlParams.get('transaction_id');
    const reference = urlParams.get('reference');
    
    /* Nettoyer l'URL */
    if (status) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    /* Nettoyer le state */
    sessionStorage.removeItem('navette_payment_pending');
    
    if (status === 'success' || status === 'completed') {
      return {
        success: true,
        status: 'completed',
        transactionId: transactionId,
        reference: reference,
        message: 'Paiement confirmé avec succès'
      };
    } else if (status === 'cancelled') {
      return {
        success: false,
        status: 'cancelled',
        message: 'Paiement annulé'
      };
    } else if (status === 'failed') {
      return {
        success: false,
        status: 'failed',
        message: 'Le paiement a échoué. Veuillez réessayer.'
      };
    }
    
    return null;
  },
  
  /**
   * Formater un montant en FCFA
   * @param {number} amount - Montant à formater
   * @returns {string} Montant formaté
   */
  formatAmount: function(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  },
  
  /**
   * Afficher le modal de sélection de paiement
   * @param {Object} facture - Facture à payer
   * @param {Function} onMethodSelect - Callback sélection méthode
   */
  showPaymentModal: function(facture, onMethodSelect) {
    /* Créer le modal */
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.id = 'fineopay-modal';
    
    let methodsHtml = '';
    this.paymentMethods.forEach(method => {
      methodsHtml += `
        <button class="payment-method-btn" data-method="${method.id}">
          <span class="payment-method-icon">${this.getMethodIcon(method.icon)}</span>
          <span class="payment-method-label">${method.label}</span>
        </button>
      `;
    });
    
    modal.innerHTML = `
      <div class="payment-modal-backdrop"></div>
      <div class="payment-modal-content">
        <div class="payment-modal-header">
          <h3>Choisir le mode de paiement</h3>
          <button class="payment-modal-close" aria-label="Fermer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="payment-modal-amount">
          <span class="payment-amount-label">Montant à payer</span>
          <span class="payment-amount-value">${this.formatAmount(facture.montant)}</span>
        </div>
        <div class="payment-methods-list">
          ${methodsHtml}
        </div>
        <div class="payment-modal-footer">
          <p class="payment-secure-text">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Paiement sécurisé par FineoPay
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    /* Animation ouverture */
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
    
    /* Gestionnaires d'événements */
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.payment-modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.payment-modal-close').addEventListener('click', closeModal);
    
    modal.querySelectorAll('.payment-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        closeModal();
        if (onMethodSelect) {
          onMethodSelect(method);
        }
      });
    });
  },
  
  /**
   * Obtenir l'icône SVG d'une méthode de paiement
   * @param {string} icon - Type d'icône
   * @returns {string} SVG inline
   */
  getMethodIcon: function(icon) {
    const icons = {
      mobile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12" y2="18"/>
      </svg>`,
      orange: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF6600"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">OM</text>
      </svg>`,
      mtn: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FFCC00"/>
        <text x="12" y="16" text-anchor="middle" fill="#333" font-size="8" font-weight="bold">MTN</text>
      </svg>`,
      moov: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#0066CC"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="8" font-weight="bold">Moov</text>
      </svg>`,
      wave: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#1DC9FF"/>
        <path d="M7 12 Q9 8, 12 12 T17 12" stroke="white" stroke-width="2" fill="none"/>
      </svg>`,
      card: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>`
    };
    
    return icons[icon] || icons.mobile;
  },
  
  /**
   * Générer une référence de paiement unique
   * @param {string} prefix - Préfixe (ex: 'FAC')
   * @returns {string} Référence unique
   */
  generateReference: function(prefix = 'PAY') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
};

/* Export pour utilisation globale */
window.FineoPayConfig = FineoPayConfig;

console.log('[FineoPay] Configuration chargée (placeholder)');
