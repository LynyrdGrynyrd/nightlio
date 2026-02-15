/**
 * Common API types
 */

export interface ApiError {
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  email_verified?: boolean;
}

export interface PublicConfig {
  google_client_id?: string;
  enable_google_oauth?: boolean;
  enable_registration?: boolean;
  enable_local_login?: boolean;
  email_enabled?: boolean;
  features?: string[];
}

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}
