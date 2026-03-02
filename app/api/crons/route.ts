import { NextRequest, NextResponse } from 'next/server'

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:4440'
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || ''

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/cron/list`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch crons', status: res.status }, { status: 500 })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, jobId, ...rest } = body
    
    let endpoint = ''
    let method = 'POST'
    let payload: any = {}
    
    switch (action) {
      case 'run':
        endpoint = '/api/cron/run'
        payload = { jobId, mode: 'now' }
        break
      case 'enable':
      case 'disable':
        endpoint = '/api/cron/update'
        payload = { jobId, patch: { enabled: action === 'enable' } }
        break
      case 'update':
        endpoint = '/api/cron/update'
        payload = { jobId, patch: rest.patch }
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    
    const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
