import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { DragDropModule } from 'primeng/dragdrop';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { Task, TaskPriority } from '../../../../../../core/models';


@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css',
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() index: number = 0;
  @Output() onTaskDragStart = new EventEmitter<Task>();
  @Output() onTaskDragEnd = new EventEmitter<void>();


  dragStart(task: Task) {
    this.onTaskDragStart.emit(task);
  }

  dragEnd() {
    this.onTaskDragEnd.emit();
  }

  getPriorityClass(priority: TaskPriority): string {
    switch(priority) {
      case TaskPriority.HIGH: return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case TaskPriority.LOW: return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getPriorityText(priority: TaskPriority): string {
    switch(priority) {
      case TaskPriority.HIGH: return 'Alta';
      case TaskPriority.MEDIUM: return 'Media';
      case TaskPriority.LOW: return 'Baja';
      default: return 'Normal';
    }
  }

  constructor(private dialogService: DialogService) {}

  @Output() onTaskDeleted = new EventEmitter<number>();

  showDetails(task: Task) {

    const dialogRef = this.dialogService.open(TaskDetailsComponent, {
      data: task,
      showHeader: false,
      dismissableMask: true,
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
      style: {
        width: '40vw'
      },
      styleClass: 'p-dialog-custom',
      maskStyleClass: 'bg-black/60',
      transitionOptions: '400ms cubic-bezier(0.25, 0.8, 0.25, 1)'
    });

    dialogRef.onClose.subscribe((result) => {
      if (result) {
        if (result.action === 'delete' && result.taskId) {
          this.onTaskDeleted.emit(result.taskId);
        } else {
          this.task = result;
        }
      }
    });
  }
}
