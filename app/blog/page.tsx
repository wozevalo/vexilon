'use client';

import React, { useState, useEffect } from 'react';
import { getArticles } from '@/lib/storage';
import { Article } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-wider">
              Actuali<span className="text-vexilon-primary">tés</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Les dernières nouvelles de VEXILON.</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-vexilon-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {loading && (
          <p className="text-gray-500 text-center text-sm">Chargement…</p>
        )}
        {!loading && articles.length === 0 && (
          <p className="text-gray-600 text-center text-sm">Aucune publication pour le moment.</p>
        )}

        <div className="space-y-24">
          {articles.map((article, index) => (
            <article
              key={article.id}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-10 md:gap-16 items-center`}
            >
              {/* Text side */}
              <div className="flex-1 w-full">
                <h2 className="text-2xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
                  {article.title}
                </h2>
                <div className="w-12 h-0.5 bg-vexilon-primary mb-6" />
                {article.content && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {article.content}
                  </p>
                )}
                <p className="text-gray-400 dark:text-gray-600 text-xs uppercase tracking-widest mt-6">
                  {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Image side */}
              <div className="flex-1 w-full">
                <div className="relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                  <img
                    src={article.imagePath}
                    alt={article.title}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
