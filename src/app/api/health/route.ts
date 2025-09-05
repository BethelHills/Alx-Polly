import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * Health check endpoint for monitoring application status and dependencies.
 * 
 * This endpoint provides comprehensive health status information including database
 * connectivity, response times, and system metrics. It's designed for use by
 * monitoring systems, load balancers, and deployment pipelines to verify the
 * application is functioning correctly.
 * 
 * @returns Promise<NextResponse> - JSON response with health status and system metrics
 * 
 * @throws {503} Service unavailable - When database is unreachable or system is unhealthy
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/health');
 * const health = await response.json();
 * // Returns: { status: 'healthy', services: { database: { status: 'up' } } }
 * ```
 * 
 * @response
 * **200 OK** - System is healthy:
 * ```json
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "version": "1.0.0",
 *   "environment": "production",
 *   "services": {
 *     "database": { "status": "up", "responseTime": 45 }
 *   },
 *   "uptime": 3600
 * }
 * ```
 * 
 * **503 Service Unavailable** - System is unhealthy:
 * ```json
 * {
 *   "status": "unhealthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "services": {
 *     "database": { "status": "down", "error": "Connection timeout" }
 *   }
 * }
 * ```
 * 
 * @security
 * - Public endpoint (no authentication required)
 * - Does not expose sensitive system information
 * - Safe for external monitoring systems
 * 
 * @since 1.0.0
 */
export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const { error } = await supabaseServerClient
      .from('polls')
      .select('count')
      .limit(1)
    
    const dbResponseTime = Date.now() - startTime
    
    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: 'down',
              error: error.message,
              responseTime: dbResponseTime
            }
          }
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: 'up',
            responseTime: dbResponseTime
          }
        },
        uptime: process.uptime()
      },
      { status: 200 }
    )
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
