import { NextRequest, NextResponse } from 'next/server';
import { getGrokInsight } from '@/lib/grok';

export async function POST(request: NextRequest) {
  try {
    const { currentPrice, predictedPrice, historicalContext } = await request.json();

    if (!currentPrice || !predictedPrice) {
      return NextResponse.json(
        { success: false, error: 'Current price and predicted price are required' },
        { status: 400 }
      );
    }

    const insight = await getGrokInsight(currentPrice, predictedPrice, historicalContext);

    return NextResponse.json({
      success: true,
      data: { insight }
    });
  } catch (error) {
    console.error('Error getting insight:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI insight' },
      { status: 500 }
    );
  }
}

