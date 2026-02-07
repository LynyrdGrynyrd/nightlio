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
