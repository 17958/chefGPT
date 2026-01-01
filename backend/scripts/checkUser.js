// Script to check if a user exists in the database
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.log('Usage: node checkUser.js <email>');
  process.exit(1);
}

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    
    if (user) {
      console.log('\n📋 User Found:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('isAutoCreated:', user.isAutoCreated);
      console.log('Created:', user.createdAt);
      console.log('Has Password:', !!user.password);
    } else {
      console.log('\n❌ User not found with email:', cleanEmail);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();

