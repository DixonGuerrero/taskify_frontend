import { Component } from '@angular/core';
import {
  DialogService,
  DynamicDialogComponent,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-landing',
  imports: [Menu, ButtonModule, RouterLink],
  templateUrl: './menu-landing.component.html',
  styleUrl: './menu-landing.component.css',
})
export class MenuLandingComponent {
  instance: DynamicDialogComponent | undefined;

  constructor(
    public ref: DynamicDialogRef,
    public dialogService: DialogService
  ) {
    this.instance = this.dialogService.getInstance(ref);
  }

  items: MenuItem[] = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      routerLink: 'home/',
      command: () => this.closeDialog()
    },
    {
      label: 'Precios',
      icon: 'pi pi-star',
      routerLink: 'home/pricing',
      command: () => this.closeDialog()
    },
    {
      label: 'Roadmap',
      icon: 'pi pi-map',
      routerLink: 'home/roadmap',
      command: () => this.closeDialog()
    },
  ];



  closeDialog(): void {
    if (this.ref) {
      this.ref.close();
    }
  }
}
