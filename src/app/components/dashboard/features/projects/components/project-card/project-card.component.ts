import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Tag, TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProjectEditFormComponent } from '../project-edit-form/project-edit-form.component';
import { Project } from '../../../../../../core/models/project';
import { Task } from '../../../../../../core/models/task/task.model';
import { TaskStatus } from '../../../../../../core/models/task/task-status.model';
import { ProjectStatus } from '../../../../../../core/models';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { ProjectStateService } from '../../../../../../core/services/project/project-state.service';
import { ProjectService } from '../../../../../../core/services/project/project.service'; // Import ProjectService

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ProgressBarModule, Menu],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class ProjectCardComponent implements OnInit {
  @Input() project!: Project;
  @Input() index: number = 0;
  @Output() projectSelected = new EventEmitter<number>();
  @Output() projectDeleted = new EventEmitter<number>();

  items: MenuItem[] | undefined;
  ref: DynamicDialogRef | undefined;
  tasks: Task[] = [];
  loading: boolean = false;

  // Use inject for services
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private projectStateService = inject(ProjectStateService);
  private projectService = inject(ProjectService);

  ngOnInit() {
    this.loadMenu();
    this.loadProjectTasks();
  }

  /**
   * Load tasks associated with this project
   */
  loadProjectTasks(): void {
    if (!this.project.id) return;

    this.loading = true;
    this.taskService.findByProjectId(this.project.id).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading project tasks:', error);
        this.loading = false;
      },
    });
  }

  loadMenu(): void {
    this.items = [
      {
        label: 'Opciones',
        items: [
          {
            label: 'Editar',
            icon: 'pi pi-pen-to-square',
            command: () => {
              this.editProject();
            },
          },
          {
            label: 'Eliminar',
            icon: 'pi pi-trash',
            command: (event) => {
              this.deleteProject(event.originalEvent || new Event('click'));
            },
          },
        ],
      },
    ];
  }

  getStatusClass(status: ProjectStatus): Tag['severity'] {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'success';
      case ProjectStatus.COMPLETED:
        return 'info';
      case ProjectStatus.CANCELLED:
        return 'warn';
      default:
        return 'info';
    }
  }

  openProject(): void {
    this.projectStateService.setCurrentProject(this.project);

    this.router.navigate(['/dashboard/projects/detail']);
  }

  /**
   * Calculate project progress based on completed tasks
   */
  calculateProgress(): number {
    if (!this.tasks || this.tasks.length === 0) return 0;

    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    ).length;

    return Math.round((completedTasks / totalTasks) * 100);
  }

  /**
   * Checks if the current logged-in user is the creator of this project
   * @returns boolean indicating if current user is the project creator
   */
  isCurrentUserCreator(): boolean {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !this.project.created_by) {
      return false;
    }

    return currentUser.id === this.project.created_by.id;
  }

  /**
   * Get the count of total tasks
   */
  getTaskCount(): number {
    return this.tasks?.length || 0;
  }

  /**
   * Get the count of members in the project
   */
  getMemberCount(): number {
    return this.project?.members?.length || 0;
  }

  editProject(): void {
    this.ref = this.dialogService.open(ProjectEditFormComponent, {
      header: 'Editar Proyecto',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      style: {
        width: '50vw',
      },
      modal: true,
      dismissableMask: true,
      transitionOptions: '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      styleClass: 'p-dialog-custom',
      maskStyleClass: 'bg-black/60',
      data: {
        project: this.project,
      },
      focusOnShow: false,
    });

    this.ref.onClose.subscribe((result: any) => {
      if (result) {
        this.project = result;
        // Reload tasks after project update
        this.loadProjectTasks();
      }
    });
  }

  deleteProject(event: Event): void {
    if (!this.project || !this.project.id) {
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar el proyecto "${this.project.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.projectService.deleteById(this.project.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Proyecto eliminado',
              detail: `El proyecto "${this.project.name}" ha sido eliminado correctamente.`,
              life: 3000,
            });
            this.projectDeleted.emit(this.project.id);
          },
          error: (error) => {
            console.error('Error deleting project:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error al eliminar',
              detail: error.message || 'No se pudo eliminar el proyecto.',
              life: 5000,
            });
          },
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Eliminación cancelada',
          detail: 'No se ha eliminado el proyecto.',
          life: 3000,
        });
      },
    });
  }

  mapStatusToString(
    status: ProjectStatus
  ): 'En progreso' | 'Completado' | 'Cancelado' {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'En progreso';
      case ProjectStatus.COMPLETED:
        return 'Completado';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'En progreso';
    }
  }

  navigateToDetail(): void {
    if (this.project && this.project.id) {
      this.router.navigate(['/dashboard/projects/detail', this.project.id]);
    }
  }
}
