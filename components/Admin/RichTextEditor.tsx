'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  ImagePlus,
  Film,
  Youtube,
  Quote,
  AlignLeft,
  AlignCenter,
  Eraser,
  Type,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { uploadFile } from '@/lib/eventsClient';
import { toEmbedUrl } from '@/lib/media';
import { markdownToHtml } from '@/lib/markdownToHtml';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/** Tailles proposées par les boutons « agrandir le texte » */
const FONT_SIZES = [
  { label: 'Normal', size: '' },
  { label: 'Grand', size: '1.25em' },
  { label: 'Très grand', size: '1.6em' },
  { label: 'Énorme', size: '2em' },
];

type PromptKind = 'link' | 'embed' | null;

const btnBase =
  'flex items-center justify-center h-8 min-w-8 px-2 rounded text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const Divider = () => <span className="w-px h-5 bg-gray-700 mx-1 self-center" />;

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [promptKind, setPromptKind] = useState<PromptKind>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notice, setNotice] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  /* ── Synchronisation avec la valeur externe ────────────────────────── */
  // On n'écrit dans le DOM que si la valeur vient de l'extérieur (chargement
  // d'un événement à modifier) : sinon le curseur sauterait à chaque frappe.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
    setIsEmpty(!editor.textContent?.trim() && !editor.querySelector('img, video, iframe'));
  }, [value]);

  /* ── Sélection ─────────────────────────────────────────────────────── */

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }, []);

  /** Rend le focus à l'éditeur et restaure la sélection mémorisée */
  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;

    if (savedRange.current && editor.contains(savedRange.current.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
      return;
    }
    // Pas de sélection mémorisée : on place le curseur à la fin
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    setIsEmpty(!editor.textContent?.trim() && !editor.querySelector('img, video, iframe'));
    onChange(editor.innerHTML);
  }, [onChange]);

  /* ── Commandes ─────────────────────────────────────────────────────── */

  const exec = useCallback(
    (command: string, argument?: string) => {
      restoreSelection();
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(command, false, argument);
      saveSelection();
      emitChange();
    },
    [emitChange, restoreSelection, saveSelection]
  );

  const applyFontSize = useCallback(
    (size: string) => {
      restoreSelection();
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setUploadError('Sélectionnez d’abord le texte à agrandir.');
        return;
      }
      setUploadError('');

      // Astuce classique : execCommand ne sait produire que <font size>,
      // on convertit ensuite chaque balise en <span style="font-size">.
      document.execCommand('fontSize', false, '7');
      editorRef.current?.querySelectorAll('font[size="7"]').forEach((font) => {
        const span = document.createElement('span');
        if (size) span.style.fontSize = size;
        span.innerHTML = font.innerHTML;
        font.replaceWith(span);
      });
      emitChange();
    },
    [emitChange, restoreSelection]
  );

  /** Insère du HTML à l'emplacement du curseur */
  const insertHtml = useCallback(
    (html: string) => {
      restoreSelection();
      document.execCommand('insertHTML', false, html + '<p><br></p>');
      emitChange();
    },
    [emitChange, restoreSelection]
  );

  /* ── Liens et intégrations ─────────────────────────────────────────── */

  const openPrompt = (kind: PromptKind) => {
    saveSelection();
    if (kind === 'link') {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setUploadError('Sélectionnez d’abord le texte à transformer en lien.');
        return;
      }
    }
    setUploadError('');
    setPromptError('');
    setPromptValue('');
    setPromptKind(kind);
  };

  const confirmPrompt = () => {
    const raw = promptValue.trim();
    if (!raw) return;

    if (promptKind === 'link') {
      const url = /^(https?:\/\/|mailto:|\/|#)/i.test(raw) ? raw : 'https://' + raw;
      exec('createLink', url);
      // Les liens créés s'ouvrent dans un nouvel onglet
      editorRef.current?.querySelectorAll('a[href]').forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        if (/^https?:\/\//i.test(href)) {
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
        }
      });
      emitChange();
    } else if (promptKind === 'embed') {
      const embedUrl = toEmbedUrl(raw, window.location.host);
      if (!embedUrl) {
        setPromptError('Lien non reconnu. Formats acceptés : YouTube, Twitch, Vimeo, Dailymotion.');
        return;
      }
      insertHtml(
        '<figure><iframe src="' + embedUrl + '" title="Vidéo" allowfullscreen></iframe></figure>'
      );
    }

    setPromptKind(null);
    setPromptValue('');
  };

  /* ── Envoi de fichiers ─────────────────────────────────────────────── */

  const handleFile = async (file: File | undefined, kind: 'image' | 'video') => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { path } = await uploadFile(file);
      insertHtml(
        kind === 'image'
          ? '<figure><img src="' + path + '" alt="" /></figure>'
          : '<figure><video src="' + path + '" controls></video></figure>'
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "L'envoi du fichier a échoué.");
    } finally {
      setUploading(false);
    }
  };

  /* ── Markdown tapé ou collé ────────────────────────────────────────── */

  /** Le texte contient-il des marqueurs Markdown sans ambiguïté ? */
  const MARKDOWN_PATTERNS = [
    /(?:^|[\r\n])[ \t]*#{1,4}[ \t]+\S/, // # Titre
    /(?:^|[\r\n])[ \t]*[-*+][ \t]+\S/, // - liste
    /(?:^|[\r\n])[ \t]*\d+[.)][ \t]+\S/, // 1. liste
    /(?:^|[\r\n])[ \t]*>[ \t]+\S/, // > citation
    /\*\*[^*\r\n]+\*\*/, // **gras**
    /\[[^\]\r\n]+\]\([^)\s]+\)/, // [texte](url)
  ];

  const looksLikeMarkdown = (text: string): boolean =>
    MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboard = event.clipboardData;
    const richText = clipboard.getData('text/html');
    const plainText = clipboard.getData('text/plain');

    // Contenu déjà mis en forme (copié depuis une page web) : collage normal
    if (richText || !plainText || !looksLikeMarkdown(plainText)) return;

    event.preventDefault();
    const { html } = markdownToHtml(plainText, window.location.host);
    if (!html) return;

    document.execCommand('insertHTML', false, html);
    emitChange();
    setNotice('Markdown détecté : le texte collé a été mis en forme automatiquement.');
  };

  /**
   * Raccourcis Markdown à la frappe : « # » puis espace donne un titre,
   * « - » puis espace une liste, etc. - comme dans Notion ou Discord.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== ' ') return;

    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return;

    const node = selection.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE || node.previousSibling) return;

    const marker = (node.textContent || '').slice(0, selection.anchorOffset);
    let apply: (() => void) | null = null;

    if (/^#{1,4}$/.test(marker)) {
      apply = () => document.execCommand('formatBlock', false, '<h' + marker.length + '>');
    } else if (marker === '>') {
      apply = () => document.execCommand('formatBlock', false, '<blockquote>');
    } else if (marker === '-' || marker === '*' || marker === '+') {
      apply = () => document.execCommand('insertUnorderedList');
    } else if (/^\d+[.)]$/.test(marker)) {
      apply = () => document.execCommand('insertOrderedList');
    }
    if (!apply) return;

    event.preventDefault();

    // Retire le marqueur puis replace le curseur en début de ligne
    node.textContent = (node.textContent || '').slice(marker.length);
    const range = document.createRange();
    range.setStart(node, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand('styleWithCSS', false, 'true');
    apply();
    emitChange();
  };

  /* ── Rendu ─────────────────────────────────────────────────────────── */

  // Empêche la perte du focus quand on clique sur un bouton de la barre d'outils
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="border border-gray-800 bg-gray-900/40 focus-within:border-vexilon-primary transition-colors">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-800 p-2 bg-black/40">
        {/* Titres */}
        {(['h1', 'h2', 'h3'] as const).map((tag) => (
          <button
            key={tag}
            type="button"
            onMouseDown={keepFocus}
            onClick={() => exec('formatBlock', '<' + tag + '>')}
            className={btnBase + ' font-display font-bold uppercase text-xs'}
            title={'Titre ' + tag.slice(1)}
          >
            {tag.toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => exec('formatBlock', '<p>')}
          className={btnBase + ' text-xs uppercase tracking-wide'}
          title="Paragraphe normal"
        >
          ¶
        </button>

        <Divider />

        {/* Taille du texte */}
        <span className="flex items-center gap-1 text-gray-500" title="Taille du texte">
          <Type className="w-3.5 h-3.5" />
        </span>
        {FONT_SIZES.map((item) => (
          <button
            key={item.label}
            type="button"
            onMouseDown={keepFocus}
            onClick={() => applyFontSize(item.size)}
            className={btnBase + ' text-[11px]'}
            title={'Texte : ' + item.label.toLowerCase()}
          >
            {item.label === 'Normal' ? 'A' : item.label === 'Grand' ? 'A+' : item.label === 'Très grand' ? 'A++' : 'A+++'}
          </button>
        ))}

        <Divider />

        {/* Styles */}
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('bold')} className={btnBase} title="Gras">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('italic')} className={btnBase} title="Italique">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('underline')} className={btnBase} title="Souligné">
          <Underline className="w-4 h-4" />
        </button>

        <Divider />

        {/* Listes et blocs */}
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('insertUnorderedList')} className={btnBase} title="Liste à puces">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('insertOrderedList')} className={btnBase} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('formatBlock', '<blockquote>')} className={btnBase} title="Citation">
          <Quote className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('justifyLeft')} className={btnBase} title="Aligner à gauche">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('justifyCenter')} className={btnBase} title="Centrer">
          <AlignCenter className="w-4 h-4" />
        </button>

        <Divider />

        {/* Liens */}
        <button type="button" onMouseDown={keepFocus} onClick={() => openPrompt('link')} className={btnBase} title="Insérer un lien cliquable">
          <Link2 className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => exec('unlink')} className={btnBase} title="Retirer le lien">
          <Link2Off className="w-4 h-4" />
        </button>

        <Divider />

        {/* Médias */}
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => {
            saveSelection();
            imageInputRef.current?.click();
          }}
          disabled={uploading}
          className={btnBase}
          title="Insérer une image"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => {
            saveSelection();
            videoInputRef.current?.click();
          }}
          disabled={uploading}
          className={btnBase}
          title="Insérer une vidéo (fichier)"
        >
          <Film className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={keepFocus} onClick={() => openPrompt('embed')} className={btnBase} title="Intégrer une vidéo YouTube / Twitch / Vimeo">
          <Youtube className="w-4 h-4" />
        </button>

        <Divider />

        <button type="button" onMouseDown={keepFocus} onClick={() => exec('removeFormat')} className={btnBase} title="Effacer la mise en forme">
          <Eraser className="w-4 h-4" />
        </button>

        {uploading && (
          <span className="flex items-center gap-2 text-xs text-vexilon-primary ml-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Envoi…
          </span>
        )}
      </div>

      {/* Champ URL (lien ou intégration vidéo) */}
      {promptKind && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-black/60 p-2">
          <input
            autoFocus
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmPrompt();
              }
              if (e.key === 'Escape') setPromptKind(null);
            }}
            placeholder={
              promptKind === 'link'
                ? 'https://exemple.fr - adresse du lien'
                : 'https://youtube.com/watch?v=… ou lien Twitch / Vimeo'
            }
            className="flex-1 min-w-[220px] bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-vexilon-primary"
          />
          <button type="button" onClick={confirmPrompt} className="flex items-center gap-1 bg-vexilon-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-2 hover:bg-vexilon-primary/80 transition-colors">
            <Check className="w-3.5 h-3.5" />
            Valider
          </button>
          <button type="button" onClick={() => setPromptKind(null)} className="text-gray-500 hover:text-white transition-colors p-2">
            <X className="w-4 h-4" />
          </button>
          {promptError && <p className="w-full text-red-500 text-xs">{promptError}</p>}
        </div>
      )}

      {uploadError && <p className="text-red-500 text-xs px-3 pt-2">{uploadError}</p>}
      {notice && (
        <p className="flex items-center justify-between gap-3 border-b border-gray-800 bg-vexilon-primary/10 px-3 py-2 text-xs text-gray-300">
          {notice}
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Masquer le message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </p>
      )}

      {/* Zone d'édition */}
      <div className="relative">
        {isEmpty && placeholder && (
          <p className="pointer-events-none absolute top-4 left-4 text-sm text-gray-600">{placeholder}</p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Description de l'événement"
          onInput={emitChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            saveSelection();
            emitChange();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          className="rich-content rich-content--editor min-h-[320px] max-h-[65vh] overflow-y-auto p-4 text-sm focus:outline-none"
        />
      </div>

      {/* Champs fichiers masqués */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0], 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0], 'video');
          e.target.value = '';
        }}
      />
    </div>
  );
}
