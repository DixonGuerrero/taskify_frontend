import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, Subject } from 'rxjs';
import {
  catchError,
  map,
  tap,
  switchMap,
  finalize,
  timeout,
  first,
} from 'rxjs/operators';
import { AuthLoginRequest } from '../../models/auth/auth.model';
import { User, UserRequest } from '../../models/user/user.model';
import { UserService } from '../user/user.service';
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private apiUrl = environment.API_URL;

  private loggedInUser: User | null = null;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private isInitialized = false;
  private initializationSubject = new Subject<boolean>();

  constructor() {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    this.userService
      .findBySessionUser()
      .pipe(
        timeout(5000),
        tap((user) => {
          this.loggedInUser = user;
          this.currentUserSubject.next(user);
        }),
        catchError((error: HttpErrorResponse) => {
          this.clearUserState();
          return of(null);
        }),
        finalize(() => {
          this.isInitialized = true;
          this.initializationSubject.next(true);
          this.initializationSubject.complete();
        }),
      )
      .subscribe();
  }

  waitForAuthInitialization(): Observable<boolean> {
    if (this.isInitialized) {
      return of(true);
    }
    return this.initializationSubject.asObservable().pipe(first());
  }

  public get currentUserValue(): User | null {
    return this.loggedInUser;
  }

  updateCurrentUser(user: User): void {
    this.loggedInUser = user;
    this.currentUserSubject.next(this.loggedInUser);
  }

  login(loginRequest: AuthLoginRequest): Observable<User> {
    const loginUrl = `${this.apiUrl}/auth/v1/login`;

    return this.http.post<any>(loginUrl, loginRequest).pipe(
      switchMap(() => {
        return this.userService.findBySessionUser().pipe(
          tap((user) => {
            this.loggedInUser = user;
            this.currentUserSubject.next(this.loggedInUser);
          }),
          map((user) => user),
        );
      }),
      catchError((error: HttpErrorResponse | Error) => {
        this.clearUserState();
        let errorResponse: ErrorResponse;
        if (error instanceof HttpErrorResponse) {
          if (
            error.error &&
            typeof error.error === 'object' &&
            'code' in error.error
          ) {
            errorResponse = error.error as ErrorResponse;
          } else {
            errorResponse = {
              code: `HTTP_${error.status}`,
              message:
                error.statusText || 'Error desconocido durante el login.',
              details: [error.message],
              timestamp: new Date().toISOString(),
            };
          }
        } else {
          errorResponse = {
            code: 'AUTH_LOGIN_ERROR',
            message:
              error.message || 'Error interno durante el proceso de login.',
            details: [],
            timestamp: new Date().toISOString(),
          };
        }
        console.error('API Error (AuthService - Login):', errorResponse);
        return throwError(() => errorResponse);
      }),
    );
  }

  register(userRequest: UserRequest): Observable<User> {
    const registerUrl = `${this.apiUrl}/auth/v1/signup`;
    return this.http.post<any>(registerUrl, userRequest).pipe(
      switchMap(() => {
        return this.userService.findBySessionUser().pipe(
          tap((user) => {
            this.loggedInUser = user;
            this.currentUserSubject.next(this.loggedInUser);
          }),
          map((user) => user),
        );
      }),
      catchError((error) => {
        this.clearUserState();
        return this.handleError(error);
      }),
    );
  }

  logout(): void {
    const logoutUrl = `${this.apiUrl}/auth/v1/logout`;
    this.http
      .post(logoutUrl, {})
      .pipe(
        tap(() => {}),
        catchError((error) => {
          return of(null);
        }),
        finalize(() => {
          this.clearUserState();
        }),
      )
      .subscribe();
  }

  clearUserState(): void {
    this.loggedInUser = null;
    this.currentUserSubject.next(null);
  }

  private _clearUserState(): void {
    this.clearUserState();
  }

  isAuthenticated(): Observable<boolean> {
    if (this.isInitialized && this.loggedInUser !== null) {
      return of(true);
    }
    return this.currentUser.pipe(
      first(),
      map((user) => !!user),
    );
  }

  hasRole(roleName: string): boolean {
    return (
      !!this.loggedInUser?.role && this.loggedInUser.role.name === roleName
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorResponse: ErrorResponse;
    if (
      error.error &&
      typeof error.error === 'object' &&
      'code' in error.error
    ) {
      errorResponse = error.error as ErrorResponse;
    } else {
      if (error.status === 401 || error.status === 403) {
        errorResponse = {
          code: `HTTP_${error.status}`,
          message: 'Acceso no autorizado o sesión inválida.',
          details: [error.message || error.statusText],
          timestamp: new Date().toISOString(),
        };
      } else {
        errorResponse = {
          code: `HTTP_${error.status}`,
          message: error.message || 'Error desconocido en la solicitud.',
          details: [error.statusText || 'Error sin detalles'],
          timestamp: new Date().toISOString(),
        };
      }
    }
    console.error('API Error (AuthService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
