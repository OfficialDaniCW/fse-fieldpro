import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Image as ImageIcon, Loader2, BookOpen } from "lucide-react";
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

  // --- Part lookup helpers ---
  const PART_NUMBER_REGEX = /^[A-Z0-9]{4,}[-/]?[A-Z0-9]*$/i;

  const formatPartFull = (p) => {
    const steps = [p.installation_step_1, p.installation_step_2, p.installation_step_3].filter(Boolean);
    return [
      `**${p.part_number}** — ${p.description}`,
      p.brand ? `**Brand:** ${p.brand}` : null,
      p.pump_model ? `**Model:** ${p.pump_model}` : null,
      p.system_area ? `**System:** ${p.system_area}` : null,
      p.component_type ? `**Component:** ${p.component_type}` : null,
      p.what_it_does ? `\n**What it does:**\n${p.what_it_does}` : null,
      steps.length ? `\n**Installation:**\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : null,
      p.safety_warning ? `\n⚠️ **Safety Warning:** ${p.safety_warning}` : null,
      p.variant_spec ? `\n**Specification:** ${p.variant_spec}` : null,
    ].filter(Boolean).join("\n");
  };

  const formatPartSummary = (p) => [
    `**${p.part_number}** — ${p.description}`,
    p.brand ? `Brand: ${p.brand}` : null,
    p.pump_model ? `Model: ${p.pump_model}` : null,
  ].filter(Boolean).join(" · ");

  const NOT_FOUND_MSG = "This part is not currently in the TSG database. Please check with your supervisor or contact the TSG stores team.";

  const searchParts = async (query) => {
    const allParts = await base44.entities.Part.list();
    const q = query.toLowerCase().trim();

    // Exact part number match first
    const exact = allParts.find(p => p.part_number?.toLowerCase() === q);
    if (exact) return { type: "exact", parts: [exact] };

    // Looks like a part number pattern — search part_number field
    if (PART_NUMBER_REGEX.test(query.trim())) {
      const matches = allParts.filter(p => p.part_number?.toLowerCase().includes(q));
      return { type: "part_number", parts: matches.slice(0, 3) };
    }

    // Description / brand search — top 3
    const words = q.split(/\s+/);
    const scored = allParts
      .map(p => {
        const haystack = [p.description, p.brand, p.pump_model, p.system_area, p.component_type]
          .join(" ").toLowerCase();
        const score = words.filter(w => haystack.includes(w)).length;
        return { part: p, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.part);

    return { type: "description", parts: scored };
  };

  const buildPartResponse = ({ type, parts }) => {
    if (!parts.length) return NOT_FOUND_MSG;
    if (type === "exact" || (type === "part_number" && parts.length === 1)) {
      return formatPartFull(parts[0]);
    }
    return `Found ${parts.length} matching part${parts.length > 1 ? "s" : ""}:\n\n` +
      parts.map(formatPartSummary).join("\n\n");
  };

  const injectAssistantMessage = (conversation, content) => {
    base44.agents.addMessage(conversation, { role: "assistant", content });
  };

  // --- Send handler ---
  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    if (!conversationId) return;

    const userText = input.trim();
    setInput("");
    setImageFile(null);

    const conversation = await base44.agents.getConversation(conversationId);

    // Image path — OCR then search parts
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userText || "What part is this?",
        file_urls: [file_url]
      });

      const ocrResult = await base44.integrations.Core.InvokeLLM({
        prompt: "Extract all visible text, numbers, part numbers, codes and labels from this image. Return only the extracted text, nothing else.",
        file_urls: [file_url],
      });

      if (ocrResult) {
        const result = await searchParts(ocrResult.trim());
        if (result.parts.length > 0) {
          injectAssistantMessage(conversation, `I found the following from the image:\n\n${buildPartResponse(result)}`);
          return;
        }
      }
      // Fall through to agent if no OCR match
      injectAssistantMessage(conversation, NOT_FOUND_MSG);
      return;
    }

    // Text path — search parts first
    await base44.agents.addMessage(conversation, { role: "user", content: userText });

    const result = await searchParts(userText);
    if (result.parts.length > 0) {
      injectAssistantMessage(conversation, buildPartResponse(result));
      return;
    }

    // No part match — let the agent handle it (already sent user message above)
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-[#CC0000] tracking-tight">TSG</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">FSE Assistant</h1>
              <p className="text-xs text-slate-400">Technical support & diagnostics</p>
            </div>
          </div>
          <Link to="/manuals">
            <Button variant="ghost" size="sm" className="text-[#CC0000] hover:text-white hover:bg-slate-800">
              <BookOpen className="w-4 h-4 mr-1.5" />
              <span className="text-xs">Database</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: "180px" }}>
        {messages.length === 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white mb-3">
                <span className="text-sm font-bold text-[#CC0000] tracking-tight">TSG</span>
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
            <ImageIcon className="w-4 h-4 text-[#CC0000]" />
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
            className="flex-shrink-0 bg-[#CC0000] hover:bg-[#aa0000] h-11 px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}