import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuLandingComponent } from '../menu-landing/menu-landing.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  imports: [RouterLink, ButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  styles: [
    `
      :host {
        @keyframes slidedown-icon {
          0% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(20px);
          }

          100% {
            transform: translateY(0);
          }
        }

        .slidedown-icon {
          animation: slidedown-icon;
          animation-duration: 3s;
          animation-iteration-count: infinite;
        }

        .box {
          background-image: radial-gradient(
            var(--primary-300),
            var(--primary-600)
          );
          border-radius: 50% !important;
          color: var(--primary-color-text);
        }
      }
    `,
  ],
})
export class HeaderComponent {
  ref: DynamicDialogRef | undefined;
  dialogService = inject(DialogService);


  showMenu() {
    this.ref = this.dialogService.open(MenuLandingComponent, {
      header: 'Taskify',
      width: '70%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      position: 'top',
      modal: true,
      dismissableMask: true,
      showHeader: false,
      transitionOptions: '550ms cubic-bezier(0.25, 0.8, 0.25, 1)',
      styleClass: 'p-dialog-custom p-dialog-flip',
      maskStyleClass: 'bg-black/60'
    });
  }
}
