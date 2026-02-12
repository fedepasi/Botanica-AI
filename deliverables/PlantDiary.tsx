import React, { useState, useEffect } from 'react';
import { PlantNote, NoteCategory, CreatePlantNoteInput, GroupedPlantNotes } from '../types';
import { 
  getGroupedPlantNotes, 
  createPlantNote, 
  updatePlantNote, 
  deletePlantNote,
  togglePinNote,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  ALL_NOTE_CATEGORIES,
} from '../services/plantNotesService';
import { useTranslation } from '../hooks/useTranslation';

interface PlantDiaryProps {
  plantId: string;
}

export const PlantDiary: React.FC<PlantDiaryProps> = ({ plantId }) => {
  const { language } = useTranslation();
  const lang = language === 'it' ? 'it' : 'en';
  
  const [groupedNotes, setGroupedNotes] = useState<GroupedPlantNotes>({
    pinned: [],
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('general');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNoteTags, setNewNoteTags] = useState('');

  useEffect(() => {
    loadNotes();
  }, [plantId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const grouped = await getGroupedPlantNotes(plantId);
      setGroupedNotes(grouped);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const input: CreatePlantNoteInput = {
        plantId,
        content: newNoteContent.trim(),
        title: newNoteTitle.trim() || undefined,
        category: newNoteCategory,
        entryDate: newNoteDate,
        tags: newNoteTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await createPlantNote(input);
      
      // Reset form
      setNewNoteContent('');
      setNewNoteTitle('');
      setNewNoteCategory('general');
      setNewNoteDate(new Date().toISOString().split('T')[0]);
      setNewNoteTags('');
      setIsAdding(false);
      
      // Reload notes
      await loadNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handlePinToggle = async (note: PlantNote) => {
    try {
      await togglePinNote(note.id, !note.isPinned);
      await loadNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm(language === 'it' ? 'Eliminare questa nota?' : 'Delete this note?')) return;
    
    try {
      await deletePlantNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const allNotes = [
    ...groupedNotes.pinned.map(n => ({ ...n, group: 'pinned' })),
    ...groupedNotes.today.map(n => ({ ...n, group: 'today' })),
    ...groupedNotes.thisWeek.map(n => ({ ...n, group: 'thisWeek' })),
    ...groupedNotes.thisMonth.map(n => ({ ...n, group: 'thisMonth' })),
    ...groupedNotes.older.map(n => ({ ...n, group: 'older' })),
  ];

  const getGroupLabel = (group: string) => {
    const labels: Record<string, { en: string; it: string }> = {
      pinned: { en: '📌 Pinned', it: '📌 In evidenza' },
      today: { en: '📅 Today', it: '📅 Oggi' },
      thisWeek: { en: '📆 This Week', it: '📆 Questa settimana' },
      thisMonth: { en: '🗓️ This Month', it: '🗓️ Questo mese' },
      older: { en: '📚 Older', it: '📚 Precedenti' },
    };
    return labels[group][lang];
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse text-gray-400">
          {lang === 'it' ? 'Caricamento diario...' : 'Loading diary...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {lang === 'it' ? '📖 Diario della pianta' : '📖 Plant Diary'}
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-garden-green text-white rounded-full text-sm font-medium hover:bg-garden-green/90 transition-colors"
        >
          {isAdding 
            ? (lang === 'it' ? 'Annulla' : 'Cancel')
            : (lang === 'it' ? '+ Aggiungi nota' : '+ Add note')
          }
        </button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder={lang === 'it' ? 'Titolo (opzionale)' : 'Title (optional)'}
            className="w-full px-4 py-2 bg-gray-50 rounded-xl border-transparent focus:border-garden-green focus:bg-white outline-none text-sm font-medium"
          />
          
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={lang === 'it' 
              ? 'Scrivi una nota... (es. "Ottobre: piantato il nashi")' 
              : 'Write a note... (e.g., "October: planted the nashi")'}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 rounded-xl border-transparent focus:border-garden-green focus:bg-white outline-none text-sm resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={newNoteCategory}
              onChange={(e) => setNewNoteCategory(e.target.value as NoteCategory)}
              className="px-4 py-2 bg-gray-50 rounded-xl border-transparent focus:border-garden-green outline-none text-sm"
            >
              {ALL_NOTE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {getCategoryLabel(cat, lang)}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={newNoteDate}
              onChange={(e) => setNewNoteDate(e.target.value)}
              className="px-4 py-2 bg-gray-50 rounded-xl border-transparent focus:border-garden-green outline-none text-sm"
            />
          </div>

          <input
            type="text"
            value={newNoteTags}
            onChange={(e) => setNewNoteTags(e.target.value)}
            placeholder={lang === 'it' ? 'Tag separati da virgola' : 'Tags separated by comma'}
            className="w-full px-4 py-2 bg-gray-50 rounded-xl border-transparent focus:border-garden-green outline-none text-sm"
          />

          <button
            onClick={handleAddNote}
            disabled={!newNoteContent.trim()}
            className="w-full py-3 bg-garden-green text-white rounded-xl font-medium hover:bg-garden-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === 'it' ? 'Salva nota' : 'Save note'}
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {allNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">
              {lang === 'it' 
                ? 'Nessuna nota. Inizia a scrivere il diario della tua pianta!' 
                : 'No notes yet. Start writing your plant diary!'}
            </p>
          </div>
        ) : (
          allNotes.map((note, index) => {
            const showGroupHeader = index === 0 || allNotes[index - 1].group !== note.group;
            
            return (
              <React.Fragment key={note.id}>
                {showGroupHeader && (
                  <div className="pt-4 pb-2 border-t border-gray-100 first:border-t-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {getGroupLabel(note.group)}
                    </span>
                  </div>
                )}
                
                <div className={`bg-white rounded-2xl p-4 border ${note.isPinned ? 'border-garden-yellow' : 'border-gray-100'} shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getCategoryColor(note.category)}`}>
                          {getCategoryIcon(note.category)} {getCategoryLabel(note.category, lang)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.entryDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: note.entryDate.startsWith(new Date().getFullYear().toString()) ? undefined : 'numeric',
                          })}
                        </span>
                        {note.isPinned && (
                          <span className="text-garden-yellow">📌</span>
                        )}
                      </div>

                      {/* Title */}
                      {note.title && (
                        <h4 className="font-semibold text-gray-900 mb-1">{note.title}</h4>
                      )}

                      {/* Content */}
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>

                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handlePinToggle(note)}
                        className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'text-garden-yellow bg-garden-yellow/10' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={note.isPinned 
                          ? (lang === 'it' ? 'Rimuovi dai preferiti' : 'Unpin')
                          : (lang === 'it' ? 'Aggiungi ai preferiti' : 'Pin')
                        }
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={lang === 'it' ? 'Elimina' : 'Delete'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
