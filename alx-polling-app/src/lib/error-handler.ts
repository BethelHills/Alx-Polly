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

export function handleValidationError(errors: Array<{ field: string; message: string }>): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    },
    { status: 400 }
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

export function handleDatabaseError(error: any, operation: string = "Database operation"): NextResponse<ErrorResponse> {
  console.error(`${operation} error:`, error)
  
  return NextResponse.json(
    { 
      success: false, 
      message: `${operation} failed`,
      code: 'DATABASE_ERROR'
    },
    { status: 500 }
  )
}

export function handleRateLimitError(): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message: "Too many requests. Please try again later.",
      code: 'RATE_LIMIT_EXCEEDED'
    },
    { status: 429 }
  )
}

export function handleServerError(message: string = "An unexpected error occurred"): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { 
      success: false, 
      message,
      code: 'SERVER_ERROR'
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

// Generic error handler for try-catch blocks
export function handleGenericError(error: unknown, context: string = "Operation"): NextResponse<ErrorResponse> {
  console.error(`Error in ${context}:`, error)
  
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        success: false, 
        message: `${context} failed: ${error.message}`,
        code: 'GENERIC_ERROR'
      },
      { status: 500 }
    )
  }
  
  return handleServerError(`${context} failed`)
}