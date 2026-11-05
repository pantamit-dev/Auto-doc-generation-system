import { NextResponse } from 'next/server';
import { calculateContract, ContractInput } from '@/lib/calculation/salaryEngine';

/**
 * POST /api/calculate
 * Expects a JSON body matching {@link ContractInput}.
 * Returns derived contract fields.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContractInput;
    const result = calculateContract(body);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculate API error', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
