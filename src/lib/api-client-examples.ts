/**
 * Polly API Client Usage Examples
 * 
 * This file demonstrates how to use the Polly API client functions
 * in real-world scenarios.
 */

import { castVote, getPollResults, hasUserVoted } from './api-client';

// Example 1: Complete voting workflow
export async function handleVotingWorkflow(pollId: string, optionId: string) {
  console.log('Starting voting workflow...');
  
  try {
    // Check if user has already voted (placeholder - requires separate endpoint)
    const hasVoted = await hasUserVoted(pollId);
    if (hasVoted) {
      console.log('User has already voted on this poll');
      return { success: false, message: 'Already voted' };
    }

    // Cast the vote
    console.log('Casting vote...');
    const voteResult = await castVote(pollId, optionId);
    
    if (voteResult.success) {
      console.log('Vote cast successfully!');
      console.log('Vote ID:', voteResult.vote?.id);
      
      // Get updated results
      console.log('Fetching updated results...');
      const results = await getPollResults(pollId);
      
      if (results.success && results.data) {
        console.log('Poll Results:');
        console.log(`Title: ${results.data.poll.title}`);
        console.log(`Total Votes: ${results.data.poll.total_votes}`);
        console.log('Options:');
        results.data.results.forEach((option, index) => {
          console.log(`  ${index + 1}. ${option.text}: ${option.vote_count} votes (${option.percentage}%)`);
        });
      }
      
      return { success: true, voteResult, results };
    }
    
  } catch (error: any) {
    console.error('Voting workflow failed:', error);
    
    // Handle specific error types
    if (error.message?.includes('already voted')) {
      return { success: false, message: 'You have already voted on this poll' };
    } else if (error.message?.includes('Authentication')) {
      return { success: false, message: 'Please log in to vote' };
    } else if (error.message?.includes('not found')) {
      return { success: false, message: 'Poll not found' };
    } else {
      return { success: false, message: 'An error occurred while voting' };
    }
  }
}

// Example 2: Display poll results in a React component
export function createPollResultsComponent(pollId: string) {
  return {
    async loadResults() {
      try {
        const results = await getPollResults(pollId);
        
        if (results.success && results.data) {
          return {
            poll: results.data.poll,
            options: results.data.results,
            loading: false,
            error: null
          };
        } else {
          return {
            poll: null,
            options: [],
            loading: false,
            error: results.message || 'Failed to load results'
          };
        }
      } catch (error: any) {
        return {
          poll: null,
          options: [],
          loading: false,
          error: error.message || 'An error occurred'
        };
      }
    }
  };
}

// Example 3: Batch operations
export async function batchVoteCheck(pollIds: string[]) {
  console.log(`Checking vote status for ${pollIds.length} polls...`);
  
  const results = await Promise.allSettled(
    pollIds.map(async (pollId) => {
      try {
        const hasVoted = await hasUserVoted(pollId);
        return { pollId, hasVoted, error: null };
      } catch (error: any) {
        return { pollId, hasVoted: false, error: error.message };
      }
    })
  );
  
  const voteStatus = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        pollId: pollIds[index],
        hasVoted: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });
  
  console.log('Vote status results:', voteStatus);
  return voteStatus;
}

// Example 4: Error handling patterns
export class PollApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public field?: string
  ) {
    super(message);
    this.name = 'PollApiError';
  }
}

export function handleApiError(error: any): PollApiError {
  if (error && typeof error === 'object' && 'success' in error) {
    // API error response
    return new PollApiError(
      error.message || 'API request failed',
      error.code,
      error.statusCode
    );
  } else if (error instanceof Error) {
    // Standard error
    return new PollApiError(error.message);
  } else {
    // Unknown error
    return new PollApiError('An unexpected error occurred');
  }
}

// Example 5: TypeScript usage with proper typing
export interface PollVotingState {
  pollId: string;
  selectedOptionId: string | null;
  isVoting: boolean;
  hasVoted: boolean;
  error: string | null;
  results: any | null;
}

export class PollVotingManager {
  private state: PollVotingState;

  constructor(pollId: string) {
    this.state = {
      pollId,
      selectedOptionId: null,
      isVoting: false,
      hasVoted: false,
      error: null,
      results: null
    };
  }

  async selectOption(optionId: string) {
    this.state.selectedOptionId = optionId;
  }

  async submitVote(): Promise<boolean> {
    if (!this.state.selectedOptionId) {
      this.state.error = 'Please select an option';
      return false;
    }

    this.state.isVoting = true;
    this.state.error = null;

    try {
      const result = await castVote(this.state.pollId, this.state.selectedOptionId);
      
      if (result.success) {
        this.state.hasVoted = true;
        this.state.isVoting = false;
        
        // Load updated results
        const results = await getPollResults(this.state.pollId);
        this.state.results = results.data;
        
        return true;
      } else {
        this.state.error = result.message;
        this.state.isVoting = false;
        return false;
      }
    } catch (error: any) {
      this.state.error = error.message;
      this.state.isVoting = false;
      return false;
    }
  }

  getState(): PollVotingState {
    return { ...this.state };
  }
}
