/**
 * QuickBooks Online (QBO) API helper class
 * Handles OAuth authentication and API requests to QBO
 */

import type { QBOTokenResponse } from "@/types";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  x_refresh_token_expires_in: number;
  token_type: string;
  expires_in: number;
  realm_id: string;
}

export class QBOClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sandbox: boolean;

  constructor(
    clientId: string = process.env.QBO_CLIENT_ID || "",
    clientSecret: string = process.env.QBO_CLIENT_SECRET || "",
    redirectUri: string = process.env.QBO_REDIRECT_URI || "",
    sandbox: boolean = process.env.NODE_ENV === "development"
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.sandbox = sandbox;
  }

  /**
   * Builds the Intuit OAuth 2.0 authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens
   */
  async exchangeCode(code: string, realmId: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to exchange code: ${error.error_description || error.error}`);
    }

    const data = (await response.json()) as TokenResponse;
    return data;
  }

  /**
   * Refreshes an expired access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to refresh token: ${error.error_description || error.error}`);
    }

    const data = (await response.json()) as TokenResponse;
    return data;
  }

  /**
   * Makes an authenticated request to the QBO API
   */
  private async makeRequest(
    accessToken: string,
    realmId: string,
    endpoint: string,
    method: string = "GET",
    body?: Record<string, any>
  ): Promise<any> {
    const baseUrl = this.sandbox
      ? "https://sandbox-quickbooks.api.intuit.com/v3/company"
      : "https://quickbooks.api.intuit.com/v3/company";

    const url = `${baseUrl}/${realmId}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    };

    if (body) {
      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.text();
        errorDetail = errorBody.substring(0, 500);
      } catch { /* ignore parse errors */ }
      throw new Error(
        `QBO API ${response.status} on ${endpoint}: ${errorDetail}`
      );
    }

    return response.json();
  }

  /**
   * Gets company information
   */
  async getCompanyInfo(accessToken: string, realmId: string): Promise<any> {
    return this.makeRequest(accessToken, realmId, "/companyinfo/" + realmId);
  }

  /**
   * Gets Profit & Loss report via QBO Reports API
   * When monthly=true, returns columnar data with one column per month
   */
  async getProfitAndLoss(
    accessToken: string,
    realmId: string,
    startDate: string,
    endDate: string,
    monthly: boolean = false
  ): Promise<any> {
    const params = `start_date=${startDate}&end_date=${endDate}&minorversion=73${monthly ? '&summarize_column_by=Month' : ''}`;
    return this.makeRequest(
      accessToken,
      realmId,
      `/reports/ProfitAndLoss?${params}`
    );
  }

  /**
   * Gets Balance Sheet report via QBO Reports API
   */
  async getBalanceSheet(accessToken: string, realmId: string, asOfDate?: string): Promise<any> {
    const dateParam = asOfDate ? `?date=${asOfDate}&minorversion=73` : `?minorversion=73`;
    return this.makeRequest(
      accessToken,
      realmId,
      `/reports/BalanceSheet${dateParam}`
    );
  }

  /**
   * Gets Profit & Loss with monthly columns for cash flow analysis
   * Returns the same P&L report but broken out by month
   */
  async getMonthlyProfitAndLoss(
    accessToken: string,
    realmId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    return this.getProfitAndLoss(accessToken, realmId, startDate, endDate, true);
  }

  /**
   * Gets all invoices
   */
  async getInvoices(accessToken: string, realmId: string): Promise<any> {
    const query = encodeURIComponent("select * from Invoice maxresults 1000");
    return this.makeRequest(
      accessToken,
      realmId,
      `/query?query=${query}`
    );
  }

  /**
   * Gets all bills
   */
  async getBills(accessToken: string, realmId: string): Promise<any> {
    const query = encodeURIComponent("select * from Bill maxresults 1000");
    return this.makeRequest(
      accessToken,
      realmId,
      `/query?query=${query}`
    );
  }

  /**
   * Gets all accounts
   */
  async getAccounts(accessToken: string, realmId: string): Promise<any> {
    const query = encodeURIComponent("select * from Account");
    return this.makeRequest(
      accessToken,
      realmId,
      `/query?query=${query}`
    );
  }

  /**
   * Gets all Classes (used by practices for divisions/locations)
   * Returns: { QueryResponse: { Class: [{ Id, Name, FullyQualifiedName, SubClass, ParentRef, Active }] } }
   */
  async getClasses(accessToken: string, realmId: string): Promise<any> {
    const query = encodeURIComponent("select * from Class maxresults 1000");
    return this.makeRequest(accessToken, realmId, `/query?query=${query}`);
  }

  /**
   * Gets all Departments (alternative to Classes for location/cost center tracking)
   * Returns: { QueryResponse: { Department: [{ Id, Name, FullyQualifiedName, SubDepartment, ParentRef, Active }] } }
   */
  async getDepartments(accessToken: string, realmId: string): Promise<any> {
    const query = encodeURIComponent("select * from Department maxresults 1000");
    return this.makeRequest(accessToken, realmId, `/query?query=${query}`);
  }
}

// Export singleton instance
export const qboClient = new QBOClient();
