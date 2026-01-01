const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
require('dotenv').config();

// 12 Ice Cream items with unique images from internet
const menuItems = [
  {
    name: 'Vanilla Ice Cream',
    description: 'Classic creamy vanilla ice cream made with real vanilla beans',
    price: 120,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1b5?w=800&q=80',
    available: true
  },
  {
    name: 'Chocolate Ice Cream',
    description: 'Rich and decadent chocolate ice cream with premium cocoa',
    price: 130,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80',
    available: true
  },
  {
    name: 'Strawberry Ice Cream',
    description: 'Fresh strawberry ice cream with real fruit chunks',
    price: 140,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    available: true
  },
  {
    name: 'Mango Ice Cream',
    description: 'Tropical mango ice cream with sweet mango puree',
    price: 150,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    available: true
  },
  {
    name: 'Butterscotch Ice Cream',
    description: 'Creamy butterscotch ice cream with caramel swirls',
    price: 145,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1b5?w=800&q=80',
    available: true
  },
  {
    name: 'Pista Ice Cream',
    description: 'Delicious pistachio ice cream with real pistachio nuts',
    price: 160,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80',
    available: true
  },
  {
    name: 'Kulfi',
    description: 'Traditional Indian frozen dessert with cardamom and saffron',
    price: 100,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    available: true
  },
  {
    name: 'Cookies & Cream',
    description: 'Vanilla ice cream with crushed chocolate cookies',
    price: 155,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    available: true
  },
  {
    name: 'Chocolate Chip',
    description: 'Creamy vanilla ice cream loaded with chocolate chips',
    price: 135,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1b5?w=800&q=80',
    available: true
  },
  {
    name: 'Rocky Road',
    description: 'Chocolate ice cream with marshmallows and almonds',
    price: 165,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&q=80',
    available: true
  },
  {
    name: 'Caramel Fudge',
    description: 'Rich caramel ice cream with fudge swirls',
    price: 150,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    available: true
  },
  {
    name: 'Double Chocolate',
    description: 'Double the chocolate, double the delight with chocolate chunks',
    price: 145,
    category: 'ice-cream',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    available: true
  }
];

async function seedMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log('✅ Cleared existing menu items');

    // Insert menu items
    await MenuItem.insertMany(menuItems);
    console.log(`✅ Successfully seeded ${menuItems.length} menu items with images`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    process.exit(1);
  }
}

seedMenu();
