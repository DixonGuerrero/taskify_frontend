import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeClass = 'dark'; // Cambiado para usar solo la clase 'dark'
  private storageKey = 'taskify-theme';
  
  // Observable para que los componentes puedan suscribirse a cambios de tema
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('system');
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {}

  initializeTheme(): void {
    const storedTheme = localStorage.getItem(this.storageKey);
    
    if (storedTheme) {
      const themeMode = JSON.parse(storedTheme) as ThemeMode;
      this.setTheme(themeMode);
    } else {
      // Por defecto, usar preferencia del sistema
      this.setTheme('system');
    }
    
    // Escuchar cambios en la preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (this.currentThemeSubject.value === 'system') {
        this.applyTheme('system');
      }
    });
  }
  
  setTheme(mode: ThemeMode): void {
    this.currentThemeSubject.next(mode);
    localStorage.setItem(this.storageKey, JSON.stringify(mode));
    this.applyTheme(mode);
  }

  toggleDarkMode(): void {
    const currentMode = this.currentThemeSubject.value;
    const newMode = currentMode === 'dark' ? 'light' : 'dark';
    this.setTheme(newMode);
  }

  private applyTheme(mode: ThemeMode): void {
    if (mode === 'dark') {
      document.documentElement.classList.add(this.darkModeClass);
    } else if (mode === 'light') {
      document.documentElement.classList.remove(this.darkModeClass);
    } else {
      // Modo sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add(this.darkModeClass);
      } else {
        document.documentElement.classList.remove(this.darkModeClass);
      }
    }
  }
  
  // Método para obtener el tema actual
  getCurrentTheme(): ThemeMode {
    return this.currentThemeSubject.value;
  }
}
