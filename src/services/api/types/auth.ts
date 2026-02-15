/**
 * Authentication types
 */

import { User } from './common';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

export interface ForgotPasswordResponse {
  status: string;
  message?: string;
}

export interface ResetPasswordResponse {
  status: string;
  message?: string;
  error?: string;
}
