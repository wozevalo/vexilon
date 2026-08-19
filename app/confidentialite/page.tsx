'use client';

import { ArrowLeft} from 'lucide-react';
import Link from 'next/link';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-500">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-wider">
            Politique de <span className="text-vexilon-primary">Confidentialité</span>
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
            Introduction
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            VEXILON ESPORT s&apos;engage à protéger la vie privée de ses utilisateurs. La présente politique de confidentialité décrit les données que nous collectons, comment nous les utilisons et les droits dont vous disposez.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Données collectées
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            Ce site ne collecte aucune donnée personnelle automatiquement. Les seules données traitées sont :
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-2">
            <li><strong className="text-gray-900 dark:text-white">Préférences de thème :</strong> stockées localement dans votre navigateur (localStorage)</li>
            <li><strong className="text-gray-900 dark:text-white">Données de contact :</strong> uniquement si vous nous contactez volontairement par email</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Cookies
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Ce site n&apos;utilise pas de cookies tiers ni de trackers publicitaires. Seul le stockage local du navigateur (localStorage) est utilisé pour mémoriser vos préférences d&apos;affichage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Utilisation des données
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Les données stockées localement servent uniquement à améliorer votre expérience utilisateur (thème, préférences). Aucune donnée n&apos;est transmise à des tiers ni utilisée à des fins commerciales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Vos droits
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-2">
            <li>Droit d&apos;accès à vos données personnelles</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d&apos;opposition au traitement</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@vexilon-esport.fr" className="text-vexilon-primary hover:underline">contact@vexilon-esport.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Hébergement des données
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Ce site est hébergé par Ionos (7 place de la Gare, 57200 Sarreguemines, France). Les données de navigation peuvent transiter par leurs serveurs conformément à leur politique de confidentialité.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-bold uppercase tracking-widest text-vexilon-primary mb-4">
            Modification de la politique
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            VEXILON ESPORT se réserve le droit de modifier cette politique de confidentialité à tout moment. Les modifications prennent effet dès leur publication sur cette page.
          </p>
        </section>

        <p className="text-gray-500 dark:text-gray-600 text-xs uppercase tracking-widest pt-8 border-t border-gray-200 dark:border-gray-800">
          Dernière mise à jour : Février 2026
        </p>
      </main>
    </div>
  );
}
