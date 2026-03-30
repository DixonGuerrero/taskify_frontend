import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { ErrorResponse } from '../../../../core/models/error/error.model';
import { Image } from '../../../../core/models/image/image.model';
import { UserRequest } from '../../../../core/models/user';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ImageService } from '../../../../core/services/image/image.service';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    ToastModule,
  ],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  submitted = false;
  showPassword = false;
  loading = false;
  userImages: Image[] = [];
  googleOAuthUrl = `${environment.API_URL.replace('/api', '')}/oauth2/authorization/google`;
  githubOAuthUrl = `${environment.API_URL.replace('/api', '')}/oauth2/authorization/github`;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private imageService: ImageService,
    private router: Router,
    private messageService: MessageService,
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(3)]],
      last_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$'),
        ],
      ],
      username: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    console.log('Entrando');

    if (this.registerForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }

    this.loading = true;
    const userData: UserRequest = {
      ...this.registerForm.value,
    };

    this.authService.register(userData).subscribe({
      next: (user) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: `¡Bienvenido ${user.first_name}! Tu cuenta ha sido creada.`,
        });

        this.router.navigate(['/dashboard']);
      },
      error: (error: ErrorResponse) => {
        this.loading = false;
        console.error('Error en el registro:', error);

        this.messageService.add({
          severity: 'error',
          summary: error.message || 'Error en el registro',
          detail:
            error.details?.[0] ||
            'No se pudo completar el registro. Por favor, inténtalo de nuevo.',
          life: 5000,
        });
      },
    });
  }
}
