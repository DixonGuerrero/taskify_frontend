import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pricing',
  imports: [
    HeaderComponent,
    FooterComponent,
    CardModule,
    ButtonModule,
    ToastModule,
    RouterLink,
  ],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
  providers: [MessageService],
})
export class PricingComponent {
  constructor(private messageService: MessageService) {}

  showFreeToast() {
    this.messageService.add({
      severity: 'success',
      summary: '¡Genial!',
      detail:
        'Taskify es 100% gratuito durante el Hackathon de CubePath. ¡Regístrate ahora!',
      life: 5000,
    });
  }

  showPaymentToast() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Pagos desactivados',
      detail:
        'Esta es una demo del Hackathon CubePath. Los pagos no están disponibles actualmente.',
      life: 6000,
    });
  }
}
