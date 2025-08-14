import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      );
    }

    // Find all predictions for this user that don't have predictionHistory
    const predictions = await Prediction.find({
      userId,
      $or: [
        { predictionHistory: { $exists: false } },
        { predictionHistory: { $size: 0 } }
      ]
    });

    let fixedCount = 0;

    for (const prediction of predictions) {
      // Create a history entry from the current prediction data
      const historyEntry = {
        predictedMin: prediction.predictedMin || prediction.predictedPrice || 0,
        predictedMax: prediction.predictedMax || prediction.predictedPrice || 0,
        createdAt: prediction.createdAt,
        dayMultiplier: prediction.dayMultiplier || 1
      };

      // Update the prediction with the history entry
      await Prediction.findByIdAndUpdate(
        prediction._id,
        {
          $set: {
            predictionHistory: [historyEntry]
          }
        }
      );

      fixedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} predictions with history entries`,
      fixedCount
    });

  } catch (error) {
    console.error('Error fixing predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix predictions'
      },
      { status: 500 }
    );
  }
}
