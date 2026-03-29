import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/files/v1`;

  constructor() {}

  /**
   * Elimina un archivo por su ID en el backend.
   * Espera una respuesta 204 No Content en caso de éxito.
   * Ruta: DELETE /files/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
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
        message: error.message || 'Error desconocido en la solicitud de archivo.',
        details: [error.statusText || 'Error sin detalles'],
        timestamp: new Date().toISOString(),
      };
    }
    console.error('API Error (FileService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
