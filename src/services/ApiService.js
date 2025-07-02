/**
 * 🔗 Simple API Service - Document-Focused Implementation
 * 
 * Professional, minimal API service focusing only on document management
 * No external dependencies - just clean, maintainable code
 * 
 * Features:
 * ✅ Document Management (CRUD operations)
 * ✅ Authentication token handling
 * ✅ Error handling and response formatting
 * ✅ All endpoints from apiConfig.js maintained
 * 
 * @author Admin Dashboard Team
 * @version 1.0.0
 */

// =====================================
// CONFIGURATION
// =====================================

/**
 * API Configuration - Centralized endpoint definitions
 */
const API_CONFIG = {
  // Base URLs for different services
  BASE_URLS: {
    AGENCE_SERVICE: import.meta.env.VITE_AGENCE_SERVICE_URL || 'http://localhost:8092',
    USER_SERVICE: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8091'
  },

  // AgenceService endpoints (maintaining original structure)
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/v1/agence/auth/login',
      REFRESH: '/api/v1/agence/auth/refresh',
      LOGOUT: '/api/v1/agence/auth/logout',
      CHANGE_PASSWORD: '/api/v1/agence/auth/change-password'
    },
    
    // Admin Dashboard
    ADMIN: {
      DASHBOARD: '/api/v1/agence/admin/dashboard',
      DASHBOARD_HEALTH: '/api/v1/agence/admin/dashboard/health',
      RECENT_ACTIVITY: '/api/v1/agence/admin/dashboard/recent-activity'
    },
    
    // User Management
    USERS: {
      LIST: '/api/v1/agence/admin/users',
      DETAILS: (userId) => `/api/v1/agence/admin/users/${userId}`,
      STATISTICS: '/api/v1/agence/admin/users/statistics',
      EXPORT: '/api/v1/agence/admin/users/export',
      CREATE: '/api/v1/agence/admin/users',
      UPDATE: (userId) => `/api/v1/agence/admin/users/${userId}`,
      BLOCK: (userId) => `/api/v1/agence/admin/users/${userId}/block`,
      UNBLOCK: (userId) => `/api/v1/agence/admin/users/${userId}/unblock`
    },
    
    // Document Management (FOCUS - All endpoints maintained)
    DOCUMENTS: {
      PENDING: '/api/v1/agence/admin/documents/pending',
      REVIEW: (docId) => `/api/v1/agence/admin/documents/${docId}/review`,
      APPROVE: (docId) => `/api/v1/agence/admin/documents/${docId}/approve`,
      REJECT: (docId) => `/api/v1/agence/admin/documents/${docId}/reject`,
      STATISTICS: '/api/v1/agence/admin/documents/statistics',
      BULK_APPROVE: '/api/v1/agence/admin/documents/bulk-approve',
      BULK_REJECT: '/api/v1/agence/admin/documents/bulk-reject'
    }
  },

  // HTTP Status codes
  HTTP_STATUS: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Timeout configurations
  TIMEOUT_CONFIG: {
    DEFAULT: 10000,        // 10 seconds
    UPLOAD: 30000,         // 30 seconds
    DOWNLOAD: 60000,       // 60 seconds
    LONG_RUNNING: 120000   // 2 minutes
  }
};

// =====================================
// HTTP CLIENT - Simple Implementation
// =====================================

/**
 * Simple HTTP Client without dependencies
 */
