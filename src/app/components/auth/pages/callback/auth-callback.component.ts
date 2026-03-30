import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user/user.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col justify-center items-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
      ></div>
      <p class="mt-4 text-primary font-medium">Completando autenticación...</p>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.userService
      .findBySessionUser()
      .pipe(
        tap((user) => {
          console.log('User loaded:', user);
          this.authService.updateCurrentUser(user);
          this.router.navigate(['/dashboard']);
        }),
        catchError((error) => {
          console.error('Error loading user after OAuth2:', error);
          this.router.navigate(['/auth/login']);
          return of(null);
        }),
      )
      .subscribe();
  }
}
