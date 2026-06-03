import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Edit2, Trash2, Gift, Lock, Calendar, Loader2, Check } from 'lucide-react';
import { WishItem } from '../types.ts';
import { formatPrice, sanitizeUrl } from '../utils.ts';

interface WishlistItemCardProps {
  key?: string;
  item: WishItem;
  currentUserEmail: string;
  onEdit: (item: WishItem) => void;
  onDelete: (item: WishItem) => void | Promise<void>;
  onToggleReserve: (item: WishItem) => Promise<void>;
  onTogglePurchase: (item: WishItem) => Promise<void>;
  isOwnerOfList: boolean;
}

export default function WishlistItemCard({
  item,
  currentUserEmail,
  onEdit,
  onDelete,
  onToggleReserve,
  onTogglePurchase,
  isOwnerOfList,
}: WishlistItemCardProps) {
  const formattedPrice = formatPrice(item.price);
  const cleanLink = item.link ? sanitizeUrl(item.link) : '';
  
  // Decide what image to display. If empty, show a high-contrast nice placeholder.
  const hasPhoto = item.photo && item.photo.trim().length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden flex flex-col h-full group"
      id={`wish-card-${item.id}`}
    >
      {/* Photo Header */}
      <div className="relative aspect-[4/3] w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {hasPhoto ? (
          <img
            src={item.photo}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300 py-12">
            <Gift size={36} className="stroke-1 text-indigo-300" />
            <span className="text-[10px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">Foto</span>
          </div>
        )}

        {/* Price Tag Overlay (if exists) */}
        {formattedPrice && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/95 border border-slate-100 text-indigo-600 text-xs font-bold rounded-lg shadow-xs italic">
            {formattedPrice}
          </span>
        )}

        {/* Surprise/Reservation badges only observable by corresponding user roles */}
        {isOwnerOfList ? (
          // Sweet surprise seal for the owner
          <div className="absolute top-3 right-3 flex gap-2">
            {item.isPurchased && item.purchasedBy === item.listOwner && (
              <div className="px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-xs flex items-center gap-1 shadow-xs">
                <Check size={10} /> Preso da me
              </div>
            )}
            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <Lock size={10} /> Sorpresa 💝
            </div>
          </div>
        ) : (
          // Reservation indicator shown ONLY to the visitor
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {item.isPurchased && item.purchasedBy === currentUserEmail && (
              <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <Check size={9} /> Già Acquistato
              </div>
            )}
            {item.isReserved && !item.isPurchased && (
              <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <Check size={9} />
                {item.reservedBy === currentUserEmail ? 'Prenotato da te' : 'Già Prenotato'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Body Details */}
      <div className="p-4.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Item Name */}
          <h4 className="font-bold text-slate-800 tracking-tight text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors">
            {item.name}
          </h4>

          {/* Item Description */}
          {item.description ? (
            <p className="text-xs text-slate-500 leading-relaxed font-sans italic whitespace-pre-line break-words">
              {item.description}
            </p>
          ) : (
            <p className="text-xs text-slate-300 italic">Nessuna descrizione</p>
          )}
        </div>

        {/* Buttons and Actions footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          {isOwnerOfList ? (
            // Actions for Owner
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  id={`edit-item-${item.id}`}
                  onClick={() => onEdit(item)}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                >
                  <Edit2 size={11} /> Modifica
                </button>
                <button
                  type="button"
                  id={`delete-item-${item.id}`}
                  onClick={() => onDelete(item)}
                  className="py-1.5 px-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                  title="Elimina regalo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onTogglePurchase(item)}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer w-full ${
                  item.isPurchased && item.purchasedBy === item.listOwner
                    ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 shrink-0'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shrink-0'
                }`}
              >
                {item.isPurchased && item.purchasedBy === item.listOwner ? (
                  <>❌ Annulla acquisto personale</>
                ) : (
                  <>🛍️ L'ho comprato da me</>
                )}
              </button>
            </div>
          ) : (
            // Actions for Visitor
            <div className="flex flex-col gap-1.5 w-full">
              {item.isReserved ? (
                item.reservedBy === currentUserEmail || item.purchasedBy === currentUserEmail ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onTogglePurchase(item)}
                      className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        item.isPurchased
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100'
                      }`}
                    >
                      {item.isPurchased ? <><Check size={11} /> Acquistato!</> : <>🛍️ Segna come Acquistato</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleReserve(item)}
                      id={`unreserve-item-${item.id}`}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                    >
                      <Check size={11} className="text-emerald-500" />
                      Annulla Prenotazione
                    </button>
                  </>
                ) : (
                  // Reserved or bought by someone else
                  <button
                    type="button"
                    disabled
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Lock size={11} /> Già Prenotato
                  </button>
                )
              ) : (
                // Unreserved. Visitor can click to reserve!
                <button
                  type="button"
                  onClick={() => onToggleReserve(item)}
                  id={`reserve-item-${item.id}`}
                  className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  💝 Prenota questo regalo
                </button>
              )}
            </div>
          )}

          {/* Shop button overlay if link is provided */}
          {cleanLink && (
            <a
              href={cleanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 py-1.5 px-3 rounded-xl border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all bg-white cursor-pointer text-xs font-bold"
              title="Vedi Prodotto"
              id={`link-item-${item.id}`}
            >
              <ExternalLink size={12} /> Apri Link Prodotto
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
