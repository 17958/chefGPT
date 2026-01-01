import React, { useState, useEffect, useCallback } from 'react';
import './FriendNotification.css';

const FriendNotification = ({ notification, onClose, onAccept, onReject, onClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleAccept = useCallback(async () => {
    if (onAccept) {
      await onAccept();
    }
    handleClose();
  }, [onAccept, handleClose]);

  const handleReject = useCallback(async () => {
    if (onReject) {
      await onReject();
    }
    handleClose();
  }, [onReject, handleClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 10000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  if (!notification || !isVisible) return null;

  const { type, request } = notification;
  const isActionable = type === 'newRequest';
  const isClickable = type === 'accepted' || type === 'rejected';

  const getNotificationContent = () => {
    switch (type) {
      case 'newRequest':
        return {
          icon: '👋',
          title: 'New Friend Request',
          message: `${request?.from?.name || 'Someone'} wants to be your friend!`,
          email: request?.from?.email
        };
      case 'sent':
        return {
          icon: '📤',
          title: 'Request Sent',
          message: `Friend request sent to ${request?.to?.name || 'your friend'}!`,
          email: request?.to?.email
        };
      case 'accepted':
        return {
          icon: '✅',
          title: 'Request Accepted',
          message: `${request?.from?.name || 'Your friend'} accepted your request! You can now chat.`,
          email: request?.from?.email
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Request Rejected',
          message: `${request?.from?.name || 'Your friend'} rejected your friend request.`,
          email: request?.from?.email
        };
      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <div className={`friend-notification ${isVisible ? 'show' : ''} ${isClickable ? 'clickable' : ''}`}>
      <div className="friend-notification-content" onClick={isClickable ? onClick : undefined}>
        <div className="friend-notification-header">
          <div className="friend-notification-icon">{content.icon}</div>
          <h3>{content.title}</h3>
          <button className="friend-notification-close" onClick={handleClose}>×</button>
        </div>
        <div className="friend-notification-body">
          <p>
            <strong>{content.message}</strong>
            {content.email && <span className="friend-notification-email"> ({content.email})</span>}
          </p>
        </div>
        {isActionable && (
          <div className="friend-notification-actions">
            <button className="friend-notification-accept" onClick={handleAccept}>
              Accept
            </button>
            <button className="friend-notification-reject" onClick={handleReject}>
              Reject
            </button>
          </div>
        )}
        {isClickable && (
          <div className="friend-notification-click-hint">
            Click to {type === 'accepted' ? 'go to chat' : 'close'}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendNotification;
