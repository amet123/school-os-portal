'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Book { name: string; title: string; author: string; category: string; copies_available: number; shelf_location: string; }
interface Borrowing { name: string; book: string; book_title: string; borrowed_date: string; due_date: string; returned_date?: string; status: string; }

const CAT_COLOR: Record<string, string> = {
  Fiction: 'bg-violet-100 text-violet-700',
  Science: 'bg-teal-100 text-teal-700',
  Mathematics: 'bg-blue-100 text-blue-700',
  Language: 'bg-green-100 text-green-700',
  History: 'bg-amber-100 text-amber-700',
  Geography: 'bg-orange-100 text-orange-700',
  Reference: 'bg-slate-100 text-slate-700',
  Other: 'bg-slate-100 text-slate-700',
};
const STATUS_COLOR: Record<string, string> = {
  Borrowed: 'bg-blue-100 text-blue-700',
  Returned: 'bg-green-100 text-green-700',
  Overdue:  'bg-red-100 text-red-700',
};

export default function StudentLibrary() {
  const locale = useLocale();
  const [student, setStudent] = useState('');
  const [books, setBooks]     = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [query, setQuery]     = useState('');
  const [category, setCategory] = useState('');
  const [tab, setTab]         = useState<'catalog'|'mine'>('catalog');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const s = d.session?.student?.name;
      if (!s) return;
      setStudent(s);
      loadBorrowings(s);
    });
    loadBooks();
  }, []);

  function loadBooks() {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('cat', category);
    fetch(`/api/library/books?${params}`).then(r => r.json())
      .then(d => { setBooks(Array.isArray(d) ? d : []); setLoading(false); });
  }
  function loadBorrowings(s: string) {
    fetch(`/api/library/my?student=${encodeURIComponent(s)}`).then(r => r.json())
      .then(d => setBorrowings(Array.isArray(d) ? d : []));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); loadBooks();
  }

  const CATS = ['','Fiction','Non-Fiction','Science','Mathematics','History','Geography','Language','Reference'];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Library</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setTab('catalog')}
                  className={`px-3 py-1 rounded-full transition ${tab==='catalog'?'bg-white text-blue-700 font-semibold':'text-blue-200 hover:text-white'}`}>
            Catalog
          </button>
          <button onClick={() => setTab('mine')}
                  className={`px-3 py-1 rounded-full transition ${tab==='mine'?'bg-white text-blue-700 font-semibold':'text-blue-200 hover:text-white'}`}>
            My Books {borrowings.filter(b=>b.status!=='Returned').length > 0 &&
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                {borrowings.filter(b=>b.status!=='Returned').length}
              </span>}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'catalog' ? (
          <>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input value={query} onChange={e => setQuery(e.target.value)}
                     placeholder="Search title, author, ISBN…"
                     className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <select value={category} onChange={e => setCategory(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {CATS.map(c => <option key={c} value={c}>{c||'All Categories'}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Search</button>
            </form>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}</div>
            ) : books.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No books found.</p>
            ) : (
              <div className="space-y-2">
                {books.map(book => (
                  <div key={book.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{book.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[book.category]||CAT_COLOR.Other}`}>
                        {book.category}
                      </span>
                      <span className={`text-xs font-bold ${(book.copies_available||0)>0?'text-green-600':'text-red-500'}`}>
                        {book.copies_available||0} avail.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          borrowings.length === 0 ? (
            <p className="text-center text-slate-400 py-16">You have no borrowing history.</p>
          ) : (
            <div className="space-y-3">
              {borrowings.map(b => (
                <div key={b.name} className={`bg-white rounded-xl border p-4 ${b.status==='Overdue'?'border-red-200':'border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800">{b.book_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Borrowed: {new Date(b.borrowed_date).toLocaleDateString()}</p>
                      {b.status !== 'Returned' &&
                        <p className={`text-xs mt-0.5 ${b.status==='Overdue'?'text-red-500 font-semibold':'text-slate-400'}`}>
                          Due: {new Date(b.due_date).toLocaleDateString()}
                        </p>}
                      {b.returned_date &&
                        <p className="text-xs text-green-600 mt-0.5">Returned: {new Date(b.returned_date).toLocaleDateString()}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[b.status]||'bg-slate-100 text-slate-600'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
