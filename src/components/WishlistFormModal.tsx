import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Link2, DollarSign, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { WishItem } from '../types.ts';
import { compressImageToBase64 } from '../utils.ts';

interface WishlistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    price: number | string | null;
    link: string;
    photo: string;
  }) => Promise<void>;
  itemToEdit?: WishItem | null;
}

export default function WishlistFormModal({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
}: WishlistFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoSource, setPhotoSource] = useState<'local' | 'link'>('local');
  const [isCompilingImage, setIsCompilingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setDescription(itemToEdit.description || '');
      setPrice(itemToEdit.price !== null ? String(itemToEdit.price) : '');
      setLink(itemToEdit.link || '');
      setPhoto(itemToEdit.photo || '');
      
      // Heuristic to set photo upload source tab
      if (itemToEdit.photo && itemToEdit.photo.startsWith('data:image')) {
        setPhotoSource('local');
      } else if (itemToEdit.photo) {
        setPhotoSource('link');
      } else {
        setPhotoSource('local');
      }
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setLink('');
      setPhoto('');
      setPhotoSource('local');
    }
    setErrorMsg('');
  }, [itemToEdit, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompilingImage(true);
    setErrorMsg('');
    try {
      const base64 = await compressImageToBase64(file);
      setPhoto(base64);
    } catch (err) {
      console.error(err);
      setErrorMsg('Errore nella compressione della foto. Riprova con un altro file.');
    } finally {
      setIsCompilingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Il nome del regalo è obbligatorio!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // Validate cost
      let parsedPrice: number | string | null = null;
      if (price.trim() !== '') {
        const numeric = parseFloat(price.trim().replace(',', '.'));
        parsedPrice = isNaN(numeric) ? price.trim() : numeric;
      }

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        link: link.trim(),
        photo: photo.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Si è verificato un errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs"
            id="modal-backdrop"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            id="modal-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {itemToEdit ? '✏️' : '🎁'}
                </span>
                <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
                  {itemToEdit ? 'Modifica Regalo' : 'Aggiungi Regalo'}
                </h3>
              </div>
              <button
                type="button"
                id="close-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {errorMsg && (
                <div className="p-3.5 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-xl" id="modal-error">
                  {errorMsg}
                </div>
              )}

              {/* Gift Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block" htmlFor="gift-name">
                  Nome Regalo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="gift-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Profumo Chanel, Escursione in barca..."
                  maxLength={100}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-sm shadow-2xs"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block" htmlFor="gift-description">
                  Descrizione (opzionale)
                </label>
                <textarea
                  id="gift-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Taglia, colore, marca o qualsiasi nota utile per il tuo partner..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-sm shadow-2xs resize-none"
                />
              </div>

              {/* Price & Link Side-by-Side (or stacked on mobile) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1" htmlFor="gift-price">
                    <DollarSign size={12} className="text-slate-400" /> Prezzo (opzionale)
                  </label>
                  <input
                    type="text"
                    id="gift-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Es. 49.99 o Gratis"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-sm shadow-2xs"
                  />
                </div>

                {/* Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1" htmlFor="gift-link">
                    <Link2 size={12} className="text-slate-400" /> Link Prodotto (opzionale)
                  </label>
                  <input
                    type="text"
                    id="gift-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Incolla l'indirizzo del negozio..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-sm shadow-2xs"
                  />
                </div>
              </div>

              {/* Image Input Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Foto del Regalo (opzionale)
                  </label>
                  {/* Photo Source Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs" id="photo-source-selector">
                    <button
                      type="button"
                      onClick={() => setPhotoSource('local')}
                      className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold ${
                        photoSource === 'local'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Dai File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSource('link')}
                      className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold ${
                        photoSource === 'link'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Da Link
                    </button>
                  </div>
                </div>

                {photoSource === 'local' ? (
                  // Local Upload Drag/Drop
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      id="photo-file"
                    />
                    
                    {photo && photo.startsWith('data:image') ? (
                      // Preview uploaded thumbnail
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center">
                        <img
                          src={photo}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setPhoto('')}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs transition-all opacity-90 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-slate-900/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                          Foto compressa (Pronta)
                        </div>
                      </div>
                    ) : (
                      // Empty Drag Trigger area
                      <button
                        type="button"
                        id="local-photo-upload-trigger"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompilingImage}
                        className="w-full py-8 border-2 border-dashed border-slate-250 hover:border-slate-400 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/55 transition-all cursor-pointer text-center group"
                      >
                        {isCompilingImage ? (
                          <Loader2 size={24} className="text-indigo-600 animate-spin mb-2" />
                        ) : (
                          <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors mb-2" />
                        )}
                        <span className="text-xs font-bold text-slate-600">
                          {isCompilingImage ? 'Compressione foto in corso...' : 'Carica immagine locale'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
                          PNG, JPG, HEIC - Ottimizzata al volo
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  // Web URL input
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <ImageIcon className="absolute left-3.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        id="photo-url"
                        value={photo}
                        onChange={(e) => setPhoto(e.target.value)}
                        placeholder="Incolla l'indirizzo dell'immagine (es. https://...)"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-sm shadow-2xs"
                      />
                    </div>
                    {photo && !photo.startsWith('data:image') && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 flex items-center justify-center p-2 relative">
                        <img
                          src={photo}
                          alt="Web Preview"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setPhoto('')}
                          className="absolute top-2 right-2 p-1 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3.5">
              <button
                type="button"
                id="cancel-modal-btn"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-all font-sans cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                id="submit-modal-btn"
                onClick={handleFormSubmit}
                disabled={isSubmitting || isCompilingImage}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 border border-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Salvo...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> {itemToEdit ? 'Aggiorna Regalo' : 'Aggiungi Regalo'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
