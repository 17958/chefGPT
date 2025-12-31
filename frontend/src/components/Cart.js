import React, { useState } from 'react';
import axios from 'axios';
import UPIQRCode from './UPIQRCode';
import './Cart.css';

const Cart = ({ cart, onUpdateQuantity, onRemoveItem, onClose, totalAmount }) => {
  const [orderType, setOrderType] = useState('take-away');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);

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

      // Get QR code payment info
      const qrResponse = await axios.post(
        `${API_URL}/api/payments/qr-info`,
        {
          amount: totalAmount,
          orderId: order._id
        }
      );

      const qrData = qrResponse.data;
      setQrInfo(qrData);
      setOrderDetails(order);
      setShowQRCode(true);
      setLoading(false);
    } catch (error) {
      console.error('Order creation error:', error);
      setMessage(error.response?.data?.message || 'Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!orderDetails) return;

    setLoading(true);
    try {
      // Verify payment (manual confirmation)
      await axios.post(`${API_URL}/api/payments/verify-manual`, {
        orderId: orderDetails._id,
        transactionId: `UPI_${Date.now()}`
      });

      setOrderPlaced(true);
      setShowQRCode(false);
      
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
      setMessage('Failed to confirm payment. Please contact support.');
    } finally {
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
                  <p className="order-message">Payment confirmed! Your order is being prepared.</p>
                </div>
              )}
            </div>
          </>
        ) : showQRCode && qrInfo ? (
          <>
            <div className="cart-scrollable" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3>Order #{orderDetails?._id.slice(-6).toUpperCase()}</h3>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a73e8' }}>
                  Amount: ₹{totalAmount.toFixed(2)}
                </p>
              </div>
              <UPIQRCode
                upiId={qrInfo.upiId}
                amount={parseFloat(qrInfo.amount)}
                merchantName={qrInfo.merchantName}
              />
              <div style={{ marginTop: '20px' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  Scan the QR code with any UPI app to pay
                </p>
                <button
                  onClick={handlePaymentConfirmed}
                  className="place-order-btn"
                  disabled={loading}
                  style={{ marginTop: '10px' }}
                >
                  {loading ? 'Confirming...' : 'I have paid'}
                </button>
                <button
                  onClick={() => {
                    setShowQRCode(false);
                    setQrInfo(null);
                    setOrderDetails(null);
                  }}
                  style={{
                    marginTop: '10px',
                    background: 'transparent',
                    border: '1px solid #ddd',
                    color: '#666',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Order
                </button>
              </div>
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

