import { z } from "zod"
import DOMPurify from 'dompurify'

// Create DOMPurify instance for server-side rendering
const createDOMPurify = () => {
  if (typeof window === 'undefined') {
    // Server-side: return a mock DOMPurify that strips HTML tags
    return {
      sanitize: (html: string) => html.replace(/<[^>]*>/g, ''), // Strip HTML tags
      version: 'server-side'
    }
  }
  // Client-side: use the global DOMPurify
  return DOMPurify
}

const domPurify = createDOMPurify()

// Base poll option validation with sanitization
const pollOptionSchema = z.string()
  .min(1, 'Option text is required')
  .max(100, 'Option must be less than 100 characters')
  .refine(
    (value) => value.trim().length > 0,
    { message: 'Option text cannot be empty' }
  )
  .transform((val) => {
    // Sanitize the string using DOMPurify
    return String(domPurify.sanitize(val, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    })).trim()
  })

// Poll creation schema with comprehensive validation and sanitization
export const createPollSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .refine(
      (value) => value.trim().length >= 3,
      { message: 'Title must be at least 3 characters after trimming whitespace' }
    )
    .transform((val) => {
      // Sanitize the string using DOMPurify
      return String(domPurify.sanitize(val, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      })).trim()
    }),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return ''
      // Sanitize the string using DOMPurify
      return String(domPurify.sanitize(val, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      })).trim()
    }),

  options: z.array(pollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(
      (options) => {
        // Check for unique options (case-insensitive)
        const texts = options.map(opt => opt.trim().toLowerCase())
        return new Set(texts).size === texts.length
      },
      { message: 'Options must be unique' }
    )
    .refine(
      (options) => {
        // Ensure all options have content after trimming
        return options.every(option => option.trim().length > 0)
      },
      { message: 'All options must have content' }
    )
})

// Vote schema for voting validation
export const voteSchema = z.object({
  option_id: z.string().uuid('Invalid option ID format')
})

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{
    field: string
    message: string
  }>
}

// Validate and sanitize poll data
export function validateAndSanitizePoll(data: unknown): ValidationResult<z.infer<typeof createPollSchema>> {
  try {
    const result = createPollSchema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        errors: formatValidationErrors(result.error)
      }
    }
  } catch {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: 'Validation failed due to unexpected error'
      }]
    }
  }
}

// Format Zod validation errors into a consistent format
export function formatValidationErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message
  }))
}

// Validate vote data
export function validateVote(data: unknown): ValidationResult<z.infer<typeof voteSchema>> {
  try {
    const result = voteSchema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        errors: formatValidationErrors(result.error)
      }
    }
  } catch {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: 'Validation failed due to unexpected error'
      }]
    }
  }
}
