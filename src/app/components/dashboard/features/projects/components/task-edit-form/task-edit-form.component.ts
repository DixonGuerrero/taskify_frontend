import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { Project, User } from '../../../../../../core/models';
import { Task, TaskPriority, TaskRequest, TaskStatus } from '../../../../../../core/models/task';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { SelectModule } from 'primeng/select';
import { ProjectStateService } from '../../../../../../core/services/project/project-state.service';

@Component({
  selector: 'app-task-edit-form',
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
  templateUrl: './task-edit-form.component.html',
  styleUrl: './task-edit-form.component.css'
})
export class TaskEditFormComponent implements OnInit {
  taskForm!: FormGroup;
  task!: Task;
  project!: Project;
  members: User[] = [];
  minDate: Date = new Date();
  maxDate: Date = new Date();
  loading = false;
  
  priorityOptions = [
    { label: 'Baja', value: TaskPriority.LOW },
    { label: 'Media', value: TaskPriority.MEDIUM },
    { label: 'Alta', value: TaskPriority.HIGH }
  ];

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private messageService: MessageService,
    private taskService: TaskService,
    private projectStateService: ProjectStateService
  ) {}

  ngOnInit(): void {
    if (this.config.data?.task) {
      this.task = this.config.data.task;
      this.project = this.task.project;
      this.maxDate = new Date(this.project.due_date);
      this.minDate = new Date(this.task.due_date);
      

      this.projectStateService.getCurrentProject().subscribe({
        next: (project) => {
          if(project) {
            this.members = project.members;
          }
        },
      })

      this.initForm();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la tarea'
      });
      this.close();
    }
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      name: new FormControl<string>(this.task.name, [Validators.required, Validators.minLength(3)]),
      description: new FormControl<string>(this.task.description, [Validators.required, Validators.minLength(10)]),
      priority: new FormControl<TaskPriority>(this.task.priority, Validators.required),
      dueDate: new FormControl<Date>(new Date(this.task.due_date), Validators.required),
      assigned: new FormControl<User | null>(this.task.assigned, Validators.required)
    });
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
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar un usuario asignado'
      });
      this.loading = false;
      return;
    }

    if(this.project.id == null){
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.'
      });
      this.loading = false;
      return;
    }

    if(this.task.id == null){
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.'
      });
      this.loading = false;
      return;
    }

    const updatedTask: TaskRequest = {
      name: formValues.name,
      description: formValues.description,
      priority: formValues.priority,
      due_date: formValues.dueDate,
      assigned_id: assigned.id,
      project_id: this.project.id,
      status: this.task.status
    };
    
    this.taskService.update(this.task.id ,updatedTask).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Tarea actualizada',
          detail: 'La tarea ha sido actualizada exitosamente'
        });

        this.task.name = updatedTask.name;
        this.task.description = updatedTask.description;
        this.task.priority = formValues.priority;
        this.task.due_date = formValues.dueDate;
        this.task.assigned = assigned;

        this.ref.close(this.task);
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la tarea. Por favor, inténtalo de nuevo.'
        });
        console.error('Error al actualizar la tarea:', error);
      }
    });
  }

  close(): void {
    this.ref.close();
  }
}
