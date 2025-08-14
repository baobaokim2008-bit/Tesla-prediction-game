import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Debugging prediction data...');
    
    // Get all predictions for the current week
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const predictions = await Prediction.find({
      weekStartDate: {
        $gte: weekStart
      }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${predictions.length} predictions for debugging`);
    
    const debugData = predictions.map(pred => ({
      id: pred._id,
      username: pred.username,
      predictedMin: pred.predictedMin,
      predictedMax: pred.predictedMax,
      predictedPrice: pred.predictedPrice,
      hasMin: pred.predictedMin !== undefined && pred.predictedMin !== null,
      hasMax: pred.predictedMax !== undefined && pred.predictedMax !== null,
      hasPrice: pred.predictedPrice !== undefined && pred.predictedPrice !== null,
      createdAt: pred.createdAt,
      updatedAt: pred.updatedAt
    }));
    
    console.log('Debug data:', debugData);
    
    return NextResponse.json({
      success: true,
      weekStart: weekStart.toISOString(),
      predictionCount: predictions.length,
      predictions: debugData
    });
    
  } catch (error) {
    console.error('Error during debug:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to debug predictions'
      },
      { status: 500 }
    );
  }
}
