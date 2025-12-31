import React, { useState } from 'react';
import axios from 'axios';
import './Cart.css';

const Cart = ({ cart, onUpdateQuantity, onRemoveItem, onClose, totalAmount }) => {
  const [orderType, setOrderType] = useState('take-away');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const MERCHANT_NAME = process.env.REACT_APP_MERCHANT_NAME || 'ChefGPT';

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setMessage('Your cart is empty');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Create order first
      const orderData = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        })),
        orderType
      };

      const orderResponse = await axios.post(`${API_URL}/api/orders`, orderData);
      const order = orderResponse.data;

      // Create Razorpay payment order
      const paymentResponse = await axios.post(
        `${API_URL}/api/payments/create-order`,
        {
          amount: totalAmount,
          orderId: order._id
        }
      );

      const paymentData = paymentResponse.data;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: MERCHANT_NAME,
          description: `Order #${order._id.slice(-6).toUpperCase()}`,
          order_id: paymentData.id,
          handler: async function (response) {
            // Payment successful
            try {
              // Verify payment
              await axios.post(`${API_URL}/api/payments/verify-manual`, {
                paymentId: response.razorpay_payment_id,
                orderId: order._id
              });

              setOrderDetails(order);
              setOrderPlaced(true);
              
              // Clear cart
              try {
                await axios.delete(`${API_URL}/api/cart`);
              } catch (error) {
                console.error('Error clearing cart:', error);
              }
              
              cart.forEach(item => onRemoveItem(item.menuItemId));
              
              setTimeout(() => {
                setOrderPlaced(false);
                onClose();
              }, 3000);
            } catch (error) {
              console.error('Payment verification error:', error);
              setMessage('Payment successful but verification failed. Please contact support.');
            }
          },
          prefill: {
            contact: '',
            email: ''
          },
          theme: {
            color: '#1a73e8'
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
              setMessage('Payment cancelled');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoading(false);
      };
      script.onerror = () => {
        setLoading(false);
        setMessage('Failed to load payment gateway');
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error('Order creation error:', error);
      setMessage(error.response?.data?.message || 'Failed to create order. Please try again.');
      setLoading(false);
    }
  };


  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>{orderPlaced ? 'Order Confirmed' : 'Your Cart'}</h2>
          <button 
            className="cart-close" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ×
          </button>
        </div>

        {orderPlaced ? (
          <>
            <div className="order-confirmation">
              <div className="order-confirmation-icon">✓</div>
              <h2 className="order-confirmation-title">Order Placed!</h2>
              {orderDetails && (
                <div className="order-confirmation-details">
                  <p className="order-id">Order ID: #{orderDetails._id.slice(-6).toUpperCase()}</p>
                  <p className="order-amount">Amount: ₹{orderDetails.totalAmount.toFixed(2)}</p>
                  <p className="order-message">Payment verified! Your order is confirmed.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="cart-scrollable">
              <div className="cart-items">
                {cart.length === 0 ? (
                  <p className="cart-empty">Your cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.menuItemId} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p className="cart-item-price">₹{item.price} each</p>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          −
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.menuItemId)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="cart-item-total">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="cart-order-type">
                  <h3>Order Type</h3>
                  <div className="order-type-buttons">
                    <button
                      className={`order-type-btn ${orderType === 'take-away' ? 'active' : ''}`}
                      onClick={() => setOrderType('take-away')}
                    >
                      📦 Take Away
                    </button>
                    <button
                      className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                      onClick={() => setOrderType('dine-in')}
                    >
                      🍽️ Dine In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                {message && (
                  <div className={`cart-message ${message.includes('success') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}
                <div className="cart-total">
                  <span>Total: ₹{totalAmount.toFixed(2)}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="place-order-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;

