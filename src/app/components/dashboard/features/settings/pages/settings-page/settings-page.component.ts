import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SliderModule } from 'primeng/slider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ThemeMode, ThemeService } from '../../../../../../core/theme/service/theme.service';


interface Settings {
  theme: ThemeMode;
  primaryColor: string;
  density: string;
  language: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    upcomingTasks: boolean;
    mentions: boolean;
  };
  accessibility: {
    reduceAnimations: boolean;
    highContrast: boolean;
    fontSize: number;
  };
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputSwitchModule,
    DropdownModule,
    SelectButtonModule,
    SliderModule,
    ToastModule
  ],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css'],
  providers: [MessageService]
})
export class SettingsPageComponent implements OnInit {
  activeSection: string = 'appearance';
  
  settings: Settings = {
    theme: 'system',
    primaryColor: 'indigo',
    density: 'comfortable',
    language: 'es',
    notifications: {
      email: true,
      inApp: true,
      upcomingTasks: true,
      mentions: true
    },
    accessibility: {
      reduceAnimations: false,
      highContrast: false,
      fontSize: 100
    }
  };
  
  // Opciones para los selectores
  primaryColors = [
    { id: 'indigo', value: '#6366F1' },
    { id: 'blue', value: '#3B82F6' },
    { id: 'green', value: '#10B981' },
    { id: 'red', value: '#EF4444' },
    { id: 'purple', value: '#8B5CF6' },
    { id: 'amber', value: '#F59E0B' },
    { id: 'pink', value: '#EC4899' },
    { id: 'teal', value: '#14B8A6' }
  ];
  
  densityOptions = [
    { label: 'Compacta', value: 'compact' },
    { label: 'Cómoda', value: 'comfortable' },
    { label: 'Espaciosa', value: 'spacious' }
  ];
  
  themeOptions = [
    { label: 'Claro', value: 'light' },
    { label: 'Oscuro', value: 'dark' },
    { label: 'Sistema', value: 'system' }
  ];
  
  languages = [
    { name: 'Español', code: 'es' },
    { name: 'English', code: 'en' },
    { name: 'Français', code: 'fr' },
    { name: 'Deutsch', code: 'de' },
    { name: 'Português', code: 'pt' },
    { name: 'Italiano', code: 'it' }
  ];
  
  constructor(
    private messageService: MessageService,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    // Cargar configuraciones guardadas
    this.loadSettings();
    
    // Obtener el tema actual del servicio
    this.settings.theme = this.themeService.getCurrentTheme();
    
    // Suscribirse a cambios de tema
    this.themeService.currentTheme$.subscribe(theme => {
      this.settings.theme = theme;
    });
  }
  
  loadSettings(): void {
    const savedSettings = localStorage.getItem('taskify-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Mantener el tema del ThemeService
      const currentTheme = this.settings.theme;
      this.settings = {...parsedSettings, theme: currentTheme};
    }
  }
  
  updateTheme(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }
  
  updatePrimaryColor(colorId: string): void {
    this.settings.primaryColor = colorId;
    // Aquí se aplicaría el color primario a la aplicación
    // Esto podría implementarse en el futuro
  }
  
  saveSettings(): void {
    // Guardar en localStorage (excepto el tema que ya se guarda en el servicio)
    const settingsToSave = {...this.settings};
    localStorage.setItem('taskify-settings', JSON.stringify(settingsToSave));
    
    // Mostrar mensaje de éxito
    this.messageService.add({
      severity: 'success',
      summary: 'Configuración guardada',
      detail: 'Tus preferencias han sido actualizadas correctamente'
    });
  }
  
  resetSettings(): void {
    // Restablecer a valores predeterminados
    this.settings = {
      theme: 'system',
      primaryColor: 'indigo',
      density: 'comfortable',
      language: 'es',
      notifications: {
        email: true,
        inApp: true,
        upcomingTasks: true,
        mentions: true
      },
      accessibility: {
        reduceAnimations: false,
        highContrast: false,
        fontSize: 100
      }
    };
    
    // Aplicar tema predeterminado
    this.themeService.setTheme('system');
    
    // Mostrar mensaje
    this.messageService.add({
      severity: 'info',
      summary: 'Valores restablecidos',
      detail: 'Se han restaurado las configuraciones predeterminadas'
    });
  }

  
}
