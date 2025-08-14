import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting fix of prediction data...');
    
    // Find all predictions that are missing both predictedMin and predictedMax
    const brokenPredictions = await Prediction.find({
      $or: [
        { predictedMin: { $exists: false } },
        { predictedMax: { $exists: false } },
        { predictedMin: null },
        { predictedMax: null }
      ]
    });
    
    console.log(`Found ${brokenPredictions.length} broken predictions to fix`);
    
    let updatedCount = 0;
    
    for (const prediction of brokenPredictions) {
      console.log(`Fixing prediction for ${prediction.username}:`, {
        id: prediction._id,
        predictedMin: prediction.predictedMin,
        predictedMax: prediction.predictedMax,
        predictedPrice: prediction.predictedPrice
      });
      
      // Set a default range around $340 (current fallback price)
      let min, max;
      
      if (prediction.predictedPrice !== undefined && prediction.predictedPrice !== null) {
        // Use the old predictedPrice as midpoint
        const price = prediction.predictedPrice;
        const range = price * 0.02; // 2% range
        min = price - range;
        max = price + range;
      } else {
        // Use default range around current price
        const defaultPrice = 340;
        const range = defaultPrice * 0.02; // 2% range
        min = defaultPrice - range;
        max = defaultPrice + range;
      }
      
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
      console.log(`Fixed ${prediction.username} to range: ${min.toFixed(2)} - ${max.toFixed(2)}`);
    }
    
    console.log(`Fix completed. Updated ${updatedCount} predictions.`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} broken predictions`,
      updatedCount
    });
    
  } catch (error) {
    console.error('Error during fix:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix predictions'
      },
      { status: 500 }
    );
  }
}
