'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logout } from '@/lib/auth';
import { getArticles, addArticle, deleteArticle } from '@/lib/storage';
import { Article } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trash2, ImagePlus, X } from 'lucide-react';

export default function AdminBlogPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Middleware handles auth redirect — just load articles
    getArticles().then(setArticles);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await addArticle(title, content || undefined, imageFile);
      if (!result) throw new Error('La publication a échoué.');
      setTitle('');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      getArticles().then(setArticles);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await deleteArticle(id);
    getArticles().then(setArticles);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/gestion');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold uppercase tracking-widest">
              Back-office <span className="text-vexilon-primary">Actualités</span>
            </h1>
            <p className="text-gray-500 text-xs mt-1">Gérez vos publications et affiches</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/blog"
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              Voir le blog
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm px-6 py-3 hover:bg-vexilon-primary/80 transition-colors mb-10"
          >
            <Plus className="w-4 h-4" />
            Nouvelle publication
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="border border-gray-800 p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-bold uppercase tracking-widest">
                Nouvelle publication
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setContent('');
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-vexilon-primary transition-colors"
                  placeholder="Ex: On revient !"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Texte (optionnel)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-vexilon-primary transition-colors resize-none"
                  placeholder="Description de la publication..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Affiche / Image *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="max-h-64 border border-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 border border-dashed border-gray-700 px-6 py-8 text-gray-500 hover:text-vexilon-primary hover:border-vexilon-primary transition-colors w-full justify-center"
                  >
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-sm uppercase tracking-widest font-bold">Choisir une image</span>
                  </button>
                )}
              </div>

              {submitError && (
                <p className="text-red-500 text-sm">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={!imageFile || !title || submitting}
                className="bg-vexilon-primary text-white font-bold uppercase tracking-widest text-sm px-8 py-3 hover:bg-vexilon-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? 'Publication...' : 'Publier'}
              </button>
            </form>
          </div>
        )}

        {/* Articles list */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">
            Publications ({articles.length})
          </h2>

          {articles.length === 0 && (
            <p className="text-gray-600 text-sm">Aucune publication pour le moment.</p>
          )}

          {articles.map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-4 border border-gray-800 p-4 hover:border-gray-700 transition-colors"
            >
              <img
                src={article.imagePath}
                alt={article.title}
                className="w-20 h-20 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{article.title}</h3>
                {article.content && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{article.content}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(article.id)}
                className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
