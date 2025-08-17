import { config } from '../config/env';
import { ErgastApiResponseSchema, type ErgastApiResponse } from '../schemas/ergast';

export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public url?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number, baseDelay: number): number => 
  baseDelay * Math.pow(2, attempt - 1);

/**
 * Robust HTTP client with retry logic and timeout
 */
export class HttpClient {
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor() {
    this.timeout = config.http.timeout;
    this.retries = config.http.retries;
    this.retryDelay = config.http.retryDelay;
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(`Request timeout after ${this.timeout}ms`, undefined, url);
      }
      throw error;
    }
  }

  /**
   * Perform HTTP request with retry logic
   */
  private async request(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          throw new HttpError(errorMessage, response.status, url);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on client errors (4xx) except for specific cases
        if (error instanceof HttpError && error.status && error.status >= 400 && error.status < 500) {
          // Only retry on 408 (Request Timeout) and 429 (Too Many Requests)
          if (error.status !== 408 && error.status !== 429) {
            throw error;
          }
        }

        // If this is the last attempt, throw the error
        if (attempt === this.retries) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = getRetryDelay(attempt + 1, this.retryDelay);
        console.warn(`Request failed (attempt ${attempt + 1}/${this.retries + 1}): ${lastError.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }

  /**
   * Fetch and validate Ergast API response
   */
  async fetchErgastData(endpoint: string): Promise<ErgastApiResponse> {
    const baseUrl = config.f1.jolpica.baseUrl;
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await this.request(url);
      const data = await response.json();

      // Validate response structure with Zod
      const validatedData = ErgastApiResponseSchema.parse(data);
      return validatedData;
    } catch (error) {
      if (error instanceof Error) {
        // If it's a validation error, wrap it
        if (error.name === 'ZodError') {
          throw new ValidationError(
            `Invalid API response format: ${error.message}`,
            url
          );
        }
        // Re-throw HTTP and other errors as-is
        throw error;
      }
      throw new HttpError('Unknown error occurred', undefined, url);
    }
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
