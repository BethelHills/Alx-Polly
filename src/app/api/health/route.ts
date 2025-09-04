import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const { data, error } = await supabaseServerClient
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
