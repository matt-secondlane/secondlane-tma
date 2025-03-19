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

// Place RFQ request
export interface PlaceRFQRequest {
  project_id: string;
  tranche_size: number;
  valuation: number;
  terms: string;
  type: 'BUY' | 'SELL';
}

// Place RFQ response
export interface PlaceRFQResponse {
  rfq_id: string;
  project_id: string;
  project_name: string;
  tranche_size: number;
  valuation: number;
  type: 'BUY' | 'SELL';
  status: string;
  logo: string | null;
  created_at: string;
}

// RFQ details
export interface RFQDetails {
  data: {
    rfq_id: string;
    project_id: string;
    project_name: string;
    tranche_size: number;
    valuation: number;
    type: 'BUY' | 'SELL';
    status: string;
    terms: string;
    logo: string;
    created_at: string;
    updated_at: string;
  }
}

// Update RFQ request
export interface UpdateRFQRequest {
  rfq_id: string;
  tranche_size: number;
  valuation: number;
  terms: string;
}

// Update RFQ response
export interface UpdateRFQResponse {
  data: {
    rfq_id: string;
    project_id: string;
    tranche_size: number;
    valuation: number;
    type: 'BUY' | 'SELL';
    status: string;
    terms: string;
  }
}

// Project graph response interface
export interface ProjectGraphResponse {
  data: {
    project_id: string;
    orders?: Array<{
      date: string;
      type: string;
      offered_fully_diluted_valuation: number;
      offered_amount: number;
      order_id: string;
      round: string | null;
      deal_type: string;
    }>;
    funding_rounds?: Array<{
      date: string;
      valuation: number | null;
      amount_raised?: number | null;
      round_name?: string;
      fill?: Array<{
        date: string;
        valuation: number | null;
        amount_raised?: number | null;
      }>;
    }>;
    price_history?: Array<{
      date: string;
      price_usd: number;
      market_cap_usd: number;
      total_volume_usd?: number;
    }>;
  };
  project_name?: string;
  symbol?: string;
}

// Graph data point for processed chart data
export interface GraphDataPoint {
  date: string;
  marketValue?: number;
  fundingValue?: number;
  secondLaneBuy?: number;
  secondLaneSell?: number;
  offered_fully_diluted_valuation?: number;
  type?: string;
  allBuyOrders?: Array<OrderData>;
  allSellOrders?: Array<OrderData>;
}

// Order data for tooltips
export interface OrderData {
  id: string;
  fdv: number;
  amount: number;
}

// Attestation data
export interface Attestation {
  attestation_id: string;
  attestation_year: number;
  individual_income_test: boolean;
  joint_income_test: boolean;
  net_worth_test: boolean;
  affirmation: boolean;
  country: string;
  email: string;
  created_at: string;
}

// Attestation status response
export interface AttestationStatus {
  is_attested: boolean;
  attestation_date?: string;
  data?: Attestation[];
  latest_attestation_year?: number | null;
  has_attestation?: boolean;
  is_accredited?: boolean;
}

// Attestation request
export interface AttestationRequest {
  attestation_year: number;
  individual_income_test: boolean;
  joint_income_test: boolean;
  net_worth_test: boolean;
  affirmation: boolean;
  country: string;
  email: string;
}

// Attestation response
export interface AttestationResponse {
  success: boolean;
  message?: string;
  attestation_id?: string;
  data?: Attestation;
}

// Portfolio types
export interface Portfolio {
  portfolio_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface PortfolioAsset {
  asset_id: string;
  portfolio_id: string;
  project_id?: string;
  project_name: string;
  date?: string;
  invested_amount?: number;
  terms?: string;
  project_website?: string;
  valuation?: number;
  equity_or_tokens_amount?: number;
  created_at: string;
  updated_at: string;
  logo?: string;
  project?: {
    project_id: string | null;
    name: string;
    logo: string | null;
  };
}

export interface PortfolioResponse {
  data: Portfolio;
}

export interface PortfoliosResponse {
  data: Portfolio[];
}

export interface PortfolioAssetResponse {
  data: PortfolioAsset;
}

export interface PortfolioAssetsResponse {
  data: PortfolioAsset[];
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface CreatePortfolioAssetRequest {
  project_id?: string;
  project_name: string;
  date: string;
  invested_amount: number;
  terms?: string;
  project_website?: string;
  valuation?: number;
  equity_or_tokens_amount?: number;
}

export interface UpdatePortfolioAssetRequest {
  project_id?: string;
  project_name?: string;
  date?: string;
  invested_amount?: number;
  terms?: string;
  project_website?: string;
  valuation?: number;
  equity_or_tokens_amount?: number;
}

export interface ProjectSearchResult {
  project_id: string;
  project_name: string;
  logo?: string;
}

export interface ProjectSearchResponse {
  total: number;
  data: ProjectSearchResult[];
} 