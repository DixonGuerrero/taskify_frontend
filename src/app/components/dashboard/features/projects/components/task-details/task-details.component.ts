// Import OnDestroy interface
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { Tag, TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TaskEditFormComponent } from '../task-edit-form/task-edit-form.component';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Task, TaskPriority } from '../../../../../../core/models';
import { File as TaskFile } from '../../../../../../core/models/file';
import { ErrorResponse } from '../../../../../../core/models/error/error.model';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { FileService } from '../../../../../../core/services/file/file.service';

// Update the component class to implement OnDestroy
@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    FileUploadModule,
    ToastModule,
    ProgressBarModule,
    MenuModule,
    OverlayPanelModule,
  ],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css',
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task!: Task;
  private dataSent = false;
  progress = signal(0);
  private uploadInterval: any = null;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private taskService: TaskService,
    private fileService: FileService,
  ) {}

  ngOnInit() {
    this.task = this.config.data;
  }

  ngOnDestroy() {
    if (!this.dataSent && this.ref) {
      this.ref.close(this.task);
    }
  }

  close(task: Task) {
    this.dataSent = true;
    this.ref.close(task);
  }

  editTask() {
    const dialogRef = this.dialogService.open(TaskEditFormComponent, {
      header: 'Editar Tarea',
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
        task: this.task,
        project: this.task.project,
      },
    });

    dialogRef.onClose.subscribe((result: Task) => {
      if (result) {
        this.task = result;
      }
    });
  }

  deleteTask(event: Event) {
    this.confirmationService.confirm({
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      header: 'Eliminar tarea',
      icon: 'pi pi-exclamation-circle text-red-500 text-3xl',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass:
        'p-button-secondary p-button-sm p-button-outlined',
      accept: () => {
        if (this.task.id) {
          this.taskService.deleteById(this.task.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Tarea eliminada',
                detail: 'La tarea ha sido eliminada correctamente',
              });
              this.dataSent = true;
              this.ref.close({ action: 'delete', taskId: this.task.id });
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail:
                  'No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.',
              });
              console.error('Error al eliminar la tarea:', error);
            },
          });
        }
      },
      reject: () => {
        // Modal closed without action
      },
    });
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
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

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in-progress':
        return 'En Proceso';
      case 'completed':
        return 'Completada';
      default:
        return 'Pendiente';
    }
  }

  getStatusSeverity(status: string): Tag['severity'] {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'in-progress':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'warn';
    }
  }

  getRemainingDays(dueDate: Date): string {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} días de retraso`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return '1 día restante';
    } else {
      return `${diffDays} días restantes`;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Iconos PrimeIcons según extensión (ver https://primeng.org/icons).
   */
  getAttachmentIconClasses(attachment: TaskFile): string {
    const ext = this.getAttachmentExtension(attachment);
    const excel = new Set(['xlsx', 'xls', 'xlsm', 'csv']);
    const images = new Set([
      'png',
      'jpg',
      'jpeg',
      'webp',
      'gif',
      'bmp',
      'svg',
      'ico',
      'avif',
    ]);

    if (excel.has(ext)) {
      return 'pi pi-file-excel';
    }
    if (ext === 'pdf') {
      return 'pi pi-file-pdf';
    }
    if (images.has(ext)) {
      return 'pi pi-image';
    }
    return 'pi pi-file';
  }

  private getAttachmentExtension(attachment: TaskFile): string {
    let e = (attachment.extension ?? '').toLowerCase().replace(/^\./, '');
    if (!e && attachment.original_name) {
      const m = attachment.original_name.match(/\.([^.]+)$/);
      if (m) {
        e = m[1].toLowerCase();
      }
    }
    return e;
  }

  downloadAttachment(attachment: TaskFile): void {
    if (!attachment?.url) {
      return;
    }
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.original_name ?? 'archivo';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }

  /**
   * Genera los items del menú contextual para un archivo adjunto
   */
  getAttachmentMenuItems(attachment: TaskFile): MenuItem[] {
    return [
      {
        label: 'Descargar',
        icon: 'pi pi-download',
        command: () => this.downloadAttachment(attachment),
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.deleteAttachment(attachment),
      },
    ];
  }

  /**
   * Elimina un archivo adjunto con confirmación
   */
  deleteAttachment(attachment: TaskFile): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${attachment.original_name ?? 'este archivo'}"?`,
      header: 'Eliminar archivo',
      icon: 'pi pi-exclamation-circle text-red-500 text-3xl',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass:
        'p-button-secondary p-button-sm p-button-outlined',
      accept: () => {
        if (attachment.id) {
          this.fileService.deleteById(attachment.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Archivo eliminado',
                detail: 'El archivo ha sido eliminado correctamente',
              });
              // Remove attachment from task locally
              if (this.task.attachments) {
                this.task.attachments = this.task.attachments.filter(
                  (att) => att.id !== attachment.id,
                );
              }
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail:
                  'No se pudo eliminar el archivo. Por favor, inténtalo de nuevo.',
              });
              console.error('Error al eliminar archivo:', error);
            },
          });
        }
      },
      reject: () => {
        // Modal closed without action
      },
    });
  }

  onFileUpload(event: any): void {
    const file = event.files?.[0];
    if (!file || !this.task.id) {
      return;
    }

    this.showUploadToast();

    this.taskService.addFile(this.task.id, file).subscribe({
      next: () => {
        this.progress.set(100);
        clearInterval(this.uploadInterval);
        setTimeout(() => {
          this.messageService.clear('upload');
          this.messageService.add({
            severity: 'success',
            summary: 'Archivo subido',
            detail: 'El archivo ha sido subido correctamente',
          });
        }, 500);
        // Reload task to show new attachment
        this.taskService.findById(this.task.id!).subscribe({
          next: (updatedTask: Task) => {
            this.task = updatedTask;
          },
          error: (error: ErrorResponse) => {
            console.error('Error al recargar la tarea:', error);
          },
        });
      },
      error: (error: ErrorResponse) => {
        clearInterval(this.uploadInterval);
        this.messageService.clear('upload');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo subir el archivo. Por favor, inténtalo de nuevo.',
        });
        console.error('Error al subir archivo:', error);
      },
    });
  }

  showUploadToast(): void {
    this.progress.set(0);
    this.messageService.add({
      key: 'upload',
      sticky: true,
      severity: 'custom',
      summary: 'Subiendo archivo...',
      styleClass: 'backdrop-blur-lg rounded-2xl',
    });

    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }

    this.uploadInterval = setInterval(() => {
      if (this.progress() < 90) {
        this.progress.update((v) => v + 10);
      }
    }, 300);
  }

  onUploadToastClose(): void {
    clearInterval(this.uploadInterval);
    this.progress.set(0);
  }
}