class SimpleHttpClient {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URLS.AGENCE_SERVICE;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    return localStorage.getItem('authToken') || window.authToken;
  }

  /**
   * Make HTTP request
   */
  async request(url, options = {}) {
    try {
      const config = {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
          ...options.headers
        },
        ...options
      };

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_CONFIG.DEFAULT);
      config.signal = controller.signal;

      console.log(`📡 ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ ${config.method} ${url} - Success`);
      return { success: true, data, status: response.status };

    } catch (error) {
      console.error(`❌ ${options.method || 'GET'} ${url} - Error:`, error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  async get(url, params = {}) {
    const urlWithParams = params && Object.keys(params).length > 0 
      ? `${url}?${new URLSearchParams(params)}`
      : url;
    return this.request(urlWithParams);
  }

  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// =====================================
// AGENCE SERVICE - Document Focus
// =====================================

/**
 * AgenceService - Document Management Focus
 * Maintains original function names and endpoints
 */
class AgenceService {
  constructor() {
    this.httpClient = new SimpleHttpClient();
    this.baseUrl = API_CONFIG.BASE_URLS.AGENCE_SERVICE;
  }

  /**
   * Ensure user is authenticated
   */
  ensureAuthenticated() {
    if (!this.httpClient.getToken()) {
      throw new Error('Authentication required. Please login first.');
    }
  }

  // =====================================
  // DOCUMENT MANAGEMENT - Core Focus
  // =====================================

  /**
   * Get pending documents with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 0)
   * @param {number} params.size - Page size (default: 20)
   * @param {string} params.search - Search term
   * @param {string} params.status - Document status filter
   * @param {string} params.type - Document type filter
   * @param {string} params.priority - Priority filter
   * @returns {Promise<Object>} Paginated document list
   */
  async getPendingDocuments(params = {}) {
    try {
      this.ensureAuthenticated();
      console.log('📋 Fetching pending documents with params:', params);

      const queryParams = {
        page: params.page || 0,
        size: params.size || 20,
        sortBy: params.sortBy || 'submittedAt',
        sortDirection: params.sortDirection || 'desc'
      };

      // Add optional filters
      if (params.search) queryParams.search = params.search;
      if (params.status) queryParams.status = params.status;
      if (params.type) queryParams.type = params.type;
      if (params.priority) queryParams.priority = params.priority;
      if (params.agencyFilter) queryParams.agencyFilter = params.agencyFilter;

      const response = await this.httpClient.get(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.PENDING}`,
        queryParams
      );

      console.log('response:', response);

      console.log(`✅ Fetched ${response.data.content?.length || 0} pending documents`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch pending documents:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  /**
 * Get detailed document review data
 * @param {string} documentId - Document ID to review
 * @returns {Promise<Object>} Detailed document review data
 */
async getDocumentReview(documentId) {
  try {
    this.ensureAuthenticated();
    console.log(`🔍 Fetching document review for ID: ${documentId}`);

    const response = await httpClient.get(
      `${this.baseUrl}${ENDPOINTS.AGENCE_SERVICE.DOCUMENTS.REVIEW(documentId)}`
    );

    console.log('✅ Document review data fetched successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch document review:', error);
    throw error;
  }
}

  /**
   * Approve document
   * @param {string} documentId - Document ID
   * @param {Object} approvalData - Approval data
   * @param {string} approvalData.comment - Approval comments
   * @param {Array} approvalData.conditions - Approval conditions
   * @returns {Promise<Object>} Approval response
   */
  async approveDocument(documentId, approvalData = {}) {
    try {
      this.ensureAuthenticated();
      console.log('✅ Approving document:', documentId);

      const payload = {
        comment: approvalData.comment || 'Document approuvé',
        conditions: approvalData.conditions || [],
        approvedAt: approvalData.approvedAt || new Date().toISOString()
      };

      const response = await this.httpClient.post(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.APPROVE(documentId)}`,
        payload
      );

      console.log('✅ Document approved successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to approve document:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  /**
   * Reject document
   * @param {string} documentId - Document ID
   * @param {Object} rejectionData - Rejection data
   * @param {string} rejectionData.reason - Rejection reason (required)
   * @param {string} rejectionData.comment - Additional comments
   * @returns {Promise<Object>} Rejection response
   */
  async rejectDocument(documentId, rejectionData) {
    try {
      this.ensureAuthenticated();
      console.log('❌ Rejecting document:', documentId);

      if (!rejectionData.reason) {
        throw new Error('Rejection reason is required');
      }

      const payload = {
        reason: rejectionData.reason,
        comment: rejectionData.comment || '',
        rejectedAt: rejectionData.rejectedAt || new Date().toISOString()
      };

      const response = await this.httpClient.post(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.REJECT(documentId)}`,
        payload
      );

      console.log('✅ Document rejected successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to reject document:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  /**
   * Get document approval statistics
   * @param {Object} params - Statistics parameters
   * @param {string} params.period - Time period (daily, weekly, monthly)
   * @param {string} params.startDate - Start date
   * @param {string} params.endDate - End date
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStatistics(params = {}) {
    try {
      this.ensureAuthenticated();
      console.log('📊 Fetching document statistics');

      const queryParams = {
        period: params.period || 'monthly'
      };

      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;

      const response = await this.httpClient.get(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.STATISTICS}`,
        queryParams
      );

      console.log('✅ Document statistics fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch document statistics:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  /**
   * Bulk approve documents
   * @param {Array} documentIds - Array of document IDs
   * @param {Object} approvalData - Bulk approval data
   * @param {string} approvalData.comment - Bulk approval comment
   * @returns {Promise<Object>} Bulk approval response
   */
  async bulkApproveDocuments(documentIds, approvalData = {}) {
    try {
      this.ensureAuthenticated();
      console.log('✅ Bulk approving documents:', documentIds.length);

      if (!documentIds || documentIds.length === 0) {
        throw new Error('Document IDs are required for bulk approval');
      }

      const payload = {
        documentIds,
        comment: approvalData.comment || 'Approbation en lot',
        approvedAt: new Date().toISOString()
      };

      const response = await this.httpClient.post(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.BULK_APPROVE}`,
        payload
      );

      console.log('✅ Bulk approval completed successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to bulk approve documents:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  /**
   * Bulk reject documents
   * @param {Array} documentIds - Array of document IDs
   * @param {Object} rejectionData - Bulk rejection data
   * @param {string} rejectionData.reason - Bulk rejection reason (required)
   * @param {string} rejectionData.comment - Additional comments
   * @returns {Promise<Object>} Bulk rejection response
   */
  async bulkRejectDocuments(documentIds, rejectionData) {
    try {
      this.ensureAuthenticated();
      console.log('❌ Bulk rejecting documents:', documentIds.length);

      if (!documentIds || documentIds.length === 0) {
        throw new Error('Document IDs are required for bulk rejection');
      }

      if (!rejectionData.reason) {
        throw new Error('Rejection reason is required for bulk rejection');
      }

      const payload = {
        documentIds,
        reason: rejectionData.reason,
        comment: rejectionData.comment || '',
        rejectedAt: new Date().toISOString()
      };

      const response = await this.httpClient.post(
        `${this.baseUrl}${API_CONFIG.ENDPOINTS.DOCUMENTS.BULK_REJECT}`,
        payload
      );

      console.log('✅ Bulk rejection completed successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to bulk reject documents:', error);
      return { success: false, error: this.formatError(error.message) };
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Format error messages for user display
   */
  formatError(errorMessage) {
    if (!errorMessage) return 'Une erreur inconnue s\'est produite';
    
    // Common error mappings
    const errorMap = {
      'Network Error': 'Erreur de réseau. Vérifiez votre connexion.',
      'Request timeout': 'La requête a expiré. Veuillez réessayer.',
      'Authentication required': 'Vous devez vous connecter pour continuer.',
      'Forbidden': 'Accès non autorisé à cette ressource.',
      'Not Found': 'Ressource non trouvée.',
      'Internal Server Error': 'Erreur du serveur. Veuillez réessayer plus tard.'
    };

    // Check for mapped errors
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    return errorMessage;
  }

  /**
   * Get all agencies
   * @returns {Promise<Object>} List of agencies
   */
  async getAllAgencies() {
    try {
      this.ensureAuthenticated();
      console.log('🏢 Fetching all agencies');

      const response = await this.httpClient.get(
        `${this.baseUrl}/api/v1/agence/getAgences`
      );

      console.log('✅ Agencies fetched successfully');
      console.log(`🏢 Total agencies: ${response.data.length}`);
      console.log('Response:', response.data);
      console.log('success:', response.success);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch agencies:', error);
      throw error;
    }
  }

  /**
   * Create new agency
   * @param {Object} agencyData - Agency data to create
   * @returns {Promise<Object>} Created agency
   */
  async createAgency(agencyData) {
    try {
      this.ensureAuthenticated();
      console.log('🏢 Creating new agency');

      const response = await this.httpClient.post(
        `${this.baseUrl}/api/v1/agence/add`,
        agencyData
      );

      console.log('✅ Agency created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create agency:', error);
      throw error;
    }
  }

  /**
   * Update existing agency
   * @param {string} agencyId - Agency ID to update
   * @param {Object} agencyData - Updated agency data
   * @returns {Promise<Object>} Updated agency
   */
  async updateAgency(agencyId, agencyData) {
    try {
      this.ensureAuthenticated();
      console.log(`🏢 Updating agency ${agencyId}`);

      const response = await this.httpClient.put(
        `${this.baseUrl}/api/v1/agence/admin/agencies/${agencyId}`,
        agencyData
      );

      console.log('✅ Agency updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update agency:', error);
      throw error;
    }
  }

  /**
   * Delete agency
   * @param {string} agencyId - Agency ID to delete
   * @returns {Promise<Object>} Delete confirmation
   */
  async deleteAgency(agencyId) {
    try {
      this.ensureAuthenticated();
      console.log(`🏢 Deleting agency ${agencyId}`);

      const response = await this.httpClient.delete(
        `${this.baseUrl}/api/v1/agence/admin/agencies/${agencyId}`
      );

      console.log('✅ Agency deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to delete agency:', error);
      throw error;
    }
  }

  /**
   * Get agency details
   * @param {string} agencyId - Agency ID
   * @returns {Promise<Object>} Agency details
   */
  async getAgencyDetails(agencyId) {
    try {
      this.ensureAuthenticated();
      console.log(`🏢 Fetching agency details ${agencyId}`);

      const response = await this.httpClient.get(
        `${this.baseUrl}/api/v1/agence/admin/agencies/${agencyId}`
      );

      console.log('✅ Agency details fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch agency details:', error);
      throw error;
    }
  }
}
// =====================================
// MAIN API SERVICE - Simple Export
// =====================================

/**
 * Main ApiService class - Simple implementation
 */
class ApiService {
  constructor() {
    this.agenceService = new AgenceService();
    this.httpClient = new SimpleHttpClient();
  }

  // Document methods (direct access for backwards compatibility)
  async getPendingDocuments(params) {
    return this.agenceService.getPendingDocuments(params);
  }

  async getDocumentForReview(documentId) {
    return this.agenceService.getDocumentForReview(documentId);
  }

  async approveDocument(documentId, approvalData) {
    return this.agenceService.approveDocument(documentId, approvalData);
  }

  async rejectDocument(documentId, rejectionData) {
    return this.agenceService.rejectDocument(documentId, rejectionData);
  }

  async getDocumentStatistics(params) {
    return this.agenceService.getDocumentStatistics(params);
  }

  async bulkApproveDocuments(documentIds, approvalData) {
    return this.agenceService.bulkApproveDocuments(documentIds, approvalData);
  }

  async bulkRejectDocuments(documentIds, rejectionData) {
    return this.agenceService.bulkRejectDocuments(documentIds, rejectionData);
  }

  async getAllAgencies() {
    return this.agenceService.getAllAgencies();
  }

  async createAgency(agencyData) {
    return this.agenceService.createAgency(agencyData);
  }

  async updateAgency(agencyId, agencyData) {
    return this.agenceService.updateAgency(agencyId, agencyData);
  }

  async deleteAgency(agencyId) {
    return this.agenceService.deleteAgency(agencyId);
  }

  async getAgencyDetails(agencyId) {
    return this.agenceService.getAgencyDetails(agencyId);
  }

  // Utility methods
  formatError(errorMessage) {
    return this.agenceService.formatError(errorMessage);
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;