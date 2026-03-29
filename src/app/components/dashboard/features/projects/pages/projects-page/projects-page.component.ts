import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { Tag, TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { animate, style, transition, trigger } from '@angular/animations';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { DialogService } from 'primeng/dynamicdialog';
import { ProjectCreateFormComponent } from '../../components/project-create-form/project-create-form.component';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../../../core/services/project/project.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { Project } from '../../../../../../core/models/project/project.model';
import { ProjectStatus } from '../../../../../../core/models/project/project-status.model';
import { forkJoin, Subscription } from 'rxjs';

// Add this to the imports
import { FilterPipe } from '../../../../../../shared/pipes/filter.pipe';
import { User } from '../../../../../../core/models';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    ProjectCardComponent,
    FormsModule,
    FilterPipe,
  ],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class ProjectsPageComponent implements OnInit, OnDestroy {
  showJoinDialog: boolean = false;
  projectCode: string = '';
  isJoining: boolean = false;
  loading: boolean = true;

  projects: Project[] = [];
  searchTerm: string = '';

  private subscriptions: Subscription = new Subscription();
  private currentUserId: number | undefined;

  constructor(
    private dialogService: DialogService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    const authSub = this.authService.currentUser.subscribe(
      (user: User | null) => {
        if (user) {
          this.currentUserId = user.id;
          this.loadUserProjects();
        } else {
          this.loading = false;
          this.currentUserId = undefined;
          this.projects = [];
        }
      }
    );

    this.subscriptions.add(authSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUserProjects(): void {
    if (!this.currentUserId) {
      this.loading = false;
      return;
    }

    // Get projects where user is creator or member
    const creatorProjects$ = this.projectService.findByCreatorId(
      this.currentUserId
    );
    const memberProjects$ = this.projectService.findByMemberId(
      this.currentUserId
    );

    const projectsSub = forkJoin([creatorProjects$, memberProjects$]).subscribe(
      {
        next: ([creatorProjects, memberProjects]) => {
          const allProjects = [...creatorProjects];

          memberProjects.forEach((memberProject) => {
            if (!allProjects.some((p) => p.id === memberProject.id)) {
              allProjects.push(memberProject);
            }
          });

          this.projects = allProjects;

          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los proyectos',
          });
          this.loading = false;
        },
      }
    );

    this.subscriptions.add(projectsSub);
  }

  getStatusClass(status: ProjectStatus): Tag['severity'] {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'success';
      case ProjectStatus.COMPLETED:
        return 'info';
      case ProjectStatus.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  }

  openCreateProjectDialog(): void {
    const ref = this.dialogService.open(ProjectCreateFormComponent, {
      header: 'Crear Nuevo Proyecto',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      style: {
        width: '50vw',
      },
      modal: true,
      dismissableMask: true,
      transitionOptions: '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      styleClass: 'p-dialog-custom',
      maskStyleClass: 'bg-black/60',
    });

    ref.onClose.subscribe((project) => {
      if (project) {
        this.projects.push(project);
      }
    });
  }

  handleProjectDeleted(projectId: number): void {
    this.projects = this.projects.filter((project) => project.id !== projectId);
  }

  joinProject(): void {
    if (!this.projectCode.trim() || !this.currentUserId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Por favor, ingresa un código de proyecto.',
      });
      return;
    }

    this.isJoining = true;

    this.projectService
      .findByInvitationCode(this.projectCode.trim())
      .subscribe({
        next: (project) => {
          if (project && project.id) {
            this.projectService
              .addMember(project.id, this.currentUserId!)
              .subscribe({
                next: () => {
                  this.isJoining = false;
                  this.showJoinDialog = false;
                  this.projectCode = '';

                  this.messageService.add({
                    severity: 'success',
                    summary: 'Te has unido al proyecto',
                    detail: `Te has unido exitosamente a "${project.name}"`,
                  });

                  this.loadUserProjects();
                },
                error: (error) => {
                  this.handleJoinError(error);
                },
              });
          } else {
            this.handleJoinError(
              'Código de invitación inválido o proyecto no encontrado.'
            );
          }
        },
        error: (error) => {
          this.handleJoinError(error);
        },
      });
  }

  private handleJoinError(error: any): void {
    this.isJoining = false;
    const detailMessage =
      typeof error === 'string'
        ? error
        : error?.message ||
          'No se pudo unir al proyecto. Verifica el código o inténtalo más tarde.';

    console.error('Error joining project:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error al unirse',
      detail: detailMessage,
      life: 5000,
    });
  }
}
