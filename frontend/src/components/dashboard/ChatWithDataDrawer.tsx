import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Table as TableIcon,
  RefreshCw,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { ChatMessage, ColumnMeta } from '../../types';
import { askDataQuestion, fetchQuerySuggestions } from '../../api';
import { ChartRenderer } from './ChartRenderer';

interface ChatWithDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  columns: ColumnMeta[];
  isDarkMode?: boolean;
}

export const ChatWithDataDrawer: React.FC<ChatWithDataDrawerProps> = ({
  isOpen,
  onClose,
  datasetId,
  columns,
  isDarkMode
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (datasetId) {
      fetchQuerySuggestions(datasetId).then(suggs => {
        setSuggestions(suggs);
      });
      // Initial greeting message
      if (messages.length === 0) {
        setMessages([
          {
            id: 'init',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Hello! I'm your DataPilot AI conversational analyst. You can ask me freeform questions about this dataset, compare categories, check monthly trends, detect outliers, or calculate statistics. All calculations are executed directly on your uploaded data.",
            suggested_followups: suggestions.slice(0, 3)
          }
        ]);
      }
    }
  }, [datasetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await askDataQuestion(datasetId, q);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.answer,
        chart: res.chart,
        table: res.table,
        suggested_followups: res.suggested_followups
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Sorry, I encountered an issue analyzing that question. Please try rephrasing or click one of the suggested queries below.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>Chat With Your Data</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Natural language answers verified by pandas data analytics
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
              msg.sender === 'user' ? 'bg-slate-700' : 'bg-brand-600'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`max-w-[85%] space-y-2 ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white rounded-2xl rounded-tr-none p-3 text-xs shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none p-3.5 text-xs shadow-sm border border-slate-200/50 dark:border-slate-700/50'
            }`}>
              <div className="whitespace-pre-line leading-relaxed">
                {msg.text}
              </div>

              {/* Dynamic Chart embedded in message */}
              {msg.chart && (
                <div className="mt-3 p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    {msg.chart.title}
                  </span>
                  <ChartRenderer
                    chart={{
                      id: `chat_${msg.id}`,
                      type: msg.chart.type as any,
                      title: msg.chart.title,
                      x_column: msg.chart.x_column || '',
                      y_column: msg.chart.y_column,
                      data: msg.chart.data
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Mini Table embedded in message */}
              {msg.table && msg.table.length > 0 && (
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-200/60 dark:bg-slate-700/60 font-semibold">
                      <tr>
                        {Object.keys(msg.table[0]).map(k => (
                          <th key={k} className="p-1.5">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {msg.table.map((r, i) => (
                        <tr key={i}>
                          {Object.values(r).map((v: any, j) => (
                            <td key={j} className="p-1.5 font-mono">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Suggested Followups */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Suggested queries:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_followups.map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sugg)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-600 hover:bg-brand-50 transition-colors text-left font-medium"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className={`text-[10px] block text-right pt-0.5 ${msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
            <span>Analyzing dataset & querying statistics...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips at bottom if suggestions available */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Ask:</span>
          {suggestions.slice(0, 3).map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sugg)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 transition-colors"
            >
              {sugg}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about trends, highest values, outliers, averages..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-md shadow-brand-600/30 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
