import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Tag, TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog'; // Importar para recibir datos

import { Task } from '../../../../../../core/models/task/task.model';
import { TaskPriority } from '../../../../../../core/models/task/task-priority.model';
import { ProjectService } from '../../../../../../core/services/project/project.service';
import { ProjectStateService } from '../../../../../../core/services/project/project-state.service';
import { Project } from '../../../../../../core/models';

@Component({
  selector: 'app-task-calendar-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, DividerModule, DatePipe],
  templateUrl: './task-calendar-detail.component.html',
  styleUrls: ['./task-calendar-detail.component.css'],
})
export class TaskCalendarDetailComponent {
  task: Task;
  public dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private router = inject(Router);

  constructor(
    private projectService: ProjectService,
    private projectStateService: ProjectStateService
  ) {
    this.task = this.config.data;
  }

  goToProject(): void {
    if (this.task?.project?.id) {
      this.projectService.findById(this.task.project.id).subscribe({
        next: (project: Project) => {
          this.projectStateService.setCurrentProject(project);

          this.router.navigate(['/dashboard/projects/detail']);

          this.dialogRef.close();
        },
        error: (error) => {
          console.error('Error al obtener el proyecto:', error);
        },
      });
    }
  }

  getPriorityClass(priority: TaskPriority): Tag['severity'] {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'danger';
      case TaskPriority.MEDIUM:
        return 'warn';
      case TaskPriority.LOW:
        return 'info';
      default:
        return 'secondary';
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
        return 'No definida';
    }
  }
}
