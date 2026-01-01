import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import FriendNotification from './FriendNotification';
import axios from 'axios';

const NotificationManager = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Check for pending requests on mount
  useEffect(() => {
    if (!user || !token) return;

    const checkPendingRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/friends`);
        const receivedRequests = response.data?.pendingRequests?.received || [];
        
        if (receivedRequests.length > 0) {
          setNotification(prev => {
            if (!prev) {
              const firstRequest = receivedRequests[0];
              return {
                type: 'newRequest',
                to: user.id?.toString() || user._id?.toString(),
                request: {
                  id: firstRequest.id,
                  from: firstRequest.user
                }
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error checking pending requests:', error);
      }
    };

    checkPendingRequests();
  }, [user, token, API_URL]);

  // Setup socket connection
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(API_URL, { auth: { token } });

    socket.on('connect', () => {
      const userId = user.id?.toString() || user._id?.toString();
      socket.emit('join', userId);
    });

    socket.on('friendRequest', (data) => {
      const currentUserId = user.id?.toString() || user._id?.toString();
      const targetUserId = data.to?.toString();
      
      if (targetUserId === currentUserId) {
        setNotification(data);
      }
    });

    return () => socket.disconnect();
  }, [user, token, API_URL]);

  const handleClose = () => setNotification(null);

  const handleAccept = async () => {
    if (!notification?.request?.id) return;

    try {
      await axios.post(`${API_URL}/api/friends/accept/${notification.request.id}`);
      setNotification(null);
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept friend request');
    }
  };

  const handleReject = async () => {
    if (!notification?.request?.id) return;

    try {
      await axios.post(`${API_URL}/api/friends/reject/${notification.request.id}`);
      setNotification(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject friend request');
    }
  };

  const handleClick = () => {
    if (notification?.type === 'accepted' && notification?.request?.from?.id) {
      navigate('/chat');
      setNotification(null);
    } else {
      setNotification(null);
    }
  };

  return (
    notification && (
      <FriendNotification
        notification={notification}
        onClose={handleClose}
        onAccept={handleAccept}
        onReject={handleReject}
        onClick={handleClick}
      />
    )
  );
};

export default NotificationManager;
