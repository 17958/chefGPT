import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import FriendNotification from './FriendNotification';
import axios from 'axios';

const NotificationManager = () => {
  const { user, token } = useAuth();
  const [notification, setNotification] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Check for pending friend requests on mount
  useEffect(() => {
    if (user && token) {
      const checkPendingRequests = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/friends`);
          const receivedRequests = response.data?.pendingRequests?.received || [];
          
          // Show notification for the first pending request
          if (receivedRequests.length > 0) {
            const firstRequest = receivedRequests[0];
            setNotification(prev => {
              // Only set if there's no existing notification
              if (!prev) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, API_URL]);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(API_URL, {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ NotificationManager: Connected to server');
        const userId = user.id?.toString() || user._id?.toString();
        newSocket.emit('join', userId);
      });

      // Listen for friend request notifications
      newSocket.on('friendRequest', (data) => {
        console.log('📬 Friend request received:', data);
        
        // Only show notification if it's for the current user
        // Handle both string and ObjectId comparisons
        const currentUserId = user.id?.toString() || user._id?.toString();
        const targetUserId = data.to?.toString();
        
        if (targetUserId === currentUserId && data.type === 'newRequest') {
          console.log('✅ Showing friend request notification');
          setNotification(data);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token, API_URL]);

  const handleClose = () => {
    setNotification(null);
  };

  const handleAccept = async () => {
    if (!notification || !notification.request) return;

    try {
      const requestId = notification.request.id;
      await axios.post(`${API_URL}/api/friends/accept/${requestId}`);
      console.log('✅ Friend request accepted');
      
      // Refresh the page or update friends list if needed
      // You might want to emit an event or use a context to update friends list
      window.location.reload(); // Simple solution - refresh to update friends list
    } catch (error) {
      console.error('❌ Error accepting friend request:', error);
      alert(error.response?.data?.message || 'Failed to accept friend request');
    }
  };

  const handleReject = async () => {
    if (!notification || !notification.request) return;

    try {
      const requestId = notification.request.id;
      await axios.post(`${API_URL}/api/friends/reject/${requestId}`);
      console.log('✅ Friend request rejected');
    } catch (error) {
      console.error('❌ Error rejecting friend request:', error);
      alert(error.response?.data?.message || 'Failed to reject friend request');
    }
  };

  return (
    <>
      {notification && (
        <FriendNotification
          notification={notification}
          onClose={handleClose}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </>
  );
};

export default NotificationManager;

