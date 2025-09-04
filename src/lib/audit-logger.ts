import { NextRequest } from 'next/server'
import { supabaseServerClient } from './supabaseServerClient'

// Audit log interface
export interface AuditLogEntry {
  user_id?: string
  action: string
  target_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

// Audit log actions
export const AuditActions = {
  POLL_CREATED: 'poll_created',
  POLL_UPDATED: 'poll_updated',
  POLL_DELETED: 'poll_deleted',
  VOTE_SUBMITTED: 'vote_submitted',
  VOTE_CHANGED: 'vote_changed',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  AUTH_FAILURE: 'auth_failure',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
} as const

// Audit logger class
export class AuditLogger {
  private static instance: AuditLogger
  private supabase = supabaseServerClient

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  // Log an audit event
  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: entry.user_id || null,
          action: entry.action,
          target_id: entry.target_id || null,
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
          metadata: entry.metadata || null,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log audit event:', error)
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  // Extract request information
  private extractRequestInfo(request: NextRequest) {
    const ip = request.ip || 
               request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    return { ip, userAgent }
  }

  // Log poll creation
  public async pollCreated(
    request: NextRequest, 
    userId: string, 
    pollId: string, 
    pollTitle: string
  ): Promise<void> {
    const { ip, userAgent } = this.extractRequestInfo(request)
    
    await this.log({
      user_id: userId,
      action: AuditActions.POLL_CREATED,
      target_id: pollId,
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        poll_title: pollTitle,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Log vote submission
  public async vote(
    request: NextRequest,
    userId: string,
    pollId: string,
    optionText: string,
    isVoteChange: boolean = false
  ): Promise<void> {
    const { ip, userAgent } = this.extractRequestInfo(request)
    
    await this.log({
      user_id: userId,
      action: isVoteChange ? AuditActions.VOTE_CHANGED : AuditActions.VOTE_SUBMITTED,
      target_id: pollId,
      ip_address: ip,
      user_agent: userAgent,
      metadata: {
        option_text: optionText,
        is_vote_change: isVoteChange,
        timestamp: new Date().toISOString()
      }
    })
  }
}

// Export singleton instance
export const auditLog = AuditLogger.getInstance()
