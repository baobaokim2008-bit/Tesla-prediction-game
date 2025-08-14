import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting reset of prediction data...');
    
    // Get all predictions for the current week
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Delete all current predictions for this week
    const deleteResult = await Prediction.deleteMany({
      weekStartDate: {
        $gte: weekStart
      }
    });
    
    console.log(`Deleted ${deleteResult.deletedCount} old predictions`);
    
    // Create new predictions with correct schema
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    weekEnd.setHours(23, 59, 59, 999);
    
    const newPredictions = [
      {
        userId: 'user_chris_1755136506750',
        username: 'Chris',
        predictedMin: 240.10,
        predictedMax: 249.90,
        weekStartDate: weekStart,
        weekEndDate: weekEnd
      },
      {
        userId: 'user_iagw4i1eu',
        username: 'User1',
        predictedMin: 235.00,
        predictedMax: 255.00,
        weekStartDate: weekStart,
        weekEndDate: weekEnd
      },
      {
        userId: 'user_vct95l6v9',
        username: 'User2',
        predictedMin: 230.00,
        predictedMax: 260.00,
        weekStartDate: weekStart,
        weekEndDate: weekEnd
      }
    ];
    
    const createdPredictions = [];
    
    for (const predData of newPredictions) {
      const newPrediction = new Prediction(predData);
      await newPrediction.save();
      createdPredictions.push({
        id: newPrediction._id,
        username: newPrediction.username,
        predictedMin: newPrediction.predictedMin,
        predictedMax: newPrediction.predictedMax
      });
      console.log(`Created new prediction for ${newPrediction.username}: ${newPrediction.predictedMin} - ${newPrediction.predictedMax}`);
    }
    
    console.log(`Reset completed. Created ${createdPredictions.length} new predictions.`);
    
    return NextResponse.json({
      success: true,
      message: `Reset completed. Deleted ${deleteResult.deletedCount} old predictions and created ${createdPredictions.length} new ones.`,
      deletedCount: deleteResult.deletedCount,
      createdCount: createdPredictions.length,
      predictions: createdPredictions
    });
    
  } catch (error) {
    console.error('Error during reset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset predictions'
      },
      { status: 500 }
    );
  }
}
