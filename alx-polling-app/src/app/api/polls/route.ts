import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'
import { auditLog } from '@/lib/audit-logger'
import { validateAndSanitizePoll, formatValidationErrors } from '@/lib/validation-schemas'

/**
 * Creates a new poll with authenticated user ownership.
 * 
 * This endpoint handles poll creation with comprehensive security measures including
 * request size validation, input sanitization, user authentication, and audit logging.
 * The poll is created with the authenticated user as the owner and includes validation
 * for poll options.
 * 
 * @param request - NextRequest object containing the poll data and authorization header
 * @returns Promise<NextResponse> - JSON response with success status and poll data or error details
 * 
 * @throws {413} Request too large - When request size exceeds 10KB limit
 * @throws {400} Validation failed - When poll data fails validation or sanitization
 * @throws {401} Unauthorized - When authorization header is missing, invalid, or token is invalid
 * @throws {500} Internal server error - When database operations fail or unexpected errors occur
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/polls', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer <jwt-token>'
 *   },
 *   body: JSON.stringify({
 *     title: 'What is your favorite programming language?',
 *     description: 'Optional description',
 *     options: ['JavaScript', 'TypeScript', 'Python', 'Rust']
 *   })
 * });
 * ```
 * 
 * @security
 * - Requires valid JWT token in Authorization header
 * - Validates and sanitizes all input data
 * - Enforces request size limits to prevent DoS attacks
 * - Logs all poll creation events for audit trail
 * 
 * @since 1.0.0
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB limit
      return NextResponse.json(
        { success: false, message: "Request too large" },
        { status: 413 }
      )
    }

    const body = await request.json()
    
    // Validate JSON size
    if (JSON.stringify(body).length > 10000) {
      return NextResponse.json(
        { success: false, message: "Request payload too large" },
        { status: 413 }
      )
    }
    
    // Validate and sanitize the request body
    const validationResult = validateAndSanitizePoll(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        },
        { status: 400 }
      )
    }

    // Authenticate user (server-side) with enhanced validation
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Invalid authorization header format" },
        { status: 401 }
      )
    }

    const token = authHeader.replace("Bearer ", "").trim()
    if (!token || token.length < 10) {
      return NextResponse.json(
        { success: false, message: "Invalid token format" },
        { status: 401 }
      )
    }

            const { data: userData, error: userErr } = await supabaseServerClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      )
    }

    const { title, description, options } = validationResult.data!

    // Create the poll with user ownership
            const { data: poll, error: pollError } = await supabaseServerClient
      .from('polls')
      .insert({
        title,
        description: description || null,
        is_active: true,
        owner_id: userData.user.id
      })
      .select()
      .single()

    if (pollError) {
      console.error('Error creating poll:', pollError)
      return NextResponse.json(
        { success: false, message: 'Failed to create poll' },
        { status: 500 }
      )
    }

    // Create the poll options
    const optionsData = options
      .filter(option => option.trim())
      .map((option, index) => ({
        poll_id: poll.id,
        text: option.trim(),
        votes: 0,
        order: index
      }))

            const { error: optionsError } = await supabaseServerClient
      .from('poll_options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Error creating poll options:', optionsError)
      return NextResponse.json(
        { success: false, message: 'Poll created but options failed' },
        { status: 500 }
      )
    }

    // Log poll creation for audit trail
    try {
      await auditLog.pollCreated(request, userData.user.id, poll.id, title)
    } catch (auditError) {
      console.error('Failed to log poll creation audit event:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Poll created successfully!', 
        pollId: poll.id,
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          options: optionsData
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error in poll creation API:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Retrieves all active polls with their options and vote counts.
 * 
 * This endpoint fetches all active polls from the database, including their associated
 * poll options and vote counts. The results are ordered by creation date (newest first)
 * and include calculated total vote counts for each poll.
 * 
 * @returns Promise<NextResponse> - JSON response with success status and array of polls
 * 
 * @throws {500} Internal server error - When database query fails or unexpected errors occur
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/polls');
 * const data = await response.json();
 * // Returns: { success: true, polls: [...] }
 * ```
 * 
 * @security
 * - Public endpoint (no authentication required)
 * - Only returns active polls (is_active = true)
 * - Does not expose sensitive user information
 * 
 * @since 1.0.0
 */
export async function GET() {
  try {
            const { data: polls, error } = await supabaseServerClient
      .from('polls')
      .select(`
        *,
        options: poll_options (
          id,
          votes
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching polls:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch polls' },
        { status: 500 }
      )
    }

    // Calculate total votes for each poll
    const pollsWithVotes = polls.map(poll => ({
      ...poll,
      total_votes: poll.options.reduce((sum: number, option: any) => sum + option.votes, 0)
    }))

    return NextResponse.json(
      { 
        success: true, 
        polls: pollsWithVotes 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in polls GET API:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}