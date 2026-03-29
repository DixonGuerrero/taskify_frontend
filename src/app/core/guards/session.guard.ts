import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.waitForAuthInitialization().pipe(
      switchMap(() => {
        return this.authService.isAuthenticated().pipe(
          switchMap((isAuthenticated) => {
            if (isAuthenticated) {
              this.router.navigate(['/dashboard']);
              return of(false);
            }
            return of(true);
          })
        );
      }),
      catchError((error) => {
        console.error('SessionGuard: Error checking authentication:', error);
        return of(true);
      })
    );
  }
}