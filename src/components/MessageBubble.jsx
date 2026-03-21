import React from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[8px] font-bold text-[#CC0000] tracking-tight">TSG</span>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser && "flex flex-col items-end"}`}>
        <div
          className={`rounded-xl px-3.5 py-2.5 ${
            isUser
              ? "bg-[#CC0000] text-white"
              : "bg-slate-800 border border-slate-700 text-slate-100"
          }`}
        >
          {message.content && (
            isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
                    ) : (
                      <code className="block bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</code>
                    )
                }}
              >
                {message.content}
              </ReactMarkdown>
            )
          )}
          
          {message.file_urls && message.file_urls.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.file_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Uploaded"
                  className="rounded-lg max-w-full"
                />
              ))}
            </div>
          )}
        </div>
        
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.tool_calls.map((tool, idx) => {
              const status = tool.status || "pending";
              const isComplete = status === "completed" || status === "success";
              const isError = status === "failed" || status === "error";

              return (
                <div
                  key={idx}
                  className="text-xs flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5"
                >
                  {isComplete && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {isError && <AlertCircle className="w-3 h-3 text-red-400" />}
                  {!isComplete && !isError && <Clock className="w-3 h-3 text-slate-500" />}
                  <span className="text-slate-400 font-mono">
                    {tool.name?.split(".").pop() || "query_database"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}