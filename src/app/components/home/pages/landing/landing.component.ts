import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenuLandingComponent } from '../../../../shared/components/menu-landing/menu-landing.component';

import { AnimateOnScroll } from 'primeng/animateonscroll';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';

@Component({
  selector: 'app-landing',
  imports: [
    ButtonModule,
    AnimateOnScroll,
    FooterComponent,
    RouterLink,
    HeaderComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
