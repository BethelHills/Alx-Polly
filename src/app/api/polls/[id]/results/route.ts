import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import { handleNotFoundError, handleAuthError } from '@/lib/error-handler'

/**
 * GET /api/polls/[id]/results
 * Retrieve poll results with vote counts and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    // Authenticate user
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return handleAuthError("No token provided")
    }

    const { data: userData, error: userErr } = await supabaseServerClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return handleAuthError("Invalid token")
    }

    // Check if poll exists
    const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .select(`
        id,
        title,
        description,
        is_active,
        created_at,
        owner_id,
        poll_options (
          id,
          text,
          votes (
            id,
            user_id,
            created_at
          )
        )
      `)
      .eq('id', pollId)
      .single()

    if (pollError || !poll) {
      return handleNotFoundError("Poll")
    }

    // Calculate vote statistics
    const totalVotes = poll.poll_options.reduce((sum: number, option: any) => sum + option.votes.length, 0)
    
    const optionsWithStats = poll.poll_options.map((option: any) => ({
      id: option.id,
      text: option.text,
      vote_count: option.votes.length,
      percentage: totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
    }))

    // Sort options by vote count (descending)
    optionsWithStats.sort((a: any, b: any) => b.vote_count - a.vote_count)

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          is_active: poll.is_active,
          created_at: poll.created_at,
          owner_id: poll.owner_id,
          total_votes: totalVotes,
          total_options: poll.poll_options.length
        },
        results: optionsWithStats
      }
    })

  } catch (error) {
    console.error('Error in poll results API:', error)
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
