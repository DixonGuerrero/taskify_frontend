import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { ProjectService } from '../../../../../../core/services/project/project.service';
import { Project } from '../../../../../../core/models/project/project.model';
import { ProjectStatus } from '../../../../../../core/models/project/project-status.model';
import { ImageService } from '../../../../../../core/services/image/image.service';
import {
  ImageType,
  type Image,
  type ProjectUpdateRequest,
} from '../../../../../../core/models';
import { LOCALE_ID } from '@angular/core';

@Component({
  selector: 'app-project-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './project-edit-form.component.html',
  styleUrl: './project-edit-form.component.css',
})
export class ProjectEditFormComponent implements OnInit {
  projectForm: FormGroup;
  showImageSelector = false;
  selectedImage: Image | null = null;
  minDate: Date | undefined;
  project: Project | null = null;
  loading = false;

  availableImages: Image[] = [];

  statusOptions = [
    { label: 'En Progreso', value: ProjectStatus.IN_PROGRESS },
    { label: 'Completado', value: ProjectStatus.COMPLETED },
    { label: 'Cancelado', value: ProjectStatus.CANCELLED },
  ];

  private locale = inject(LOCALE_ID);

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private imageService: ImageService
  ) {
    this.projectForm = this.fb.group({
      name: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      description: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(10),
      ]),
      image: new FormControl<Image | null>(null, Validators.required),
      status: new FormControl<ProjectStatus | null>(null, Validators.required),
      dueDate: new FormControl<Date | null>(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.loadAvailableImages();

    const projectData = this.config.data?.project;

    if (projectData && projectData.id) {
      this.loading = true;

      this.projectService.findById(projectData.id).subscribe({
        next: (project) => {
          if (project) {
            this.project = project;

            const dueDateObject = project.due_date
              ? new Date(project.due_date)
              : null;

            this.projectForm.patchValue({
              name: project.name,
              description: project.description,
              image: project.image,
              status: project.status,
              dueDate: dueDateObject,
            });

            this.minDate = dueDateObject ?? new Date();

            this.selectedImage = project.image;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading project:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información del proyecto',
          });
          this.loading = false;
        },
      });
    }
  }

  openImageSelector(): void {
    this.showImageSelector = true;
  }

  selectImage(image: Image): void {
    this.selectedImage = image;
    this.projectForm.patchValue({ image: image });

    this.showImageSelector = false;
  }

  onSubmit(): void {
    if (this.projectForm.invalid || !this.project) {
      return;
    }

    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: '¿Estás seguro de que deseas actualizar este proyecto?',
      header: 'Confirmar actualización',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Actualizar',
        severity: 'primary',
      },
      accept: () => {
        this.updateProject();
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'No se actualizó el proyecto',
        });
      },
    });
  }

  updateProject(): void {
    if (!this.project || this.project.id === undefined) {
      console.error(
        'Error: Intento de actualizar sin un proyecto válido cargado.'
      );
      this.messageService.add({
        severity: 'error',
        summary: 'Error Interno',
        detail: 'No se pudo identificar el proyecto a actualizar.',
      });
      return;
    }

    const formValues = this.projectForm.value;

    let formattedDueDate: string | null = null;
    if (formValues.dueDate instanceof Date) {
      const datePart = formValues.dueDate.toISOString().split('T')[0];
      formattedDueDate = `${datePart}T00:00:00`;
    } else if (typeof formValues.dueDate === 'string') {
      formattedDueDate = formValues.dueDate;
    }

    if (!formattedDueDate) {
      console.error('Error: La fecha de vencimiento no es válida.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Datos',
        detail: 'La fecha de vencimiento no es válida.',
      });
      return;
    }
    const updatedProjectData: ProjectUpdateRequest = {
      name: formValues.name,
      description: formValues.description,
      status: formValues.status,
      due_date: formattedDueDate,
      image_id: formValues.image?.id,
    };

    if (
      updatedProjectData.image_id === undefined ||
      updatedProjectData.image_id === null
    ) {
      console.error('Error: Falta el ID de la imagen para la actualización.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Datos',
        detail: 'La imagen seleccionada no es válida.',
      });
      return;
    }

    this.loading = true;

    this.projectService.update(this.project.id, updatedProjectData).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Proyecto actualizado',
          detail: 'El proyecto ha sido actualizado exitosamente',
        });

        if (!this.project) {
          console.error(
            'Error: Intento de actualizar sin un proyecto válido cargado.'
          );
          this.messageService.add({
            severity: 'error',
            summary: 'Error Interno',
            detail: 'No se pudo identificar el proyecto a actualizar.',
          });
          return;
        }
        this.project.name = formValues.name;
        this.project.description = formValues.description;
        this.project.status = formValues.status;
        this.project.due_date = formValues.dueDate;
        this.project.image = formValues.image;

        this.ref.close(this.project);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating project:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Actualizar',
          detail: error.message || 'No se pudo actualizar el proyecto.',
        });
      },
    });
  }

  close(): void {
    this.ref.close();
  }

  dateFormat(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if (day < 10) return `0${day}/${month}/${date.getFullYear()}`;

    if (month < 10) return `${day}/0${month}/${date.getFullYear()}`;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  loadAvailableImages(): void {
    this.imageService.findByType(ImageType.PROJECT).subscribe({
      next: (images) => {
        this.availableImages = images;
      },
      error: (error) => {
        console.error('Error loading images:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las imágenes',
        });
      },
    });
  }
}
