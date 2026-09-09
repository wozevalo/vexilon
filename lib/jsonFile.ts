import { writeFileSync, renameSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';

/**
 * Écriture atomique d'un fichier JSON.
 *
 * `writeFileSync` tronque le fichier avant d'écrire : une coupure au mauvais
 * moment (plantage, disque plein, arrêt du conteneur) laisse un JSON
 * incomplet. Les lecteurs du projet interceptent l'erreur d'analyse et
 * renvoient une liste vide — la corruption se traduirait donc par une
 * disparition silencieuse de tous les événements ou articles.
 *
 * On écrit d'abord dans un fichier temporaire, puis on le renomme : sur un
 * même système de fichiers, le renommage est atomique. À tout instant, le
 * fichier de destination est soit l'ancienne version complète, soit la
 * nouvelle — jamais un mélange des deux.
 */
export function writeJsonAtomic(path: string, data: unknown): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const temp = `${path}.${process.pid}.tmp`;

  try {
    writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
    renameSync(temp, path);
  } catch (error) {
    // Ne pas laisser traîner le fichier temporaire en cas d'échec
    try {
      if (existsSync(temp)) unlinkSync(temp);
    } catch {
      /* rien de plus à tenter */
    }
    throw error;
  }
}
