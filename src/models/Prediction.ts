import mongoose, { Schema, Document } from 'mongoose';

export interface IPredictionHistoryEntry {
  predictedMin: number;
  predictedMax: number;
  createdAt: Date;
  dayMultiplier: number;
}

export interface IPrediction extends Document {
  userId: string;
  username: string; // Added for user identification
  predictedMin?: number;
  predictedMax?: number;
  predictedPrice?: number; // Keep for backward compatibility
  weekStartDate: Date;
  weekEndDate: Date;
  actualPrice?: number;
  isCorrect?: boolean;
  score?: number; // Score for this prediction
  rangeSize?: number; // Size of the prediction range
  dayMultiplier?: number; // Multiplier based on prediction day (Monday=5, Tuesday=3, Wednesday=2, Thursday=1)
  predictionHistory?: IPredictionHistoryEntry[]; // Track all inputs for this week
  createdAt: Date;
  updatedAt: Date;
}

const PredictionHistoryEntrySchema = new Schema({
  predictedMin: {
    type: Number,
    required: true,
    min: 0
  },
  predictedMax: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  dayMultiplier: {
    type: Number,
    required: true
  }
}, { _id: false });

const PredictionSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  predictedMin: {
    type: Number,
    required: false, // Changed to false
    min: 0
  },
  predictedMax: {
    type: Number,
    required: false, // Changed to false
    min: 0
  },
  predictedPrice: { // Added back for backward compatibility
    type: Number,
    required: false,
    min: 0
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  weekEndDate: {
    type: Date,
    required: true
  },
  actualPrice: {
    type: Number,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  score: {
    type: Number,
    default: null
  },
  rangeSize: {
    type: Number,
    default: null
  },
  dayMultiplier: {
    type: Number,
    default: null
  },
  predictionHistory: {
    type: [PredictionHistoryEntrySchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound index to ensure one prediction per user per week
PredictionSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

export default mongoose.models.Prediction || mongoose.model<IPrediction>('Prediction', PredictionSchema);

