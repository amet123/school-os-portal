'use client';
import {useEffect, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Thread { name: string; subject: string; student_name: string; status: string; last_message_on: string; unread: number; }
interface Msg    { name: string; sender: string; sender_role: string; sender_name: string; body: string; sent_on: string; }

export default function TeacherMessages() {
  const locale = useLocale();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSel]    = useState<string|null>(null);
  const [subject, setSubject] = useState('');
  const [messages, setMsgs]   = useState<Msg[]>([]);
  const [newBody, setNewBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, []);

  function loadThreads() {
    setLoading(true);
    fetch('/api/messages/threads').then(r=>r.json()).then(d => {
      setThreads(Array.isArray(d)?d:[]); setLoading(false);
    }).catch(() => setLoading(false));
  }

  function openThread(t: Thread) {
    setSel(t.name); setSubject(t.subject);
    fetch(`/api/messages/thread?id=${encodeURIComponent(t.name)}`).then(r=>r.json()).then(d => {
      setMsgs(d.messages ?? []);
      // refresh unread counts
      loadThreads();
      setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100);
    });
  }

  function sendReply() {
    if (!newBody.trim() || !selected) return;
    setSending(true);
    fetch('/api/messages/send', {method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({thread:selected, body:newBody}),
    }).then(r=>r.json()).then(() => {
      setNewBody('');
      fetch(`/api/messages/thread?id=${encodeURIComponent(selected!)}`).then(r=>r.json()).then(d => {
        setMsgs(d.messages??[]); setSending(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100);
      });
    }).catch(() => setSending(false));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Parent Messages</h1>
      </header>
      <div className="flex flex-1 max-w-2xl w-full mx-auto">
        <div className={`${selected?'hidden md:flex':'flex'} flex-col w-full md:w-72 bg-white border-r border-slate-200`}>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2].map(i=><div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse"/>)}</div>
          ) : threads.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No messages.</p>
          ) : threads.map(t => (
            <button key={t.name} onClick={() => openThread(t)}
                    className={`text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${selected===t.name?'bg-teal-50':''}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate flex-1">{t.subject}</p>
                {t.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {t.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{t.student_name}</p>
            </button>
          ))}
        </div>
        {selected ? (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-2">
              <button onClick={() => setSel(null)} className="md:hidden text-slate-400 text-sm mr-2">←</button>
              <p className="font-semibold text-slate-700 text-sm flex-1">{subject}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[55vh]">
              {messages.map(m => (
                <div key={m.name} className={`flex ${m.sender_role==='Teacher'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.sender_role==='Teacher'?'bg-teal-600 text-white':'bg-slate-100 text-slate-800'}`}>
                    <p className="font-medium text-xs mb-1 opacity-70">{m.sender_name||m.sender_role}</p>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className="text-[10px] opacity-60 mt-1 text-right">{String(m.sent_on||'').slice(0,16)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2">
              <textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Reply…" rows={2}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              <button onClick={sendReply} disabled={sending||!newBody.trim()}
                      className="bg-teal-600 text-white text-sm px-4 rounded-xl disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-slate-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
