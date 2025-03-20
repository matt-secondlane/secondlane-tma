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
<<<<<<< HEAD
        logo: string | null; 
=======
        image_url: string | null;
        logo: string | null;
>>>>>>> d48e45f (Add portfolio tracker CSV functionality)
      } 
    }) => ({
      asset_id: asset.asset_id || '',
      portfolio_id: asset.portfolio_id || '',
      logo: asset.project?.logo || '',
      project_name: asset.project?.name || '',
      // Извлекаем logo из объекта project
      logo: asset.project?.logo || asset.project?.image_url || null,
      project: asset.project,
      project_website: asset.project_website || '',
<<<<<<< HEAD
=======
      tranche_size: asset.tranche_size,
>>>>>>> d48e45f (Add portfolio tracker CSV functionality)
      invested_amount: asset.invested_amount,
      valuation: asset.valuation,
      terms: asset.terms || '',
      date: asset.date || asset.created_at || '',
      created_at: asset.created_at || '',
      updated_at: asset.updated_at || '',
      equity_or_tokens_amount: asset.equity_or_tokens_amount
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
      invested_amount: data.invested_amount,
      terms: data.terms || '',
      project_website: data.project_website || null,
      valuation: data.valuation ? data.valuation : null,
      equity_or_tokens_amount: data.equity_or_tokens_amount ? data.equity_or_tokens_amount : null
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
      invested_amount: data.invested_amount,
      terms: data.terms || '',
      project_website: data.project_website || null,
      valuation: data.valuation ?? 0,
      equity_or_tokens_amount: data.equity_or_tokens_amount
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
    // Проверка файла
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Проверка расширения файла
    if (!file.name.endsWith('.csv')) {
      throw new Error('Файл должен быть в формате CSV');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/portfolio/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Create new portfolio from CSV
  createPortfolioFromCSV: async (name: string, file: File): Promise<Portfolio> => {
    // Проверка файла
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Проверка только расширения файла
    if (!file.name.endsWith('.csv')) {
      throw new Error('Файл должен быть в формате CSV');
    }
    
    // Создаем FormData
    const formData = new FormData();
    formData.append('csv_file', file, file.name);
    formData.append('portfolio_name', name);
    
    // Отправляем запрос
    const response = await fetch('/api/v1/portfolio/csv', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `tma ${window.Telegram?.WebApp?.initData || ''}`
      }
    });
    
    // Обрабатываем ошибки
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }
    
    // Получаем результат
    const csvResponse = await response.json();
    let portfolioId = csvResponse?.data?.portfolio_id;
    
    // Если ID нет в ответе, ищем по имени
    if (!portfolioId) {
      const portfolios = await api.get('/portfolio');
      const createdPortfolio = portfolios.data.data.find((p: Portfolio) => p.name === name);
      if (createdPortfolio) {
        portfolioId = createdPortfolio.portfolio_id;
      }
    }
    
    if (portfolioId) {
      const portfolioResponse = await api.get(`/portfolio/${portfolioId}`);
      return portfolioResponse.data.data;
    } else {
      throw new Error('Не удалось получить ID созданного портфолио');
    }
  },

  // Add assets to existing portfolio from CSV
  addAssetsToPortfolioFromCSV: async (portfolioId: string, file: File, portfolioName?: string): Promise<void> => {
    // Проверка файла
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Проверка только расширения файла
    if (!file.name.endsWith('.csv')) {
      throw new Error('Файл должен быть в формате CSV');
    }
    
    // Если имя портфолио не передано, получаем его по ID
    let name = portfolioName;
    if (!name) {
      const portfolio = await apiService.getPortfolioById(portfolioId);
      name = portfolio.name;
    }
    
    if (!name) {
      throw new Error('Portfolio name is required');
    }
    
    // Создаем FormData с нужными полями
    const formData = new FormData();
    formData.append('csv_file', file, file.name);
    formData.append('portfolio_name', name);
    formData.append('portfolio_id', portfolioId); // Добавляем ID портфолио
    formData.append('append', 'true'); // Явно указываем, что нужно добавить, а не заменить
    
    // Используем основной эндпоинт для работы с CSV
    const response = await fetch('/api/v1/portfolio/csv', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `tma ${window.Telegram?.WebApp?.initData || ''}`
      }
    });
    
    // Обрабатываем ошибки
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }
  },

  // Get CSV template URL
  getCSVTemplateURL: (): string => {
    return 'https://d1yccqs7b7eo8o.cloudfront.net/28cb6313-ab56-4caf-a282-8aa8e1e2bb38';
  },

  // Search projects for portfolio assets
  searchProjects: async (query: string): Promise<ProjectSearchResult[]> => {
    const response = await api.get<ProjectSearchResponse>('/projects/ids', { 
      params: { 
        search: query,
        include_logo: true 
      } 
    });
    return response.data.data || [];
  },

  // Add assets from CSV one by one to existing portfolio (fallback method)
  addAssetsFromCSVOneByOne: async (portfolioId: string, file: File): Promise<void> => {
    // Проверка файла
    if (!file || file.size === 0) {
      throw new Error('CSV file is required and cannot be empty');
    }
    
    // Проверка расширения файла
    if (!file.name.endsWith('.csv')) {
      throw new Error('CSV file format is required');
    }
    
    // Читаем CSV файл как текст
    const reader = new FileReader();
    
    const csvText = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    
    // Парсим CSV
    const rows = csvText.split('\n');
    const headers = rows[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    
    // Проверяем, что есть необходимые заголовки
    const requiredHeaders = ['project_name', 'date', 'invested_amount'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    // Успешно добавленные активы
    let successCount = 0;
    let errorCount = 0;
    
    // Обрабатываем каждую строку, начиная со второй (индекс 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue; // Пропускаем пустые строки
      
      const values = row.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      
      // Проверяем, что у нас достаточно значений
      if (values.length < headers.length) {
        errorCount++;
        continue;
      }
      
      // Создаем объект с данными актива
      const assetData: Record<string, string | null> = {};
      headers.forEach((header, index) => {
        assetData[header] = values[index] || null;
      });
      
      try {
        // Преобразуем данные в формат, ожидаемый API
        const formattedData = {
          project_name: assetData.project_name,
          date: assetData.date, // Формат YYYY-MM-DD
          invested_amount: assetData.invested_amount,
          terms: assetData.terms || '',
          project_website: assetData.project_website || null,
          valuation: assetData.valuation || null,
          equity_or_tokens_amount: assetData.equity_or_tokens_amount || null
        };
        
        // Создаем актив с помощью стандартного API
        await api.post(`/portfolio/${portfolioId}/assets`, formattedData);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    
    // Если ни один актив не был добавлен успешно, выбрасываем ошибку
    if (successCount === 0) {
      throw new Error(`Failed to add any assets. Errors: ${errorCount}`);
    }
    
    // Если были ошибки, но некоторые активы были добавлены успешно
    if (errorCount > 0) {
      console.warn(`Some assets (${errorCount}) failed to import. Successfully imported: ${successCount}`);
    }
  }
}; 