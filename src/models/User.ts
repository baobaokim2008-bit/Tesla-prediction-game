import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false, // Optional for X users
    unique: true,
    sparse: true // Allow multiple null values
  },
  password: {
    type: String,
    required: false // Optional for X users
  },
  // X (Twitter) specific fields
  twitterId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: false
  },
  image: {
    type: String,
    required: false
  },
  provider: {
    type: String,
    enum: ['guest', 'twitter'],
    default: 'guest'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
