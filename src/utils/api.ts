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
    const response = await api.get(`/orderbook/${orderId}`);
    return response.data.data;
  },

  // Get project graph data
  getProjectGraph: async (projectId: string): Promise<ProjectGraphResponse> => {
    const response = await api.get(`/projects/${projectId}/graph`);
    
    if (response.data && (response.data.data || Array.isArray(response.data))) {
      return Array.isArray(response.data) 
        ? { data: response.data, project_name: '', symbol: '' }
        : response.data;
    } else {
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
  },

  // Get attestation status
  getAttestationStatus: async (): Promise<AttestationStatus> => {
    try {
      const response = await api.get('/attestations/status');
      
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
    } catch {
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
    try {
      const response = await api.get('/attestations');
      
      // API returns an array of attestations in the data field
      return response.data.data || [];
    } catch {
      // Return a default response for testing
      return [];
    }
  },

  // Get attestation by ID
  getAttestationById: async (attestationId: string): Promise<Attestation | null> => {
    try {
      const response = await api.get(`/attestations/${attestationId}`);
      
      // API returns the attestation in the data field
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Submit attestation
  submitAttestation: async (data: AttestationRequest): Promise<AttestationResponse> => {
    try {
      const response = await api.post('/attestations', data);
      
      // API returns an object with a data field containing the created attestation
      return {
        success: true,
        message: "Attestation submitted successfully",
        attestation_id: response.data.data?.attestation_id,
        data: response.data.data
      };
    } catch (error) {
      // Return a default response for testing
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit attestation"
      };
    }
  },

  // Delete attestation
  deleteAttestation: async (attestationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.delete(`/attestations/${attestationId}`);
      return { success: true };
    } catch (error) {
      
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
    const response = await api.get('/portfolio');
    return response.data.data || [];
  },

  // Get portfolio by ID
  getPortfolioById: async (portfolioId: string): Promise<Portfolio> => {
    const response = await api.get(`/portfolio/${portfolioId}`);
    return response.data.data;
  },

  // Create portfolio
  createPortfolio: async (data: CreatePortfolioRequest): Promise<Portfolio> => {
    const response = await api.post('/portfolio', data);
    return response.data.data;
  },

  // Update portfolio
  updatePortfolio: async (portfolioId: string, data: UpdatePortfolioRequest): Promise<Portfolio> => {
    const response = await api.put(`/portfolio/${portfolioId}`, data);
    return response.data.data;
  },

  // Delete portfolio
  deletePortfolio: async (portfolioId: string): Promise<void> => {
    await api.delete(`/portfolio/${portfolioId}`);
  },

  // Get portfolio assets
  getPortfolioAssets: async (portfolioId: string): Promise<PortfolioAsset[]> => {
    const response = await api.get(`/portfolio/${portfolioId}`);
    
    // Return assets array from API response
    const assets = response.data.data.assets || [];
    
    // Transform data to the correct format
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
  },

  // Get portfolio asset by ID
  getPortfolioAssetById: async (_portfolioId: string, assetId: string): Promise<PortfolioAsset> => {
    const response = await api.get(`/portfolio/assets/${assetId}`);
    return response.data.data;
  },

  // Create portfolio asset
  createPortfolioAsset: async (portfolioId: string, data: CreatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    // Transform data to the correct format
    const formattedData = {
      project_id: data.project_id || null,
      project_name: data.project_name,
      // Send date without timezone as required by API
      date: data.date.split('T')[0], // Format YYYY-MM-DD
      // Use invested_amount as string since API expects a string
      invested_amount: String(data.invested_amount),
      terms: data.terms || '',
      project_website: data.project_website || null,
      valuation: data.valuation ? String(data.valuation) : null,
      equity_or_tokens_amount: data.equity_or_tokens_amount ? String(data.equity_or_tokens_amount) : null
    };
    
    const response = await api.post(`/portfolio/${portfolioId}/assets`, formattedData);
    return response.data.data;
  },

  // Update portfolio asset
  updatePortfolioAsset: async (_portfolioId: string, assetId: string, data: UpdatePortfolioAssetRequest): Promise<PortfolioAsset> => {
    // Transform data to the correct format
    const formattedData = {
      project_id: data.project_id || null,
      project_name: data.project_name,
      // Send date without timezone as required by API
      date: data.date ? data.date.split('T')[0] : undefined, // Format YYYY-MM-DD
      // Use numeric fields as strings since API expects strings
      invested_amount: data.invested_amount !== undefined ? String(data.invested_amount) : undefined,
      terms: data.terms || '',
      project_website: data.project_website || null,
      // Validation should be in string format with floating point
      valuation: data.valuation === null || data.valuation === undefined ? "0" : String(data.valuation),
      equity_or_tokens_amount: data.equity_or_tokens_amount !== undefined ? String(data.equity_or_tokens_amount) : undefined
    };
    
    const response = await api.put(`/portfolio/assets/${assetId}`, formattedData);
    return response.data.data;
  },

  // Delete portfolio asset
  deletePortfolioAsset: async (_portfolioId: string, assetId: string): Promise<void> => {
    await api.delete(`/portfolio/assets/${assetId}`);
  },

  // Upload portfolio assets CSV
  uploadPortfolioAssetsCSV: async (_portfolioId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/portfolio/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Search projects for portfolio assets
  searchProjects: async (query: string): Promise<ProjectSearchResult[]> => {
    const response = await api.get<ProjectSearchResponse>('/projects/ids', { params: { search: query } });
    return response.data.data || [];
  }
}; 