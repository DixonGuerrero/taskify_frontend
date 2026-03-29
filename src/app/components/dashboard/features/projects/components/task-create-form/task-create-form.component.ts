import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { Project, User } from '../../../../../../core/models';
import { Task, TaskPriority, TaskRequest, TaskStatus } from '../../../../../../core/models/task';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { SelectModule } from 'primeng/select';


@Component({
  selector: 'app-task-create-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule
  ],
  templateUrl: './task-create-form.component.html',
  styleUrl: './task-create-form.component.css'
})
export class TaskCreateFormComponent implements OnInit {
  project!: Project ;
  
  taskForm!: FormGroup;
  minDate: Date = new Date();
  maxDate: Date = new Date();
  loading = false;

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private messageService: MessageService,
    private taskService: TaskService
  ) {
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
  }

  priorityOptions = [
    { label: 'Baja', value: TaskPriority.LOW },
    { label: 'Media', value: TaskPriority.MEDIUM },
    { label: 'Alta', value: TaskPriority.HIGH }
  ];

  ngOnInit(): void {
    if (this.config.data?.project) {
      this.project = this.config.data.project;
    }
    
    this.initForm();
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      name: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl<string>('', [Validators.required, Validators.minLength(10)]),
      priority: new FormControl<TaskPriority>(TaskPriority.MEDIUM, Validators.required),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      assigned: new FormControl<User | null>(null, Validators.required),
    });

    // Convertir project.due_date a Date y validar
    if (this.project?.due_date) {
      const dueDate = new Date(this.project.due_date);
      if (!isNaN(dueDate.getTime())) {
        this.maxDate = dueDate;
      } else {
        console.warn('project.due_date no es una fecha válida:', this.project.due_date);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'La fecha límite del proyecto no es válida. Se usará un valor predeterminado.',
        });
      }
    } else {
      console.warn('project.due_date no está definido');
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se proporcionó una fecha límite para el proyecto. Se usará un valor predeterminado.',
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    const formValues = this.taskForm.value;
    const assigned: User = formValues.assigned;

    if (!assigned || !assigned.id) {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, selecciona un miembro asignado.'
      });
      return;
    }

    if (!this.project || this.project.id === undefined) {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo encontrar el proyecto.'
      });
      return;
    }
    
    const newTask: TaskRequest = {
      name: formValues.name,
      description: formValues.description,
      priority: formValues.priority,
      due_date: formValues.dueDate,
      status: TaskStatus.PENDING,
      project_id: this.project.id,
      assigned_id: assigned.id
    };
    
    this.taskService.save(newTask).subscribe({
      next: (createdTask) => {
        this.loading = false;
        this.ref.close(createdTask);
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la tarea. Por favor, inténtalo de nuevo.'
        });
        console.error('Error al crear la tarea:', error);
      }
    });
  }

  close(): void {
    this.ref.close();
  }
}
