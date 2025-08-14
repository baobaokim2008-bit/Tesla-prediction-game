import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('Password reset request received');
    await connectDB();
    console.log('Database connected');
    
    const { nickname, email, newPassword } = await request.json();
    console.log('Request data:', { nickname, email, newPassword: newPassword ? '***' : 'undefined' });
    
    if (!nickname || !email || !newPassword) {
      console.log('Missing nickname, email, or password');
      return NextResponse.json(
        { success: false, error: 'Nickname, email, and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password format
    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      console.log('Invalid password format');
      return NextResponse.json(
        { success: false, error: 'Password must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Check if user exists with the provided nickname and email
    console.log('Looking for user with nickname:', nickname, 'and email:', email);
    const existingUser = await User.findOne({ 
      username: nickname,
      email: email 
    });
    console.log('User found:', existingUser ? 'Yes' : 'No');

    if (!existingUser) {
      console.log('No user found with this nickname and email combination');
      return NextResponse.json({
        success: false,
        error: 'No account found with this nickname and email combination. Please check your information.'
      }, { status: 404 });
    }

    // Update the password
    console.log('Updating password for user:', existingUser.username);
    existingUser.password = newPassword;
    await existingUser.save();
    console.log('Password updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        userId: existingUser.userId,
        username: existingUser.username,
        email: existingUser.email
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
