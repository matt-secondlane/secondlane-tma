import api from '../services/api';
import type { 
  BidsQueryParams, 
  BidsResponse, 
  PlaceBidRequest, 
  PlaceBidResponse,
  BidDetails,
  UpdateBidRequest,
  UpdateBidResponse,
  ProjectsQueryParams,
  ProjectsResponse,
  Project,
  OrderbookResponse,
  OrderDetails,
  PlaceRFQRequest,
  PlaceRFQResponse,
  RFQDetails,
  UpdateRFQRequest,
  UpdateRFQResponse,
  ProjectGraphResponse,
  AttestationStatus,
  AttestationRequest,
  AttestationResponse,
  Attestation,
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioAsset,
  CreatePortfolioAssetRequest,
  UpdatePortfolioAssetRequest,
  ProjectSearchResult,
  ProjectSearchResponse
} from '../types/api';

export const apiService = {
  // Get list of bids
  async getBids(params: BidsQueryParams): Promise<BidsResponse> {
    const response = await api.get('/bids', { params });
    return response.data;
  },

  // Place bid
  async placeBid(data: PlaceBidRequest): Promise<PlaceBidResponse> {
    const response = await api.post('/bids', data);
    return response.data;
  },

  // Get bid details
  async getBidDetails(inquiryId: string): Promise<BidDetails> {
    const response = await api.get(`/bids/${inquiryId}`);
    return response.data;
  },

  // Update bid
  async updateBid(data: UpdateBidRequest): Promise<UpdateBidResponse> {
    const response = await api.put(`/bids/${data.inquiry_id}`, data);
    return response.data;
  },

  // Delete bid
  async deleteBid(inquiryId: string): Promise<void> {
    await api.delete(`/bids/${inquiryId}`);
  },

  // Get list of projects
  async getProjects(params: ProjectsQueryParams): Promise<ProjectsResponse> {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get project details
  async getProjectById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  // Place RFQ
  async placeRFQ(data: PlaceRFQRequest): Promise<PlaceRFQResponse> {
    const response = await api.post('/rfq', data);
    return response.data;
  },

  // Get RFQ details
  async getRFQDetails(rfqId: string): Promise<RFQDetails> {
    const response = await api.get(`/rfq/${rfqId}`);
    return response.data;
  },

  // Update RFQ
  async updateRFQ(data: UpdateRFQRequest): Promise<UpdateRFQResponse> {
    const response = await api.put(`/rfq/${data.rfq_id}`, data);
    return response.data;
  },

  // Get orderbook
  getOrderbook: (params: BidsQueryParams): Promise<OrderbookResponse> => {
    return api.get('/orderbook', { params }).then(response => response.data);
  },

  // Get order details
  getOrderDetails: async (orderId: string): Promise<OrderDetails> => {
    console.log('API: getOrderDetails called with:', { orderId });
    try {
      const response = await api.get(`/orderbook/${orderId}`);
      console.log('API: getOrderDetails response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API: getOrderDetails error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        orderId
      });
      throw error;
    }
  },

  // Get project graph data
  getProjectGraph: async (projectId: string): Promise<ProjectGraphResponse> => {
    console.log('API: getProjectGraph called with:', { projectId });
    try {
      const response = await api.get(`/projects/${projectId}/graph`);
      console.log('API: getProjectGraph response:', response.data);
      
      if (response.data && (response.data.data || Array.isArray(response.data))) {
        return Array.isArray(response.data) 
          ? { data: response.data, project_name: '', symbol: '' }
          : response.data;
      } else {
        console.warn('API: getProjectGraph received unexpected data format:', response.data);
        return {
          data: {
            project_id: projectId,
            orders: [],
            funding_rounds: [],
            price_history: []
          },
          project_name: '',
          symbol: ''
        };
      }
    } catch (error) {
      console.error('API: getProjectGraph error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        projectId
      });
      throw error;
    }
  },

  // Get attestation status
  getAttestationStatus: async (): Promise<AttestationStatus> => {
    console.log('API: getAttestationStatus called');
    try {
      const response = await api.get('/attestations/status');
      console.log('API: getAttestationStatus response:', response.data);
      
      // API returns an object with a data field containing the attestation status
      const data = response.data.data;
      return {
        is_attested: data.has_attestation,
        has_attestation: data.has_attestation,
        is_accredited: data.is_accredited,
        latest_attestation_year: data.latest_attestation_year,
        attestation_date: undefined, // API does not return a date
        data: [] // API does not return an array of attestations
      };
    } catch (error) {
      console.error('API: getAttestationStatus error:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      // Return a default response for testing
      return {
        is_attested: false,
        has_attestation: false,
        is_accredited: false,
        latest_attestation_year: null,
        attestation_date: undefined,
        data: []
      };
    }
  },

  // Get attestations list
  getAttestations: async (): Promise<Attestation[]> => {
    console.log('API: getAttestations called');
    try {
      const response = await api.get('/attestations');
      console.log('API: getAttestations response:', response.data);
      
      // API returns an array of attestations in the data field
      return response.data.data || [];
    } catch (error) {
      console.error('API: getAttestations error:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      // Return a default response for testing
      return [];
    }
  },

  // Get attestation by ID
  getAttestationById: async (attestationId: string): Promise<Attestation | null> => {
    console.log('API: getAttestationById called with:', { attestationId });
    try {
      const response = await api.get(`/attestations/${attestationId}`);
      console.log('API: getAttestationById response:', response.data);
      
      // API returns the attestation in the data field
      return response.data.data || null;
    } catch (error) {
      console.error('API: getAttestationById error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        attestationId
      });
      return null;
    }
  },

  // Submit attestation
  submitAttestation: async (data: AttestationRequest): Promise<AttestationResponse> => {
    console.log('API: submitAttestation called with:', data);
    try {
      const response = await api.post('/attestations', data);
      console.log('API: submitAttestation response:', response.data);
      
      // API returns an object with a data field containing the created attestation
      return {
        success: true,
        message: "Attestation submitted successfully",
        attestation_id: response.data.data?.attestation_id,
        data: response.data.data
      };
    } catch (error) {
      console.error('API: submitAttestation error:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      // Return a default response for testing
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit attestation"
      };
    }
  },

  // Delete attestation
  deleteAttestation: async (attestationId: string): Promise<{ success: boolean; error?: string }> => {
    console.log('API: deleteAttestation called with:', { attestationId });
    try {
      const response = await api.delete(`/attestations/${attestationId}`);
      console.log('API: deleteAttestation response:', response.data);
      return { success: true };
    } catch (error) {
      console.error('API: deleteAttestation error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        attestationId
      });
      
      // If API returned an error with a message
      if (error && typeof error === 'object' && 'response' in error) {
        const responseData = (error as { response?: { data?: { error?: string } } }).response?.data;
        if (responseData && responseData.error) {
          return { success: false, error: responseData.error };
        }
      }
      
      return { success: false, error: "Failed to delete attestation" };
    }
  },

  // Portfolio API methods
  
  // Get all portfolios
  getPortfolios: async (): Promise<Portfolio[]> => {
    console.log('API: getPortfolios called');
    try {
      // Используем GET-запрос в соответствии с документацией
      const response = await api.get('/portfolio');
      console.log('API: getPortfolios response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: getPortfolios error:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  },

  // Get portfolio by ID
  getPortfolioById: async (portfolioId: string): Promise<Portfolio> => {
    console.log('API: getPortfolioById called with:', { portfolioId });
    try {
      // Используем GET-запрос в соответствии с документацией
      const response = await api.get(`/portfolio/${portfolioId}`);
      console.log('API: getPortfolioById response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API: getPortfolioById error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId
      });
      throw error;
    }
  },

  // Create portfolio
  createPortfolio: async (data: CreatePortfolioRequest): Promise<Portfolio> => {
    console.log('API: createPortfolio called with:', { data });
    try {
      const response = await api.post('/portfolio', data);
      console.log('API: createPortfolio response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API: createPortfolio error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        data
      });
      throw error;
    }
  },

  // Update portfolio
  updatePortfolio: async (portfolioId: string, data: UpdatePortfolioRequest): Promise<Portfolio> => {
    console.log('API: updatePortfolio called with:', { portfolioId, data });
    try {
      const response = await api.put(`/portfolio/${portfolioId}`, data);
      console.log('API: updatePortfolio response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API: updatePortfolio error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId,
        data
      });
      throw error;
    }
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId: string): Promise<void> => {
    console.log('API: deletePortfolio called with:', { portfolioId });
    try {
      await api.delete(`/portfolio/${portfolioId}`);
      console.log('API: deletePortfolio successful');
    } catch (error) {
      console.error('API: deletePortfolio error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId
      });
      throw error;
    }
  },

  // Get portfolio assets
  getPortfolioAssets: async (portfolioId: string): Promise<PortfolioAsset[]> => {
    console.log('API: getPortfolioAssets called with:', { portfolioId });
    try {
      // Получаем данные портфеля, включая активы
      const response = await api.get(`/portfolio/${portfolioId}`);
      console.log('API: getPortfolioAssets full response:', JSON.stringify(response.data, null, 2));
      
      // Возвращаем массив активов из ответа API
      const assets = response.data.data.assets || [];
      
      // Преобразуем данные в правильный формат
      return assets.map((asset: Partial<PortfolioAsset> & { 
        project?: { 
          project_id: string | null; 
          name: string; 
          image_url: string | null; 
        } 
      }) => ({
        asset_id: asset.asset_id || '',
        portfolio_id: asset.portfolio_id || '',
        project_name: asset.project?.name || '',
        project: asset.project,
        project_website: asset.project_website || '',
        tranche_size: asset.tranche_size,
        valuation: asset.valuation,
        terms: asset.terms || '',
        date: asset.date || asset.created_at || '',
        created_at: asset.created_at || '',
        updated_at: asset.updated_at || ''
      }));
    } catch (error) {
      console.error('API: getPortfolioAssets error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId
      });
      throw error;
    }
  },

  // Get portfolio asset by ID
  getPortfolioAssetById: async (portfolioId: string, assetId: string): Promise<PortfolioAsset> => {
    console.log('API: getPortfolioAssetById called with:', { portfolioId, assetId });
    try {
      // Используем GET-запрос в соответствии с документацией
      const response = await api.get(`/portfolio/assets/${assetId}`);
      console.log('API: getPortfolioAssetById full response:', JSON.stringify(response.data, null, 2));
      return response.data.data;
    } catch (error) {
      console.error('API: getPortfolioAssetById error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId,
        assetId
      });
      throw error;
    }
  },

  // Create portfolio asset
  createPortfolioAsset: async (portfolioId: string, data: CreatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    console.log('API: createPortfolioAsset called with:', JSON.stringify({ portfolioId, data }, null, 2));
    try {
      // Преобразуем данные в правильный формат
      const formattedData = {
        project_id: data.project_id || null,
        project_name: data.project_name,
        // Отправляем дату без часового пояса, как требует API
        date: data.date.split('T')[0], // Формат YYYY-MM-DD
        // Используем invested_amount как строку, так как API ожидает строку
        invested_amount: String(data.invested_amount),
        terms: data.terms || '',
        project_website: data.project_website || null,
        valuation: data.valuation ? String(data.valuation) : null,
        equity_or_tokens_amount: data.equity_or_tokens_amount ? String(data.equity_or_tokens_amount) : null
      };
      
      console.log('API: createPortfolioAsset formatted data:', JSON.stringify(formattedData, null, 2));
      
      const response = await api.post(`/portfolio/${portfolioId}/assets`, formattedData);
      console.log('API: createPortfolioAsset full response:', JSON.stringify(response.data, null, 2));
      return response.data.data;
    } catch (error) {
      console.error('API: createPortfolioAsset error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId,
        data
      });
      throw error;
    }
  },

  // Update portfolio asset
  updatePortfolioAsset: async (portfolioId: string, assetId: string, data: UpdatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    console.log('API: updatePortfolioAsset called with:', { portfolioId, assetId, data });
    try {
      // Преобразуем данные в правильный формат
      const formattedData = {
        project_id: data.project_id || null,
        project_name: data.project_name,
        // Отправляем дату без часового пояса, как требует API
        date: data.date ? data.date.split('T')[0] : undefined, // Формат YYYY-MM-DD
        // Используем числовые поля как строки, так как API ожидает строки
        invested_amount: data.invested_amount !== undefined ? String(data.invested_amount) : undefined,
        terms: data.terms || '',
        project_website: data.project_website || null,
        // Валидация должна быть в формате строки с плавающей точкой
        valuation: data.valuation === null || data.valuation === undefined ? "0" : String(data.valuation),
        equity_or_tokens_amount: data.equity_or_tokens_amount !== undefined ? String(data.equity_or_tokens_amount) : undefined
      };
      
      console.log('API: updatePortfolioAsset formatted data:', JSON.stringify(formattedData, null, 2));
      
      const response = await api.put(`/portfolio/assets/${assetId}`, formattedData);
      console.log('API: updatePortfolioAsset response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API: updatePortfolioAsset error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId,
        assetId,
        data
      });
      throw error;
    }
  },

  // Delete portfolio asset
  deletePortfolioAsset: async (portfolioId: string, assetId: string): Promise<void> => {
    console.log('API: deletePortfolioAsset called with:', { portfolioId, assetId });
    try {
      await api.delete(`/portfolio/assets/${assetId}`);
      console.log('API: deletePortfolioAsset successful');
    } catch (error) {
      console.error('API: deletePortfolioAsset error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId,
        assetId
      });
      throw error;
    }
  },

  // Upload portfolio assets CSV
  uploadPortfolioAssetsCSV: async (portfolioId: string, file: File): Promise<void> => {
    console.log('API: uploadPortfolioAssetsCSV called with:', { portfolioId });
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/portfolio/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('API: uploadPortfolioAssetsCSV successful');
    } catch (error) {
      console.error('API: uploadPortfolioAssetsCSV error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        portfolioId
      });
      throw error;
    }
  },

  // Search projects for portfolio assets
  searchProjects: async (query: string): Promise<ProjectSearchResult[]> => {
    console.log('API: searchProjects called with:', { query });
    try {
      const response = await api.get<ProjectSearchResponse>('/projects/ids', { params: { search: query } });
      console.log('API: searchProjects response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('API: searchProjects error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        query
      });
      throw error;
    }
  }
}; 