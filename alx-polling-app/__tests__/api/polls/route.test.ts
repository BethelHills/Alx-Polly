import '@testing-library/jest-dom'
import { POST, GET } from '@/app/api/polls/route'
import { NextRequest } from 'next/server'
import { createMockSupabaseClient, mockSuccessfulAuth, mockSuccessfulPollCreation, mockPollFetch } from '../../mocks/supabase-mocks'

// Mock the Supabase server client
jest.mock('@/lib/supabaseServerClient', () => ({
  supabaseServerClient: createMockSupabaseClient()
}))

// Mock audit logger
jest.mock('@/lib/audit-logger', () => ({
  auditLog: {
    pollCreated: jest.fn().mockResolvedValue(undefined)
  }
}))

describe('/api/polls POST endpoint - Security Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mocked client
    const { supabaseServerClient } = require('@/lib/supabaseServerClient')
    mockSupabaseClient = supabaseServerClient
  })

  it('should successfully create a poll with valid data', async () => {
    // Setup successful authentication and poll creation
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')
    mockSuccessfulPollCreation(mockSupabaseClient, 'poll-123')

    const request = new NextRequest('http://localhost:3000/api/polls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify({ title: 'Test Poll', options: ['Option 1', 'Option 2'] }).length.toString()
      },
      body: JSON.stringify({
        title: 'Test Poll',
        options: ['Option 1', 'Option 2']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Poll created successfully!')
    expect(data.pollId).toBe('poll-123')
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('valid-token-12345')
  })

  it('should reject malformed authorization headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/polls', {
      method: 'POST',
      headers: {
        'Authorization': 'InvalidToken valid-token-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Test Poll', options: ['Option 1', 'Option 2'] })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid authorization header format')
  })

  it('should sanitize HTML in poll titles', async () => {
    mockSuccessfulAuth(mockSupabaseClient, 'user-123')
    mockSuccessfulPollCreation(mockSupabaseClient, 'poll-123')

    const request = new NextRequest('http://localhost:3000/api/polls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token-12345',
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify({ title: '<h1>Test Poll</h1>', options: ['Option 1', 'Option 2'] }).length.toString()
      },
      body: JSON.stringify({
        title: '<h1>Test Poll</h1>',
        options: ['Option 1', 'Option 2']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.poll.title).toBe('Test Poll') // HTML should be stripped
  })
})

describe('/api/polls GET endpoint - Security Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mocked client
    const { supabaseServerClient } = require('@/lib/supabaseServerClient')
    mockSupabaseClient = supabaseServerClient
  })

  it('should successfully fetch all polls', async () => {
    // Mock successful poll fetch
    const mockPollsWithOptions = [{
      id: 'poll-1',
      title: 'Test Poll 1',
      options: [{ id: 'opt-1', votes: 5 }, { id: 'opt-2', votes: 3 }]
    }]

    mockPollFetch(mockSupabaseClient, mockPollsWithOptions)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.polls).toHaveLength(1)
    expect(data.polls[0].total_votes).toBe(8) // 5 + 3
  })
})