"use client";

import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
// @ts-ignore
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";

// Deep Dark Palette
const COLORS = {
  bg: "bg-[#0b0c10]",        
  sidebar: "bg-[#13151b]",   
  input: "bg-[#1f2129]",     
  text: "text-[#e2e8f0]",    
  accent: "bg-[#3b82f6]",    
  hover: "hover:bg-[#2563eb]",
  myMsg: "bg-[#3b82f6]",     
  otherMsg: "bg-[#1f2129]",  
};

const NAME_COLORS = [
  "text-red-400 bg-red-400/10 border-red-400",
  "text-orange-400 bg-orange-400/10 border-orange-400",
  "text-amber-400 bg-amber-400/10 border-amber-400",
  "text-green-400 bg-green-400/10 border-green-400",
  "text-emerald-400 bg-emerald-400/10 border-emerald-400",
  "text-teal-400 bg-teal-400/10 border-teal-400",
  "text-cyan-400 bg-cyan-400/10 border-cyan-400",
  "text-blue-400 bg-blue-400/10 border-blue-400",
  "text-indigo-400 bg-indigo-400/10 border-indigo-400",
  "text-violet-400 bg-violet-400/10 border-violet-400",
  "text-purple-400 bg-purple-400/10 border-purple-400",
  "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400",
  "text-pink-400 bg-pink-400/10 border-pink-400",
  "text-rose-400 bg-rose-400/10 border-rose-400",
];

