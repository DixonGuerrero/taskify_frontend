import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

import { ConfirmDialog } from 'primeng/confirmdialog';
import { ThemeService } from './core/theme/service/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ButtonModule, ConfirmDialog],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {

  title = 'Taskify';
 
}
