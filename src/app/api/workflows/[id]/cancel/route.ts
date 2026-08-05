import { NextResponse } from 'next/server';
import { CancellationRegistry } from '@/runtime/cancellation/CancellationRegistry';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const registry = CancellationRegistry.getInstance();
    
    const token = registry.get(workflowId);
    if (!token) {
      return NextResponse.json(
        { error: 'Workflow is not currently running.' },
        { status: 404 }
      );
    }

    registry.cancel(workflowId);
    
    return NextResponse.json({ success: true, message: 'Cancellation requested.' });
  } catch (error: any) {
    console.error('[Cancel API] Failed to cancel workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
