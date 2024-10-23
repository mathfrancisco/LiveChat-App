import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('darkMode');

    if (savedTheme !== null) {
      this.setTheme(savedTheme === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
    }
  }

  private setTheme(isDark: boolean): void {
    this.darkMode.next(isDark);

    // Usar o atributo data-bs-theme do Bootstrap 5.3+
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');

    localStorage.setItem('darkMode', isDark.toString());
  }

  toggleTheme(): void {
    const currentTheme = this.darkMode.value;
    console.log('Current theme before toggle:', currentTheme);
    console.log('Current data-bs-theme:', document.documentElement.getAttribute('data-bs-theme'));

    this.setTheme(!currentTheme);

    console.log('New theme after toggle:', this.darkMode.value);
    console.log('New data-bs-theme:', document.documentElement.getAttribute('data-bs-theme'));
  }
}
