// Query parameters
export interface BidsQueryParams {
  order_id?: string;
  type?: 'Buy' | 'Sell';
  limit?: number;
  offset?: number;
  search?: string;
}

// Error response
export interface ApiError {
  error: string;
}

// Rate limit error response
export interface RateLimitError extends ApiError {
  reset_at: string;
}

// Bid data
export interface Bid {
  // Required fields
  inquiry_id: string;
  order_id: string;
  tranche_size: number;
  valuation: number;
  type: 'BUY' | 'SELL';
  project_id: string;
  project_name: string;
  offered_fdv: number;
  asset_type: 'SAFT' | 'LIQUID_TOKEN' | string;
  logo: string | null;
  created_at: string;
  updated_at: string;

  // Optional fields
  name?: string;
  email?: string;
}

// Bids list response
export interface BidsResponse {
  page: number;
  items: number;
  total: number;
  data: Bid[];
}

// Place bid request
export interface PlaceBidRequest {
  order_id: string;
  tranche_size: number;
  valuation: number;
  email: string;
  name: string;
  company?: string;
  job_title?: string;
  website?: string;
  telegram_username?: string;
  linkedin?: string;
  x_username?: string;
}

// Place bid response
export interface PlaceBidResponse {
  inquiry_id: string;
  order_id: string;
  created_at: string;
  updated_at: string;
}

// Bid details
export interface BidDetails {
  data: {
    inquiry_id: string;
    order_id: string;
    name: string;
    email: string;
    tranche_size: number;
    valuation: number;
    type: 'Buy' | 'Sell';
  }
}

// Update bid request
export interface UpdateBidRequest {
  inquiry_id: string;
  tranche_size: number;
  valuation: number;
  type: 'Buy' | 'Sell';
}

// Update bid response
export interface UpdateBidResponse {
  data: {
    inquiry_id: string;
    order_id: string;
    tranche_size: number;
    valuation: number;
    type: 'Buy' | 'Sell';
  }
}

// Funding round
export interface FundingRound {
  round_name: string;
  date: string;
  fully_diluted_valuation?: number;
  amount_raised?: number;
  investors?: string[];
}

// Project
export interface Project {
  project_id: string;
  project_name: string;
  logo?: string;
  description?: string;
  link?: string;
  rounds?: FundingRound[];
}

// Projects query parameters
export interface ProjectsQueryParams {
  ids?: string[];
  limit?: number;
  offset?: number;
  include_rounds?: boolean;
  sort_by?: 'DATE' | 'PROJECT_NAME';
  sort_direction?: 'ASC' | 'DESC';
}

// Projects list response
export interface ProjectsResponse {
  total: number;
  page: number;
  items: number;
  data: Project[];
}

// Orderbook item (for list in DealsScreen)
export interface OrderbookItem {
  order_id: string;
  project_id: string;
  project_name: string;
  logo: string | null;
  deal_type: 'LIQUID_TOKEN' | 'EQUITY';
  type: 'BUY' | 'SELL';
  offered_amount: number;
  offered_fully_diluted_value: number;
  date: string;
  round: string | null;
}

// Order details (for OrderDetailsScreen)
export interface OrderDetails {
  order_id: string;
  project_id: string;
  logo: string | null;
  date: string;
  project_name: string;
  offered_amount: number;
  offered_fully_diluted_value: number;
  round: string | null;
  type: 'BUY' | 'SELL';
}

// Orderbook list response
export interface OrderbookResponse {
  data: OrderbookItem[];
  items: number;
  page: number;
  total: number;
}

// Project details response
export interface ProjectDetailsResponse {
  total: number;
  data: Project;
}

export interface ProjectResponse {
  total: number;
  data: Project;
} 