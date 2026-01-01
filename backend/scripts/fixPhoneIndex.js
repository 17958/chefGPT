// Script to drop the unique index on phone field if it exists
// This fixes the "E11000 duplicate key error collection: test.yumsters index: phone_1" error
const mongoose = require('mongoose');
require('dotenv').config();

async function fixPhoneIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
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
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPhoneIndex();

