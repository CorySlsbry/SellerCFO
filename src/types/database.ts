/**
 * Supabase database type definitions
 * Generated from database schema
 */

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          qbo_realm_id: string | null;
          qbo_access_token: string | null;
          qbo_refresh_token: string | null;
          qbo_token_expires_at: string | null;
          stripe_customer_id: string | null;
          subscription_status: "trialing" | "active" | "past_due" | "canceled";
          plan: "basic" | "pro" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          qbo_realm_id?: string | null;
          qbo_access_token?: string | null;
          qbo_refresh_token?: string | null;
          qbo_token_expires_at?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: "trialing" | "active" | "past_due" | "canceled";
          plan?: "basic" | "pro" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          qbo_realm_id?: string | null;
          qbo_access_token?: string | null;
          qbo_refresh_token?: string | null;
          qbo_token_expires_at?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: "trialing" | "active" | "past_due" | "canceled";
          plan?: "basic" | "pro" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          organization_id: string | null;
          role: "owner" | "admin" | "viewer";
          platform_role: "user" | "admin" | "superadmin";
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          organization_id?: string | null;
          role?: "owner" | "admin" | "viewer";
          platform_role?: "user" | "admin" | "superadmin";
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          organization_id?: string | null;
          role?: "owner" | "admin" | "viewer";
          platform_role?: "user" | "admin" | "superadmin";
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      dashboard_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          data: Record<string, any>;
          pulled_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data: Record<string, any>;
          pulled_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          data?: Record<string, any>;
          pulled_at?: string;
        };
      };
      integration_connections: {
        Row: {
          id: string;
          organization_id: string;
          provider: string;
          status: string;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          api_key: string | null;
          external_account_id: string | null;
          external_account_name: string | null;
          config: Record<string, any>;
          last_sync_at: string | null;
          last_sync_status: string;
          last_sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: string;
          status?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          api_key?: string | null;
          external_account_id?: string | null;
          external_account_name?: string | null;
          config?: Record<string, any>;
          last_sync_at?: string | null;
          last_sync_status?: string;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider?: string;
          status?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          api_key?: string | null;
          external_account_id?: string | null;
          external_account_name?: string | null;
          config?: Record<string, any>;
          last_sync_at?: string | null;
          last_sync_status?: string;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_jobs: {
        Row: {
          id: string;
          organization_id: string;
          integration_id: string;
          provider: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          records_synced: number;
          error_message: string | null;
          sync_type: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          integration_id: string;
          provider: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          records_synced?: number;
          error_message?: string | null;
          sync_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          integration_id?: string;
          provider?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          records_synced?: number;
          error_message?: string | null;
          sync_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      normalized_projects: {
        Row: {
          id: string;
          organization_id: string;
          source: string;
          external_id: string;
          name: string;
          customer_name: string | null;
          address: string | null;
          status: string;
          project_type: string | null;
          start_date: string | null;
          estimated_completion: string | null;
          actual_completion: string | null;
          contract_amount: number;
          estimated_cost: number;
          actual_cost: number;
          percent_complete: number;
          change_orders_amount: number;
          budget_remaining: number;
          profit_margin: number;
          costs_to_date: number;
          billings_to_date: number;
          earned_revenue: number;
          over_under_billing: number;
          retainage_receivable: number;
          retainage_payable: number;
          raw_data: Record<string, any>;
          last_synced: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source: string;
          external_id: string;
          name: string;
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      normalized_contacts: {
        Row: {
          id: string;
          organization_id: string;
          source: string;
          external_id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          company: string | null;
          title: string | null;
          contact_type: string;
          tags: string[];
          raw_data: Record<string, any>;
          last_synced: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source: string;
          external_id: string;
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      normalized_deals: {
        Row: {
          id: string;
          organization_id: string;
          source: string;
          external_id: string;
          name: string;
          contact_name: string | null;
          company_name: string | null;
          amount: number;
          stage: string | null;
          probability: number;
          weighted_amount: number;
          expected_close_date: string | null;
          created_date: string | null;
          last_activity_date: string | null;
          deal_type: string | null;
          source_campaign: string | null;
          notes: string | null;
          raw_data: Record<string, any>;
          last_synced: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source: string;
          external_id: string;
          name: string;
          [key: string]: any;
        };
        Update: {
          [key: string]: any;
        };
      };
      error_logs: {
        Row: {
          id: string;
          organization_id: string;
          error_type: string;
          severity: "info" | "warning" | "error" | "critical";
          title: string;
          message: string | null;
          metadata: Record<string, any>;
          provider: string | null;
          resolved: boolean;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          error_type: string;
          severity?: "info" | "warning" | "error" | "critical";
          title: string;
          message?: string | null;
          metadata?: Record<string, any>;
          provider?: string | null;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: {
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      platform_metrics: {
        Row: {
          id: string;
          metric_date: string;
          total_organizations: number;
          active_subscriptions: number;
          mrr: number;
          total_errors_unresolved: number;
          syncs_today: number;
          failures_today: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          metric_date: string;
          total_organizations: number;
          active_subscriptions: number;
          mrr: number;
          total_errors_unresolved: number;
          syncs_today: number;
          failures_today: number;
          created_at?: string;
        };
        Update: {
          [key: string]: any;
        };
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string | null;
          organization_id: string | null;
          details: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          organization_id?: string | null;
          details?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          [key: string]: any;
        };
      };
      locations: {
        Row: {
          id: string;
          organization_id: string;
          parent_id: string | null;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          parent_id?: string | null;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          parent_id?: string | null;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      location_members: {
        Row: {
          id: string;
          location_id: string;
          profile_id: string;
          role: 'owner' | 'admin' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          profile_id: string;
          role?: 'owner' | 'admin' | 'viewer';
          created_at?: string;
        };
        Update: {
          role?: 'owner' | 'admin' | 'viewer';
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
