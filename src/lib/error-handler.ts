import { NextResponse } from 'next/server'

// Error response interface
export interface ErrorResponse {
  success: false
  message: string
  code?: string
  details?: any
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

// Centralized error handling functions
export function handleAuthError(message: string = "Unauthorized"): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message,
      code: 'AUTH_ERROR'
    },
    { status: 401 }
  )
}

export function handleNotFoundError(resource: string = "Resource"): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message: `${resource} not found`,
      code: 'NOT_FOUND'
    },
    { status: 404 }
  )
}

export function handleVoteError(error: any): NextResponse<ErrorResponse> {
  console.error('Vote error:', error)
  
  // Handle specific database errors
  if (error.code === '23505') {
    return NextResponse.json(
      { 
        success: false, 
        message: "You have already voted on this poll",
        code: 'DUPLICATE_VOTE'
      },
      { status: 409 }
    )
  }
  
  if (error.code === '23503') {
    return NextResponse.json(
      { 
        success: false, 
        message: "Invalid poll or option",
        code: 'FOREIGN_KEY_VIOLATION'
      },
      { status: 400 }
    )
  }
  
  // Generic vote error
  return NextResponse.json(
    { 
      success: false, 
      message: "Failed to submit vote",
      code: 'VOTE_ERROR'
    },
    { status: 500 }
  )
}

// Success response creator
export function createSuccessResponse<T>(
  data: T, 
  message: string = "Success", 
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { 
      success: true, 
      data,
      message
    },
    { status }
  )
}
