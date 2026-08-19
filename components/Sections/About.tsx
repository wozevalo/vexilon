import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Target, Users } from 'lucide-react';

const About: React.FC = () => {
  const pillars = [
    {
      icon: <ShieldCheck size={32} />,
      title: "Professionnaliser",
      description: "Encadrer les joueurs locaux dans un environnement structuré, sécurisé et éthique pour les aider à progresser sereinement."
    },
    {
      icon: <Users size={32} />,
      title: "Rassembler",
      description: "Organiser des événements intergénérationnels pour fédérer les passionnés de tous âges et rompre l'isolement numérique."
    },
    {
      icon: <Target size={32} />,
      title: "Dynamiser",
      description: "Collaborer avec les institutions et entreprises de l'Yonne pour faire rayonner le territoire à travers des projets numériques ambitieux."
    },
  ];

  return (
    <section id="about" className="relative py-24 px-6 border-t border-gray-200/20 dark:border-gray-800/30 transition-colors duration-500">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Content */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-1 bg-vexilon-primary"></div>
              <span className="text-vexilon-primary font-bold tracking-widest uppercase">À Propos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight text-gray-900 dark:text-white">
              PLUS QU'UNE ÉQUIPE, <br /> UNE <span className="text-gray-500">MISSION</span>.
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8">
              Implantés dans l'Yonne, nous sommes une équipe de 11 bénévoles animés par une même conviction : faire de notre département un territoire pionnier de l'e-sport responsable. Notre engagement repose sur la passion du jeu vidéo et la volonté de le mettre au service du lien social.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-12">
              Nous défendons un gaming fondé sur le fair-play, l'inclusion et le partage. Chacun de nos événements est pensé comme un espace d'échange où la passion du jeu rapproche les générations et brise l'isolement numérique.
            </p>

            <div className=" grid  grid-cols-3 gap-6">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="flex woze flex-col items-center lg:items-start group">
                  <div className="mb-4 text-vexilon-primary group-hover:scale-110 transition-transform duration-300">
                    {pillar.icon}
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pillar.title}</span>
                  <span className="text-xs text-gray-500 tracking-wide text-center lg:text-left">{pillar.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual/Image Placeholder */}
          <div className="relative">
            <div className="absolute -inset-4 border-2 border-vexilon-primary opacity-30 translate-x-4 translate-y-4"></div>
            <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-900">
              <Image
                src="/img/team.jpg"
                alt="L'équipe Vexilon Esport"
                fill
                className="object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-700"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent dark:from-black dark:via-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <span className="bg-vexilon-primary text-white text-xs font-bold px-3 py-1 uppercase">Saison 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;