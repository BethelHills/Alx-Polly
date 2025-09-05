import '@testing-library/jest-dom'
import { POST, GET } from '@/app/api/polls/[id]/vote/route'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, mockSuccessfulAuth, mockSuccessfulVote, mockDuplicateVoteError, mockPollResults } from '../../mocks/supabase-mocks'

// Mock the Supabase server client
jest.mock('@/lib/supabaseServerClient', () => ({
  supabaseServerClient: createMockSupabaseClient()
}))

// Mock audit logger
jest.mock('@/lib/audit-logger', () => ({
  auditLog: {
    vote: jest.fn().mockResolvedValue(undefined)
  }
}))

describe('/api/polls/[id]/vote POST endpoint - Security Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mocked client
    const { supabaseServerClient } = require('@/lib/supabaseServerClient')
    mockSupabaseClient = supabaseServerClient
  })

  it('should successfully submit a vote', async () => {
    // Setup successful authentication and vote submission
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')
    mockSuccessfulVote(mockSupabaseClient, 'vote-123')

    // Mock poll and option validation
    mockSupabaseClient.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'poll-123', title: 'Test Poll', is_active: true, owner_id: 'user-123' },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'option-123', text: 'Option 1', poll_id: 'poll-123' },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'vote-123', poll_id: 'poll-123', option_id: 'option-123', user_id: 'user-123' },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'option-123', text: 'Option 1', votes: 1, order_index: 0 }],
              error: null
            })
          })
        })
      })

    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_id: 'option-123'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Vote submitted successfully!')
    expect(data.vote.id).toBe('vote-123')
  })

  it('should handle duplicate vote constraint violation', async () => {
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')
    mockDuplicateVoteError(mockSupabaseClient)

    // Mock poll and option validation
    mockSupabaseClient.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'poll-123', title: 'Test Poll', is_active: true, owner_id: 'user-123' },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'option-123', text: 'Option 1', poll_id: 'poll-123' },
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' }
            })
          })
        })
      })

    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_id: 'option-123'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.message).toBe('You have already voted on this poll')
  })

  it('should reject invalid option IDs', async () => {
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')

    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_id: 'invalid-uuid'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Validation failed')
    expect(data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'option_id', message: 'Invalid option ID format' })
      ])
    )
  })

  it('should reject requests without authentication', async () => {
    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_id: 'option-123'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.message).toBe('No token provided')
  })

  it('should handle inactive polls', async () => {
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')

    // Mock inactive poll
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'poll-123', title: 'Test Poll', is_active: false, owner_id: 'user-123' },
            error: null
          })
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_id: 'option-123'
      })
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Poll is no longer active')
  })
})

describe('/api/polls/[id]/vote GET endpoint - Security Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mocked client
    const { supabaseServerClient } = require('@/lib/supabaseServerClient')
    mockSupabaseClient = supabaseServerClient
  })

  it('should successfully fetch poll results', async () => {
    const mockPoll = {
      id: 'poll-123',
      title: 'Test Poll',
      description: 'Test Description',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      owner_id: 'user-123'
    }

    const mockOptions = [
      { id: 'option-1', text: 'Option 1', votes: 5, order_index: 0 },
      { id: 'option-2', text: 'Option 2', votes: 3, order_index: 1 }
    ]

    // Mock poll fetch
    mockSupabaseClient.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPoll,
              error: null
            })
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockOptions,
              error: null
            })
          })
        })
      })

    const request = new NextRequest('http://localhost:3000/api/polls/poll-123/vote')
    const response = await GET(request, { params: Promise.resolve({ id: 'poll-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.poll.id).toBe('poll-123')
    expect(data.poll.total_votes).toBe(8) // 5 + 3
    expect(data.poll.options).toHaveLength(2)
    expect(data.poll.options[0].percentage).toBe(63) // 5/8 * 100 rounded
    expect(data.poll.options[1].percentage).toBe(38) // 3/8 * 100 rounded
  })

  it('should handle poll not found', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Poll not found')
          })
        })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/polls/nonexistent/vote')
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Poll not found')
  })
})
