import React, { useState } from 'react';
import './MenuCard.css';

const MenuCard = ({ item, onAddToCart, delay = 0 }) => {
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(item);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="menu-card fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="menu-card-image">
        {item.image && !imageError ? (
          <img 
            src={item.image} 
            alt={item.name}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="menu-card-placeholder">
            <span>🍽️</span>
          </div>
        )}
      </div>
      
      <div className="menu-card-content">
        <h3 className="menu-card-name">{item.name}</h3>
        {item.description && (
          <p className="menu-card-description">{item.description}</p>
        )}
        <div className="menu-card-footer">
          <span className="menu-card-price">₹{item.price}</span>
          <button
            onClick={handleAddToCart}
            className="menu-card-button"
            disabled={!item.available}
          >
            {item.available ? '+ Add' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;

