/**
 * Configuration FineoPay — Navette Express Espace Entreprise
 * W2K-Digital 2025
 */

const FineoPayConfig = {
  /* Clés API FineoPay */
  apiKey: 'fpay_310daa9572f3ffd9da42e410f74578afb5ab3e356bd978936fbebdeccaaa',
  codeClient: 'jaebets_holding',
  apiBaseUrl: 'https://api.fineopay.com/v1',

  /**
   * Initier un paiement facture
   * @param {Object} params - Paramètres paiement
   * @returns {Promise} Résultat paiement
   */
  initierPaiement: async function(params) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/paiements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Code': this.codeClient
        },
        body: JSON.stringify({
          montant: params.montant,
          devise: 'XOF',
          reference: params.referenceFacture,
          description: params.description || 'Paiement facture Navette Express',
          callback_url: params.callbackUrl || window.location.origin + '/facturation.html'
        })
      });

      if (!response.ok) throw new Error('Erreur paiement FineoPay');
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('[FineoPay] Erreur:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Vérifier statut d'un paiement
   * @param {string} referenceFacture - Référence facture
   * @returns {Promise} Statut paiement
   */
  verifierPaiement: async function(referenceFacture) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/paiements/${referenceFacture}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-Code': this.codeClient
        }
      });

      if (!response.ok) throw new Error('Paiement introuvable');
      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      console.error('[FineoPay] Erreur vérification:', error.message);
      return { success: false, error: error.message };
    }
  }
};

/* Export pour utilisation globale */
window.FineoPayConfig = FineoPayConfig;

console.log('[FineoPay] Configuration chargée');
