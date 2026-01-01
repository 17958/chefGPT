// Script to drop the unique index on phone field in production database
// Run this on Railway or your production server to fix the E11000 duplicate key error
const mongoose = require('mongoose');
require('dotenv').config();

async function fixPhoneIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('yumsters');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => {
      console.log('  -', JSON.stringify(idx));
    });
    
    // Check if phone_1 index exists
    const phoneIndex = indexes.find(idx => idx.name === 'phone_1');
    
    if (phoneIndex) {
      console.log('\n⚠️ Found unique index on phone field. Dropping it...');
      await collection.dropIndex('phone_1');
      console.log('✅ Successfully dropped phone_1 index');
    } else {
      console.log('\n✅ No phone_1 index found. Nothing to fix.');
    }
    
    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('\n📋 Updated indexes:');
    updatedIndexes.forEach(idx => {
      console.log('  -', JSON.stringify(idx));
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! Phone index issue fixed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPhoneIndex();

