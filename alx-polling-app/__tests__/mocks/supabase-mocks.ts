// Centralized Supabase mocks for testing
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn(),
        })),
        single: jest.fn(),
      })),
      order: jest.fn(() => ({
        single: jest.fn(),
        range: jest.fn(),
      })),
      single: jest.fn(),
      range: jest.fn(),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
})

// Mock successful authentication
export const mockSuccessfulAuth = (mockClient: any, userId: string = 'user-123') => {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null
  })
}

// Mock failed authentication
export const mockFailedAuth = (mockClient: any, error: any = new Error('Invalid token')) => {
  mockClient.auth.getUser.mockResolvedValue({
    data: null,
    error
  })
}

// Mock successful poll creation
export const mockSuccessfulPollCreation = (mockClient: any, pollId: string = 'poll-123') => {
  const mockInsert = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: pollId, title: 'Test Poll', owner_id: 'user-123' },
        error: null
      })
    })
  })

  const mockInsertOptions = jest.fn().mockResolvedValue({
    data: [],
    error: null
  })

  mockClient.from
    .mockReturnValueOnce({ insert: mockInsert }) // For poll creation
    .mockReturnValueOnce({ insert: mockInsertOptions }) // For options creation
}

// Mock poll fetch
export const mockPollFetch = (mockClient: any, polls: any[] = []) => {
  mockClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: polls,
          error: null
        })
      })
    })
  })
}