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

    console.log('Fixing Mongoose recognition for userId:', userId);

    // Get the raw MongoDB document first
    const db = Prediction.db;
    const collection = db.collection('predictions');
    const rawDoc = await collection.findOne({ userId });
    
    if (!rawDoc) {
      return NextResponse.json({
        success: false,
        error: 'No document found for this user'
      });
    }

    console.log('Raw document has predictionHistory:', 'predictionHistory' in rawDoc);

    if (!('predictionHistory' in rawDoc)) {
      return NextResponse.json({
        success: false,
        error: 'No predictionHistory field in raw document'
      });
    }

    // Force Mongoose to recognize the field by updating through Mongoose
    const result = await Prediction.findByIdAndUpdate(
      rawDoc._id,
      {
        $set: {
          predictionHistory: rawDoc.predictionHistory
        }
      },
      { 
        new: true,
        runValidators: true,
        strict: false // Allow fields not in schema
      }
    );

    console.log('Mongoose update result:', {
      success: !!result,
      hasPredictionHistory: !!result?.predictionHistory,
      predictionHistoryLength: result?.predictionHistory ? result.predictionHistory.length : 'N/A'
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Mongoose fix successful - field now recognized',
        data: {
          _id: result._id,
          hasPredictionHistory: !!result.predictionHistory,
          predictionHistoryLength: result.predictionHistory ? result.predictionHistory.length : 0
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Mongoose fix failed - could not update document'
      });
    }

  } catch (error) {
    console.error('Error in Mongoose fix:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform Mongoose fix'
      },
      { status: 500 }
    );
  }
}
