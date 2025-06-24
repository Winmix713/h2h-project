import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  FigmaFile, 
  FileResponse, 
  FileNodesResponse, 
  FileImagesResponse,
  FigmaNode 
} from '../types/figma';

export class FigmaApiClient {
  private client: AxiosInstance;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': token,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔄 Figma API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Figma API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`❌ Figma API Error: ${error.response.status} ${error.response.data?.err || error.message}`);
          throw new FigmaApiError(
            error.response.data?.err || error.message,
            error.response.status,
            error.response.config.url
          );
        } else if (error.request) {
          console.error('❌ Figma API Network Error:', error.message);
          throw new FigmaApiError('Network error - please check your internet connection', 0);
        } else {
          console.error('❌ Figma API Request Error:', error.message);
          throw new FigmaApiError(error.message, 0);
        }
      }
    );
  }

  /**
   * Get a Figma file with all its data
   */
  async getFile(fileKey: string, options: GetFileOptions = {}): Promise<FigmaFile> {
    const params = new URLSearchParams();
    
    if (options.version) params.append('version', options.version);
    if (options.ids) params.append('ids', options.ids.join(','));
    if (options.depth) params.append('depth', options.depth.toString());
    if (options.geometry) params.append('geometry', options.geometry);
    if (options.plugin_data) params.append('plugin_data', options.plugin_data);
    if (options.branch_data !== undefined) params.append('branch_data', options.branch_data.toString());

    const url = `/files/${fileKey}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.get<FileResponse>(url);
    
    if (response.data.err) {
      throw new FigmaApiError(response.data.err, response.data.status || 400);
    }

    return response.data;
  }

  /**
   * Get specific nodes from a Figma file
   */
  async getFileNodes(fileKey: string, nodeIds: string[], options: GetFileNodesOptions = {}): Promise<FileNodesResponse> {
    const params = new URLSearchParams();
    params.append('ids', nodeIds.join(','));
    
    if (options.version) params.append('version', options.version);
    if (options.depth) params.append('depth', options.depth.toString());
    if (options.geometry) params.append('geometry', options.geometry);
    if (options.plugin_data) params.append('plugin_data', options.plugin_data);

    const url = `/files/${fileKey}/nodes?${params.toString()}`;
    const response = await this.client.get<FileNodesResponse>(url);
    
    if (response.data.err) {
      throw new FigmaApiError(response.data.err, response.data.status || 400);
    }

    return response.data;
  }

  /**
   * Get image URLs for specific nodes
   */
  async getFileImages(
    fileKey: string, 
    nodeIds: string[], 
    options: GetFileImagesOptions = {}
  ): Promise<Record<string, string>> {
    const params = new URLSearchParams();
    params.append('ids', nodeIds.join(','));
    
    if (options.scale) params.append('scale', options.scale.toString());
    if (options.format) params.append('format', options.format);
    if (options.svg_outline_text !== undefined) params.append('svg_outline_text', options.svg_outline_text.toString());
    if (options.svg_include_id !== undefined) params.append('svg_include_id', options.svg_include_id.toString());
    if (options.svg_include_node_id !== undefined) params.append('svg_include_node_id', options.svg_include_node_id.toString());
    if (options.svg_simplify_stroke !== undefined) params.append('svg_simplify_stroke', options.svg_simplify_stroke.toString());
    if (options.use_absolute_bounds !== undefined) params.append('use_absolute_bounds', options.use_absolute_bounds.toString());
    if (options.version) params.append('version', options.version);

    const url = `/images/${fileKey}?${params.toString()}`;
    const response = await this.client.get<FileImagesResponse>(url);
    
    if (response.data.err) {
      throw new FigmaApiError(response.data.err, response.data.status || 400);
    }

    return response.data.images || {};
  }

  /**
   * Get all components from a Figma file
   */
  async getComponents(fileKey: string): Promise<FigmaNode[]> {
    const file = await this.getFile(fileKey);
    return this.findNodesByType(file.document, 'COMPONENT');
  }

  /**
   * Get all frames from a Figma file
   */
  async getFrames(fileKey: string): Promise<FigmaNode[]> {
    const file = await this.getFile(fileKey);
    return this.findNodesByType(file.document, 'FRAME');
  }

  /**
   * Get all pages from a Figma file
   */
  async getPages(fileKey: string): Promise<FigmaNode[]> {
    const file = await this.getFile(fileKey);
    return file.document.children || [];
  }

  /**
   * Find nodes by type recursively
   */
  private findNodesByType(node: FigmaNode, type: string): FigmaNode[] {
    const results: FigmaNode[] = [];
    
    if (node.type === type) {
      results.push(node);
    }
    
    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByType(child, type));
      }
    }
    
    return results;
  }

  /**
   * Find nodes by name pattern
   */
  findNodesByName(node: FigmaNode, pattern: RegExp): FigmaNode[] {
    const results: FigmaNode[] = [];
    
    if (pattern.test(node.name)) {
      results.push(node);
    }
    
    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByName(child, pattern));
      }
    }
    
    return results;
  }

  /**
   * Get node by ID
   */
  findNodeById(node: FigmaNode, id: string): FigmaNode | null {
    if (node.id === id) {
      return node;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * Validate Figma token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.client.get('/me');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user information
   */
  async getUser(): Promise<any> {
    const response = await this.client.get('/me');
    return response.data;
  }

  /**
   * Extract file key from Figma URL
   */
  static extractFileKey(url: string): string | null {
    // Handle various Figma URL formats
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If it's already a file key
    if (/^[a-zA-Z0-9]+$/.test(url)) {
      return url;
    }

    return null;
  }

  /**
   * Build Figma URL from file key
   */
  static buildFigmaUrl(fileKey: string, nodeId?: string): string {
    let url = `https://www.figma.com/file/${fileKey}`;
    if (nodeId) {
      url += `?node-id=${encodeURIComponent(nodeId)}`;
    }
    return url;
  }
}

// API Options Interfaces
export interface GetFileOptions {
  version?: string;
  ids?: string[];
  depth?: number;
  geometry?: 'paths';
  plugin_data?: string;
  branch_data?: boolean;
}

export interface GetFileNodesOptions {
  version?: string;
  depth?: number;
  geometry?: 'paths';
  plugin_data?: string;
}

export interface GetFileImagesOptions {
  scale?: number;
  format?: 'jpg' | 'png' | 'svg' | 'pdf';
  svg_outline_text?: boolean;
  svg_include_id?: boolean;
  svg_include_node_id?: boolean;
  svg_simplify_stroke?: boolean;
  use_absolute_bounds?: boolean;
  version?: string;
}

// Custom Error Class
export class FigmaApiError extends Error {
  public status: number;
  public url?: string;

  constructor(message: string, status: number, url?: string) {
    super(message);
    this.name = 'FigmaApiError';
    this.status = status;
    this.url = url;
  }

  get isAuthError(): boolean {
    return this.status === 403 || this.status === 401;
  }

  get isNotFoundError(): boolean {
    return this.status === 404;
  }

  get isRateLimitError(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}