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
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MenuModule } from 'primeng/menu';
import { Task, TaskPriority } from '../../../../../../core/models';
import { File as TaskFile } from '../../../../../../core/models/file';
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
    ConfirmPopupModule,
    FileUploadModule,
    ToastModule,
    ProgressBarModule,
    MenuModule,
  ],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css',
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task!: Task;
  private dataSent = false;
  uploadProgress = signal(0);
  isUploading = signal(false);
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
      target: event.target as EventTarget,
      message: '¿Estás seguro de que deseas eliminar esta tarea?',
      header: 'Confirmar eliminación',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
      },
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
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado la eliminación de la tarea',
          life: 3000,
        });
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

  onFileUpload(event: { files: File[] }): void {
    if (!this.task.id || event.files.length === 0 || this.isUploading()) {
      return;
    }

    const file = event.files[0];
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    // Clear any existing interval
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }

    // Show upload toast
    this.messageService.add({
      key: 'upload',
      sticky: true,
      severity: 'custom',
      summary: 'Subiendo archivo...',
      detail: file.name,
    });

    // Simulate progress animation
    this.uploadInterval = setInterval(() => {
      if (this.uploadProgress() < 90) {
        this.uploadProgress.update((v) => v + 10);
      }
    }, 200);

    this.taskService.addFile(this.task.id, file).subscribe({
      next: () => {
        // Complete progress
        this.uploadProgress.set(100);
        clearInterval(this.uploadInterval);

        // Close upload toast and show success
        this.messageService.clear('upload');
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo cargado',
          detail: 'El archivo se ha subido correctamente',
          life: 3000,
        });

        // Refresh task data to show the new attachment
        this.taskService.findById(this.task.id!).subscribe({
          next: (updatedTask) => {
            this.task = updatedTask;
          },
          error: (error) => {
            console.error('Error al actualizar la tarea:', error);
          },
        });

        // Reset state after delay
        setTimeout(() => {
          this.isUploading.set(false);
          this.uploadProgress.set(0);
        }, 500);
      },
      error: (error) => {
        clearInterval(this.uploadInterval);
        this.messageService.clear('upload');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo subir el archivo. Por favor, inténtalo de nuevo.',
        });
        console.error('Error al subir archivo:', error);
        this.isUploading.set(false);
        this.uploadProgress.set(0);
      },
    });
  }

  closeUploadToast(): void {
    this.messageService.clear('upload');
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }
    this.isUploading.set(false);
    this.uploadProgress.set(0);
  }

  getAttachmentMenuItems(
    attachment: TaskFile,
    targetButton: HTMLElement,
  ): MenuItem[] {
    return [
      {
        label: 'Descargar',
        icon: 'pi pi-download',
        command: () => this.downloadAttachment(attachment),
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.confirmDeleteAttachment(targetButton, attachment),
      },
    ];
  }

  confirmDeleteAttachment(target: HTMLElement, attachment: TaskFile): void {
    this.confirmationService.confirm({
      target: target,
      message: `¿Estás seguro de que deseas eliminar "${attachment.original_name}"?`,
      header: 'Confirmar eliminación',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
      },
      accept: () => {
        if (!attachment.id) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo identificar el archivo a eliminar',
          });
          return;
        }

        this.fileService.deleteById(attachment.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Archivo eliminado',
              detail: 'El archivo ha sido eliminado correctamente',
              life: 3000,
            });
            // Remove from local array
            if (this.task.attachments) {
              this.task.attachments = this.task.attachments.filter(
                (a) => a.id !== attachment.id,
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
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado la eliminación del archivo',
          life: 3000,
        });
      },
    });
  }
}
