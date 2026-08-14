import { NextResponse } from 'next/server';
import { EngineeringAdvisor } from '@/platform/advisor/EngineeringAdvisor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { changeRequest, workflowId } = body;

    if (!changeRequest || !workflowId) {
      return NextResponse.json(
        { error: 'Missing changeRequest or workflowId' },
        { status: 400 }
      );
    }

    const evaluation = await EngineeringAdvisor.evaluateChange(changeRequest, workflowId);

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('[AdvisorAPI] Error evaluating change:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
