'use client';
import {useState, useEffect, useRef, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Message {role:'user'|'assistant'; content:string}
interface Session {name:string; subject:string; title:string; session_date:string; message_count:number}

const SUBJECTS = ['Mathematics','Science','English','History','Geography',
                  'Physics','Chemistry','Biology','Computer Science','Economics'];

export default function AiTutorPage() {
  const router = useRouter();
  const locale  = useLocale();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [activeSession, setActive]  = useState<string|null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState('');
  const [subject,    setSubject]    = useState('Mathematics');
  const [loading,    setLoading]    = useState(false);
  const [typing,     setTyping]     = useState(false);
  const [usage,      setUsage]      = useState<{daily_count:number;daily_limit:number;remaining:number}|null>(null);
  const [error,      setError]      = useState('');

  const fetchSessions = useCallback(async () => {
    const r = await fetch('/api/tutor/sessions');
    if (r.ok) { const d = await r.json(); setSessions(d.data||[]); }
  }, []);

  const fetchUsage = useCallback(async () => {
    const r = await fetch('/api/tutor/usage');
    if (r.ok) { const d = await r.json(); setUsage(d.data); }
  }, []);

  useEffect(() => { fetchSessions(); fetchUsage(); }, [fetchSessions, fetchUsage]);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, typing]);

  async function startSession() {
    setLoading(true); setError('');
    const r = await fetch('/api/tutor/session', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({subject}),
    });
    const d = await r.json();
    if (d.data?.session) {
      setActive(d.data.session);
      setMessages([{role:'assistant',content:`Hi! I'm your ${subject} tutor. What would you like to learn today?`}]);
      await fetchSessions();
    }
    setLoading(false);
  }

  async function loadSession(name:string) {
    const r = await fetch(`/api/tutor/session/${encodeURIComponent(name)}`);
    const d = await r.json();
    if (d.data) {
      setActive(name);
      const msgs: Message[] = d.data.messages || [];
      if (msgs.length === 0) {
        msgs.push({role:'assistant',content:`Welcome back! Continue your ${d.data.subject} session.`});
      }
      setMessages(msgs);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !activeSession || typing) return;
    const msg = input.trim();
    setInput(''); setTyping(true); setError('');
    setMessages(prev => [...prev, {role:'user',content:msg}]);
    const r = await fetch('/api/tutor/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({session_name:activeSession, message:msg}),
    });
    setTyping(false);
    if (r.ok) {
      const d = await r.json();
      if (d.data?.reply) {
        setMessages(prev => [...prev, {role:'assistant',content:d.data.reply}]);
        await fetchUsage();
      }
    } else {
      setError('Failed to get response. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
        <Link href={`/${locale}/student`} className="text-slate-400 hover:text-slate-600 text-sm">← Portal</Link>
        <div className="w-px h-5 bg-slate-200"/>
        <div className="text-2xl">🤖</div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">AI Tutor</h1>
          <p className="text-xs text-slate-500">Your personal academic assistant</p>
        </div>
        {usage && (
          <div className="ml-auto text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {usage.daily_count}/{usage.daily_limit} queries today
          </div>
        )}
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
            <select value={subject} onChange={e=>setSubject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {SUBJECTS.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={startSession} disabled={loading}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
              {loading ? 'Starting…' : '+ New Chat'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">Recent Sessions</p>
            {sessions.length === 0 && <p className="text-xs text-slate-400 px-2">No sessions yet.</p>}
            {sessions.map(s=>(
              <button key={s.name} onClick={()=>loadSession(s.name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${activeSession===s.name?'bg-indigo-100 text-indigo-700 font-semibold':'hover:bg-slate-100 text-slate-600'}`}>
                <div className="font-medium truncate">{s.title || s.subject}</div>
                <div className="text-slate-400 mt-0.5">{s.subject} · {s.session_date}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col">
          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="text-6xl mb-4">🎓</div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">Start Learning</h2>
                <p className="text-slate-500 text-sm mb-4">
                  Select a subject and start a new chat, or continue a previous session.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Mathematics','Science','English','History'].map(s=>(
                    <button key={s} onClick={()=>{setSubject(s); startSession();}}
                      className="p-3 bg-white rounded-xl border hover:border-indigo-300 hover:bg-indigo-50 text-sm font-medium text-slate-700 transition-all">
                      {s==='Mathematics'?'📐':s==='Science'?'🔬':s==='English'?'📖':'🏛️'} {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m,i)=>(
                  <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                    {m.role==='assistant' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg mr-2 flex-shrink-0">🤖</div>}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      m.role==='user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white border text-slate-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {m.content}
                    </div>
                    {m.role==='user' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs ml-2 flex-shrink-0">You</div>}
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg mr-2">🤖</div>
                    <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                      </span>
                    </div>
                  </div>
                )}
                {error && <p className="text-center text-red-500 text-xs">{error}</p>}
                <div ref={bottomRef}/>
              </div>
              <div className="border-t bg-white p-4">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <textarea value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){e.preventDefault();sendMessage();} }}
                    placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="flex-1 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                  <button onClick={sendMessage} disabled={typing || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-5 py-3 text-sm font-semibold transition-colors">
                    Send ↑
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">
                  AI tutor may make mistakes. Always verify important information.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
