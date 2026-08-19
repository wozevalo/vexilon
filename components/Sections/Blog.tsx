'use client';

import React, { useState, useEffect } from 'react';

import { getArticles } from '@/lib/storage';
import { Article } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

const Blog: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    getArticles().then((all) => setArticles(all.slice(0, 1)));
  }, []);

  if (articles.length === 0) return null;

  return (
    <section id="blog" className="py-32 px-6 transition-colors duration-500">
      <div className="container mx-auto">
        {/* Titre */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-4 text-gray-900 dark:text-white">
            ACTUALI<span className="text-vexilon-primary">TÉS</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Les dernières nouvelles de VEXILON.
          </p>
        </div>

        {/* Articles */}
        <div className="space-y-20 max-w-5xl mx-auto">
          {articles.map((article, index) => (
            <article
              key={article.id}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 md:gap-12 items-center`}
            >
              {/* Text */}
              <div className="flex-1 w-full">
                <h3 className="text-xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
                  {article.title}
                </h3>
                <div className="w-10 h-0.5 bg-vexilon-primary mb-4" />
                {article.content && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                    {article.content}
                  </p>
                )}
                <p className="text-gray-400 dark:text-gray-600 text-xs uppercase tracking-widest mt-4">
                  {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Image */}
              <div className="flex-1 w-full">
                <div className="overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-vexilon-primary transition-colors duration-500">
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

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 border-2 border-vexilon-primary text-vexilon-primary font-bold uppercase tracking-widest text-sm px-8 py-3 hover:bg-vexilon-primary hover:text-white transition-colors"
          >
            Voir toutes les actualités
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Blog;
