import React, { useState, useEffect, useCallback } from 'react';
import './FriendNotification.css';

const FriendNotification = ({ notification, onClose, onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation
  }, [onClose]);

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [handleClose]);

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept();
    }
    handleClose();
  };

  const handleReject = async () => {
    if (onReject) {
      await onReject();
    }
    handleClose();
  };

  if (!notification || !isVisible) return null;

  const { request } = notification;
  const senderName = request?.from?.name || 'Someone';
  const senderEmail = request?.from?.email || '';

  return (
    <div className={`friend-notification ${isVisible ? 'show' : ''}`}>
      <div className="friend-notification-content">
        <div className="friend-notification-header">
          <div className="friend-notification-icon">👋</div>
          <h3>New Friend Request</h3>
          <button className="friend-notification-close" onClick={handleClose}>×</button>
        </div>
        <div className="friend-notification-body">
          <p>
            <strong>{senderName}</strong>
            {senderEmail && <span className="friend-notification-email"> ({senderEmail})</span>}
            {' '}wants to be your friend!
          </p>
        </div>
        <div className="friend-notification-actions">
          <button 
            className="friend-notification-accept" 
            onClick={handleAccept}
          >
            Accept
          </button>
          <button 
            className="friend-notification-reject" 
            onClick={handleReject}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendNotification;

