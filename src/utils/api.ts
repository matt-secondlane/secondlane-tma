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
  Attestation
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
  }
}; 