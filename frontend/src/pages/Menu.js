import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import MenuCard from '../components/MenuCard';
import Cart from '../components/Cart';
import './Menu.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMenu();
    if (user) {
      fetchCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/menu`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/signin');
      }
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cart`);
      if (response.data && response.data.items) {
        const cartItems = response.data.items.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.menuItem.name,
          price: item.price,
          quantity: item.quantity
        }));
        setCart(cartItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Cart might not exist yet, that's okay
    }
  };

  const saveCart = async (cartItems) => {
    try {
      await axios.post(`${API_URL}/api/cart`, {
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.menuItemId === item._id);
    
    let newCart;
    if (existingItem) {
      newCart = cart.map(cartItem =>
        cartItem.menuItemId === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, {
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1
      }];
    }
    
    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.menuItemId !== itemId);
    setCart(newCart);
    saveCart(newCart);
  };

  const updateQuantity = (itemId, quantity) => {
    let newCart;
    if (quantity <= 0) {
      newCart = cart.filter(item => item.menuItemId !== itemId);
    } else {
      newCart = cart.map(item =>
        item.menuItemId === itemId
          ? { ...item, quantity }
          : item
      );
    }
    setCart(newCart);
    saveCart(newCart);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getWelcomeMessage = (user) => {
    if (!user) return 'Hey!';
    
    // Generate consistent food name based on user ID (so it's always the same for each user)
    const foodNames = [
      'Biryani Lover',
      'Pizza Master',
      'Curry King',
      'Tikka Champion',
      'Dosa Expert',
      'Noodles Ninja',
      'Burger Boss',
      'Ice Cream Icon',
      'Wings Warrior',
      'Rice Ruler',
      'Soup Star',
      'Tandoori Titan'
    ];
    
    // Use user ID to get consistent name
    const index = parseInt(user.id.slice(-2), 16) % foodNames.length;
    const foodName = foodNames[index];
    
    return foodName;
  };

  return (
    <div className="menu-page">
      <header className="menu-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="restaurant-title">ChefGPT</h1>
            <h2 className="restaurant-subtitle">AI-Powered Restaurant</h2>
          </div>
          <div className="header-actions">
            <span className="user-name">Hey {getWelcomeMessage(user)}!</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="menu-container">
        <div className="menu-content">
          <div className="menu-intro fade-in">
            <h2>Our Menu</h2>
            <p>AI-powered culinary excellence</p>
          </div>

          <div className="menu-grid">
            {menuItems.map((item, index) => (
              <MenuCard
                key={item._id}
                item={item}
                onAddToCart={addToCart}
                delay={index * 0.1}
              />
            ))}
          </div>

          {menuItems.length === 0 && (
            <div className="empty-menu">
              <p>No menu items available at the moment.</p>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-toggle">
            <button
              onClick={() => setShowCart(!showCart)}
              className="cart-button"
            >
              🛒 Cart ({cart.length}) - ₹{getTotalAmount().toFixed(2)}
            </button>
          </div>
        )}

        {showCart && (
          <Cart
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClose={() => setShowCart(false)}
            totalAmount={getTotalAmount()}
          />
        )}
      </div>
    </div>
  );
};

export default Menu;

