import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import MyPreset from './core/theme/mypreset';
import { ConfirmationService, MessageService, PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { registerLocaleData } from '@angular/common';

import localeEs from '@angular/common/locales/es';                    
registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
      zIndex: {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100,
      },
      translation: {
        accept: 'Aceptar',
        reject: 'Cancelar',
        cancel: 'Cancelar',
        choose: 'Elegir',
        monthNames: [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ],
        monthNamesShort: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ],
        dayNames: [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        weekHeader: 'Semana',
        firstDayOfWeek: 0,
        strong: 'Fuerte',
        weak: 'Débil',
        medium: 'Medio',
        emptyMessage: 'No hay resultados',
        emptyFilterMessage: 'No hay resultados',
        passwordPrompt: 'Introduce una contraseña',
      },
      ripple: true,
    }),
    MessageService,
    PrimeIcons,
    DialogService,
    ConfirmationService,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {provide: LOCALE_ID, useValue: 'es'}
  ],
};
