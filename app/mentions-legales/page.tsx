'use client';

import { ArrowLeft} from 'lucide-react';
import Link from 'next/link';
export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-500">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-wider">
            Mentions <span className="text-vexilon-primary">Légales</span>
          </h1>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-vexilon-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Éditeur du site
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            <p><strong className="text-gray-900 dark:text-white">Nom :</strong> Association VEXILON ESPORT</p>
            <p><strong className="text-gray-900 dark:text-white">Siège social :</strong> Les Étangs de Saint-Ange89400 Bussy-en-Othe</p>
            <p><strong className="text-gray-900 dark:text-white">N° SIREN :</strong> 100 446 095</p>
            <p><strong className="text-gray-900 dark:text-white">N° SIRET (siège) :</strong> 100 446 095 00018</p>
            <p><strong className="text-gray-900 dark:text-white">Email :</strong>contact@vexilon-esport.fr</p>
            <p><strong className="text-gray-900 dark:text-white">Directeur de publication :</strong> Eduardo Teles Dos Santos</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Hébergement
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            <p><strong className="text-gray-900 dark:text-white">Hébergeur :</strong> Ionos</p>
            <p><strong className="text-gray-900 dark:text-white">Adresse :</strong> 7 place de la Gare, 57200 Sarreguemines, France</p>
            <p><strong className="text-gray-900 dark:text-white">Site web :</strong> ionos.fr</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Propriété intellectuelle
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            L&apos;ensemble du contenu de ce site (textes, images, logos, vidéos, éléments graphiques) est la propriété exclusive de VEXILON ESPORT ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Limitation de responsabilité
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            VEXILON ESPORT s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Toutefois, elle ne peut garantir l&apos;exactitude, la complétude et l&apos;actualité des informations mises à disposition. VEXILON ESPORT décline toute responsabilité pour les éventuelles imprécisions, inexactitudes ou omissions portant sur des informations disponibles sur le site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Liens hypertextes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Le site peut contenir des liens vers d&apos;autres sites internet. VEXILON ESPORT n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Droit applicable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>
      </main>
    </div>
  );
}
