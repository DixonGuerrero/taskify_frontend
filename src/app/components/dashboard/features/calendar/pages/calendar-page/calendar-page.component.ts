import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { Task } from '../../../../../../core/models/task/task.model';
import { TaskService } from '../../../../../../core/services/task/task.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { Subscription } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskCalendarDetailComponent } from '../../components/task-calendar-detail/task-calendar-detail.component';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { ListboxModule } from 'primeng/listbox';
import { Tag } from 'primeng/tag';
import { TaskPriority } from '../../../../../../core/models';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    DividerModule,
    TextareaModule,
    TooltipModule,
    ListboxModule,
    RouterLink,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.css',
  providers: [DialogService],
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();

  tasks: Task[] = [];
  loading = true;
  private currentUserId: number | undefined;
  private subscriptions = new Subscription();

  weekDays: string[] = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  showTaskListDialog: boolean = false;
  tasksForDialogList: Task[] = [];
  selectedDayForTaskList: Date | null = null;

  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private dialogService = inject(DialogService);

  ngOnInit(): void {
    this.loadUserTasks();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUserTasks(): void {
    this.loading = true;
    const authSub = this.authService.currentUser.subscribe((user: any) => {
      if (user && user.id) {
        this.currentUserId = user.id;
        if (this.currentUserId) {
          const taskSub = this.taskService
            .findByAssignedUserId(this.currentUserId)
            .subscribe({
              next: (tasks) => {
                // Convertir due_date a objetos Date
                this.tasks = tasks.map((task) => ({
                  ...task,
                  due_date: new Date(task.due_date),
                }));
                this.loading = false;
              },
              error: (error) => {
                console.error('Error loading user tasks:', error); // Log de error
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudieron cargar las tareas.',
                });
                this.loading = false;
              },
            });
          this.subscriptions.add(taskSub);
        } else {
          this.loading = false; // No hay ID de usuario
        }
      } else {
        this.loading = false; // No hay usuario en sesión
        this.tasks = []; // Limpiar tareas si no hay usuario
      }
    });
    this.subscriptions.add(authSub);
  }

  goToToday(): void {
    this.selectedDate = new Date();
  }

  getTasksForDate(date: Date): Task[] {
    return this.tasks.filter((task) => {
      const taskDate = task.due_date;
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  }

  hasTasks(date: Date): boolean {
    return this.getTasksForDate(date).length > 0;
  }

  formatMonthYear(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
    };
    // Capitalizar la primera letra del mes
    const formatted = date.toLocaleDateString('es-ES', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  getDaysInMonth(year: number, month: number): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Días del mes anterior
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Ajustar para que la semana empiece en Lunes (0=L, 6=D) -> No, usamos D como 0. getDay() D=0, S=6
    const startDayIndex = firstDay.getDay(); // 0 para Domingo, 6 para Sábado
    for (let i = startDayIndex; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push(prevDate);
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Días del mes siguiente
    const lastDayIndex = lastDay.getDay(); // 0 para Domingo, 6 para Sábado
    const remainingDays = 6 - lastDayIndex;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push(nextDate);
    }

    // Asegurar que siempre haya 6 semanas (42 días) si es necesario
    while (days.length < 42 && days.length % 7 === 0) {
      // Solo añadir si completa una semana
      const lastCurrentDate = days[days.length - 1];
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(
          lastCurrentDate.getFullYear(),
          lastCurrentDate.getMonth(),
          lastCurrentDate.getDate() + i,
        );
        days.push(nextDate);
      }
    }
    // Si aún no son 42 y no completa semana, añadir hasta 35 si es necesario
    while (days.length < 35 && days.length % 7 !== 0) {
      const lastCurrentDate = days[days.length - 1];
      const nextDate = new Date(
        lastCurrentDate.getFullYear(),
        lastCurrentDate.getMonth(),
        lastCurrentDate.getDate() + 1,
      );
      days.push(nextDate);
    }
    // Si son 35, añadir una semana más para llegar a 42
    if (days.length === 35) {
      const lastCurrentDate = days[days.length - 1];
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(
          lastCurrentDate.getFullYear(),
          lastCurrentDate.getMonth(),
          lastCurrentDate.getDate() + i,
        );
        days.push(nextDate);
      }
    }

    return days;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.selectedDate.getMonth();
  }

  selectDateAndOpenDialog(date: Date): void {
    const tasksOnDate = this.getTasksForDate(date);

    if (tasksOnDate.length === 1) {
      // Si solo hay una tarea, abrir directamente el diálogo de detalles
      this.openTaskDialog(tasksOnDate[0]);
    } else if (tasksOnDate.length > 1) {
      // Si hay varias tareas, preparar y mostrar el diálogo intermedio de lista
      this.tasksForDialogList = tasksOnDate;
      this.selectedDayForTaskList = date;
      this.showTaskListDialog = true;
    }
    // Si tasksOnDate.length === 0, no hacer nada
  }

  previousMonth(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.selectedDate = newDate;
  }

  nextMonth(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.selectedDate = newDate;
  }

  selectTaskFromList(task: Task): void {
    this.showTaskListDialog = false; // Ocultar el diálogo de lista
    this.openTaskDialog(task); // Abrir el diálogo de detalles para la tarea seleccionada
  }

  openTaskDialog(task: Task): void {
    const dialogRef = this.dialogService.open(TaskCalendarDetailComponent, {
      data: task,
      showHeader: true,
      dismissableMask: true,
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      style: {
        width: '50vw',
      },
      transitionOptions: '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      styleClass: 'p-dialog-custom',
      maskStyleClass: 'bg-black/60',
    });

    dialogRef.onClose.subscribe(() => {
      // Lógica opcional al cerrar el diálogo de detalles
    });
  }

  formatDateForDialog(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
