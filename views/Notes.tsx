import React, { useState, useEffect } from 'react';
import { Note, User } from '../types';
import { improveNote } from '../services/geminiService';
import { supabase } from '../services/supabase';
import Button from '../components/Button';
import { Plus, Trash2, Wand2, Save, Star, X, Tag, Search, AlignLeft, Filter, Loader2, AlertCircle } from 'lucide-react';

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  user: User;
}

const Notes: React.FC<NotesProps> = ({ notes, setNotes, user }) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Temporary state for the modal editor
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }); // Use created_at as it's safer than updated_at

        if (error) throw error;

        const mappedNotes: Note[] = (data || []).map(item => ({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          lastModified: item.updated_at ? new Date(item.updated_at).getTime() : Date.now(),
        }));

        setNotes(mappedNotes);
      } catch (err: any) {
        console.error('Error fetching notes:', err);
        setFetchError(err.message || JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user.id, setNotes]);

  // Derive unique tags from all notes
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || []))).sort();

  // When a note is opened for editing
  const openNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorTags(note.tags || []);
    setTagInput('');
  };

  const closeNote = () => {
    setEditingNoteId(null);
  };

  const handleCreateNote = async () => {
    try {
      const newNote = {
        user_id: user.id,
        title: '',
        content: '',
        tags: [],
        is_favorite: false,
      };

      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();

      if (error) throw error;

      const mappedNote: Note = {
        id: data.id,
        title: data.title || '',
        content: data.content || '',
        tags: data.tags || [],
        isFavorite: data.is_favorite || false,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        lastModified: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
      };

      setNotes([mappedNote, ...notes]);
      openNote(mappedNote);
    } catch (err: any) {
      console.error('Error creating note:', err);
      alert('Failed to create note: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
        
        setNotes(notes.filter(n => n.id !== id));
        if (editingNoteId === id) closeNote();
      } catch (err: any) {
        console.error('Error deleting note:', err);
        alert('Failed to delete note');
      }
    }
  };

  const toggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Optimistic update
    const updatedStatus = !note.isFavorite;
    setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: updatedStatus } : n));

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: updatedStatus })
        .eq('id', id);

      if (error) {
        // Revert on error
        setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !updatedStatus } : n));
        throw error;
      }
    } catch (err) {
      console.error('Error updating favorite status:', err);
    }
  };

  // Save changes logic
  useEffect(() => {
    if (!editingNoteId) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('notes')
          .update({
            title: editorTitle,
            content: editorContent,
            tags: editorTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNoteId);

        if (error) throw error;

        setNotes(prev => prev.map(n => 
          n.id === editingNoteId 
            ? { ...n, title: editorTitle, content: editorContent, tags: editorTags, lastModified: Date.now() }
            : n
        ));
      } catch (err) {
        console.error('Error saving note:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [editorTitle, editorContent, editorTags, editingNoteId, setNotes]);

  const handleAiAction = async (action: 'fix_grammar' | 'simplify' | 'expand') => {
    if (!editorContent.trim()) return;
    setIsAiProcessing(true);
    try {
      const improved = await improveNote(editorContent, action);
      setEditorContent(improved);
    } catch (error) {
      console.error(error);
      alert("AI Service unavailable. Check API Key.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !editorTags.includes(val)) {
        setEditorTags([...editorTags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tag: string) => {
    setEditorTags(editorTags.filter(t => t !== tag));
  };

  // Filter notes based on search query AND selected tag
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query));
    
    const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  // Sort notes: Favorites first, then by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isFavorite === b.isFavorite) {
      return b.lastModified - a.lastModified;
    }
    return a.isFavorite ? -1 : 1;
  });

  const wordCount = editorContent.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header / Toolbar */}
      <div className="flex flex-col mb-4 gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <h2 className="text-2xl font-bold text-slate-800">Study Notes</h2>
            <p className="text-slate-500">Manage your vocabulary and concepts.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
                <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search notes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all"
                    />
                </div>
                <Button onClick={handleCreateNote} className="shadow-lg shadow-indigo-200 whitespace-nowrap">
                <Plus size={20} /> <span className="hidden sm:inline">New Note</span>
                </Button>
            </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter size={12} /> Filter:
                </span>
                <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                        selectedTag === null 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    All
                </button>
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                            selectedTag === tag 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-center gap-3">
            <AlertCircle size={20} />
            <div className="flex-1">
                <p className="font-bold text-sm">Error loading notes</p>
                <p className="text-xs opacity-90">{fetchError}</p>
            </div>
            <Button variant="secondary" onClick={() => window.location.reload()} className="text-xs h-8">Retry</Button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Loading notes...
        </div>
      ) : notes.length === 0 && !fetchError ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl h-64">
           <div className="bg-slate-50 p-4 rounded-full mb-4">
             <Plus size={32} className="text-slate-300" />
           </div>
           <p>No notes yet. Create one to start!</p>
        </div>
      ) : sortedNotes.length === 0 && !fetchError ? (
        <div className="text-center py-20 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p>No notes found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {sortedNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => openNote(note)}
              className={`
                group relative bg-white p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col h-72
                ${note.isFavorite ? 'border-yellow-200 shadow-yellow-100/50' : 'border-slate-200 hover:border-indigo-300'}
                hover:shadow-xl hover:-translate-y-1
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold text-lg truncate pr-2 ${!note.title ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                  {note.title || 'Untitled Note'}
                </h3>
                <button
                  onClick={(e) => toggleFavorite(note.id, e)}
                  className={`p-1 rounded-full transition-colors ${note.isFavorite ? 'text-yellow-400' : 'text-slate-200 group-hover:text-yellow-400'}`}
                >
                  <Star fill={note.isFavorite ? "currentColor" : "none"} size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden relative mb-2 group-hover:bg-slate-50/50 transition-colors rounded-lg -mx-2 px-2">
                <p className="text-slate-600 text-sm whitespace-pre-wrap font-mono leading-relaxed pt-2">
                  {note.content || <span className="text-slate-300 italic">Empty note...</span>}
                </p>
                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>

              {/* Tags Preview */}
              <div className="flex flex-wrap gap-1 mb-3">
                {note.tags && note.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider rounded-full truncate max-w-[80px]">
                    {tag}
                  </span>
                ))}
                {note.tags && note.tags.length > 3 && (
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-full">
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400">
                  {new Date(note.lastModified).toLocaleDateString()}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Delete Note"
                    >
                      <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Edit Modal */}
      {editingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={closeNote}
          />
          <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="bg-white z-10 border-b border-slate-100 shrink-0">
              <div className="px-6 pt-5 pb-2 flex items-center gap-4">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Note Title"
                  className="flex-1 text-2xl font-bold text-slate-800 outline-none placeholder-slate-300 bg-transparent"
                />
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => toggleFavorite(editingNoteId)}
                      className={`p-2 rounded-full hover:bg-slate-100 ${notes.find(n => n.id === editingNoteId)?.isFavorite ? 'text-yellow-400' : 'text-slate-300'}`}
                      title={notes.find(n => n.id === editingNoteId)?.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star fill={notes.find(n => n.id === editingNoteId)?.isFavorite ? "currentColor" : "none"} size={24} />
                   </button>
                   <button 
                      onClick={closeNote}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                    >
                      <X size={24} />
                   </button>
                </div>
              </div>

              {/* Tag Input Section */}
              <div className="px-6 pb-4 flex items-center flex-wrap gap-2">
                 <div className="text-slate-400">
                   <Tag size={16} />
                 </div>
                 {editorTags.map(tag => (
                   <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                     {tag}
                     <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 rounded-full hover:bg-indigo-200 p-0.5"><X size={10} /></button>
                   </span>
                 ))}
                 <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag (Enter)..."
                    className="text-sm bg-transparent outline-none min-w-[120px] text-slate-600 placeholder-slate-400 hover:placeholder-indigo-300 transition-colors"
                 />
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
               <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                  <div className="bg-white min-h-full shadow-sm rounded-xl border border-slate-200 p-8 sm:p-12 max-w-3xl mx-auto">
                    <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full h-full min-h-[500px] resize-none outline-none text-slate-800 leading-8 font-serif text-lg bg-transparent"
                        placeholder="Start typing your English notes here..."
                        autoFocus
                    />
                  </div>
               </div>
            </div>
               
            {/* Modal Footer / AI Toolbar */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0 z-10">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold mr-2 whitespace-nowrap">
                        <Wand2 size={16} /> AI Tools
                    </div>
                    <Button 
                        variant="secondary" 
                        className="text-xs h-9" 
                        onClick={() => handleAiAction('fix_grammar')}
                        isLoading={isAiProcessing}
                    >
                        Fix Grammar
                    </Button>
                    <Button 
                        variant="secondary" 
                        className="text-xs h-9"
                        onClick={() => handleAiAction('simplify')}
                        isLoading={isAiProcessing}
                    >
                        Simplify
                    </Button>
                    <Button 
                        variant="secondary" 
                        className="text-xs h-9"
                        onClick={() => handleAiAction('expand')}
                        isLoading={isAiProcessing}
                    >
                        Expand
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                         <AlignLeft size={14} /> {wordCount} words
                    </div>
                    <div className="flex items-center gap-1">
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 
                        {isSaving ? 'Saving...' : 'Auto-saved'}
                    </div>
                </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;