'use client';
import {useEffect, useRef, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Thread { name: string; subject: string; student_name: string; status: string; last_message_on: string; }
interface Msg    { name: string; sender: string; sender_role: string; sender_name: string; body: string; sent_on: string; }

export default function ParentMessages() {
  const locale = useLocale();
  const [student, setStudent] = useState('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSel]    = useState<string|null>(null);
  const [messages, setMsgs]   = useState<Msg[]>([]);
  const [subject, setSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSubj, setNewSubj] = useState('');
  const [newMsg, setNewMsg]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      const s = d.session?.student?.name || '';
      setStudent(s);
      loadThreads();
    });
  }, []);

  function loadThreads() {
    setLoading(true);
    fetch('/api/messages/threads').then(r=>r.json()).then(d => {
      setThreads(Array.isArray(d)?d:[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  function openThread(t: Thread) {
    setSel(t.name); setSubject(t.subject);
    fetch(`/api/messages/thread?id=${encodeURIComponent(t.name)}`).then(r=>r.json()).then(d => {
      setMsgs(d.messages ?? []);
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
        setMsgs(d.messages ?? []);
        setSending(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({behavior:'smooth'}), 100);
      });
    }).catch(() => setSending(false));
  }

  function startThread() {
    if (!newSubj.trim() || !newMsg.trim() || !student) return;
    setSending(true);
    fetch('/api/messages/start', {method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({student, subject:newSubj, body:newMsg}),
    }).then(r=>r.json()).then(() => {
      setNewSubj(''); setNewMsg(''); setShowNew(false); setSending(false);
      loadThreads();
    }).catch(() => setSending(false));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-violet-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Messages</h1>
        <button onClick={() => setShowNew(!showNew)}
                className="text-sm bg-white text-violet-700 font-semibold px-3 py-1.5 rounded-lg">
          + New
        </button>
      </header>

      {showNew && (
        <div className="bg-white border-b border-slate-200 px-4 py-4 max-w-2xl w-full mx-auto">
          <p className="text-sm font-medium text-slate-700 mb-2">New Message to Teacher</p>
          <input value={newSubj} onChange={e=>setNewSubj(e.target.value)} placeholder="Subject"
                 className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400"/>
          <textarea value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="Your message…" rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"/>
          <div className="flex gap-2">
            <button onClick={startThread} disabled={sending}
                    className="bg-violet-600 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50">
              Send
            </button>
            <button onClick={() => setShowNew(false)} className="text-sm text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-1 max-w-2xl w-full mx-auto">
        {/* Thread list */}
        <div className={`${selected?'hidden md:flex':'flex'} flex-col w-full md:w-64 bg-white border-r border-slate-200`}>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2].map(i=><div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse"/>)}</div>
          ) : threads.length === 0 ? (
            <p className="text-slate-400 text-sm p-4">No conversations yet.</p>
          ) : threads.map(t => (
            <button key={t.name} onClick={() => openThread(t)}
                    className={`text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${selected===t.name?'bg-violet-50':''}`}>
              <p className="text-sm font-semibold text-slate-800 truncate">{t.subject}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.student_name}</p>
              <p className={`text-xs mt-0.5 ${t.status==='Open'?'text-green-600':'text-slate-400'}`}>{t.status}</p>
            </button>
          ))}
        </div>

        {/* Messages pane */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center gap-2">
              <button onClick={() => setSel(null)} className="md:hidden text-slate-400 text-sm mr-2">←</button>
              <p className="font-semibold text-slate-700 text-sm flex-1">{subject}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 max-h-[55vh]">
              {messages.map(m => (
                <div key={m.name} className={`flex ${m.sender_role==='Teacher'?'justify-start':'justify-end'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.sender_role==='Teacher'?'bg-slate-100 text-slate-800':'bg-violet-600 text-white'}`}>
                    <p className="font-medium text-xs mb-1 opacity-70">{m.sender_name || m.sender_role}</p>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className="text-[10px] opacity-60 mt-1 text-right">{String(m.sent_on||'').slice(0,16)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2">
              <textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Type a message…" rows={2}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"/>
              <button onClick={sendReply} disabled={sending||!newBody.trim()}
                      className="bg-violet-600 text-white text-sm px-4 rounded-xl disabled:opacity-50">
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
