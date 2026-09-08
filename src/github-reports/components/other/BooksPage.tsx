import React, { useState } from 'react';
import { INITIAL_BOOKS } from '../../data/initialBooks';
import { BookOpen, Search, Filter, Layers, FileCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button';

export const BooksPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredBooks = INITIAL_BOOKS.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Books & Publications Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage active book titles, ISBN identifiers, reflowable/fixed EPUB packages, and edition versions.
          </p>
        </div>
        <Button variant="primary" size="md">
          + Add New Title
        </Button>
      </div>

      {/* Search toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book title, author, or ISBN..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {book.projectCode}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {book.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{book.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">ISBN</span>
                  <span className="font-mono text-slate-800 text-[11px]">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Edition</span>
                  <span className="text-slate-800 text-[11px]">{book.edition}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">EPUB Profile</span>
                  <span className="text-slate-800 font-medium text-[11px]">{book.format}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">{book.chaptersCount} Chapters</span>
              <button
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Inspect Spine</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
