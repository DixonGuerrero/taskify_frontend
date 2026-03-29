import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tag, TagModule } from 'primeng/tag';
import { DragDropModule } from 'primeng/dragdrop';
import { FormsModule } from '@angular/forms';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TaskCreateFormComponent } from '../../components/task-create-form/task-create-form.component';
import { ProjectStateService } from '../../../../../../core/services/project/project-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../../../../core/services/project/project.service';
import {
  Project,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskRequest,
  TaskStatus,
  User,
} from '../../../../../../core/models';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    DragDropModule,
    FormsModule,
    TaskCardComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, height: '*', overflow: 'hidden' }),
        animate('300ms ease-in', style({ opacity: 0, height: 0 })),
      ]),
    ]),
  ],
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;

  showDetails: boolean = false;
  showShare: boolean = false;
  showMembers: boolean = false;

  currentUser!: User;

  // Add these properties to your component class
  progress: number = 0;
  taskStats = {
    total: 0,
    completed: 0,
    pending: 0,
  };

  private dialogRef: DynamicDialogRef | undefined;

  // In the constructor
  constructor(
    private messageService: MessageService,
    private dialogService: DialogService,
    private projectStateService: ProjectStateService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
  ) {}

  // Replace the ngOnInit method
  ngOnInit(): void {
    // Get the current user
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.currentUser = user;

      // Get the project directly from state service instead of using route params
      this.projectStateService.getCurrentProject().subscribe({
        next: (project) => {
          if (project) {
            if (this.userHasAccess(project)) {
              this.project = project;

              console.log('Project:', project);

              this.loadProjectTasks(project.id || 0);
            } else {
              // User doesn't have access - show alert and redirect
              this.messageService.add({
                severity: 'error',
                summary: 'Acceso denegado',
                detail: 'No tienes permisos para acceder a este proyecto',
                life: 3000,
              });
              this.router.navigate(['/dashboard']);
            }
          } else {
            // No project in state, redirect to projects list
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se encontró el proyecto',
              life: 3000,
            });
            this.router.navigate(['/dashboard/projects']);
          }
        },
      });
    });
  }

  /**
   * Check if the current user has access to the project
   */
  userHasAccess(project: Project): boolean {
    if (!this.currentUser || !project) return false;

    if (project.members && project.members.length > 0) {
      return project.members.some(
        (member) => member.id === this.currentUser.id,
      );
    }

    return false;
  }

  onTaskDeleted(taskId: number): void {
    console.log('Task deleted:', taskId);

    this.allTasks = this.allTasks.filter((task) => task.id !== taskId);
    this.filterTasks();
    this.updateProjectProgress();
  }

  onTaskStatusChange(event: { task: Task; newStatus: TaskStatus }): void {
    const { task, newStatus } = event;

    // Set the dragged task temporarily for the update method
    this.draggedTask = task;

    // Call the existing update method
    this.updateTaskStatus(newStatus);

    // Clear dragged task after update
    this.draggedTask = null;
  }

  loadProjectTasks(projectId: number): void {
    this.taskService.findByProjectId(projectId).subscribe({
      next: (tasks) => {
        if (this.project) {
          this.allTasks = tasks;
          this.filterTasks();
          this.updateProjectProgress();
        }
      },
      error: (error) => {
        console.error('Error loading project tasks:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las tareas del proyecto',
          life: 3000,
        });
      },
    });
  }

  allTasks: Task[] = [];

  pendingTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completedTasks: Task[] = [];

  draggedTask: Task | null = null;
  autoScrollInterval: any = null;
  scrollSpeed = 10;

  filterTasks(): void {
    if (!this.allTasks) return;

    this.pendingTasks = this.allTasks.filter(
      (task) => task.status === TaskStatus.PENDING,
    );
    this.inProgressTasks = this.allTasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    );
    this.completedTasks = this.allTasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    );
  }

  dragStart(task: Task): void {
    this.draggedTask = task;
    // Start listening for auto-scroll
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('touchmove', this.handleDragMove);
  }

  dragEnd(): void {
    this.draggedTask = null;
    // Clean up event listeners and intervals
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('touchmove', this.handleDragMove);
    this.clearAutoScroll();
  }

  handleDragMove = (event: MouseEvent | TouchEvent) => {
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const windowHeight = window.innerHeight;
    const scrollThreshold = 50; // pixels from edge to start scrolling

    // Clear any existing interval
    this.clearAutoScroll();

    // Auto-scroll when near the top edge
    if (clientY < scrollThreshold) {
      this.startAutoScroll(-this.scrollSpeed);
    }
    // Auto-scroll when near the bottom edge
    else if (clientY > windowHeight - scrollThreshold) {
      this.startAutoScroll(this.scrollSpeed);
    }
  };

  startAutoScroll(speed: number) {
    this.autoScrollInterval = setInterval(() => {
      window.scrollBy(0, speed);
    }, 16); // ~60fps
  }

  clearAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  updateProjectProgress(): void {
    if (!this.allTasks || this.allTasks.length === 0) return;

    const totalTasks = this.allTasks.length;
    const completedTasks = this.completedTasks.length;
    const pendingTasks = this.pendingTasks.length;

    if (totalTasks > 0) {
      this.progress = Math.round((completedTasks / totalTasks) * 100);

      this.taskStats = {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
      };
    }
  }

  dropToPending(): void {
    if (
      this.draggedTask &&
      this.draggedTask.status !== TaskStatus.PENDING &&
      this.draggedTask.id &&
      this.draggedTask.project.id &&
      this.draggedTask.assigned.id
    ) {
      this.updateTaskStatus(TaskStatus.PENDING);
    }
  }

  dropToInProgress(): void {
    if (
      this.draggedTask &&
      this.draggedTask.status !== TaskStatus.IN_PROGRESS
    ) {
      this.updateTaskStatus(TaskStatus.IN_PROGRESS);
    }
  }

  dropToCompleted(): void {
    if (this.draggedTask && this.draggedTask.status !== TaskStatus.COMPLETED) {
      this.updateTaskStatus(TaskStatus.COMPLETED);
    }
  }

  updateTaskStatus(newStatus: TaskStatus): void {
    if (
      this.draggedTask &&
      this.draggedTask.status !== newStatus &&
      this.draggedTask.id &&
      this.draggedTask.project.id &&
      this.draggedTask.assigned.id
    ) {
      this.draggedTask.status = newStatus;
      const oldStatus = this.draggedTask.status;

      const taskUpdate: TaskRequest = {
        name: this.draggedTask.name,
        description: this.draggedTask.description,
        priority: this.draggedTask.priority,
        project_id: this.draggedTask.project.id,
        due_date: new Date(this.draggedTask.due_date).toISOString(),
        assigned_id: this.draggedTask.assigned.id,
        status: newStatus,
      };

      this.taskService.update(this.draggedTask.id, taskUpdate).subscribe({
        next: () => {
          this.filterTasks();
          this.updateProjectProgress();

          this.messageService.add({
            severity: 'info',
            summary: 'Tarea movida',
            detail: `"${taskUpdate.name}" movida a ${this.getTaskStatusText(newStatus)}`,
            life: 3000,
          });
        },
        error: (error) => {
          if (this.draggedTask) this.draggedTask.status = oldStatus;
          this.filterTasks();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado de la tarea',
            life: 3000,
          });
          console.error('Error updating task status:', error);
        },
      });
    }
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case TaskPriority.LOW:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  }

  getPriorityText(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'Alta';
      case TaskPriority.MEDIUM:
        return 'Media';
      case TaskPriority.LOW:
        return 'Baja';
      default:
        return 'Normal';
    }
  }

  getTaskStatusText(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'Pendiente';
      case TaskStatus.IN_PROGRESS:
        return 'En progreso';
      case TaskStatus.COMPLETED:
        return 'Completada';
      default:
        return 'Desconocido';
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
    // Close other sections when opening details
    if (this.showDetails) {
      this.showShare = false;
      this.showMembers = false;
    }
  }

  toggleShare(): void {
    this.showShare = !this.showShare;
    // Close other sections when opening share
    if (this.showShare) {
      this.showDetails = false;
      this.showMembers = false;
    }
  }

  toggleMembers(): void {
    this.showMembers = !this.showMembers;
    // Close other sections when opening members
    if (this.showMembers) {
      this.showDetails = false;
      this.showShare = false;
    }
  }

  copyProjectCode(): void {
    if (!this.project || !this.project.invite_code) return;

    navigator.clipboard.writeText(this.project.invite_code).then(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copiado',
          detail: 'Código del proyecto copiado al portapapeles',
          life: 3000,
        });
      },
      () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar el código',
          life: 3000,
        });
      },
    );
  }

  getStatusClass(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'bg-green-500';
      case ProjectStatus.COMPLETED:
        return 'bg-blue-500';
      case ProjectStatus.CANCELLED:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: ProjectStatus): string {
    if (!status) return 'En progreso';

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

  getStatusSeverity(status: ProjectStatus): Tag['severity'] {
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

  showCreateTaskForm(): void {
    this.dialogRef = this.dialogService.open(TaskCreateFormComponent, {
      header: 'Crear Nueva Tarea',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      style: {
        width: '50vw',
      },
      modal: true,
      dismissableMask: true,
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: true,
      transitionOptions: '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      styleClass: 'p-dialog-custom',
      maskStyleClass: 'bg-black/60',
      data: {
        project: this.project,
      },
    });

    this.dialogRef.onClose.subscribe((task: Task) => {
      if (task) {
        this.allTasks.push(task);

        this.filterTasks();

        this.updateProjectProgress();

        this.messageService.add({
          severity: 'success',
          summary: 'Tarea creada',
          detail: `La tarea "${task.name}" ha sido creada exitosamente`,
          life: 3000,
        });
      }
    });
  }

  getDefualtStatus(): ProjectStatus {
    return ProjectStatus.IN_PROGRESS;
  }

  // Add these methods to the component class

  /**
   * Checks if the given user is the creator of the project
   */
  isProjectCreator(user: User): boolean {
    if (!this.project || !this.project.created_by || !user) return false;
    return this.project.created_by.id === user.id;
  }

  /**
   * Checks if the current logged-in user is the creator of the project
   */
  isCurrentUserCreator(): boolean {
    if (!this.project || !this.project.created_by || !this.currentUser)
      return false;
    return this.project.created_by.id === this.currentUser.id;
  }

  /**
   * Removes a member from the project
   */
  removeMember(memberId: number): void {
    if (!this.project) return;

    this.confirmationService.confirm({
      message:
        '¿Estás seguro de que deseas eliminar a este miembro del proyecto?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Here you would call your service to remove the member
        // For now, we'll just update the local array
        if (this.project && this.project.members) {
          this.project.members = this.project.members.filter(
            (m) => m.id !== memberId,
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Miembro eliminado',
            detail: 'El miembro ha sido eliminado del proyecto',
            life: 3000,
          });
        }
      },
    });
  }
}
