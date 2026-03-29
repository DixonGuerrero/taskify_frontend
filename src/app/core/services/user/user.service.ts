import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';

import { User, UserRequest } from '../../models/user/user.model';
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/users/v1`;

  // Cache de usuarios individuales: Map<userId, Observable<User>>
  private userCache = new Map<number, Observable<User>>();
  // Cache de lista de usuarios
  private usersListCache: Observable<User[]> | null = null;
  // Cache de usuario de sesión
  private sessionUserCache: Observable<User> | null = null;

  constructor() {}

  /**
   * Limpia toda la caché de usuarios
   */
  clearCache(): void {
    this.userCache.clear();
    this.usersListCache = null;
    this.sessionUserCache = null;
  }

  /**
   * Limpia la caché de un usuario específico
   */
  clearUserCache(userId: number): void {
    this.userCache.delete(userId);
  }

  /**
   * Limpia la caché del usuario de sesión
   */
  clearSessionUserCache(): void {
    this.sessionUserCache = null;
  }

  /**
   * Obtiene todos los usuarios desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /users/v1
   */
  findAll(): Observable<User[]> {
    if (!this.usersListCache) {
      this.usersListCache = this.http
        .get<User[]>(this.apiUrl)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
    }
    return this.usersListCache;
  }

  /**
   * Obtiene un usuario por su ID desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /users/v1/{id}
   */
  findById(id: number): Observable<User> {
    if (!this.userCache.has(id)) {
      const url = `${this.apiUrl}/${id}`;
      const request$ = this.http
        .get<User>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.userCache.set(id, request$);
    }
    return this.userCache.get(id)!;
  }

  /**
   * Obtiene un usuario por su nombre de usuario desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /users/v1/session-user
   */
  findBySessionUser(): Observable<User> {
    if (!this.sessionUserCache) {
      const url = `${this.apiUrl}/session-user`;
      this.sessionUserCache = this.http
        .get<User>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
    }
    return this.sessionUserCache;
  }

  /**
   * Actualiza un usuario existente en el backend.
   * Invalida la caché del usuario actualizado.
   * Ruta: PUT /users/v1/{id}
   */
  update(id: number, updateRequest: UserRequest): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<User>(url, updateRequest).pipe(
      tap(() => this.clearUserCache(id)),
      catchError(this.handleError),
    );
  }

  /**
   * Elimina un usuario por su ID en el backend.
   * Invalida la caché del usuario eliminado.
   * Ruta: DELETE /users/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.clearUserCache(id)),
      catchError(this.handleError),
    );
  }
  /**
   * Maneja errores HTTP y lanza un ErrorResponse.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorResponse: ErrorResponse;
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
          error.message || 'Error desconocido en la solicitud de usuario.',
        details: [error.statusText || 'Error sin detalles'],
        timestamp: new Date().toISOString(),
      };
    }
    console.error('API Error (UserService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
