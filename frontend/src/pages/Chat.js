import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Chat.css';

// Prevent duplicate message handling
const messageCache = new Set();

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
  const [socketStatus, setSocketStatus] = useState('disconnected'); // 'connected', 'disconnected', 'connecting'
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

  // @bro suggestion prompts
  const broSuggestions = [
    { text: '@bro', label: 'Ask @bro anything', description: 'Get AI assistance' },
    { text: '@bro what can you help me with?', label: 'What can you help with?', description: 'Discover @bro capabilities' },
    { text: '@bro give me cooking tips', label: 'Cooking tips', description: 'Get culinary advice' },
    { text: '@bro tell me a joke', label: 'Tell me a joke', description: 'Have some fun' },
    { text: '@bro help me with recipes', label: 'Recipe help', description: 'Get recipe suggestions' },
    { text: '@bro explain something', label: 'Explain something', description: 'Learn something new' }
  ];

  // Persist selected friend to localStorage
  const STORAGE_KEY = 'chat_selected_friend';
  
  // Cleanup message cache on unmount
  useEffect(() => {
    return () => {
      messageCache.clear();
    };
  }, []);

  // Function to format AI response with markdown support
  const formatAIMessage = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Remove redundant "🤖 @bro:" prefix if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('🤖 @bro:')) {
      cleanedText = cleanedText.substring(8).trim();
    } else if (cleanedText.startsWith('@bro:')) {
      cleanedText = cleanedText.substring(5).trim();
    }
    
    const elements = [];
    let currentIndex = 0;
    
    // Pattern to match code blocks: ```language\ncode\n```
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;
    let lastIndex = 0;
    
    while ((codeMatch = codeBlockPattern.exec(cleanedText)) !== null) {
      // Add text before code block
      if (codeMatch.index > lastIndex) {
        const beforeText = cleanedText.substring(lastIndex, codeMatch.index);
        elements.push(...formatTextWithBro(beforeText, currentIndex));
        currentIndex += beforeText.length;
      }
      
      // Add code block
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
    
    // Add remaining text after last code block
    if (lastIndex < cleanedText.length) {
      const remainingText = cleanedText.substring(lastIndex);
      elements.push(...formatTextWithBro(remainingText, currentIndex));
    }
    
    // If no code blocks found, just format the text
    if (elements.length === 0) {
      return formatTextWithBro(cleanedText, 0);
    }
    
    return elements;
  };
  
  // Helper function to format text with @bro highlighting and line breaks
  const formatTextWithBro = (text, startIndex) => {
    if (!text) return [];
    
    const elements = [];
    let elementIndex = startIndex;
    
    // Split by line breaks first
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        elements.push(<br key={`br-${elementIndex}`} />);
        elementIndex++;
      }
      
      // Check for inline code: `code`
      const inlineCodePattern = /`([^`]+)`/g;
      let codeMatch;
      let lastIndex = 0;
      const lineElements = [];
      
      while ((codeMatch = inlineCodePattern.exec(line)) !== null) {
        // Add text before inline code
        if (codeMatch.index > lastIndex) {
          const beforeText = line.substring(lastIndex, codeMatch.index);
          lineElements.push(...highlightBroInText(beforeText, elementIndex));
          elementIndex += beforeText.length;
        }
        
        // Add inline code
        lineElements.push(
          <code key={`inline-code-${elementIndex}`} className="ai-inline-code">
            {codeMatch[1]}
          </code>
        );
        elementIndex += codeMatch[0].length;
        lastIndex = codeMatch.index + codeMatch[0].length;
      }
      
      // Add remaining text after inline code
      if (lastIndex < line.length) {
        const remainingText = line.substring(lastIndex);
        lineElements.push(...highlightBroInText(remainingText, elementIndex));
        elementIndex += remainingText.length;
      }
      
      // If no inline code, just highlight @bro
      if (lineElements.length === 0) {
        lineElements.push(...highlightBroInText(line, elementIndex));
        elementIndex += line.length;
      }
      
      elements.push(...lineElements);
    });
    
    return elements;
  };
  
  // Helper function to highlight @bro in text
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
  
  // Function to highlight @bro in regular messages (non-AI)
  const highlightBro = (text) => {
    if (!text || typeof text !== 'string') return text;
    return highlightBroInText(text, 0);
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await axios.get(`${API_URL}/api/friends`);
      const friendsList = response.data.friends || [];
      setFriends(friendsList);
      
      // Restore selected friend from localStorage
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
      // Small delay to ensure DOM is updated
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

  // Initialize Socket.io connection with reconnection handling
  useEffect(() => {
    if (!user || !token) return;

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear any pending reconnection
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
      
      // If we have a selected friend, refetch messages to ensure sync
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
      
      // Auto-reconnect if not a manual disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
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
      // Only add message if it's for the current conversation
      const currentFriendId = selectedFriend?._id || selectedFriend?.id;
      const messageSenderId = message.sender?._id || message.sender;
      const messageReceiverId = message.receiver?._id || message.receiver;
      
      // Create unique key for message
      const messageKey = `${message._id || message.content}-${new Date(message.createdAt).getTime()}`;
      
      if (currentFriendId && 
          (messageSenderId === currentFriendId || messageReceiverId === currentFriendId ||
           messageSenderId === user.id || messageReceiverId === user.id)) {
        // Check cache to avoid duplicates
        if (messageCache.has(messageKey)) {
          return;
        }
        messageCache.add(messageKey);
        
        // Clean cache if it gets too large (keep last 1000)
        if (messageCache.size > 1000) {
          const firstKey = messageCache.values().next().value;
          messageCache.delete(firstKey);
        }
        
        setMessages(prev => {
          // Double check for duplicates in state
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
      // Create unique key for message
      const messageKey = `${message._id || message.content}-${new Date(message.createdAt).getTime()}`;
      
      // Check cache to avoid duplicates
      if (messageCache.has(messageKey)) {
        return;
      }
      messageCache.add(messageKey);
      
      setMessages(prev => {
        // Double check for duplicates in state
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
  }, [user, token, API_URL, selectedFriend, fetchMessages]);

  // Fetch friends list on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user, fetchFriends]);

  // Handle window focus - refetch data if needed
  useEffect(() => {
    const handleFocus = () => {
      if (user && socketStatus === 'connected') {
        // Refetch friends to get latest status
        fetchFriends();
        // Refetch messages if friend is selected
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

  // Fetch messages when friend is selected
  useEffect(() => {
    if (selectedFriend && user) {
      const friendId = selectedFriend._id || selectedFriend.id;
      if (friendId) {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, friendId);
        fetchMessages(friendId);
      }
    } else {
      // Clear selection from localStorage
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedFriend, user, fetchMessages]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendEmail.trim() || isAddingFriend) return;

    // Basic email validation
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
      
      // Show success message
      alert(response.data.message || 'Friend added successfully!');
      setFriendEmail('');
      setShowAddFriend(false);
      await fetchFriends();
      
      // Optionally select the newly added friend
      if (response.data.friend) {
        setSelectedFriend(response.data.friend);
      }
    } catch (error) {
      console.error('Add friend error:', error);
      
      // Show specific error message
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

    // Close suggestions
    setShowBroSuggestions(false);
    setSelectedSuggestionIndex(-1);

    // Optimistically add message to UI
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
    
    // Remove optimistic message after a delay (will be replaced by real message)
    setTimeout(() => {
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    }, 1000);
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ margin: 0 }}>💬 Chat</h2>
            <div className={`socket-status ${socketStatus}`} title={`Socket: ${socketStatus}`}></div>
          </div>
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
                  {messages.map((message, index) => {
                    const isOwn = (message.sender?._id || message.sender) === user.id;
                    const isAI = message.isAIResponse;
                    const messageContent = message.content || '';
                    
                    return (
                      <div
                        key={message._id || `msg-${index}`}
                        className={`message ${isOwn ? 'own' : 'other'} ${isAI ? 'ai' : ''}`}
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-input-form">
              <div className="message-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={socketStatus === 'connected' ? "Type a message... (Use @bro for AI help)" : "Connecting..."}
                  value={newMessage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewMessage(value);
                    
                    // Show suggestions when typing @bro
                    const lastAtBro = value.toLowerCase().lastIndexOf('@bro');
                    if (lastAtBro !== -1) {
                      const afterAtBro = value.substring(lastAtBro + 4).trim();
                      // Show suggestions if @bro is at the end or followed by space
                      if (afterAtBro === '' || afterAtBro.startsWith(' ')) {
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
                    // Handle suggestions navigation
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
                        setNewMessage(suggestion.text);
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
                    // Delay hiding suggestions to allow click
                    setTimeout(() => {
                      const activeElement = document.activeElement;
                      if (!suggestionsRef.current?.contains(activeElement) && activeElement !== inputRef.current) {
                        setShowBroSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }
                    }, 200);
                  }}
                  onClick={() => {
                    // Show suggestions if input contains @bro
                    if (newMessage.toLowerCase().includes('@bro')) {
                      const lastAtBro = newMessage.toLowerCase().lastIndexOf('@bro');
                      if (lastAtBro !== -1) {
                        const afterAtBro = newMessage.substring(lastAtBro + 4).trim();
                        if (afterAtBro === '' || afterAtBro.startsWith(' ')) {
                          setShowBroSuggestions(true);
                        }
                      }
                    }
                  }}
                  autoFocus
                />
                {showBroSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="bro-suggestions"
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  >
                    <div className="bro-suggestions-header">
                      <span className="bro-badge">🤖 @bro</span>
                      <span className="bro-suggestions-title">AI Assistant</span>
                    </div>
                    {broSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`bro-suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                        onClick={() => {
                          setNewMessage(suggestion.text);
                          setShowBroSuggestions(false);
                          setSelectedSuggestionIndex(-1);
                          inputRef.current?.focus();
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <div className="suggestion-label">{suggestion.label}</div>
                        <div className="suggestion-description">{suggestion.description}</div>
                      </div>
                    ))}
                    <div className="bro-suggestions-footer">
                      <span>💡 Type your question after @bro</span>
                    </div>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="send-button"
                disabled={!newMessage.trim() || socketStatus !== 'connected' || loadingMessages}
                title={socketStatus !== 'connected' ? 'Waiting for connection...' : 'Send message (Enter)'}
              >
                {socketStatus === 'connected' ? 'Send' : '...'}
              </button>
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

