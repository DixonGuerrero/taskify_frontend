import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AnimateOnScroll } from 'primeng/animateonscroll';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';

interface RoadmapFeature {
  title: string;
  description: string;
  icon: string;
  image: string;
  expanded: boolean;
  releaseInfo: {
    estimatedDate: string;
    quarter: string;
    details: string;
    progress: number;
    status: 'planning' | 'development' | 'testing' | 'finalizing';
  };
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [
    ButtonModule,
    FooterComponent,
    HeaderComponent,
    CommonModule,
    ProgressBarModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    AccordionModule,
  ],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.css',
})
export class RoadmapComponent {
  selectedFeatureIndex: number | null = null;

  features: RoadmapFeature[] = [
    {
      title: 'Chat en Equipo',
      description:
        'Comunícate en tiempo real con tu equipo dentro de cada proyecto, sin salir de Taskify.',
      icon: 'pi pi-comments',
      image: 'assets/Feature_2.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Mayo 2025',
        quarter: 'Q1 2025',
        details:
          'Estamos trabajando en una experiencia de chat integrada que permitirá comunicación en tiempo real, compartir archivos y menciones a miembros del equipo.',
        progress: 65,
        status: 'development',
      },
    },
    {
      title: 'Notificaciones Inteligentes',
      description:
        'Recibe alertas por correo o en la app sobre tareas vencidas y nuevas asignaciones.',
      icon: 'pi pi-bell',
      image: 'assets/Feature_3.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Agosto 2025',
        quarter: 'Q2 2025',
        details:
          'Las notificaciones inteligentes te alertarán sobre tareas próximas a vencer, asignaciones nuevas y actualizaciones importantes de tus proyectos.',
        progress: 40,
        status: 'development',
      },
    },
    {
      title: 'Integración con Calendario',
      description: 'Sincroniza tus tareas con Google Calendar, Outlook y más.',
      icon: 'pi pi-calendar',
      image: 'assets/Feature_2.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Noviembre 2025',
        quarter: 'Q3 2025',
        details:
          'Conecta Taskify con tus calendarios favoritos para ver todas tus tareas y eventos en un solo lugar.',
        progress: 50,
        status: 'testing',
      },
    },
    {
      title: 'Versión Desktop',
      description:
        'Usa Taskify como app nativa en tu computadora, incluso sin conexión.',
      icon: 'pi pi-desktop',
      image: 'assets/Feature_1.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Abril 2026',
        quarter: 'Q1 2026',
        details:
          'La versión de escritorio permitirá trabajar sin conexión y sincronizar automáticamente cuando vuelvas a estar en línea.',
        progress: 25,
        status: 'planning',
      },
    },
    {
      title: 'App Móvil',
      description:
        'Gestiona tus proyectos desde cualquier lugar con una app para iOS y Android.',
      icon: 'pi pi-mobile',
      image: 'assets/Feature_3.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Noviembre 2026',
        quarter: 'Q2 2026',
        details:
          'Accede a tus proyectos desde cualquier lugar con nuestra app móvil nativa para iOS y Android.',
        progress: 15,
        status: 'planning',
      },
    },
    {
      title: 'Asistente IA',
      description:
        'Optimiza tu flujo de trabajo con sugerencias inteligentes y asignaciones automáticas.',
      icon: 'pi pi-star',
      image: 'assets/Feature_1.webp',
      expanded: false,
      releaseInfo: {
        estimatedDate: 'Diciembre 2026',
        quarter: 'Q3 2026',
        details:
          'Nuestro asistente IA aprenderá de tus patrones de trabajo para sugerir mejoras y automatizar tareas repetitivas.',
        progress: 10,
        status: 'planning',
      },
    },
  ];

  toggleFeature(index: number): void {
    // Cerrar la característica expandida actual si existe
    if (
      this.selectedFeatureIndex !== null &&
      this.selectedFeatureIndex !== index
    ) {
      this.features[this.selectedFeatureIndex].expanded = false;
    }

    // Alternar la característica seleccionada
    this.features[index].expanded = !this.features[index].expanded;
    this.selectedFeatureIndex = this.features[index].expanded ? index : null;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'planning':
        return 'info';
      case 'development':
        return 'warn';
      case 'testing':
        return 'success';
      case 'finalizing':
        return 'success';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'planning':
        return 'Planificación';
      case 'development':
        return 'En Desarrollo';
      case 'testing':
        return 'En Pruebas';
      case 'finalizing':
        return 'Finalizando';
      default:
        return 'Planificación';
    }
  }
}
