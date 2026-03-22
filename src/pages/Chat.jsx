import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Image as ImageIcon, Loader2, BookOpen, History } from "lucide-react";
import MessageBubble from "../components/MessageBubble";
import PageHeader from "../components/PageHeader";
import PartsUsedTray from "../components/PartsUsedTray";

const CONV_STORAGE_KEY = "fse_last_conversation_id";
const RECENT_SEARCHES_KEY = "fse_recent_searches";
const MAX_RECENT = 5;

export default function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const cacheRef = useRef({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partsUsed, setPartsUsed] = useState([]);
  const [showHistoryBanner, setShowHistoryBanner] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const startNewConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "field_service_assistant",
        metadata: { name: "Troubleshooting Session", description: "Field service troubleshooting assistance" }
      });
      localStorage.setItem(CONV_STORAGE_KEY, conversation.id);
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
      setPartsUsed([]);
      setShowHistoryBanner(false);
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        setMessages(data.messages);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  useEffect(() => {
    const initConversation = async () => {
      const savedId = localStorage.getItem(CONV_STORAGE_KEY);
      if (savedId) {
        try {
          const conversation = await base44.agents.getConversation(savedId);
          if (conversation && conversation.messages?.length > 0) {
            setConversationId(conversation.id);
            setMessages(conversation.messages);
            setShowHistoryBanner(true);
            const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
              setMessages(data.messages);
            });
            return () => unsubscribe();
          }
        } catch {
          // Conversation expired or not found — create new
        }
      }
      return startNewConversation();
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
  // Matches part numbers: pure numeric (e.g. 140852556) or alphanumeric codes (e.g. SK700-A)
  const PART_NUMBER_REGEX = /^[A-Z0-9]{4,}([-/][A-Z0-9]+)*$/i;

  const formatPartFull = (p) => {
    const steps = [p.installation_step_1, p.installation_step_2, p.installation_step_3].filter(Boolean);
    const lines = [
      `**${p.part_number}** — ${p.description}`,
    ];
    if (p.brand || p.pump_model || p.system_area || p.component_type) {
      lines.push("");
      if (p.brand) lines.push(`**Brand:** ${p.brand}`);
      if (p.pump_model) lines.push(`**Model:** ${p.pump_model}`);
      if (p.system_area) lines.push(`**System:** ${p.system_area}`);
      if (p.component_type) lines.push(`**Component:** ${p.component_type}`);
    }
    if (p.variant_spec) lines.push(`**Spec:** ${p.variant_spec}`);
    if (p.what_it_does) {
      lines.push("");
      lines.push(`**What it does:**`);
      lines.push(p.what_it_does);
    }
    if (steps.length) {
      lines.push("");
      lines.push(`**Installation steps:**`);
      steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    }
    if (p.safety_warning) {
      lines.push("");
      lines.push(`**Safety Warning:** ${p.safety_warning}`);
    }
    return lines.join("\n");
  };

  const formatPartSummary = (p) => [
    `**${p.part_number}** — ${p.description}`,
    p.brand ? `Brand: ${p.brand}` : null,
    p.pump_model ? `Model: ${p.pump_model}` : null,
  ].filter(Boolean).join(" · ");

  const NOT_FOUND_MSG = "This part is not in the TSG FieldPro database yet. Please check with your supervisor or contact the TSG stores team.";

  const searchParts = async (query) => {
    // Use local cache (works offline)
    let allParts = cacheRef.current.parts;
    if (!allParts || allParts.length === 0) {
      allParts = await base44.entities.Part.list("-created_date", 2000);
      cacheRef.current.parts = allParts;
    }
    const q = query.toLowerCase().trim();

    // 1. Exact part number match
    const exact = allParts.find(p => p.part_number?.toLowerCase() === q);
    if (exact) {
      // If part is obsolete, suggest replacement
      if (exact.is_obsolete && exact.superseded_by) {
        const replacement = allParts.find(p => p.part_number === exact.superseded_by);
        return { type: "obsolete", parts: [exact], alternatives: replacement ? [replacement] : [] };
      }
      return { type: "exact", parts: [exact] };
    }

    // 2. Looks like a part number — search part_number field only
    if (PART_NUMBER_REGEX.test(q) && !q.includes(" ")) {
      const matches = allParts.filter(p => p.part_number?.toLowerCase().includes(q));
      if (matches.length > 0) return { type: "part_number", parts: matches.slice(0, 3) };
    }

    // 3. Fuzzy free-text search with weighted field scoring
    const words = q.split(/\s+/).filter(w => w.length > 1);
    const scored = allParts
      .map(p => {
        let score = 0;
        const fields = {
          part_number:    { text: p.part_number, weight: 5 },
          description:    { text: p.description, weight: 4 },
          brand:          { text: p.brand, weight: 3 },
          pump_model:     { text: p.pump_model, weight: 3 },
          component_type: { text: p.component_type, weight: 2 },
          system_area:    { text: p.system_area, weight: 2 },
          what_it_does:   { text: p.what_it_does, weight: 1 },
        };
        for (const [, { text, weight }] of Object.entries(fields)) {
          if (!text) continue;
          const t = text.toLowerCase();
          for (const w of words) {
            if (t === w) score += weight * 3;          // exact word match
            else if (t.startsWith(w)) score += weight * 2; // prefix match
            else if (t.includes(w)) score += weight;   // substring match
          }
        }
        return { part: p, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.part);

    return { type: "description", parts: scored };
  };

  const addToPartsUsed = (parts) => {
    setPartsUsed(prev => {
      const existingIds = new Set(prev.map(p => p.part_number));
      const newOnes = parts.filter(p => !existingIds.has(p.part_number));
      return [...prev, ...newOnes];
    });
  };

  const buildPartResponse = ({ type, parts, alternatives }) => {
    if (!parts.length) return NOT_FOUND_MSG;
    
    let response = "";
    
    if (type === "obsolete" && alternatives?.length > 0) {
      response = `⚠️ **This part is obsolete.**\n\n`;
      response += `**${parts[0].part_number}** — ${parts[0].description}\n\n`;
      response += `**Recommended replacement:**\n\n`;
      response += `${formatPartFull(alternatives[0])}`;
      addToPartsUsed(alternatives);
    } else if (type === "exact" || (type === "part_number" && parts.length === 1)) {
      addToPartsUsed(parts);
      response = formatPartFull(parts[0]);
    } else {
      addToPartsUsed(parts);
      response = `Found ${parts.length} matching part${parts.length > 1 ? "s" : ""}:\n\n` +
        parts.map(formatPartSummary).join("\n\n");
    }
    
    return response;
  };

  const injectAssistantMessage = (conversation, content) => {
    base44.agents.addMessage(conversation, { role: "assistant", content });
  };

  // --- Semantic manual search ---
  const searchManuals = async (query) => {
    let allManuals = cacheRef.current.manuals;
    if (!allManuals || allManuals.length === 0) {
      allManuals = await base44.entities.Manual.list("-created_date");
      cacheRef.current.manuals = allManuals;
    }

    const withContent = allManuals.filter(m => m.manual_text || m.error_codes || m.troubleshooting_steps || m.summary);
    if (withContent.length === 0) return [];

    // Build a lightweight index (id + metadata + summary) for the AI ranker
    // Avoids sending full text in the ranking call — cheaper and faster
    const index = withContent.map((m, i) => ({
      idx: i,
      id: m.id,
      title: m.title,
      manufacturer: m.manufacturer,
      model: m.model,
      version: m.version || "",
      summary: m.summary || "",
      has_error_codes: !!m.error_codes,
      has_troubleshooting: !!m.troubleshooting_steps,
    }));

    // Phase 1: keyword pre-filter to narrow candidates (fast, no API call)
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 2);
    const candidates = index
      .map(entry => {
        const haystack = [entry.title, entry.manufacturer, entry.model, entry.version, entry.summary]
          .filter(Boolean).join(" ").toLowerCase();
        const score = words.filter(w => haystack.includes(w)).length;
        return { entry, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(8, index.length)) // top 8 candidates for semantic re-ranking
      .map(x => x.entry);

    if (candidates.length === 0) return [];

    // Phase 2: AI semantic re-ranking across the candidate set
    const ranked = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a technical document retrieval system for field service engineers.
Given the engineer's query and a list of equipment manuals, return the IDs of the most relevant manuals in order of relevance.
Only include manuals that are genuinely relevant. Return at most 2 IDs.

ENGINEER QUERY: "${query}"

AVAILABLE MANUALS:
${candidates.map(c => `ID:${c.idx} | ${c.manufacturer} ${c.model} ${c.version} | "${c.title}" | Summary: ${c.summary || "N/A"} | Has error codes: ${c.has_error_codes} | Has troubleshooting: ${c.has_troubleshooting}`).join("\n")}`,
      response_json_schema: {
        type: "object",
        properties: {
          relevant_indices: {
            type: "array",
            items: { type: "number" },
            description: "The idx values of relevant manuals, most relevant first, max 2"
          },
          reasoning: { type: "string" }
        }
      }
    });

    const relevantIndices = ranked?.relevant_indices || [];
    if (relevantIndices.length === 0) return [];

    return relevantIndices
      .filter(i => withContent[i])
      .map(i => withContent[i]);
  };

  const buildManualContext = (manuals, query) => {
    return manuals.map(m => {
      const sections = [];
      const meta = [m.equipment_manufacturer, m.equipment_model, m.version].filter(Boolean).join(" ");
      sections.push(`=== Manual: ${m.title} (${meta}) ===`);
      if (m.summary) sections.push(`Overview: ${m.summary}`);
      // Prioritise error codes / troubleshooting for diagnostic queries
      if (m.error_codes) sections.push(`--- Error Codes ---\n${m.error_codes}`);
      if (m.troubleshooting_steps) sections.push(`--- Troubleshooting ---\n${m.troubleshooting_steps}`);
      // Include raw text, trimmed — give more space to the first (most relevant) manual
      if (m.manual_text) {
        const limit = manuals.length === 1 ? 6000 : 3000;
        sections.push(`--- Full Text (excerpt) ---\n${m.manual_text.slice(0, limit)}`);
      }
      return sections.join("\n\n");
    }).join("\n\n========\n\n");
  };

  const logSearch = (query, result_type, result_count = 0) => {
    base44.entities.SearchLog.create({ query, result_type, result_count }).catch(() => {});
  };

  const addToRecentSearches = (query) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // --- Send handler ---
  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    if (!conversationId || isProcessing) return;

    const userText = input.trim();
    setInput("");
    setImageFile(null);
    setIsProcessing(true);
    if (userText) addToRecentSearches(userText);

    const conversation = await base44.agents.getConversation(conversationId);
    if (!conversation) {
      setIsProcessing(false);
      return;
    }

    // Image path — OCR then search parts, then manuals
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
          logSearch(ocrResult.trim(), "image", result.parts.length);
          injectAssistantMessage(conversation, `I found the following from the image:\n\n${buildPartResponse(result)}`);
          setIsProcessing(false);
          return;
        }
        const matchedManuals = await searchManuals(ocrResult.trim());
        if (matchedManuals.length > 0) {
          logSearch(ocrResult.trim(), "manual_found", matchedManuals.length);
          const context = buildManualContext(matchedManuals, ocrResult.trim());
          const answer = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a senior field service engineer assistant. The engineer has sent an image. Use ONLY the manual content below to answer their question. Be concise, safety-first, and use numbered steps where applicable. Cite the manual at the end.\n\nMANUAL CONTENT:\n${context}\n\nQUESTION: ${userText || "What is this part or error code?"}\n\nIf the answer is not in the manual content, say so clearly.`,
          });
          injectAssistantMessage(conversation, answer);
          setIsProcessing(false);
          return;
        }
      }
      logSearch(userText || "image", "not_found", 0);
      injectAssistantMessage(conversation, NOT_FOUND_MSG);
      setIsProcessing(false);
      return;
    }

    // Text path — search parts first
    const partResult = await searchParts(userText);
    if (partResult.parts.length > 0) {
      logSearch(userText, "part_found", partResult.parts.length);
      await base44.agents.addMessage(conversation, { role: "user", content: userText });
      injectAssistantMessage(conversation, buildPartResponse(partResult));
      setIsProcessing(false);
      return;
    }

    // No part match — search manual text (semantic via LLM re-ranking)
    const matchedManuals = await searchManuals(userText);
    if (matchedManuals.length > 0) {
      logSearch(userText, "manual_found", matchedManuals.length);
      await base44.agents.addMessage(conversation, { role: "user", content: userText });
      const context = buildManualContext(matchedManuals, userText);
      const answer = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior field service engineer assistant. Use ONLY the manual content below to answer the engineer's question.
Rules:
- Be concise and direct
- Prioritise safety — always surface warnings and cautions
- Use numbered steps for procedures
- If the query is about an error code, explain the code, its cause, and the fix
- Cite the manual name and model at the end of your response
- If the answer is NOT in the manual, say so and advise contacting a supervisor

MANUAL CONTENT:
${context}

ENGINEER'S QUESTION: ${userText}`,
        model: "gemini_3_flash",
      });
      injectAssistantMessage(conversation, answer);
      setIsProcessing(false);
      return;
    }

    // Nothing in local DB — log as not found, send to agent
    logSearch(userText, "not_found", 0);
    await base44.agents.addMessage(conversation, { role: "user", content: userText });
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <PageHeader title="FSE FieldPro" subtitle="Technical support & diagnostics">
        <Link to="/Manuals">
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-red-700">
            <BookOpen className="w-4 h-4 mr-1.5" />
            <span className="text-xs">Database</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-3" style={{ paddingBottom: "220px" }}>
        {showHistoryBanner && messages.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <History className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">Resumed previous session.</span>
            <button onClick={startNewConversation} className="font-semibold underline">Start fresh</button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#CC0000] mb-3">
                <span className="text-sm font-bold text-white tracking-tight">FSE</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">FSE FieldPro Assistant</h2>
              <p className="text-sm text-gray-500">Query equipment data, error codes & procedures</p>
            </div>
            
            <div className="space-y-2">
              {recentSearches.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <p className="text-xs font-mono text-gray-400 mb-2">RECENT SEARCHES:</p>
                  <div className="space-y-1.5">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setInput(search); }}
                        className="block text-sm text-blue-600 hover:underline text-left w-full"
                      >
                        "{search}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <p className="text-xs font-mono text-gray-400 mb-2">EXAMPLE QUERIES:</p>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-700">"140852556" — look up a part number</p>
                  <p className="text-sm text-gray-700">"SK700 VR hose" — search by description</p>
                  <p className="text-sm text-gray-700">Photo of a part label — auto-identify</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isProcessing && (
          <div className="flex gap-2 items-center text-gray-400 px-1">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs">Searching database & manuals...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <PartsUsedTray
        parts={partsUsed}
        onRemove={(i) => setPartsUsed(prev => prev.filter((_, idx) => idx !== i))}
        onClear={() => setPartsUsed([])}
      />

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 z-30">
        {imageFile && (
          <div className="mb-2 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
            <ImageIcon className="w-4 h-4 text-[#CC0000]" />
            <span className="text-xs text-gray-700 flex-1">{imageFile.name}</span>
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
            <button className="bg-white hover:bg-gray-100 text-gray-600 p-2.5 rounded-lg border border-gray-300">
              <ImageIcon className="w-5 h-5" />
            </button>
          </label>

          <button
            onClick={handleVoiceInput}
            className={`flex-shrink-0 p-2.5 rounded-lg border ${
              isListening
                ? "bg-red-100 border-red-400 text-red-600 animate-pulse"
                : "bg-white hover:bg-gray-100 border-gray-300 text-gray-600"
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
            className="flex-1 text-sm h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || !conversationId || isProcessing}
            className="flex-shrink-0 bg-[#CC0000] hover:bg-[#aa0000] h-11 px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}