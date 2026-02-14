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
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold">🔧 Field Service Assistant</h1>
        <p className="text-xs text-blue-100 mt-1">Ask about error codes, troubleshooting, procedures</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 Hi! I'm your Field Service Assistant.</p>
            <p className="text-sm">Ask me about equipment troubleshooting, error codes, or procedures.</p>
            <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-sm font-medium text-gray-700">💡 Try asking:</p>
                <p className="text-xs text-gray-600 mt-1">"What does Gilbarco E47 mean?"</p>
                <p className="text-xs text-gray-600">"How to replace a fuel filter?"</p>
                <p className="text-xs text-gray-600">"Wayne Ovation ERR 03 troubleshooting"</p>
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
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        {imageFile && (
          <div className="mb-2 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700 flex-1">{imageFile.name}</span>
            <button
              onClick={() => setImageFile(null)}
              className="text-red-500 text-sm font-medium"
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
            <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg cursor-pointer">
              <ImageIcon className="w-5 h-5" />
            </div>
          </label>

          <button
            onClick={handleVoiceInput}
            className={`flex-shrink-0 p-3 rounded-lg ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
            placeholder="Ask about error codes, procedures..."
            className="flex-1 text-base h-12"
          />

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || !conversationId}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 h-12 px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}