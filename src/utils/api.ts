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
  ProjectGraphResponse
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
  }
}; 