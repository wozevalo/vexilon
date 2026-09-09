'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from 'react';

// useLayoutEffect n'existe pas au rendu serveur : on retombe sur useEffect
// pour eviter l'avertissement de React.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  /*
   * Le premier rendu client doit être identique à celui du serveur, sinon
   * React signale une erreur d'hydratation : le serveur ignore localStorage
   * et produit toujours `dark`, alors que lire la préférence dès l'état
   * initial donnait `light`. Navbar et Hero branchent sur cette valeur à une
   * douzaine d'endroits, qui divergeaient donc tous.
   *
   * On démarre donc sur `dark`, comme le serveur, et on adopte la préférence
   * enregistrée juste après le montage — avant le premier affichage, pour
   * qu'aucun clignotement ne soit visible. Le script anti-flash de layout.tsx
   * a de son côté déjà posé la bonne classe sur <html>, si bien que tout ce
   * qui est stylé en CSS est correct dès le départ.
   */
  const [theme, setTheme] = useState<Theme>('dark');
  const hydrated = useRef(false);

  useBeforePaint(() => {
    const stored = localStorage.getItem('vexilon_theme');
    if (stored === 'light') setTheme('light');
    hydrated.current = true;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Ne rien écrire tant que la préférence enregistrée n'a pas été lue,
    // sous peine d'écraser un « light » par le « dark » de départ.
    if (hydrated.current) localStorage.setItem('vexilon_theme', theme);
  }, [theme]);

  // Durée du fondu des couleurs, à garder alignée sur globals.css
  const TRANSITION_MS = 450;
  const transitionTimer = useRef<number | undefined>(undefined);

  /**
   * La classe `theme-transition` n'est posée que le temps de la bascule.
   * L'appliquer en permanence ralentirait aussi les survols et toutes les
   * autres animations du site ; et la poser au premier rendu ferait
   * clignoter la page au chargement.
   */
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, TRANSITION_MS);

    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
