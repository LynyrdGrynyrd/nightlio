/**
 * API Service - Re-export from modular structure
 *
 * This file provides backward compatibility with the original API service.
 * All implementation has been moved to ./api/ directory for better organization.
 *
 * Structure:
 * - ./api/types/     - Type definitions by domain
 * - ./api/utils/     - Query params, goal normalization helpers
 * - ./api/endpoints/ - Endpoint modules by domain
 * - ./api/cache.ts   - Response caching layer
 * - ./api/apiClient.ts - Base client with retry logic
 * - ./api/index.ts   - Main facade composing all endpoints
 */

export * from './api/index';
export { default } from './api/index';
