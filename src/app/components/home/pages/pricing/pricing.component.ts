import { Component } from '@angular/core';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-pricing',
  imports: [HeaderComponent, FooterComponent, CardModule, ButtonModule
  ],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css'
})
export class PricingComponent {

}
