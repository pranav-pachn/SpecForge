"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "copilot";
  content: string;
}

export const CopilotWidget = ({ workflowId }: { workflowId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "copilot",
      content: "Hi! I'm the SpecForge Copilot. I have deep context on your Engineering Graph, Decisions, and Impact metrics. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content })
      });
      
      const data = await res.json();
      
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: "copilot", content: data.reply || "Sorry, I couldn't process that." }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: "copilot", content: "Error connecting to Intelligence Facade." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center z-50"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed right-6 bottom-6 flex flex-col glass border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-50 transition-all duration-300 ease-in-out ${isMinimized ? 'h-14 w-80' : 'h-[500px] w-96'}`}>
      <div className="bg-slate-900/80 p-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-sm text-slate-200">Engineering Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'glass border-white/10 text-slate-200 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-900/80 border-t border-white/10 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about architecture, tasks, decisions..."
                className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder:text-slate-500"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1 p-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 rounded-full text-white transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
