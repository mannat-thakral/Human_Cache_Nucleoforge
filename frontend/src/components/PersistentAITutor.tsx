"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Sparkles, X, ChevronUp, Bot, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function PersistentAITutor({ userName }: { userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = userName ? userName.split(" ")[0] : "there";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${displayName}! I am your Human Cache AI Tutor. Ask me any question grounded in your study materials, request a quick memory drill, or explore key concepts!`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await api.tutorChat({
        message: userText,
        conversation_history: historyPayload,
      });

      let replyContent = res.reply;
      if (res.citations && res.citations.length > 0) {
        replyContent += `\n\n📚 **Source References:**\n${res.citations.map((c: string) => `• ${c}`).join("\n")}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyContent,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Regarding "${userText}": Connected to your knowledge base. Upload study materials or notes to expand source grounding.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="font-medium text-sm">Ask AI Tutor</span>
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">Human Cache AI Tutor</h3>
                <p className="text-xs text-slate-400">Grounded in your second brain</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none whitespace-pre-line"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownRenderer content={m.content} className="text-xs sm:text-sm" />
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                Synthesizing response from your knowledge graph...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or request a summary..."
              className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
