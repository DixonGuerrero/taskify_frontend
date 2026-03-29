import { Component, OnInit } from '@angular/core';
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
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TextareaModule } from 'primeng/textarea';
import { ImageService } from '../../../../../../core/services/image/image.service';
import { MessageService } from 'primeng/api';
import { ProjectService } from '../../../../../../core/services/project/project.service';
import { ProjectStatus } from '../../../../../../core/models/project/project-status.model';
import {
  ImageType,
  Project,
  type Image,
  type ProjectCreateRequest,
  type User,
} from '../../../../../../core/models';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../../../../core/models/error/error.model';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-project-create-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    DialogModule,
  ],
  templateUrl: './project-create-form.component.html',
  styleUrl: './project-create-form.component.css',
})
export class ProjectCreateFormComponent implements OnInit {
  projectForm: FormGroup;
  showImageSelector = false;
  minDate: Date = new Date();
  selectedImage: Image | null = null;
  loading = false;
  submitted = false; // Añadir bandera submitted

  availableImages: Image[] = [];

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private imageService: ImageService,
    private messageService: MessageService,
    private authService: AuthService,
    private projectService: ProjectService
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
      dueDate: new FormControl<Date | null>(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.loadAvailableImages();
  }

  // Getter para fácil acceso a los controles del formulario
  get f() {
    return this.projectForm.controls;
  }

  loadAvailableImages(): void {
    this.loading = true;
    this.imageService.findByType(ImageType.PROJECT).subscribe({
      next: (images) => {
        this.availableImages = images;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading images:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las imágenes',
        });
        this.loading = false;
      },
    });
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
    this.submitted = true; // Marcar como enviado al intentar guardar

    if (this.projectForm.invalid) {
      // Marcar todos los controles como 'touched' para mostrar errores si aún no lo están
      Object.values(this.projectForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos correctamente.',
      });
      return; // Detener si el formulario es inválido
    }

    this.loading = true;
    const formValues = this.projectForm.value;
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || currentUser.id === undefined) {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Usuario',
        detail:
          'No se pudo obtener la información del usuario de la sesión. Por favor, inicia sesión de nuevo.',
      });
      console.error('Error: Current user not found or missing ID in session.');
      return;
    }

    const newProject: ProjectCreateRequest = {
      name: formValues.name,
      description: formValues.description,
      image_id: formValues.image.id,
      due_date: formValues.dueDate,
      status: ProjectStatus.IN_PROGRESS,
      created_by: currentUser.id,
    };

    this.projectService.save(newProject).subscribe({
      next: (result: Project) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Proyecto Creado',
          detail: 'El proyecto ha sido creado exitosamente.',
        });
        this.ref.close(result);
      },
      error: (error: ErrorResponse) => {
        this.loading = false;
        console.error('Error creating project:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Crear',
          detail:
            error.message ||
            'No se pudo crear el proyecto. Inténtalo de nuevo.',
        });
      },
    });
  }

  close(): void {
    this.ref.close();
  }
}
