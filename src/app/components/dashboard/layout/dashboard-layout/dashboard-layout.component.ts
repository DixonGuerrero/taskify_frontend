import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Popover, PopoverModule } from 'primeng/popover';
import { Subscription, forkJoin } from 'rxjs';
import { User } from '../../../../core/models';
import { Project } from '../../../../core/models/project/project.model';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ProjectStateService } from '../../../../core/services/project/project-state.service';
import { ProjectService } from '../../../../core/services/project/project.service';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Notification } from '../../../../core/models/notification/notification.model';
import { NotificationService } from '../../../../core/services/notification/notification.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    RouterLinkActive,
    RouterLink,
    MenuModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    BadgeModule,
    OverlayBadgeModule,
    PopoverModule,
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  api_url: string = '';

  logo: any;
  barraLateral: any;
  spans: any;
  palanca: any;
  circulo: any;
  menu: any;
  main: any;

  private sidebarCollapsed = signal<boolean>(false);
  private mobile = signal<boolean>(false);

  projects: Project[] = [];
  loading = true;
  currentUser!: User;

  suscriptions: Subscription = new Subscription();

  notifications: Notification[] = [];
  unreadCount: number = 0;
  animateBell: boolean = false;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router,
    private projectStateService: ProjectStateService,
    private notificationService: NotificationService
  ) {
    this.initializeMenu();
  }

  ngOnInit(): void {
    this.notifyUpdateEmpresa();
    this.checkScreenSize();
    this.loadCurrentUser();
    this.loadUserProjects();

    const projectChangesSub =
      this.projectStateService.projectListChanged$.subscribe(() => {
        if (this.currentUser?.id) {
          this.loadProjectsForUser(this.currentUser.id);
        }
      });
    this.suscriptions.add(projectChangesSub);

    // Suscribirse a las notificaciones WebSocket y cargar las iniciales después de autenticar
    this.suscriptions.add(
      this.authService.currentUser.subscribe((user) => {
        if (user?.id) {
          this.currentUser = user;
          this.notificationService.connect(user.id); // Conectar al WebSocket con el ID del usuario
          this.subscribeToNotifications();
          this.loadInitialNotifications();
        }
      })
    );
  }

  private subscribeToNotifications(): void {
    this.suscriptions.add(
      this.notificationService.getNotifications().subscribe(
        (notification: Notification) => {
          console.log('Nueva notificación recibida:', notification);
          this.notifications.unshift(notification); // Añadir al inicio
          if (!notification.is_read) this.unreadCount++;
          this.triggerBellAnimation(); // Activar animación
        },
        (error) => {
          console.error('Error al recibir notificación:', error);
        }
      )
    );
  }

  private loadInitialNotifications(): void {
    if (this.currentUser?.id) {
      this.notificationService
        .getUnreadNotifications(this.currentUser.id)
        .subscribe(
          (notifications: Notification[]) => {
            this.notifications = notifications;
            this.unreadCount = notifications.filter((n) => !n.is_read).length;
          },
          (error) => {
            console.error('Error al cargar notificaciones iniciales:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar las notificaciones.',
            });
          }
        );
    }
  }

  markAsRead(notificationId: number): void {
    this.notificationService.markAsRead(notificationId).subscribe(
      () => {
        const notification = this.notifications.find(
          (n) => n.id === notificationId
        );
        if (notification && !notification.is_read) {
          notification.is_read = true;
          this.unreadCount--;
        }
      },
      (error) => {
        console.error('Error al marcar notificación como leída:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo marcar la notificación como leída.',
        });
      }
    );
  }

  markAllAsRead(): void {
    if (this.currentUser?.id) {
      this.notificationService.markAllAsRead(this.currentUser.id).subscribe(
        () => {
          this.notifications.forEach((n) => (n.is_read = true));
          this.unreadCount = 0;
        },
        (error) => {
          console.error('Error al marcar todas como leídas:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'No se pudieron marcar todas las notificaciones como leídas.',
          });
        }
      );
    }
  }

  private triggerBellAnimation(): void {
    this.animateBell = false; // Resetear la animación
    requestAnimationFrame(() => {
      this.animateBell = true; // Activar la animación
      setTimeout(() => {
        this.animateBell = false; // Desactivar después de un ciclo
      }, 1000); // Duración total de 1 segundo (2 ciclos de 0.5s)
    });
  }

  loadCurrentUser(): void {
    const authSub = this.authService.currentUser.subscribe({
      next: (user: User | null) => {
        if (user) {
          this.currentUser = user;
        }
      },
      error: (err) => {
        console.error('Error getting current user from AuthService:', err);
      },
    });

    this.suscriptions.add(authSub);
  }

  ngOnDestroy(): void {
    this.suscriptions.unsubscribe();
    this.notificationService.disconnect();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.mobile.set(window.innerWidth < 768);
    if (this.mobile()) {
      this.sidebarCollapsed.set(true);
    }
  }

  notifyUpdateEmpresa(): void {}

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  isSidebarCollapsed() {
    return this.sidebarCollapsed();
  }

  isMobile() {
    return this.mobile();
  }

  loadUserProjects(): void {
    this.loading = true;

    if (this.currentUser && this.currentUser.id) {
      this.loadProjectsForUser(this.currentUser.id);
    }
  }

  private loadProjectsForUser(userId: number): void {
    const creatorProjects$ = this.projectService.findByCreatorId(userId);
    const memberProjects$ = this.projectService.findByMemberId(userId);

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
          this.loading = false;
        },
      }
    );

    this.suscriptions.add(projectsSub);
  }

  logout(): void {
    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar cierre de sesión',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Cerrar sesión',
        severity: 'danger',
      },
      accept: () => {
        this.authService.logout();
        this.router.navigate(['/home']);
        this.messageService.add({
          severity: 'success',
          summary: 'Sesión cerrada',
          detail: 'Has cerrado sesión correctamente',
          life: 3000,
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Has cancelado el cierre de sesión',
          life: 3000,
        });
      },
    });
  }

  initializeMenu(): void {
    this.logo = document.getElementById('logo');
    this.barraLateral =
      document.querySelector<HTMLDivElement>('.barra-lateral');
    this.spans = document.querySelectorAll<HTMLSpanElement>('span');
    this.palanca = document.querySelector<HTMLDivElement>('.switch');
    this.circulo = document.querySelector<HTMLDivElement>('.circulo');
    this.menu = document.querySelector<HTMLDivElement>('.menu');
    this.main = document.querySelector<HTMLElement>('main');

    this.menuItems = [
      {
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        styleClass: 'hover:text-[#FC3942] dark:hover:text-[#FF6C73]',
        routerLink: '/dashboard/profile',
        command: () => {},
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        styleClass: 'hover:text-[#FC3942] dark:hover:text-[#FF6C73]',
        routerLink: '/dashboard/settings',
      },
      {
        separator: true,
      },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-power-off',
        styleClass:
          'text-[#FC3942] dark:text-[#FF6C73] hover:text-[#D62C35] dark:hover:text-[#FFB8BC]',
        command: () => {
          this.logout();
        },
      },
    ];
  }

  toggleLogo() {
    this.barraLateral.classList.toggle('mini-barra-lateral');
    this.main.classList.toggle('min-main');
    console.log(this.main);
    this.spans.forEach((span: any) => {
      span.classList.toggle('oculto');
    });
  }

  sizeSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
    this.barraLateral.classList.toggle('max-barra-lateral');
    if (this.barraLateral.classList.contains('max-barra-lateral')) {
      if (this.menu.children.length > 1) {
        this.menu.children[0].setAttribute('style', 'display: none');
        this.menu.children[1].setAttribute('style', 'display: block');
      }
    } else {
      if (this.menu.children.length > 1) {
        this.menu.children[0].setAttribute('style', 'display: block');
        this.menu.children[1].setAttribute('style', 'display: none');
      }
    }
    if (window.innerWidth <= 320) {
      this.barraLateral.classList.add('mini-barra-lateral');
      this.main.classList.add('min-main');
      this.spans.forEach((span: any) => {
        span.classList.add('oculto');
      });
    }
  }

  openProject(project: Project): void {
    this.projectStateService.setCurrentProject(project);
    this.router.navigate(['/dashboard/projects/detail']);
  }

  isCurrentProject(project: Project): boolean {
    const currentProject = this.projectStateService.getCurrentProjectValue();
    return currentProject?.id === project.id;
  }

  toggleNotifications(event: Event): void {
    this.notificationsPopover.toggle(event);
  }

  get unreadNotificationsCount(): number {
    return this.unreadCount;
  }

  @ViewChild('notificationsPopover') notificationsPopover!: Popover;
}
