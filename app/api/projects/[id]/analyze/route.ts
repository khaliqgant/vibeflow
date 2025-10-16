import { NextResponse } from 'next/server'
import { orchestrateProjectAnalysis } from '@/lib/agents/orchestrator'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await orchestrateProjectAnalysis(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error analyzing project:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    )
  }
}
