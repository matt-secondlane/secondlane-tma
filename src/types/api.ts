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
      spot_fdv_usd: number;
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
  marketCap?: number;
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
  subscribe_to_newsletter?: boolean;
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
  assets?: PortfolioAsset[];
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
  equity_or_tokens_amount?: number | string;
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
  equity_or_tokens_amount?: number | string;
}

export interface UpdatePortfolioAssetRequest {
  project_id?: string;
  project_name?: string;
  date?: string;
  invested_amount?: number;
  terms?: string;
  project_website?: string;
  valuation?: number;
  equity_or_tokens_amount?: number | string;
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

// Notification types
export interface NotificationSettings {
  id: string;
  telegram_notifications: boolean;
  email_notifications: boolean;
  email: string;
}

export interface NotificationEventType {
  id: string;
  code: string;
  name: string;
}

export interface NotificationPreference {
  id: string;
  event_type: {
    id: string;
    code: string;
    name: string;
  };
  telegram_enabled: boolean;
  email_enabled: boolean;
}

export interface Notification {
  id: string;
  notification_type: string;
  message: string;
  notification_data: {
    [key: string]: string | number | boolean | null | undefined;
  };
  created_at: string;
  read_at: string | null;
}

export interface NotificationSettingsResponse {
  data: NotificationSettings;
}

export interface NotificationEventTypesResponse {
  data: NotificationEventType[];
}

export interface NotificationPreferencesResponse {
  data: NotificationPreference[];
}

export interface NotificationsResponse {
  data: Notification[];
}

// Portfolio summary interfaces
export interface PortfolioSummary {
  total_invested_amount: number;
  total_current_value: number;
  total_gain_loss_usd: number;
  total_gain_loss_percentage: number;
  total_assets: number;
  assets?: AssetSummary[];
}

export interface PortfolioGraphDataPoint {
  date: string;
  total_value: number;
  total_invested: number;
  gain_loss_usd: number;
  gain_loss_percentage: number;
  assets: {
    asset_id: string;
    name: string;
    value: number;
    gain_loss_usd: number;
    gain_loss_percentage: number;
  }[];
}

export interface PortfolioGraphResponse {
  data: {
    portfolio_id: string;
    monthly_values: PortfolioGraphDataPoint[];
  };
}

export interface AssetSummary {
  asset_id: string;
  project: {
    project_id: string;
    name: string;
    logo?: string;
  };
  invested_amount: number;
  current_value: number;
  project_valuation: number;
  previous_valuation: number;
  gain_loss_usd: number;
  gain_loss_percentage: number;
  valuation_source: string;
  date: string;
  project_website?: string;
  equity_or_tokens_amount?: number | string;
  unlock?: PortfolioAssetUnlock;
}

export interface PortfolioAssetSummaries {
  assets: AssetSummary[];
}

export interface AssetGraphResponse {
  data: {
    asset_id: string;
    project: {
      project_id: string;
      name: string;
      logo?: string;
    };
    monthly_values: PortfolioGraphDataPoint[];
  };
}

export interface CSVPortfolioResponse {
  portfolio_id: string;
  matched_assets: number;
  total_assets: number;
}

// Project Unlock types
export interface ProjectUnlockAllocation {
  name: string;
  tokens: number;
  allocation_of_supply: number;
  unlock_type: string;
  tge_unlock: number;
  tge_unlock_percent: number;
  next_unlock_date: string;
  next_unlock_tokens: number;
}

export interface ProjectUnlock {
  unlock_type: string;
  total_supply: number;
  max_supply: number;
  circulating_supply: number;
  next_unlock_date: string;
  next_unlock_tokens: number;
  total_unlocked: number;
  total_locked: number;
  total_untracked: number;
  vesting_start_date: string;
  vesting_end_date: string;
  listing_date: string;
  allocations: ProjectUnlockAllocation[];
}

export interface ProjectUnlockResponse {
  unlock: ProjectUnlock;
}

// Portfolio Unlock types
export interface PortfolioAssetUnlockAllocation {
  unlock_date: string;
  amount: number;
  percent_of_total: number;
  is_cliff: boolean;
  is_tge: boolean;
}

export interface PortfolioAssetUnlock {
  unlock_type: string;
  start_date: string;
  end_date: string;
  cliff_date?: string;
  tge_percent?: number;
  total_amount?: number;
  allocations?: PortfolioAssetUnlockAllocation[];
  status?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  total_allocation_percentage?: number;
  summary?: PortfolioUnlocksSummary;
  unlock_status?: 'unlocking' | 'unlocked' | 'locked';
}

// Data for endpoint /api/v1/portfolio/unlocks/summary
export interface PortfolioUnlockSummaryItem {
  portfolio_id: string;
  portfolio_name: string;
  asset_id: string;
  asset_name: string;
  logo?: string;
  unlock: PortfolioAssetUnlock;
}

export interface PortfolioUnlockSummaryResponse {
  data: {
    summary: PortfolioUnlocksSummary;
    unlocks: PortfolioUnlockSummaryItem[];
  };
}

// Data for endpoint /api/v1/portfolio/{portfolio_id}/unlocks
export interface PortfolioAssetUnlockItem {
  asset_id: string;
  asset_name: string;
  logo?: string;
  unlock: PortfolioAssetUnlock;
}

export interface PortfolioUnlocksSummary {
  total_amount_locked: number;
  total_amount_unlocked: number;
  unlocked_percent: number;
  locked_percent: number;
  next_unlock_date?: string;
  portfolio_count?: number;
  asset_count?: number;
  total_tge_amount?: number;
}

export interface PortfolioUnlocksResponse {
  data: {
    summary: PortfolioUnlocksSummary;
    unlocks: PortfolioAssetUnlockItem[];
  };
}

// Data for endpoint /api/v1/portfolio/unlocks/allocations
export interface PortfolioAssetAllocationItem {
  portfolio_id: string;
  portfolio_name: string;
  asset_id: string;
  asset_name: string;
  logo?: string;
  allocations: PortfolioAssetUnlockAllocation[];
}

export interface PortfolioUnlockAllocationsResponse {
  data: PortfolioAssetAllocationItem[];
} 