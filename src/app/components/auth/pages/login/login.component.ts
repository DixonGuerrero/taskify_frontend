import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { AuthLoginRequest } from '../../../../core/models/auth';
import { ErrorResponse } from '../../../../core/models/error/error.model';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  submitted = false;
  showPassword = false;
  loading = false;
  checkingAuth = true;
  googleOAuthUrl = `${environment.API_URL.replace('/api', '')}/oauth2/authorization/google`;
  githubOAuthUrl = `${environment.API_URL.replace('/api', '')}/oauth2/authorization/github`;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.authService.currentUser.subscribe((user) => {
      this.checkingAuth = false;
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }

    this.loading = true;
    const loginRequest: AuthLoginRequest = this.loginForm.value;
    console.log(loginRequest);

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        console.log(user);
        this.loading = false;
        this.submitted = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Inicio de sesión correcto.',
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err: ErrorResponse) => {
        console.log(err);
        this.loading = false;
        this.submitted = false;
        const detail =
          err.details && err.details.length > 0
            ? err.details[0]
            : 'Error desconocido.';
        this.messageService.add({
          severity: 'error',
          summary: err.message || 'Error de autenticación',
          detail: detail,
          life: 5000,
        });
      },
    });
  }
}
