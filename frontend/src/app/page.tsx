"use client";

import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [stompClient, setStompClient] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper function to format the timestamp nicely
  const formatTime = (isoString: string) => {
    if (!isoString) return "Just now";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/messages");
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (error) {
      console.error("Could not load history:", error);
    }
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
        await fetchChatHistory();
        connectToSocket(username);
      } else {
        alert("Login Failed");
      }
    } catch (error) {
      alert("Error connecting to backend!");
    }
  };

  const connectToSocket = (user: string) => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => {
      client.subscribe("/topic/public", (payload: any) => {
        const message = JSON.parse(payload.body);
        setMessages((prev) => [...prev, message]);
      });

      client.send(
        "/app/chat.addUser",
        {},
        JSON.stringify({ sender: user, type: "JOIN" })
      );
    }, (error: any) => console.error(error));

    setStompClient(client);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && stompClient) {
      const chatMessage = {
        sender: username,
        content: currentMessage,
        type: "CHAT",
      };
      stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
      setCurrentMessage("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white font-sans">
        <h1 className="text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">ARCADIA</h1>
        <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 rounded-lg bg-gray-700 border border-gray-600 outline-none text-white mb-6"
            placeholder="Choose your handle..."
          />
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg font-bold text-lg">Enter the Realm</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md z-10">
        <h2 className="text-xl font-bold tracking-wider text-blue-400">ARCADIA | Global Channel</h2>
        <span className="bg-gray-700 px-3 py-1 rounded-full text-sm font-medium">{username}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.type === "JOIN" ? "items-center" : "items-start"}`}>
            {msg.type === "JOIN" && (
              <span className="text-gray-400 text-sm">⚡ {msg.sender} connected.</span>
            )}
            {msg.type === "CHAT" && (
              <div className={`max-w-md break-words ${msg.sender === username ? "self-end" : "self-start"}`}>
                 <div className={`flex items-end gap-2 ${msg.sender === username ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${msg.sender === username ? "bg-blue-600 border-blue-400" : "bg-purple-600 border-purple-400"}`}>
                    {msg.sender ? msg.sender.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className={`p-3 rounded-2xl shadow-md border relative ${msg.sender === username ? "bg-blue-600 border-blue-500 rounded-br-none" : "bg-gray-800 border-gray-700 rounded-bl-none"}`}>
                    <p className="text-sm mb-1">{msg.content}</p>
                    {/* 🟢 NEW: Display Timestamp nicely */}
                    <span className="text-[10px] opacity-70 block text-right">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-4 items-center">
        <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} className="flex-1 p-4 rounded-xl bg-gray-900 border border-gray-600 outline-none text-white" placeholder="Type a message..." />
        <button type="submit" disabled={!currentMessage.trim()} className="bg-blue-600 text-white p-4 rounded-xl font-bold">SEND</button>
      </form>
    </div>
  );
}