const getColorForUser = (username: string) => {
  if (!username) return NAME_COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NAME_COLORS.length;
  return NAME_COLORS[index];
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [stompClient, setStompClient] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isSameDay = (d1: string, d2: string) => {
    return new Date(d1).toDateString() === new Date(d2).toDateString();
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/messages");
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (error) { console.error(error); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const res = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        setOnlineUsers(new Set([username])); 
        await fetchChatHistory();
        connectToSocket(username);
      } else { alert("Login Failed"); }
    } catch (error) { alert("Error connecting to backend!"); }
  };

  const connectToSocket = (user: string) => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);
    client.debug = () => {};
    
    client.connect({}, () => {
      client.subscribe("/topic/public", (payload: any) => {
        const message = JSON.parse(payload.body);
        
        if (message.type === "JOIN") {
            setOnlineUsers(prev => new Set(prev).add(message.sender));
            if (message.sender !== user) {
                client.send("/app/chat.presence", {}, JSON.stringify({ sender: user, type: "PRESENCE" }));
            }
        } 
        else if (message.type === "PRESENCE") {
            setOnlineUsers(prev => new Set(prev).add(message.sender));
        }
        else if (message.type === "LEAVE") {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(message.sender);
                return newSet;
            });
        }

        if (message.type === "TYPING") {
            if (message.sender !== user) { 
                setTypingUsers((prev) => new Set(prev).add(message.sender));
                setTimeout(() => {
                    setTypingUsers((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(message.sender);
                        return newSet;
                    });
                }, 4000); 
            }
        } else if (message.type === "CHAT") {
            setMessages((prev) => [...prev, message]);
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(message.sender);
                return newSet;
            });
        }
      });

      client.send("/app/chat.addUser", {}, JSON.stringify({ sender: user, type: "JOIN" }));
    }, (error: any) => console.error(error));
    setStompClient(client);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    if (stompClient && username) {
        stompClient.send("/app/chat.typing", {}, JSON.stringify({ sender: username, type: "TYPING" }));
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && stompClient) {
      const chatMessage = { sender: username, content: currentMessage, type: "CHAT" };
      stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
      setCurrentMessage("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${COLORS.bg} font-sans`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="z-10 text-center space-y-8 animate-fade-in-up">
          <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 drop-shadow-2xl">ARCADIA</h1>
          <form onSubmit={handleLogin} className={`p-10 ${COLORS.sidebar} rounded-3xl shadow-2xl border border-white/5 w-[400px] backdrop-blur-xl`}>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full p-4 rounded-xl ${COLORS.input} text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 transition-all placeholder-gray-500 font-medium`} placeholder="Enter your name..." autoFocus />
            <button type="submit" className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all`}>Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${COLORS.bg} ${COLORS.text} font-sans overflow-hidden`}>
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <div className={`h-16 px-6 ${COLORS.sidebar} border-b border-white/5 flex justify-between items-center shadow-lg z-20`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">#</div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white">Global Channel</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></div>
                <span className="text-xs text-gray-400 font-medium">Live Connection</span>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {messages.map((msg, idx) => {
            const userColorStyle = getColorForUser(msg.sender);
            const showDateSeparator = idx === 0 || (msg.timestamp && messages[idx - 1].timestamp && !isSameDay(msg.timestamp, messages[idx - 1].timestamp));
            if (msg.type === "LEAVE" || msg.type === "PRESENCE") return null; 

            return (
              <div key={idx} className="flex flex-col">
                {showDateSeparator && msg.timestamp && (
                  <div className="flex items-center justify-center my-6">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{getDateLabel(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`group flex flex-col animate-fade-in`}>
                  {msg.type === "JOIN" ? (
                    <div className="flex items-center justify-center my-4 opacity-60">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">⚡ {msg.sender} connected</span>
                    </div>
                  ) : msg.type === "CHAT" && (
                    <div className={`flex gap-4 ${msg.sender === username ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-lg border ${msg.sender === username ? "bg-blue-600 border-blue-400 text-white" : `${userColorStyle}`}`}>
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className={`flex flex-col max-w-[85%] ${msg.sender === username ? "items-end" : "items-start"}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-sm font-bold cursor-pointer hover:underline ${msg.sender === username ? "text-blue-400" : userColorStyle.split(' ')[0]}`}>{msg.sender}</span>
                          <span className="text-[10px] text-gray-500">{formatTime(msg.timestamp)}</span>
                        </div>
                        {/* 🟢 MARKDOWN RENDERING (Types Ignored for safety) */}
                        <div className={`px-5 py-3 rounded-2xl shadow-md text-[15px] leading-relaxed tracking-wide ${msg.sender === username ? `${COLORS.myMsg} text-white rounded-tr-sm` : `${COLORS.otherMsg} text-gray-100 rounded-tl-sm border border-white/5`}`}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // @ts-ignore
                              p: ({node, ...props}) => <p className="mb-0" {...props} />,
                              // @ts-ignore
                              a: ({node, ...props}) => <a className="text-blue-300 hover:underline" target="_blank" {...props} />,
                              // @ts-ignore
                              code: ({node, ...props}) => <code className="bg-black/30 rounded px-1 py-0.5 text-sm font-mono" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className={`p-6 ${COLORS.bg}`}>
          <div className="h-6 mb-2 pl-2">
              {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 animate-pulse">
                      <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{Array.from(typingUsers).join(", ")} is typing...</span>
                  </div>
              )}
          </div>
          <form onSubmit={sendMessage} className={`flex items-center gap-2 p-2 rounded-2xl ${COLORS.input} shadow-xl border border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all`}>
            <button type="button" className="p-3 text-gray-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
            <input type="text" value={currentMessage} onChange={handleInputChange} className="flex-1 bg-transparent text-gray-100 outline-none placeholder-gray-600 font-medium py-2" placeholder={`Message #${username || "global"}...`} />
            <button type="submit" disabled={!currentMessage.trim()} className="p-3 bg-blue-600 rounded-xl text-white shadow-lg hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-all transform active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg></button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Online Users) */}
      <div className={`w-64 ${COLORS.sidebar} border-l border-white/5 hidden md:flex flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-white/5">
            <h3 className="font-bold text-gray-300 text-sm tracking-widest uppercase">Online — {onlineUsers.size}</h3>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
            {Array.from(onlineUsers).map((user, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getColorForUser(user)}`}>
                            {user.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#13151b]"></div>
                    </div>
                    <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">{user}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}