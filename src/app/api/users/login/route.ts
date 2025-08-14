import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('Login request received');
    await connectDB();
    console.log('Database connected');
    
    const { nickname, password } = await request.json();
    console.log('Request data:', { nickname, password: password ? '***' : 'undefined' });
    
    if (!nickname || !password) {
      console.log('Missing nickname or password');
      return NextResponse.json(
        { success: false, error: 'Nickname and password are required' },
        { status: 400 }
      );
    }

    // Validate password format
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      console.log('Invalid password format');
      return NextResponse.json(
        { success: false, error: 'Password must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Find user by nickname
    console.log('Looking for user with nickname:', nickname);
    const existingUser = await User.findOne({ username: nickname });
    console.log('User found:', existingUser ? 'Yes' : 'No');

    if (!existingUser) {
      console.log('No user found with nickname:', nickname);
      return NextResponse.json({
        success: false,
        error: 'No account found with this nickname. Please check your nickname or sign up for a new account.'
      }, { status: 404 });
    }

    // Verify password
    if (existingUser.password !== password) {
      console.log('Incorrect password for user:', nickname);
      return NextResponse.json({
        success: false,
        error: 'Incorrect password. Please try again.'
      }, { status: 401 });
    }

    console.log('Login successful for user:', nickname);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: existingUser.userId,
        username: existingUser.username,
        email: existingUser.email
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
