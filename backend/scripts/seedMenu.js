const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
require('dotenv').config();

const menuItems = [
  // Chicken Starters
  {
    name: 'Fire 65',
    description: 'Spicy deep-fried chicken pieces marinated in special spices',
    price: 220,
    category: 'appetizer',
    available: true
  },
  {
    name: 'Crispy Lollipop',
    description: 'Crispy chicken wings with tangy sauce',
    price: 250,
    category: 'appetizer',
    available: true
  },
  {
    name: 'Smoky Tikka',
    description: 'Tender chicken pieces marinated in yogurt and spices, grilled to perfection',
    price: 240,
    category: 'appetizer',
    available: true
  },
  {
    name: 'Hot Wings',
    description: 'Spicy and crispy chicken wings',
    price: 200,
    category: 'appetizer',
    available: true
  },
  {
    name: 'Chicken Seekh Kebab',
    description: 'Minced chicken kebabs grilled on skewers with aromatic spices',
    price: 260,
    category: 'appetizer',
    available: true
  },
  {
    name: 'Tandoori Chicken',
    description: 'Marinated chicken cooked in traditional tandoor oven',
    price: 280,
    category: 'appetizer',
    available: true
  },
  
  // Main Course
  {
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces',
    price: 320,
    category: 'main-course',
    available: true
  },
  {
    name: 'Chicken Curry',
    description: 'Traditional Indian chicken curry with rich gravy',
    price: 300,
    category: 'main-course',
    available: true
  },
  {
    name: 'Chicken Korma',
    description: 'Mild and creamy chicken curry with cashews and cream',
    price: 340,
    category: 'main-course',
    available: true
  },
  {
    name: 'Chicken Masala',
    description: 'Spicy chicken cooked with onions, tomatoes and aromatic spices',
    price: 310,
    category: 'main-course',
    available: true
  },
  
  // Rice
  {
    name: 'Classic Biryani',
    description: 'Fragrant basmati rice cooked with tender chicken pieces and aromatic spices',
    price: 280,
    category: 'rice',
    available: true
  },
  {
    name: 'Royal Dum Biryani',
    description: 'Slow-cooked chicken biryani with layers of rice and marinated chicken',
    price: 320,
    category: 'rice',
    available: true
  },
  {
    name: 'Chicken Fried Rice',
    description: 'Stir-fried rice with chicken, vegetables and aromatic spices',
    price: 250,
    category: 'rice',
    available: true
  },
  {
    name: 'Jeera Rice',
    description: 'Fragrant basmati rice tempered with cumin seeds',
    price: 120,
    category: 'rice',
    available: true
  },
  
  // Bread
  {
    name: 'Butter Naan',
    description: 'Soft leavened bread brushed with butter',
    price: 60,
    category: 'bread',
    available: true
  },
  {
    name: 'Garlic Naan',
    description: 'Naan bread topped with fresh garlic and herbs',
    price: 70,
    category: 'bread',
    available: true
  },
  {
    name: 'Roti',
    description: 'Whole wheat flatbread',
    price: 40,
    category: 'bread',
    available: true
  },
  {
    name: 'Paratha',
    description: 'Layered flatbread cooked with ghee',
    price: 50,
    category: 'bread',
    available: true
  },
  
  // Dessert
  {
    name: 'Vanilla Dream',
    description: 'Creamy vanilla ice cream',
    price: 80,
    category: 'dessert',
    available: true
  },
  {
    name: 'Choco Delight',
    description: 'Rich chocolate ice cream',
    price: 90,
    category: 'dessert',
    available: true
  },
  {
    name: 'Berry Blast',
    description: 'Fresh strawberry ice cream',
    price: 90,
    category: 'dessert',
    available: true
  },
  {
    name: 'Butterscotch Bliss',
    description: 'Delicious butterscotch flavored ice cream',
    price: 100,
    category: 'dessert',
    available: true
  },
  {
    name: 'Gulab Jamun',
    description: 'Sweet milk dumplings soaked in sugar syrup',
    price: 80,
    category: 'dessert',
    available: true
  },
  {
    name: 'Kheer',
    description: 'Traditional rice pudding with cardamom and nuts',
    price: 85,
    category: 'dessert',
    available: true
  },
  
  // Beverages
  {
    name: 'Mango Lassi',
    description: 'Refreshing yogurt drink with mango',
    price: 60,
    category: 'beverage',
    available: true
  },
  {
    name: 'Sweet Lassi',
    description: 'Traditional sweet yogurt drink',
    price: 50,
    category: 'beverage',
    available: true
  },
  {
    name: 'Masala Chai',
    description: 'Spiced Indian tea with milk',
    price: 40,
    category: 'beverage',
    available: true
  }
];

async function seedMenu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amma-chethi-vanta', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing menu items
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    // Insert menu items
    await MenuItem.insertMany(menuItems);
    console.log(`Successfully seeded ${menuItems.length} menu items`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding menu:', error);
    process.exit(1);
  }
}

seedMenu();
