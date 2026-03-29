import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { User, UserRequest } from '../../models/user/user.model';
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/users/v1`;

  constructor() {}

  /**
   * Obtiene todos los usuarios desde el backend.
   * Ruta: GET /users/v1
   */
  findAll(): Observable<User[]> {
    return this.http
      .get<User[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene un usuario por su ID desde el backend.
   * Ruta: GET /users/v1/{id}
   */
  findById(id: number): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<User>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene un usuario por su nombre de usuario desde el backend.
   * Ruta: GET /users/v1/username/{username}
   */
  findBySessionUser(): Observable<User> {
    const url = `${this.apiUrl}/session-user`;
    return this.http.get<User>(url).pipe(catchError(this.handleError));
  }

  /**
   * Actualiza un usuario existente en el backend.
   * Ruta: PUT /users/v1/{id}
   */
  update(id: number, updateRequest: UserRequest): Observable<User> {
    const url = `${this.apiUrl}/${id}`;
    return this.http
      .put<User>(url, updateRequest)
      .pipe(catchError(this.handleError));
  }

  /**
   * Elimina un usuario por su ID en el backend.
   * Ruta: DELETE /users/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
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
