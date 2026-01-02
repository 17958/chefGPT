import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { Send, UserPlus, LogOut, MessageCircle } from 'lucide-react';
import './Chat.css';

const messageCache = new Set();

const Chat = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [showBroSuggestions, setShowBroSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const broSuggestions = [
    { text: 'bro', label: '🤖 @bro', description: 'AI Assistant - Ask anything' },
    { text: 'bro what can you help me with?', label: 'What can you help with?', description: 'Discover @bro capabilities' },
    { text: 'bro give me cooking tips', label: 'Cooking tips', description: 'Get culinary advice' },
    { text: 'bro tell me a joke', label: 'Tell me a joke', description: 'Have some fun' },
    { text: 'bro help me with recipes', label: 'Recipe help', description: 'Get recipe suggestions' },
    { text: 'bro explain something', label: 'Explain something', description: 'Learn something new' }
  ];

  const STORAGE_KEY = 'chat_selected_friend';
  
  useEffect(() => {
    return () => {
      messageCache.clear();
    };
  }, []);

  const formatAIMessage = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('🤖 @bro:')) {
      cleanedText = cleanedText.substring(8).trim();
    } else if (cleanedText.startsWith('@bro:')) {
      cleanedText = cleanedText.substring(5).trim();
    }
    
    const elements = [];
    let currentIndex = 0;
    
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;
    let lastIndex = 0;
    
    while ((codeMatch = codeBlockPattern.exec(cleanedText)) !== null) {
      if (codeMatch.index > lastIndex) {
        const beforeText = cleanedText.substring(lastIndex, codeMatch.index);
        elements.push(...formatTextWithBro(beforeText, currentIndex));
        currentIndex += beforeText.length;
      }
      
      const language = codeMatch[1] || 'text';
      const code = codeMatch[2].trim();
      elements.push(
        <pre key={`code-${currentIndex}`} className="ai-code-block">
          <div className="code-block-header">
            <span className="code-language">{language}</span>
            <button 
              className="copy-code-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(code).then(() => {
                  const btn = e.target;
                  const originalText = btn.textContent;
                  btn.textContent = '✓ Copied!';
                  btn.style.background = '#4caf50';
                  setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                  }, 2000);
                }).catch(() => {
                  alert('Failed to copy code');
                });
              }}
              title="Copy code"
            >
              📋 Copy
            </button>
          </div>
          <code>{code}</code>
        </pre>
      );
      
      lastIndex = codeBlockPattern.lastIndex;
      currentIndex = lastIndex;
    }
    
    if (lastIndex < cleanedText.length) {
      const remainingText = cleanedText.substring(lastIndex);
      elements.push(...formatTextWithBro(remainingText, currentIndex));
    }
    
    if (elements.length === 0) {
      return formatTextWithBro(cleanedText, 0);
    }
    
    return elements;
  };
  
  const formatTextWithBro = (text, startIndex) => {
    if (!text) return [];
    
    const elements = [];
    let elementIndex = startIndex;
    
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        elements.push(<br key={`br-${elementIndex}`} />);
        elementIndex++;
      }
      
      const inlineCodePattern = /`([^`]+)`/g;
      let codeMatch;
      let lastIndex = 0;
      const lineElements = [];
      
      while ((codeMatch = inlineCodePattern.exec(line)) !== null) {
        if (codeMatch.index > lastIndex) {
          const beforeText = line.substring(lastIndex, codeMatch.index);
          lineElements.push(...highlightBroInText(beforeText, elementIndex));
          elementIndex += beforeText.length;
        }
        
        lineElements.push(
          <code key={`inline-code-${elementIndex}`} className="ai-inline-code">
            {codeMatch[1]}
          </code>
        );
        elementIndex += codeMatch[0].length;
        lastIndex = codeMatch.index + codeMatch[0].length;
      }
      
      if (lastIndex < line.length) {
        const remainingText = line.substring(lastIndex);
        lineElements.push(...highlightBroInText(remainingText, elementIndex));
        elementIndex += remainingText.length;
      }
      
      if (lineElements.length === 0) {
        lineElements.push(...highlightBroInText(line, elementIndex));
        elementIndex += line.length;
      }
      
      elements.push(...lineElements);
    });
    
    return elements;
  };
  
  const highlightBroInText = (text, startIndex) => {
    if (!text) return [];
    
    const parts = text.split(/(@bro)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === '@bro') {
        return (
          <span key={`bro-${startIndex}-${index}`} className="bro-highlight">
            @bro
          </span>
        );
      }
      return <span key={`text-${startIndex}-${index}`}>{part}</span>;
    });
  };

  const highlightBro = (text) => {
    if (!text || typeof text !== 'string') return text;
    return highlightBroInText(text, 0);
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await axios.get(`${API_URL}/api/friends`);
      const friendsList = response.data.friends || [];
      setFriends(friendsList);
      
      const savedFriendId = localStorage.getItem(STORAGE_KEY);
      if (savedFriendId && friendsList.length > 0) {
        const savedFriend = friendsList.find(
          f => (f._id || f.id) === savedFriendId
        );
        if (savedFriend) {
          setSelectedFriend(savedFriend);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoadingFriends(false);
    }
  }, [API_URL, navigate]);

  const fetchMessages = useCallback(async (friendId) => {
    if (!friendId) return;
    try {
      setLoadingMessages(true);
      const response = await axios.get(`${API_URL}/api/messages/${friendId}`);
      setMessages(response.data.messages || []);
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [API_URL, scrollToBottom, navigate]);

  useEffect(() => {
    if (!user || !token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setSocketStatus('connecting');
    
    const newSocket = io(API_URL, {
      auth: { token: token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setSocketStatus('connected');
      newSocket.emit('join', user.id);
      
      if (selectedFriend) {
        const friendId = selectedFriend._id || selectedFriend.id;
        if (friendId) {
          fetchMessages(friendId);
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      setSocketStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }, 2000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketStatus('disconnected');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setSocketStatus('connected');
      newSocket.emit('join', user.id);
    });

    newSocket.on('reconnect_attempt', () => {
      setSocketStatus('connecting');
    });

    newSocket.on('newMessage', (message) => {
      const currentFriendId = selectedFriend?._id || selectedFriend?.id;
      const messageSenderId = message.sender?._id || message.sender;
      const messageReceiverId = message.receiver?._id || message.receiver;
      
      const messageKey = `${message._id || message.content}-${new Date(message.createdAt).getTime()}`;
      
      if (currentFriendId && 
          (messageSenderId === currentFriendId || messageReceiverId === currentFriendId ||
           messageSenderId === user.id || messageReceiverId === user.id)) {
        if (messageCache.has(messageKey)) {
          return;
        }
        messageCache.add(messageKey);
        
        if (messageCache.size > 1000) {
          const firstKey = messageCache.values().next().value;
          messageCache.delete(firstKey);
        }
        
        setMessages(prev => {
          const exists = prev.some(m => 
            m._id === message._id || 
            (m.content === message.content && 
             m.createdAt === message.createdAt)
          );
          if (exists) return prev;
          return [...prev, message];
        });
        setTimeout(() => scrollToBottom(), 50);
      }
    });

    newSocket.on('messageSent', (message) => {
      const messageKey = `${message._id || message.content}-${new Date(message.createdAt).getTime()}`;
      
      if (messageCache.has(messageKey)) {
        return;
      }
      messageCache.add(messageKey);
      
      setMessages(prev => {
        const exists = prev.some(m => 
          m._id === message._id || 
          (m.content === message.content && 
           m.createdAt === message.createdAt)
        );
        if (exists) return prev;
        return [...prev, message];
      });
      setTimeout(() => scrollToBottom(), 50);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketStatus('disconnected');
    };
  }, [user, token, API_URL, selectedFriend, fetchMessages, scrollToBottom]);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, fetchFriends]);

  useEffect(() => {
    const handleFocus = () => {
      if (user && socketStatus === 'connected') {
        fetchFriends();
        if (selectedFriend) {
          const friendId = selectedFriend._id || selectedFriend.id;
          if (friendId) {
            fetchMessages(friendId);
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, socketStatus, selectedFriend, fetchFriends, fetchMessages]);

  useEffect(() => {
    if (selectedFriend && user) {
      const friendId = selectedFriend._id || selectedFriend.id;
      if (friendId) {
        localStorage.setItem(STORAGE_KEY, friendId);
        fetchMessages(friendId);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedFriend, user, fetchMessages]);

  // Smooth scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim() || isAddingFriend) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(friendEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    setIsAddingFriend(true);
    try {
      const response = await axios.post(`${API_URL}/api/friends`, { 
        email: friendEmail.trim() 
      });
      
      alert(response.data.message || 'Friend added successfully!');
      setFriendEmail('');
      setShowAddFriend(false);
      await fetchFriends();
      
      if (response.data.friend) {
        setSelectedFriend(response.data.friend);
      }
    } catch (error) {
      console.error('Add friend error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to add friend. Please check the email and try again.';
      alert(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    
    if (!socket || socketStatus !== 'connected') {
      alert('Not connected to chat server. Please wait for connection...');
      return;
    }

    const messageData = {
      senderId: user.id,
      receiverId: selectedFriend._id || selectedFriend.id,
      content: newMessage.trim()
    };

    setShowBroSuggestions(false);
    setSelectedSuggestionIndex(-1);

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user.id },
      receiver: { _id: selectedFriend._id || selectedFriend.id },
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setTimeout(() => scrollToBottom(), 50);

    socket.emit('sendMessage', messageData);
    
    setTimeout(() => {
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="chat-container">
      <motion.div 
        className="chat-sidebar"
        initial={{ x: -350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
      >
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={24} />
              Chat
            </h2>
            <div className={`socket-status ${socketStatus}`} title={`Socket: ${socketStatus}`}></div>
          </div>
          <motion.button 
            className="add-friend-btn"
            onClick={() => setShowAddFriend(!showAddFriend)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <UserPlus size={16} style={{ marginRight: '8px', display: 'inline-block' }} />
            Add Friend
          </motion.button>
        </div>

        <AnimatePresence>
          {showAddFriend && (
            <motion.form
              onSubmit={handleAddFriend}
              className="add-friend-form"
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <input
                type="email"
                placeholder="Enter friend's email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                disabled={isAddingFriend}
                required
              />
              <div className="add-friend-buttons">
                <motion.button 
                  type="submit" 
                  disabled={isAddingFriend}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isAddingFriend ? 'Adding...' : 'Add'}
                </motion.button>
                <motion.button 
                  type="button" 
                  onClick={() => {
                    setShowAddFriend(false);
                    setFriendEmail('');
                  }}
                  disabled={isAddingFriend}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="friends-list">
              {loadingFriends ? (
            <div className="chat-loading">
              <div className="chat-loading-spinner"></div>
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div className="no-friends">
              <p>No friends yet. Add a friend by email to start chatting!</p>
            </div>
          ) : (
            friends.map((friend, index) => (
              <motion.div
                key={friend._id || friend.id}
                className={`friend-item ${selectedFriend?._id === friend._id || selectedFriend?.id === friend.id ? 'active' : ''}`}
                onClick={() => setSelectedFriend(friend)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="friend-avatar">
                  {friend.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{friend.name}</div>
                  <div className="friend-email">{friend.email}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="chat-footer-sidebar">
          <motion.button 
            className="logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <LogOut size={16} style={{ marginRight: '8px', display: 'inline-block' }} />
            Logout
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        className="chat-main"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.1
        }}
      >
        {selectedFriend ? (
          <>
            <div className="chat-header-main">
              <div className="selected-friend-info">
                <div className="friend-avatar">
                  {selectedFriend.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="friend-info">
                  <div className="friend-name">{selectedFriend.name}</div>
                  <div className="friend-email">{selectedFriend.email}</div>
                </div>
              </div>
            </div>

            <div className="messages-container">
              {loadingMessages ? (
                <div className="chat-loading">
                  <div className="chat-loading-spinner"></div>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="no-chat-selected" style={{ padding: '40px 20px' }}>
                  <div className="no-chat-icon">💬</div>
                  <h3>No messages yet</h3>
                  <p>Start the conversation!</p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwn = (message.sender?._id || message.sender) === user.id;
                      const isAI = message.isAIResponse;
                      const messageContent = message.content || '';
                      
                      return (
                        <motion.div
                          key={message._id || `msg-${index}`}
                          className={`message ${isOwn ? 'own' : 'other'} ${isAI ? 'ai' : ''}`}
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            mass: 0.8
                          }}
                          layout
                        >
                          {!isOwn && (
                            <div className="message-avatar">
                              {isAI ? '🤖' : (selectedFriend.name?.charAt(0).toUpperCase() || 'F')}
                            </div>
                          )}
                          <div className="message-content">
                            <div className={`message-text ${isAI ? 'ai-message-text' : ''}`}>
                              {isAI ? formatAIMessage(messageContent) : highlightBro(messageContent)}
                            </div>
                            <div className="message-time">
                              {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Just now'}
                              {isOwn && (
                                <span className="message-status">
                                  {message.read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <div className="message-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={socketStatus === 'connected' ? "Type a message... (Type @ for AI help)" : "Connecting..."}
                  value={newMessage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewMessage(value);
                    
                    const lastAt = value.lastIndexOf('@');
                    if (lastAt !== -1) {
                      const afterAt = value.substring(lastAt + 1).trim();
                      if (afterAt === '' || afterAt.startsWith(' ') || /^[a-zA-Z]*$/.test(afterAt)) {
                        setShowBroSuggestions(true);
                        setSelectedSuggestionIndex(-1);
                      } else {
                        setShowBroSuggestions(false);
                      }
                    } else {
                      setShowBroSuggestions(false);
                    }
                  }}
                  className="message-input"
                  disabled={socketStatus !== 'connected' || loadingMessages}
                  onKeyDown={(e) => {
                    if (showBroSuggestions && broSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedSuggestionIndex(prev => 
                          prev < broSuggestions.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                        e.preventDefault();
                        const suggestion = broSuggestions[selectedSuggestionIndex];
                        const lastAt = newMessage.lastIndexOf('@');
                        if (lastAt !== -1) {
                          const beforeAt = newMessage.substring(0, lastAt + 1);
                          const afterAt = newMessage.substring(lastAt + 1);
                          const wordEndMatch = afterAt.match(/^([a-zA-Z]*)(\s|$)/);
                          const restOfText = wordEndMatch ? afterAt.substring(wordEndMatch[1].length) : '';
                          setNewMessage(beforeAt + suggestion.text + restOfText);
                        } else {
                          setNewMessage('@' + suggestion.text);
                        }
                        setShowBroSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                        inputRef.current?.focus();
                      } else if (e.key === 'Escape') {
                        setShowBroSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      } else if (e.key === 'Enter' && !e.shiftKey && !showBroSuggestions) {
                        e.preventDefault();
                        if (newMessage.trim() && socketStatus === 'connected') {
                          handleSendMessage(e);
                        }
                      }
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim() && socketStatus === 'connected') {
                        handleSendMessage(e);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      const activeElement = document.activeElement;
                      if (!suggestionsRef.current?.contains(activeElement) && activeElement !== inputRef.current) {
                        setShowBroSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }
                    }, 200);
                  }}
                  onClick={() => {
                    if (newMessage.includes('@')) {
                      const lastAt = newMessage.lastIndexOf('@');
                      if (lastAt !== -1) {
                        const afterAt = newMessage.substring(lastAt + 1).trim();
                        if (afterAt === '' || afterAt.startsWith(' ') || /^[a-zA-Z]*$/.test(afterAt)) {
                          setShowBroSuggestions(true);
                        }
                      }
                    }
                  }}
                  autoFocus
                />
                <AnimatePresence>
                  {showBroSuggestions && (
                    <motion.div 
                      ref={suggestionsRef}
                      className="bro-suggestions"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ 
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="bro-suggestions-header">
                        <span className="bro-badge">🤖 @bro</span>
                        <span className="bro-suggestions-title">AI Assistant Suggestions</span>
                      </div>
                      {broSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        className={`bro-suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                        onClick={() => {
                          const lastAt = newMessage.lastIndexOf('@');
                          if (lastAt !== -1) {
                            const beforeAt = newMessage.substring(0, lastAt + 1);
                            const afterAt = newMessage.substring(lastAt + 1);
                            const wordEndMatch = afterAt.match(/^([a-zA-Z]*)(\s|$)/);
                            const restOfText = wordEndMatch ? afterAt.substring(wordEndMatch[1].length) : '';
                            setNewMessage(beforeAt + suggestion.text + restOfText);
                          } else {
                            setNewMessage('@' + suggestion.text);
                          }
                          setShowBroSuggestions(false);
                          setSelectedSuggestionIndex(-1);
                          inputRef.current?.focus();
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                          <div className="suggestion-label">{suggestion.label}</div>
                          <div className="suggestion-description">{suggestion.description}</div>
                        </motion.div>
                      ))}
                      <div className="bro-suggestions-footer">
                        <span>💡 Type your question after @bro</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.button 
                type="submit" 
                className="send-button"
                disabled={!newMessage.trim() || socketStatus !== 'connected' || loadingMessages}
                title={socketStatus !== 'connected' ? 'Waiting for connection...' : 'Send message (Enter)'}
                whileHover={{ 
                  scale: socketStatus === 'connected' && newMessage.trim() ? 1.08 : 1,
                  rotate: socketStatus === 'connected' && newMessage.trim() ? 5 : 0
                }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Send size={18} />
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div 
            className="no-chat-selected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="no-chat-icon"
              animate={{ 
                y: [0, -8, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              💬
            </motion.div>
            <h3>Select a friend to start chatting</h3>
            <p>Or add a new friend to begin a conversation</p>
            <p className="ai-hint">💡 Tip: Type @ in your messages to get AI assistance suggestions!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Chat;
