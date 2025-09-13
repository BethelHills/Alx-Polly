/**
 * Polly API Client Functions
 * 
 * This module provides client-side functions for interacting with the Polly API.
 * All functions handle authentication, error handling, and response validation.
 */

// Types for API responses
export interface VoteResponse {
  success: boolean;
  message: string;
  vote?: {
    id: string;
    poll_id: string;
    option_id: string;
    user_id: string;
    created_at: string;
  };
}

export interface PollResultsResponse {
  success: boolean;
  data?: {
    poll: {
      id: string;
      title: string;
      description: string;
      is_active: boolean;
      created_at: string;
      owner_id: string;
      total_votes: number;
      total_options: number;
    };
    results: Array<{
      id: string;
      text: string;
      vote_count: number;
      percentage: number;
    }>;
  };
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get authentication token from localStorage or session
 * @returns {string | null} The authentication token or null if not found
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

/**
 * Make authenticated API request
 * @param {string} endpoint - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication token not found. Please log in.');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  return response;
}

/**
 * Handle API response and extract JSON data
 * @param {Response} response - The fetch response
 * @returns {Promise<any>} The parsed JSON data
 */
async function handleApiResponse(response: Response): Promise<any> {
  const data = await response.json();
  
  if (!response.ok) {
    const error: ApiError = {
      success: false,
      message: data.message || `HTTP ${response.status}: ${response.statusText}`,
      errors: data.errors || data.details?.fieldErrors
    };
    throw error;
  }
  
  return data;
}

/**
 * Cast a vote on an existing poll
 * 
 * @param {string} pollId - The UUID of the poll to vote on
 * @param {string} optionId - The UUID of the option to vote for
 * @returns {Promise<VoteResponse>} The vote response with success status and vote details
 * 
 * @throws {ApiError} When the request fails due to validation, authentication, or server errors
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await castVote('poll-uuid-123', 'option-uuid-456');
 *   console.log('Vote successful:', result.message);
 * } catch (error) {
 *   console.error('Vote failed:', error.message);
 * }
 * ```
 */
export async function castVote(pollId: string, optionId: string): Promise<VoteResponse> {
  try {
    // Validate inputs
    if (!pollId || typeof pollId !== 'string') {
      throw new Error('Poll ID is required and must be a string');
    }
    
    if (!optionId || typeof optionId !== 'string') {
      throw new Error('Option ID is required and must be a string');
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId)) {
      throw new Error('Invalid poll ID format. Must be a valid UUID.');
    }
    
    if (!uuidRegex.test(optionId)) {
      throw new Error('Invalid option ID format. Must be a valid UUID.');
    }

    const response = await makeAuthenticatedRequest(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });

    const data = await handleApiResponse(response);
    return data as VoteResponse;

  } catch (error) {
    // Re-throw API errors as-is
    if (error && typeof error === 'object' && 'success' in error) {
      throw error;
    }
    
    // Handle other errors
    console.error('Error casting vote:', error);
    throw {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred while casting vote'
    } as ApiError;
  }
}

/**
 * Retrieve poll results with vote counts and statistics
 * 
 * @param {string} pollId - The UUID of the poll to get results for
 * @returns {Promise<PollResultsResponse>} The poll results with vote statistics
 * 
 * @throws {ApiError} When the request fails due to authentication, poll not found, or server errors
 * 
 * @example
 * ```typescript
 * try {
 *   const results = await getPollResults('poll-uuid-123');
 *   console.log('Total votes:', results.data?.poll.total_votes);
 *   results.data?.results.forEach(option => {
 *     console.log(`${option.text}: ${option.vote_count} votes (${option.percentage}%)`);
 *   });
 * } catch (error) {
 *   console.error('Failed to get poll results:', error.message);
 * }
 * ```
 */
export async function getPollResults(pollId: string): Promise<PollResultsResponse> {
  try {
    // Validate inputs
    if (!pollId || typeof pollId !== 'string') {
      throw new Error('Poll ID is required and must be a string');
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId)) {
      throw new Error('Invalid poll ID format. Must be a valid UUID.');
    }

    const response = await makeAuthenticatedRequest(`/api/polls/${pollId}/results`, {
      method: 'GET',
    });

    const data = await handleApiResponse(response);
    return data as PollResultsResponse;

  } catch (error) {
    // Re-throw API errors as-is
    if (error && typeof error === 'object' && 'success' in error) {
      throw error;
    }
    
    // Handle other errors
    console.error('Error getting poll results:', error);
    throw {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred while retrieving poll results'
    } as ApiError;
  }
}

/**
 * Utility function to check if a user has voted on a poll
 * This would require a separate API endpoint to check vote status
 * 
 * @param {string} pollId - The UUID of the poll to check
 * @returns {Promise<boolean>} True if the user has voted, false otherwise
 * 
 * @example
 * ```typescript
 * const hasVoted = await hasUserVoted('poll-uuid-123');
 * if (hasVoted) {
 *   console.log('User has already voted on this poll');
 * }
 * ```
 */
export async function hasUserVoted(pollId: string): Promise<boolean> {
  try {
    // This would require implementing a separate endpoint like /api/polls/[id]/vote-status
    // For now, we'll return false as a placeholder
    console.warn('hasUserVoted: This function requires a separate API endpoint to be implemented');
    return false;
  } catch (error) {
    console.error('Error checking vote status:', error);
    return false;
  }
}
