const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
require('dotenv').config();

async function checkMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);

    // Count items
    const count = await MenuItem.countDocuments();
    console.log(`\n📊 Total menu items in database: ${count}`);

    if (count > 0) {
      console.log('\n📋 Menu Items:');
      const items = await MenuItem.find().select('name price category');
      items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - ₹${item.price} (${item.category})`);
      });
    } else {
      console.log('\n⚠️  No menu items found!');
      console.log('💡 Run: npm run seed');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. MongoDB is running');
    console.log('2. MONGODB_URI is correct in .env file');
    process.exit(1);
  }
}

checkMenu();

