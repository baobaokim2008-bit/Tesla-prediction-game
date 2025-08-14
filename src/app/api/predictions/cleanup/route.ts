import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting cleanup of old prediction data...');
    
    // Find all predictions that have predictedPrice but no predictedMin/Max
    const oldPredictions = await Prediction.find({
      predictedPrice: { $exists: true },
      $or: [
        { predictedMin: { $exists: false } },
        { predictedMax: { $exists: false } }
      ]
    });
    
    console.log(`Found ${oldPredictions.length} old predictions to clean up`);
    
    let updatedCount = 0;
    
    for (const prediction of oldPredictions) {
      console.log(`Cleaning up prediction for ${prediction.username}:`, {
        oldPrice: prediction.predictedPrice,
        oldMin: prediction.predictedMin,
        oldMax: prediction.predictedMax
      });
      
      // Convert single price to a small range (±1%)
      const price = prediction.predictedPrice;
      const range = price * 0.01; // 1% range
      const min = price - range;
      const max = price + range;
      
      // Update the prediction
      await Prediction.findByIdAndUpdate(
        prediction._id,
        {
          $set: {
            predictedMin: min,
            predictedMax: max,
            updatedAt: new Date()
          },
          $unset: {
            predictedPrice: 1
          }
        }
      );
      
      updatedCount++;
      console.log(`Updated ${prediction.username} to range: ${min.toFixed(2)} - ${max.toFixed(2)}`);
    }
    
    console.log(`Cleanup completed. Updated ${updatedCount} predictions.`);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${updatedCount} old predictions`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup old predictions'
      },
      { status: 500 }
    );
  }
}
