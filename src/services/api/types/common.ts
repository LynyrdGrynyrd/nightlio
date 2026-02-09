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
}

export interface PublicConfig {
  google_client_id?: string;
  enable_google_oauth?: boolean;
  enable_registration?: boolean;
  enable_local_login?: boolean;
  features?: string[];
}

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}
