import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Chat.css';
// test comment
const Chat = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/friends`);
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [API_URL]);

  const fetchMessages = useCallback(async (friendId) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${friendId}`);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [API_URL, scrollToBottom]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io(API_URL, {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        newSocket.emit('join', user.id);
      });

      newSocket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      newSocket.on('messageSent', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token, API_URL, scrollToBottom]);

  // Fetch friends list
  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, fetchFriends]);

  // Fetch messages when friend is selected
  useEffect(() => {
    if (selectedFriend && user) {
      fetchMessages(selectedFriend._id || selectedFriend.id);
    }
  }, [selectedFriend, user, fetchMessages]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim() || isAddingFriend) return;

    setIsAddingFriend(true);
    try {
      console.log('Adding friend:', friendEmail.trim());
      const response = await axios.post(`${API_URL}/api/friends`, { 
        email: friendEmail.trim() 
      });
      console.log('Add friend response:', response.data);
      
      // Show success message
      alert(response.data.message || 'Friend added successfully!');
      setFriendEmail('');
      setShowAddFriend(false);
      fetchFriends();
    } catch (error) {
      console.error('Add friend error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to add friend. Please check the email and try again.';
      alert(errorMessage);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !socket) return;

    const messageData = {
      senderId: user.id,
      receiverId: selectedFriend._id || selectedFriend.id,
      content: newMessage.trim()
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>💬 Chat with Friends</h2>
          <button 
            className="add-friend-btn"
            onClick={() => setShowAddFriend(!showAddFriend)}
          >
            + Add Friend
          </button>
        </div>

        {showAddFriend && (
          <form onSubmit={handleAddFriend} className="add-friend-form">
            <input
              type="email"
              placeholder="Enter friend's email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              disabled={isAddingFriend}
              required
            />
            <div className="add-friend-buttons">
              <button 
                type="submit" 
                disabled={isAddingFriend}
                className={isAddingFriend ? 'loading' : ''}
              >
                {isAddingFriend ? 'Adding...' : 'Add'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddFriend(false);
                  setFriendEmail('');
                }}
                disabled={isAddingFriend}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="no-friends">
              <p>No friends yet. Add a friend by email to start chatting!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend._id || friend.id}
                className={`friend-item ${selectedFriend?._id === friend._id || selectedFriend?.id === friend.id ? 'active' : ''}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="friend-avatar">
                  {friend.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{friend.name}</div>
                  <div className="friend-email">{friend.email}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-footer-sidebar">
          <button 
            className="back-to-menu-btn"
            onClick={() => navigate('/menu')}
          >
            ← Back to Menu
          </button>
        </div>
      </div>

      <div className="chat-main">
        {selectedFriend ? (
          <>
            <div className="chat-header-main">
              <div className="selected-friend-info">
                <div className="friend-avatar">
                  {selectedFriend.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div>
                  <div className="friend-name">{selectedFriend.name}</div>
                  <div className="friend-email">{selectedFriend.email}</div>
                </div>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => {
                const isOwn = (message.sender?._id || message.sender) === user.id;
                const isAI = message.isAIResponse;
                
                return (
                  <div
                    key={index}
                    className={`message ${isOwn ? 'own' : 'other'} ${isAI ? 'ai' : ''}`}
                  >
                    {!isOwn && (
                      <div className="message-avatar">
                        {isAI ? '🤖' : (selectedFriend.name?.charAt(0).toUpperCase() || 'F')}
                      </div>
                    )}
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                placeholder="Type a message... (Use @bro for AI help)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Select a friend to start chatting</h3>
            <p>Or add a new friend to begin a conversation</p>
            <p className="ai-hint">💡 Tip: Use @bro in your messages to get AI assistance!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

