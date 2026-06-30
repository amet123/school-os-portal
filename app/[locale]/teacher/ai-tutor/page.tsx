'use client';
import {useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

type Mode = 'lesson_plan'|'question_paper'|'explanation'|'activity';

const MODES: {id:Mode; label:string; icon:string; desc:string}[] = [
  {id:'lesson_plan',    label:'Lesson Plan',     icon:'📋', desc:'Complete lesson plan with activities'},
  {id:'question_paper', label:'Question Paper',  icon:'📝', desc:'Exam paper with answer key'},
  {id:'explanation',    label:'Explain Concept', icon:'💡', desc:'Clear concept breakdown for students'},
  {id:'activity',       label:'Classroom Activity', icon:'🎮', desc:'Engaging hands-on activity design'},
];

const SUBJECTS = ['Mathematics','Science','English','History','Geography',
                  'Physics','Chemistry','Biology','Computer Science','Economics','Art','Music'];
const GRADES   = ['Pre-KG','KG','Class 1','Class 2','Class 3','Class 4','Class 5',
                  'Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12',
                  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
                  'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

export default function TeacherAiTutorPage() {
  const locale = useLocale();
  const [mode,        setMode]        = useState<Mode>('lesson_plan');
  const [subject,     setSubject]     = useState('Mathematics');
  const [topic,       setTopic]       = useState('');
  const [grade,       setGrade]       = useState('Class 6');
  const [difficulty,  setDifficulty]  = useState('Medium');
  const [numQs,       setNumQs]       = useState(10);
  const [duration,    setDuration]    = useState(45);
  const [result,      setResult]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [copied,      setCopied]      = useState(false);

  async function generate() {
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    setLoading(true); setError(''); setResult(''); setCopied(false);
    const r = await fetch('/api/tutor/teacher/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mode, subject, topic, grade, difficulty, num_questions:numQs, duration_min:duration}),
    });
    setLoading(false);
    if (r.ok) {
      const d = await r.json();
      setResult(d.data?.result || 'No content generated.');
    } else {
      setError('Generation failed. Please try again.');
    }
  }

  function copy() {
    navigator.clipboard.writeText(result).then(()=>{setCopied(true); setTimeout(()=>setCopied(false),2000);});
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3 shadow-sm">
        <Link href={`/${locale}/teacher`} className="text-slate-400 hover:text-slate-600 text-sm">← Portal</Link>
        <div className="w-px h-5 bg-slate-200"/>
        <div className="text-2xl">✨</div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">AI Teaching Assistant</h1>
          <p className="text-xs text-slate-500">Generate lesson plans, papers & more</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Mode selector */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">What to Generate</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(m=>(
                <button key={m.id} onClick={()=>setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${mode===m.id?'border-violet-400 bg-violet-50':'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className={`text-xs font-semibold ${mode===m.id?'text-violet-700':'text-slate-700'}`}>{m.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Topic *</label>
              <input value={topic} onChange={e=>setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Quadratic Equations…"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                <select value={subject} onChange={e=>setSubject(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Grade</label>
                <select value={grade} onChange={e=>setGrade(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {GRADES.map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            {mode==='question_paper' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Difficulty</label>
                  <select value={difficulty} onChange={e=>setDifficulty(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {['Easy','Medium','Hard','Mixed'].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Questions</label>
                  <input type="number" min={3} max={30} value={numQs} onChange={e=>setNumQs(+e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                </div>
              </div>
            )}
            {mode==='lesson_plan' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (minutes)</label>
                <input type="number" min={20} max={120} value={duration} onChange={e=>setDuration(+e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
              </div>
            )}
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={generate} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generating…</>
              ) : (
                <>✨ Generate</>
              )}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-2xl border shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-slate-700 text-sm">
              {result ? MODES.find(m=>m.id===mode)?.label + ' — ' + (topic||'Output') : 'Output'}
            </h2>
            {result && (
              <button onClick={copy}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            )}
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            {!result && !loading && (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="text-4xl mb-3">{MODES.find(m=>m.id===mode)?.icon}</div>
                  <p className="text-slate-400 text-sm">Fill in the details and click Generate.</p>
                  <p className="text-slate-300 text-xs mt-1">Output will appear here.</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">AI is generating your content…</p>
                </div>
              </div>
            )}
            {result && (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{result}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
