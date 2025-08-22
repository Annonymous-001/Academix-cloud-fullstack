"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

const BOT_AVATAR = "/logo.png"; // Bot avatar is now always the logo

export default function Page() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const userAvatar = user?.imageUrl || "/avatar.png";

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.text || "Error generating response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error generating response." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <main className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-blue-50 rounded-t-lg">
        <Image src="/logo.png" alt="School Logo" width={40} height={40} className="rounded-full" />
        <div>
          <h1 className="text-xl font-bold text-blue-700">Academix Chatbot</h1>
          <p className="text-xs text-gray-500">Powered by Gemini AI</p>
        </div>
      </div>
      {/* Chat area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-16">Start a conversation with your school assistant!</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && (
              <Image src={BOT_AVATAR} alt="Bot" width={32} height={32} className="rounded-full mr-2 self-end" />
            )}
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-sm whitespace-pre-line ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
            {msg.sender === "user" && (
              <Image src={userAvatar} alt="You" width={32} height={32} className="rounded-full ml-2 self-end" />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end">
            <Image src={BOT_AVATAR} alt="Bot" width={32} height={32} className="rounded-full mr-2 self-end" />
            <div className="bg-white border border-gray-200 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-md shadow animate-pulse text-sm">
              Gemini is thinking...
            </div>
          </div>
        )}
      </div>
      {/* Input bar */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2 items-center rounded-b-lg">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          placeholder="Ask something about your school..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold text-sm disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </main>
  );
}
