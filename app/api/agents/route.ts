import { NextResponse } from 'next/server'
import { getAllAgents } from '@/lib/agents/definitions'

export async function GET() {
  const agents = getAllAgents()
  return NextResponse.json(agents)
}
