import { supabase } from '@/lib/supabase'

// Types for better type safety
interface VoteResult {
  success?: boolean
  data?: any
  error?: string
}

interface VoteData {
  poll_id: string
  option: string
  user_id: string
}

/**
 * Handles voting on a poll with duplicate vote prevention
 * @param pollId - The ID of the poll to vote on
 * @param option - The option the user is voting for
 * @param userId - The ID of the user voting
 * @returns Promise<VoteResult> - Result of the voting operation
 */
export async function voteHandler(
  pollId: string, 
  option: string, 
  userId: string
): Promise<VoteResult> {
  // Input validation
  if (!pollId || !option || !userId) {
    return { error: "Missing required parameters" }
  }

  try {
    // Check for existing vote
    const existingVoteResult = await checkExistingVote(pollId, userId)
    if (existingVoteResult.error) {
      return existingVoteResult
    }
    if (existingVoteResult.hasVoted) {
      return { error: "User has already voted" }
    }

    // Submit the vote
    const voteResult = await submitVote(pollId, option, userId)
    return voteResult

  } catch (error) {
    console.error('Unexpected error in voteHandler:', error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Checks if a user has already voted on a poll
 */
async function checkExistingVote(
  pollId: string, 
  userId: string
): Promise<{ hasVoted?: boolean; error?: string }> {
  const { data: existingVote, error: existingError } = await supabase
    .from("votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .single()

  // Handle "no rows found" error (PGRST116) as expected behavior
  if (existingError && existingError.code !== "PGRST116") {
    return { error: "Could not check existing vote" }
  }

  return { hasVoted: !!existingVote }
}

/**
 * Submits a new vote to the database
 */
async function submitVote(
  pollId: string, 
  option: string, 
  userId: string
): Promise<VoteResult> {
  const voteData: VoteData = {
    poll_id: pollId,
    option,
    user_id: userId
  }

  const { data, error } = await supabase
    .from("votes")
    .insert([voteData])

  if (error) {
    console.error('Failed to submit vote:', error)
    return { error: "Failed to submit vote" }
  }

  return { success: true, data }
}