import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClientClient } from '@/lib/supabaseServerClientClient'
import { z } from 'zod'
import { handleVoteError, handleAuthError, handleNotFoundError, createSuccessResponse } from '@/lib/error-handler'
import { auditLog } from '@/lib/audit-logger'

// Validation schema for voting
const voteSchema = z.object({
  option_id: z.string().uuid('Invalid option ID format')
})

/**
 * Submits a vote for a specific poll option by poll ID and option ID.
 * 
 * This endpoint handles vote submission for a specific poll identified by the URL parameter.
 * It provides enhanced validation, error handling, and audit logging compared to the generic
 * vote endpoint. The endpoint validates the poll exists, is active, and the option belongs
 * to the poll before processing the vote.
 * 
 * @param request - NextRequest object containing vote data and authorization header
 * @param params - Route parameters containing the poll ID
 * @returns Promise<NextResponse> - JSON response with success status and vote data or error details
 * 
 * @throws {401} Unauthorized - When authorization header is missing or token is invalid
 * @throws {400} Invalid input - When option_id fails validation or poll is inactive
 * @throws {404} Poll not found - When poll ID doesn't exist in database
 * @throws {409} User already voted - When user attempts to vote multiple times on same poll
 * @throws {500} Internal server error - When database operations fail or unexpected errors occur
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/polls/123e4567-e89b-12d3-a456-426614174000/vote', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <jwt-token>'
 *   },
 *   body: JSON.stringify({
 *     option_id: '987fcdeb-51a2-43d7-b890-123456789abc'
 *   })
 * });
 * ```
 * 
 * @security
 * - Requires valid JWT token in Authorization header
 * - Validates poll exists and is active before allowing votes
 * - Enforces unique vote constraint (one vote per user per poll)
 * - Validates option_id belongs to the specified poll
 * - Logs all voting activity with detailed audit trail
 * 
 * @since 1.0.0
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const body = await request.json()
    
    // Validate the request body
    const validationResult = voteSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validationResult.error?.issues?.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })) || []
        },
        { status: 400 }
      )
    }

    // Authenticate user
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return handleAuthError("No token provided")
    }

            const { data: userData, error: userErr } = await supabaseServerClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return handleAuthError("Invalid token")
    }

    const { option_id } = validationResult.data
    const userId = userData.user.id

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select('id, title, is_active, owner_id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return handleNotFoundError("Poll")
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { success: false, message: "Poll is no longer active" },
        { status: 400 }
      )
    }

    // Check if option exists and belongs to this poll
    const { data: option, error: optionError } = await supabaseServerClient
      .from('poll_options')
      .select('id, text, poll_id')
      .eq('id', option_id)
      .eq('poll_id', pollId)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { success: false, message: "Invalid option for this poll" },
        { status: 400 }
      )
    }

    // Submit the vote directly - let database constraint handle duplicates
    // This eliminates the race condition between check and insert
    const { data: vote, error: voteError } = await supabaseServerClient
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: option_id,
        user_id: userId
      })
      .select()
      .single()

    if (voteError) {
      // Handle unique constraint violation (user already voted)
      if (voteError.code === '23505') {
        return NextResponse.json(
          { success: false, message: "You have already voted on this poll" },
          { status: 409 }
        )
      }
      return handleVoteError(voteError)
    }

    // Log vote for audit trail
    try {
      await auditLog.vote(request, userId, pollId, option.text, false)
    } catch (auditError) {
      console.error('Failed to log vote audit event:', auditError)
      // Don't fail the request if audit logging fails
    }

    // Get updated poll results
    const { data: pollResults, error: resultsError } = await supabaseServerClient
      .from('poll_options')
      .select('id, text, votes, order_index')
      .eq('poll_id', pollId)
      .order('votes', { ascending: false })

    if (resultsError) {
      console.error('Error fetching poll results:', resultsError)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Vote submitted successfully!",
        vote: {
          id: vote.id,
          poll_id: pollId,
          option_id: option_id,
          user_id: userId,
          created_at: vote.created_at
        },
        poll: {
          id: pollId,
          title: poll.title,
          results: pollResults || []
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in vote API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/polls/[id]/vote
 * Get poll results (without voting)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    // Get poll details
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select('id, title, description, is_active, created_at, owner_id')
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, message: "Poll not found" },
        { status: 404 }
      )
    }

    // Get poll options with vote counts
    const { data: options, error: optionsError } = await supabaseServerClient
      .from('poll_options')
      .select('id, text, votes, order_index')
      .eq('poll_id', pollId)
      .order('votes', { ascending: false })

    if (optionsError) {
      console.error('Error fetching poll options:', optionsError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch poll results" },
        { status: 500 }
      )
    }

    // Calculate total votes
    const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)

    // Add percentage calculations
    const optionsWithPercentages = options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
    }))

    return NextResponse.json(
      { 
        success: true, 
        poll: {
          ...poll,
          total_votes: totalVotes,
          options: optionsWithPercentages
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in poll results API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}