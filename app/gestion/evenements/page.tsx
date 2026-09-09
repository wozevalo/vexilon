'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  ImagePlus,
  Film,
  Youtube,
  Loader2,
  CalendarDays,
  MapPin,
  Save,
  FileUp,
  Eye,
  PenLine,
  Sun,
  Moon,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import AdminShell from '@/components/Admin/AdminShell';
import RichTextEditor from '@/components/Admin/RichTextEditor';
import { VexEvent, EventMedia, EventStatus } from '@/lib/types';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadFile,
  EventPayload,
} from '@/lib/eventsClient';
import { toEmbedUrl, embedPlatform } from '@/lib/media';
import { markdownToHtml, describeImport } from '@/lib/markdownToHtml';

/* ── Helpers dates ────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO → valeur d'un <input type="datetime-local"> (heure locale) */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes())
  );
}

function fromLocalInput(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Réplique la logique serveur pour l'affichage du badge */
function resolveStatus(event: VexEvent): 'upcoming' | 'past' {
  if (event.status === 'upcoming' || event.status === 'past') return event.status;
  const date = new Date(event.endDate || event.startDate);
  if (Number.isNaN(date.getTime())) return 'upcoming';
  if (!event.endDate) date.setHours(23, 59, 59, 999);
  return date.getTime() >= Date.now() ? 'upcoming' : 'past';
}

/* ── État du formulaire ───────────────────────────────────────────────── */

interface FormState {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  coverPath: string;
  coverColor: string;
  excerpt: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  media: EventMedia[];
}

const EMPTY_FORM: FormState = {
  title: '',
  startDate: '',
  endDate: '',
  location: '',
  status: 'auto',
  coverPath: '',
  coverColor: '',
  excerpt: '',
  description: '',
  ctaLabel: '',
  ctaUrl: '',
  media: [],
};

/** Couleurs proposées en un clic, tirées de l'identité du site */
const COVER_PRESETS = ['#bc13fe', '#b700ff', '#5700f3', '#0b0f1a', '#111827', '#f9fafb'];

const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2';
const inputClass =
  'w-full bg-gray-900 border border-gray-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-vexilon-primary transition-colors';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<VexEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedError, setEmbedError] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [descriptionTab, setDescriptionTab] = useState<'write' | 'preview'>('write');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const mediaImageRef = useRef<HTMLInputElement>(null);
  const mediaVideoRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const loadEvents = () => fetchEvents(true).then(setEvents);

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Déduit du contenu du formulaire : aucun champ de mode à stocker, ni à
  // resynchroniser au chargement d'un événement existant.
  const coverMode: 'image' | 'color' = form.coverColor && !form.coverPath ? 'color' : 'image';

  /* ── Ouverture / fermeture du formulaire ───────────────────────────── */

  const openCreate = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setForm({ ...EMPTY_FORM, startDate: toLocalInput(now.toISOString()) });
    setEditingId(null);
    setError(null);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openEdit = (event: VexEvent) => {
    setForm({
      title: event.title,
      startDate: toLocalInput(event.startDate),
      endDate: toLocalInput(event.endDate),
      location: event.location || '',
      status: event.status || 'auto',
      coverPath: event.coverPath || '',
      coverColor: event.coverColor || '',
      excerpt: event.excerpt || '',
      description: event.description || '',
      ctaLabel: event.ctaLabel || '',
      ctaUrl: event.ctaUrl || '',
      media: event.media || [],
    });
    setEditingId(event.id);
    setError(null);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setEmbedUrl('');
    setEmbedError('');
    setImportMessage(null);
    setImportError(null);
    setDescriptionTab('write');
  };

  /* ── Import d'un fichier Markdown ──────────────────────────────── */

  const handleMarkdownImport = async (file?: File) => {
    if (!file) return;
    setImportMessage(null);
    setImportError(null);

    if (file.size > 2 * 1024 * 1024) {
      setImportError('Fichier trop volumineux (2 Mo maximum).');
      return;
    }

    // Le contenu déjà saisi serait perdu : on demande confirmation
    const hasContent = form.description.replace(/<[^>]*>/g, '').trim().length > 0;
    if (hasContent && !confirm('Remplacer la description actuelle par le contenu du fichier ?')) {
      return;
    }

    try {
      const text = await file.text();
      const host = typeof window !== 'undefined' ? window.location.host : undefined;
      const { html, stats } = markdownToHtml(text, host);

      if (!html.trim()) {
        setImportError('Le fichier est vide ou ne contient aucun texte exploitable.');
        return;
      }

      setField('description', html);
      setImportMessage(describeImport(stats));
    } catch {
      setImportError('Lecture du fichier impossible.');
    }
  };

  /* ── Médias ────────────────────────────────────────────────────────── */

  const handleCoverUpload = async (file?: File) => {
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const { path } = await uploadFile(file);
      // Les deux modes s'excluent : choisir une image annule la couleur.
      setForm((prev) => ({ ...prev, coverPath: path, coverColor: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi de l'image a échoué.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleMediaUpload = async (file: File | undefined, type: 'image' | 'video') => {
    if (!file) return;
    setUploadingMedia(true);
    setError(null);
    try {
      const { path } = await uploadFile(file);
      setForm((prev) => ({
        ...prev,
        media: [...prev.media, { id: crypto.randomUUID(), type, path, caption: '' }],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi du fichier a échoué.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const addEmbed = () => {
    const raw = embedUrl.trim();
    if (!raw) return;
    if (!toEmbedUrl(raw, typeof window !== 'undefined' ? window.location.host : undefined)) {
      setEmbedError('Lien non reconnu. Formats acceptés : YouTube, Twitch, Vimeo, Dailymotion.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      media: [...prev.media, { id: crypto.randomUUID(), type: 'embed', url: raw, caption: '' }],
    }));
    setEmbedUrl('');
    setEmbedError('');
  };

  const updateMediaCaption = (id: string, caption: string) =>
    setForm((prev) => ({
      ...prev,
      media: prev.media.map((m) => (m.id === id ? { ...m, caption } : m)),
    }));

  const removeMedia = (id: string) =>
    setForm((prev) => ({ ...prev, media: prev.media.filter((m) => m.id !== id) }));

  /* ── Enregistrement ────────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const startDate = fromLocalInput(form.startDate);
    if (!startDate) {
      setError('La date de début est obligatoire.');
      return;
    }
    const endDate = fromLocalInput(form.endDate);
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('La date de fin doit être postérieure à la date de début.');
      return;
    }

    const payload: EventPayload = {
      title: form.title.trim(),
      description: form.description,
      excerpt: form.excerpt.trim() || undefined,
      coverPath: form.coverPath || undefined,
      coverColor: form.coverColor || undefined,
      location: form.location.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      status: form.status,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaUrl: form.ctaUrl.trim() || undefined,
      media: form.media,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      await loadEvents();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: VexEvent) => {
    if (!confirm('Supprimer définitivement « ' + event.title + ' » ?')) return;
    try {
      await deleteEvent(event.id);
      if (editingId === event.id) closeForm();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La suppression a échoué.');
    }
  };

  /* ── Rendu ─────────────────────────────────────────────────────────── */

  const upcoming = events.filter((e) => resolveStatus(e) === 'upcoming');
  const past = events.filter((e) => resolveStatus(e) === 'past');

  return (
    <AdminShell title="Événements" subtitle="Créez et modifiez les événements affichés sur le site">
      {!showForm && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm px-6 py-3 hover:bg-vexilon-primary/80 transition-colors mb-10"
        >
          <Plus className="w-4 h-4" />
          Nouvel événement
        </button>
      )}

      {/* ── Formulaire ──────────────────────────────────────────────── */}
      {showForm && (
        <div ref={formRef} className="border border-gray-800 p-6 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-display font-bold uppercase tracking-widest">
              {editingId ? "Modifier l'événement" : 'Nouvel événement'}
            </h2>
            <button onClick={closeForm} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations principales */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Ex : Sens Valorant Cup"
                />
              </div>

              <div>
                <label className={labelClass}>Date de début *</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                  required
                  className={inputClass + ' [color-scheme:dark]'}
                />
              </div>

              <div>
                <label className={labelClass}>Date de fin (optionnel)</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                  className={inputClass + ' [color-scheme:dark]'}
                />
              </div>

              <div>
                <label className={labelClass}>Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className={inputClass}
                  placeholder="Ex : Médiathèque La Ruche, Sens"
                />
              </div>

              <div>
                <label className={labelClass}>Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value as EventStatus)}
                  className={inputClass}
                >
                  <option value="auto">Automatique (selon la date)</option>
                  <option value="upcoming">Forcer « À venir »</option>
                  <option value="past">Forcer « Passé »</option>
                </select>
              </div>
            </div>

            {/* Image de couverture */}
            <div>
              <label className={labelClass}>Image de couverture</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleCoverUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              {/* Choix du mode : une image, ou un aplat de couleur */}
              <div className="flex items-center border border-gray-800 w-fit mb-4">
                {([
                  { key: 'image', label: 'Image', icon: ImageIcon },
                  { key: 'color', label: 'Couleur', icon: Palette },
                ] as const).map((mode) => {
                  const Icon = mode.icon;
                  const isActive = coverMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        // Les deux modes s'excluent : basculer efface l'autre.
                        if (mode.key === 'image') {
                          setForm((prev) => ({ ...prev, coverColor: '' }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            coverPath: '',
                            coverColor: prev.coverColor || COVER_PRESETS[0],
                          }));
                        }
                      }}
                      className={
                        'flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-colors ' +
                        (isActive ? 'bg-vexilon-primary text-white' : 'text-gray-400 hover:text-white')
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {coverMode === 'color' ? (
                <div className="flex flex-wrap items-center gap-4">
                  {/* Aperçu au format d'une bannière */}
                  <div
                    className="w-56 h-28 border border-gray-800 flex-shrink-0"
                    style={{ backgroundColor: form.coverColor || COVER_PRESETS[0] }}
                  />

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.coverColor || COVER_PRESETS[0]}
                        onChange={(e) => setField('coverColor', e.target.value)}
                        className="w-10 h-9 p-0 bg-transparent border border-gray-800 cursor-pointer"
                        aria-label="Couleur de couverture"
                      />
                      <input
                        type="text"
                        value={form.coverColor || COVER_PRESETS[0]}
                        onChange={(e) => setField('coverColor', e.target.value.toLowerCase())}
                        className="w-28 bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-vexilon-primary"
                        aria-label="Code hexadecimal"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setField('coverColor', preset)}
                          title={preset}
                          className={
                            'w-7 h-7 border transition-transform hover:scale-110 ' +
                            (form.coverColor === preset ? 'border-white' : 'border-gray-700')
                          }
                          style={{ backgroundColor: preset }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : form.coverPath ? (
                <div className="relative inline-block">
                  <img src={form.coverPath} alt="Couverture" className="max-h-56 border border-gray-800" />
                  <button
                    type="button"
                    onClick={() => setField('coverPath', '')}
                    className="absolute top-2 right-2 bg-black/80 text-white p-1 hover:bg-red-600 transition-colors"
                    title="Retirer la couverture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex items-center gap-3 border border-dashed border-gray-700 px-6 py-8 text-gray-500 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors w-full justify-center disabled:opacity-50"
                >
                  {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
                  <span className="text-sm uppercase tracking-widest font-bold">
                    {uploadingCover ? 'Envoi…' : 'Choisir une image'}
                  </span>
                </button>
              )}
            </div>

            {/* Description riche */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <label className={labelClass + ' mb-0'}>Description de l&apos;événement</label>

                <input
                  ref={markdownInputRef}
                  type="file"
                  accept=".md,.markdown,.txt,text/markdown"
                  className="hidden"
                  onChange={(e) => {
                    handleMarkdownImport(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-2">
                  {/* Bascule écriture / aperçu */}
                  <div className="flex items-center border border-gray-800">
                    {([
                      { key: 'write', label: 'Écrire', icon: PenLine },
                      { key: 'preview', label: 'Aperçu', icon: Eye },
                    ] as const).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = descriptionTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setDescriptionTab(tab.key)}
                          className={
                            'flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest font-bold transition-colors ' +
                            (isActive
                              ? 'bg-vexilon-primary text-white'
                              : 'text-gray-400 hover:text-white')
                          }
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => markdownInputRef.current?.click()}
                    title="Remplacer la description par le contenu d'un fichier Markdown"
                    className="flex items-center gap-2 border border-gray-700 px-3 py-2 text-[11px] uppercase tracking-widest font-bold text-gray-300 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Importer un .md
                  </button>
                </div>
              </div>

              

              {importMessage && (
                <p className="mb-3 border-l-2 border-vexilon-primary bg-vexilon-primary/10 px-3 py-2 text-xs text-gray-300">
                  {importMessage}
                </p>
              )}
              {importError && <p className="mb-3 text-red-500 text-xs">{importError}</p>}

              {descriptionTab === 'write' ? (
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => setField('description', html)}
                  placeholder="Décrivez l'événement : programme, inscriptions, lots à gagner…"
                />
              ) : (
                <div className="border border-gray-800">
                  {/* Barre de l'aperçu */}
                  <div className="flex items-center justify-between gap-3 border-b border-gray-800 bg-black/40 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-gray-500">
                      Rendu sur le site
                    </span>
                    
                  </div>

                  {/* Contenu — mêmes styles que la page publique */}
                  <div className={previewTheme === 'light' ? 'bg-gray-50' : 'bg-black'}>
                    {form.description.replace(/<[^>]*>/g, '').trim() ||
                    /<(img|video|iframe|hr)\b/i.test(form.description) ? (
                      <div
                        className={
                          'rich-content max-w-3xl mx-auto px-6 py-10 min-h-[320px] max-h-[65vh] overflow-y-auto ' +
                          (previewTheme === 'light' ? 'rich-content--light' : '')
                        }
                        // Contenu rédigé par l'administrateur lui-même, déjà rendu
                        // tel quel dans l'éditeur ; assaini côté serveur à l'enregistrement.
                        dangerouslySetInnerHTML={{ __html: form.description }}
                      />
                    ) : (
                      <p className="px-6 py-16 text-center text-sm text-gray-600">
                        Rien à prévisualiser pour le moment.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Résumé */}
            <div>
              <label className={labelClass}>Résumé (affiché sur les cartes)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setField('excerpt', e.target.value)}
                rows={2}
                maxLength={300}
                className={inputClass + ' resize-none'}
                placeholder="Laissez vide pour reprendre automatiquement le début de la description."
              />
            </div>

            {/* Bouton d'action */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Libellé du bouton</label>
                <input
                  type="text"
                  value={form.ctaLabel}
                  onChange={(e) => setField('ctaLabel', e.target.value)}
                  className={inputClass}
                  placeholder="Ex : S'inscrire gratuitement"
                />
              </div>
              <div>
                <label className={labelClass}>Lien du bouton</label>
                <input
                  type="url"
                  value={form.ctaUrl}
                  onChange={(e) => setField('ctaUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://www.helloasso.com/…"
                />
              </div>
            </div>

            {/* Galerie */}
            <div>
              <label className={labelClass}>Galerie (images, vidéos, intégrations)</label>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <input
                  ref={mediaImageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleMediaUpload(e.target.files?.[0], 'image');
                    e.target.value = '';
                  }}
                />
                <input
                  ref={mediaVideoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    handleMediaUpload(e.target.files?.[0], 'video');
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => mediaImageRef.current?.click()}
                  disabled={uploadingMedia}
                  className="flex items-center gap-2 border border-gray-700 px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-300 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  Ajouter une image
                </button>
                <button
                  type="button"
                  onClick={() => mediaVideoRef.current?.click()}
                  disabled={uploadingMedia}
                  className="flex items-center gap-2 border border-gray-700 px-4 py-2 text-xs uppercase tracking-widest font-bold text-gray-300 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors disabled:opacity-50"
                >
                  <Film className="w-4 h-4" />
                  Ajouter une vidéo
                </button>
                {uploadingMedia && (
                  <span className="flex items-center gap-2 text-xs text-vexilon-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Envoi en cours…
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-start gap-2 mb-4">
                <div className="flex-1 min-w-[240px]">
                  <input
                    type="url"
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEmbed();
                      }
                    }}
                    className={inputClass}
                    placeholder="Lien YouTube / Twitch / Vimeo à intégrer"
                  />
                  {embedError && <p className="text-red-500 text-xs mt-2">{embedError}</p>}
                </div>
                <button
                  type="button"
                  onClick={addEmbed}
                  className="flex items-center gap-2 border border-gray-700 px-4 py-3 text-xs uppercase tracking-widest font-bold text-gray-300 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  Intégrer
                </button>
              </div>

              {form.media.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {form.media.map((media) => (
                    <div key={media.id} className="border border-gray-800 p-3">
                      <div className="relative mb-3 bg-black/40 h-32 flex items-center justify-center overflow-hidden">
                        {media.type === 'image' && media.path && (
                          <img src={media.path} alt="" className="w-full h-full object-cover" />
                        )}
                        {media.type === 'video' && media.path && (
                          <video src={media.path} className="w-full h-full object-cover" muted />
                        )}
                        {media.type === 'embed' && media.url && (
                          <div className="text-center px-3">
                            <Youtube className="w-6 h-6 text-vexilon-primary mx-auto mb-2" />
                            <p className="text-xs text-gray-400 break-all line-clamp-2">
                              {embedPlatform(media.url)}
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(media.id)}
                          className="absolute top-1 right-1 bg-black/80 text-white p-1 hover:bg-red-600 transition-colors"
                          title="Retirer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={media.caption || ''}
                        onChange={(e) => updateMediaCaption(media.id, e.target.value)}
                        placeholder="Légende (optionnel)"
                        className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs focus:outline-none focus:border-vexilon-primary"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm px-8 py-3 hover:bg-vexilon-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : "Publier l'événement"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Listes ──────────────────────────────────────────────────── */}
      {loading ? (
        <p className="text-gray-600 text-sm">Chargement…</p>
      ) : events.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucun événement pour le moment.</p>
      ) : (
        <div className="space-y-12">
          <EventGroup title="À venir" events={upcoming} onEdit={openEdit} onDelete={handleDelete} />
          <EventGroup title="Passés" events={past} onEdit={openEdit} onDelete={handleDelete} />
        </div>
      )}
    </AdminShell>
  );
}

/* ── Liste d'événements ───────────────────────────────────────────────── */

function EventGroup({
  title,
  events,
  onEdit,
  onDelete,
}: {
  title: string;
  events: VexEvent[];
  onEdit: (event: VexEvent) => void;
  onDelete: (event: VexEvent) => void;
}) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">
        {title} ({events.length})
      </h2>

      {events.length === 0 ? (
        <p className="text-gray-700 text-sm">Aucun événement dans cette catégorie.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-800 p-4 hover:border-gray-700 transition-colors"
            >
              <div
                className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-900 flex items-center justify-center overflow-hidden"
                style={event.coverColor && !event.coverPath ? { backgroundColor: event.coverColor } : undefined}
              >
                {event.coverPath ? (
                  <img src={event.coverPath} alt="" className="w-full h-full object-cover" />
                ) : event.coverColor ? null : (
                  <CalendarDays className="w-6 h-6 text-gray-700" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">{event.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(event.startDate)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  )}
                </p>
                {event.excerpt && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{event.excerpt}</p>
                )}
                <p className="text-[10px] uppercase tracking-widest text-gray-700 mt-2">
                  {event.media.length} média{event.media.length > 1 ? 's' : ''}
                  {event.status !== 'auto' && ' · statut forcé'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={'/evenements/' + event.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest text-gray-500 hover:text-vexilon-primary transition-colors px-2"
                >
                  Voir
                </a>
                <button
                  onClick={() => onEdit(event)}
                  className="text-gray-500 hover:text-vexilon-primary transition-colors p-2"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(event)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-2"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
