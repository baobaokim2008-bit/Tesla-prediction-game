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

    // Find the user's prediction
    const prediction = await Prediction.findOne({ userId }).sort({ createdAt: -1 });

    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'No prediction found for user'
        },
        { status: 404 }
      );
    }

    console.log('Before fix - prediction data:', {
      _id: prediction._id,
      userId: prediction.userId,
      predictedMin: prediction.predictedMin,
      predictedMax: prediction.predictedMax,
      hasPredictionHistory: !!prediction.predictionHistory
    });

    // Create a history entry from the current prediction data
    const historyEntry = {
      predictedMin: prediction.predictedMin || prediction.predictedPrice || 0,
      predictedMax: prediction.predictedMax || prediction.predictedPrice || 0,
      createdAt: prediction.createdAt,
      dayMultiplier: prediction.dayMultiplier || 1
    };

    console.log('Creating history entry:', historyEntry);

    // Directly update the document to add the predictionHistory field
    const result = await Prediction.updateOne(
      { _id: prediction._id },
      {
        $set: {
          predictionHistory: [historyEntry]
        }
      }
    );

    console.log('Update result:', result);

    if (result.modifiedCount > 0) {
      // Verify the update worked
      const updatedPrediction = await Prediction.findById(prediction._id);
      
      console.log('After fix - prediction data:', {
        _id: updatedPrediction._id,
        hasPredictionHistory: !!updatedPrediction.predictionHistory,
        historyLength: updatedPrediction.predictionHistory ? updatedPrediction.predictionHistory.length : 'N/A'
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully added predictionHistory field',
        data: {
          _id: updatedPrediction._id,
          historyLength: updatedPrediction.predictionHistory ? updatedPrediction.predictionHistory.length : 0,
          modifiedCount: result.modifiedCount
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to update prediction - no documents modified'
      });
    }

  } catch (error) {
    console.error('Error adding history field:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add history field'
      },
      { status: 500 }
    );
  }
}
