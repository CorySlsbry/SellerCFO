/**
 * Base connector class for all integrations
 * Provides common functionality: HTTP requests, token management, error handling, rate limiting
 */

import type {
  IntegrationProvider,
  IntegrationConnection,
  TokenResult,
} from '@/types/integrations';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export abstract class BaseConnector {
  abstract provider: IntegrationProvider;
  protected rateLimitConfig: RateLimitConfig = { maxRequests: 100, windowMs: 60000 };
  private requestCount = 0;
  private windowStart = Date.now();

  /**
   * Make an authenticated HTTP request with rate limiting and retry logic
   */
  protected async makeRequest<T = any>(
    url: string,
    accessToken: string,
    options: RequestOptions = {}
  ): Promise<T> {
    await this.checkRateLimit();

    const { method = 'GET', headers = {}, body, params, timeout = 30000 } = options;

    // Build URL with query params
    const requestUrl = new URL(url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        requestUrl.searchParams.append(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(requestUrl.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      this.requestCount++;

      if (response.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        await this.sleep(retryAfter * 1000);
        return this.makeRequest<T>(url, accessToken, options);
      }

      if (response.status === 401) {
        throw new AuthError('Access token expired or invalid', this.provider);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new IntegrationError(
          `${this.provider} API error (${response.status}): ${errorBody}`,
          this.provider,
          response.status
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof AuthError || error instanceof IntegrationError) {
        throw error;
      }
      if ((error as any)?.name === 'AbortError') {
        throw new IntegrationError(`Request to ${this.provider} timed out`, this.provider, 408);
      }
      throw new IntegrationError(
        `${this.provider} request failed: ${(error as Error).message}`,
        this.provider,
        500
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make an authenticated request using API key auth (in header)
   */
  protected async makeApiKeyRequest<T = any>(
    url: string,
    apiKey: string,
    options: RequestOptions = {},
    headerName: string = 'Authorization'
  ): Promise<T> {
    await this.checkRateLimit();

    const { method = 'GET', headers = {}, body, params, timeout = 30000 } = options;

    const requestUrl = new URL(url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        requestUrl.searchParams.append(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const authHeader = headerName === 'Authorization' ? `Bearer ${apiKey}` : apiKey;

      const response = await fetch(requestUrl.toString(), {
        method,
        headers: {
          [headerName]: authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      this.requestCount++;

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        await this.sleep(retryAfter * 1000);
        return this.makeApiKeyRequest<T>(url, apiKey, options, headerName);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new IntegrationError(
          `${this.provider} API error (${response.status}): ${errorBody}`,
          this.provider,
          response.status
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(
        `${this.provider} request failed: ${(error as Error).message}`,
        this.provider,
        500
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if token needs refreshing (within 5 min of expiry)
   */
  protected isTokenExpired(connection: IntegrationConnection): boolean {
    if (!connection.token_expires_at) return false;
    const expiresAt = new Date(connection.token_expires_at).getTime();
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= expiresAt - bufferMs;
  }

  /**
   * Build OAuth authorization URL helper
   */
  protected buildOAuthUrl(
    baseUrl: string,
    params: Record<string, string>
  ): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  /**
   * Exchange an OAuth authorization code for tokens
   */
  protected async exchangeOAuthCode(
    tokenUrl: string,
    params: Record<string, string>,
    headers: Record<string, string> = {}
  ): Promise<TokenResult> {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new IntegrationError(
        `${this.provider} token exchange failed: ${error}`,
        this.provider,
        response.status
      );
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      extra: data,
    };
  }

  /**
   * Rate limit check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.windowStart > this.rateLimitConfig.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    if (this.requestCount >= this.rateLimitConfig.maxRequests) {
      const waitTime = this.rateLimitConfig.windowMs - (now - this.windowStart);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error for auth failures (token expired, etc.)
 */
export class AuthError extends Error {
  provider: IntegrationProvider;
  constructor(message: string, provider: IntegrationProvider) {
    super(message);
    this.name = 'AuthError';
    this.provider = provider;
  }
}

/**
 * Custom error for integration failures
 */
export class IntegrationError extends Error {
  provider: IntegrationProvider;
  statusCode: number;
  constructor(message: string, provider: IntegrationProvider, statusCode: number) {
    super(message);
    this.name = 'IntegrationError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}
