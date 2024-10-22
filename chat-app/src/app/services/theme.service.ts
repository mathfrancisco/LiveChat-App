import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    // Aplica o tema inicial
    this.initializeTheme();

    // Adiciona listener para mudanças na preferência do sistema
    this.watchSystemThemeChanges();
  }

  private initializeTheme(): void {
    // Verifica se há preferência salva no localStorage
    const savedTheme = localStorage.getItem('darkMode');

    if (savedTheme !== null) {
      this.setTheme(savedTheme === 'true');
    } else {
      // Verifica preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
    }
  }

  private watchSystemThemeChanges(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('darkMode')) {
        this.setTheme(e.matches);
      }
    };

    // Remove listener antigo se existir
    mediaQuery.removeEventListener('change', handleChange);
    // Adiciona novo listener
    mediaQuery.addEventListener('change', handleChange);
  }

  private setTheme(isDark: boolean): void {
    // Atualiza o estado interno
    this.darkMode.next(isDark);

    // Aplica a classe tanto no documentElement quanto no body
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);

    // Salva a preferência
    localStorage.setItem('darkMode', isDark.toString());
  }

  toggleTheme(): void {
    this.setTheme(!this.darkMode.value);
  }
}
