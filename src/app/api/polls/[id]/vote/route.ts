import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import { z } from 'zod'
import { handleVoteError, handleAuthError, handleNotFoundError } from '@/lib/error-handler'
import { auditLog } from '@/lib/audit-logger'

// Validation schema for voting
const voteSchema = z.object({
  option_id: z.string().uuid('Invalid option ID format')
})

/**
 * POST /api/polls/[id]/vote
 * Vote on a specific poll option
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
