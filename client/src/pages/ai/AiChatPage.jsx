import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';
import { aiService } from '../../services';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

// Suggested questions covering M1, M4, M5
const SUGGESTIONS = [
  { label: 'My balance', q: 'What is my current balance?' },
  { label: 'Last 5 transactions', q: 'Show my last 5 transactions' },
  { label: 'This month spending', q: 'How much did I spend this month?' },
  { label: 'Top recipients', q: 'Who do I transfer money to most?' },
  { label: 'Scheduled transfers', q: 'Do I have any upcoming scheduled transfers?' },
  { label: 'Standing instructions', q: 'Show my active standing instructions' },
  { label: 'Transfers over ₹5000', q: 'Show transfers above ₹5000' },
  { label: 'Financial advice', q: 'How can I save more money based on my spending?' },
  { label: 'This week activity', q: 'What transactions did I make this week?' },
  { label: 'Afford a purchase', q: 'Can I afford a ₹10,000 purchase right now?' },
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-brand-600' : 'bg-gradient-to-br from-purple-500 to-blue-600'}`}>
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
        {msg.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
        ))}
        {msg.toolsUsed?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
            {msg.toolsUsed.map(t => (
              <span key={t} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-mono">{t.replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiChatPage() {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋 I'm your FinCore AI assistant. I have access to your real banking data and can help you with:\n\n• Account balances and transactions\n• Spending analysis and insights\n• Scheduled and standing instructions\n• Financial advice based on your data\n• Search transactions in natural language\n\nWhat would you like to know?`,
    }]);
  }, [user?.firstName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    // Build history for context (last 6 exchanges, skip welcome)
    const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await aiService.chat(msg, history);
      const data = res.data.data;
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, toolsUsed: data.toolsUsed }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. How can I help you, ${user?.firstName}?`,
    }]);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="p-6 pb-0">
        <PageHeader
          title={<span className="flex items-center gap-2"><Sparkles size={22} className="text-purple-500" /> FinCore AI Assistant</span>}
          subtitle="Ask anything about your finances — powered by real banking data"
          action={
            <button onClick={clearChat} className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
              <RefreshCw size={13} /> Clear chat
            </button>
          }
        />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s.q} onClick={() => sendMessage(s.q)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors shadow-sm">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-500">Analysing your data…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about your balance, transactions, spending… (Enter to send)"
              className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-colors"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary p-3 rounded-xl flex-shrink-0 disabled:opacity-40">
            <Send size={17} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <MessageSquare size={11} /> AI responses are grounded in your real account data. Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}
