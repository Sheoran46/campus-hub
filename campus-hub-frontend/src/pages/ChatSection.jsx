import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import api from '../services/api';

const ChatSection = () => {
    const { user } = useContext(AuthContext);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Setup WebSocket connection for Global Chat
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        const client = new Client({
            // Using standard WebSocket constructor instead of SockJS if possible, or SockJS fallback
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: function (str) {
              console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket as:', user.email);
                setIsConnected(true);

                // Subscribe to the PUBLIC topic instead of a private queue
                client.subscribe('/topic/public', (message) => {
                    const receivedMsg = JSON.parse(message.body);

                    setMessages(prev => {
                        // Avoid duplicates
                        const exists = prev.some(m => m.messageId === receivedMsg.messageId);
                        if (!exists) {
                            return [...prev, receivedMsg];
                        }
                        return prev;
                    });
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                setIsConnected(false);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [user]);

    // Fetch GLOBAL history on load
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch from the global history endpoint
                const response = await api.get(`/chat/history`);
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch global history", error);
            }
        };
        fetchHistory();
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isConnected) return;

        // No receiver needed for public chat
        const chatMessage = {
            content: newMessage.trim(),
            senderEmail: user.email,
            senderName: user.name
        };

        stompClientRef.current.publish({
            destination: '/app/chat', // Routes to @MessageMapping("/chat") in backend
            body: JSON.stringify(chatMessage)
        });

        setNewMessage('');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
            <div className="bg-white rounded-3xl shadow-lg shadow-cyan-900/5 overflow-hidden flex flex-col h-full border border-cyan-100">

                {/* Chat Header */}
                <div className="py-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-20">
                    <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            🌐
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Global Campus Chat</h3>
                            <p className="text-xs text-slate-500 font-medium flex items-center">
                                {isConnected ? (
                                    <><span className="h-2 w-2 bg-emerald-500 rounded-full mr-1.5"></span> Connected</>
                                ) : (
                                    <><span className="h-2 w-2 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span> Disconnected</>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
                    {messages.length === 0 ? (
                         <div className="flex justify-center mt-10">
                             <span className="bg-white border border-slate-200 text-slate-500 text-xs px-4 py-2 rounded-full shadow-sm font-medium">
                                 Welcome to the global chat! Say hi to everyone.
                             </span>
                         </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.senderEmail === user.email;

                            // Show sender name only if it's not the current user
                            return (
                                <div key={msg.messageId || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <span className="text-[10px] font-bold text-slate-500 ml-2 mb-1 uppercase tracking-wider">
                                            {msg.senderName || msg.senderEmail.split('@')[0]}
                                        </span>
                                    )}
                                    <div className={`max-w-[80%] px-5 py-3 shadow-sm relative ${
                                        isMe ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                                    }`}>
                                        <p className="text-sm font-medium break-words leading-relaxed">{msg.content}</p>
                                        <div className="flex justify-end items-center mt-1.5">
                                            <span className={`text-[10px] font-medium ${isMe ? 'text-cyan-100' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={isConnected ? "Message everyone..." : "Connecting..."}
                                className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                disabled={!isConnected}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || !isConnected}
                                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 flex items-center justify-center text-white transition-colors shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatSection;