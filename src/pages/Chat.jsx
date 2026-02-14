import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import MessageBubble from "../components/MessageBubble";

export default function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create conversation on mount
    const initConversation = async () => {
      try {
        const conversation = await base44.agents.createConversation({
          agent_name: "field_service_assistant",
          metadata: {
            name: "Troubleshooting Session",
            description: "Field service troubleshooting assistance"
          }
        });
        setConversationId(conversation.id);
        setMessages(conversation.messages || []);

        // Subscribe to updates
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          setMessages(data.messages);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    };

    initConversation();
  }, []);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Try Chrome or Safari.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-GB";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    if (!conversationId) return;

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      
      let file_urls = null;
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        file_urls = [file_url];
      }

      await base44.agents.addMessage(conversation, {
        role: "user",
        content: input || "What does this error mean?",
        file_urls: file_urls
      });

      setInput("");
      setImageFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">FSE Assistant</h1>
            <p className="text-xs text-slate-400">Technical support & diagnostics</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: "180px" }}>
        {messages.length === 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-500"></div>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">Field Service Engine</h2>
              <p className="text-sm text-slate-400">Query equipment data, error codes & procedures</p>
            </div>
            
            <div className="space-y-2">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <p className="text-xs font-mono text-slate-500 mb-2">EXAMPLE QUERIES:</p>
                <div className="space-y-1.5">
                  <p className="text-sm text-slate-300">"Gilbarco E47 error meaning"</p>
                  <p className="text-sm text-slate-300">"Fuel filter replacement procedure"</p>
                  <p className="text-sm text-slate-300">"Wayne Ovation ERR 03 diagnostic"</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 z-10">
        {imageFile && (
          <div className="mb-2 flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-300 flex-1">{imageFile.name}</span>
            <button
              onClick={() => setImageFile(null)}
              className="text-red-400 text-xs font-medium"
            >
              Remove
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-shrink-0">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-lg border border-slate-700">
              <ImageIcon className="w-5 h-5" />
            </button>
          </label>

          <button
            onClick={handleVoiceInput}
            className={`flex-shrink-0 p-2.5 rounded-lg border ${
              isListening
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
            title="Voice input"
          >
            {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          </button>

          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Query equipment database..."
            className="flex-1 text-sm h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || !conversationId}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 h-11 px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}