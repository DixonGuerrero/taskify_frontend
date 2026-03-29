import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Image, ImageCreateRequest, ImageType } from '../../models/image';
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/images/v1`;

  constructor() {}

  findAll(): Observable<Image[]> {
    return this.http.get<Image[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  findById(id: number): Observable<Image> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Image>(url).pipe(
      catchError(this.handleError)
    );
  }

  findByType(type: ImageType): Observable<Image[]> {
    const url = `${this.apiUrl}/type/${type}`;
    return this.http.get<Image[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  save(imageRequest: ImageCreateRequest): Observable<Image> {
    return this.http.post<Image>(this.apiUrl, imageRequest).pipe(
      catchError(this.handleError)
    );
  }

  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo centralizado de errores para todos los métodos del servicio.
   * Lanza un ErrorResponse que puede ser capturado desde el componente.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorResponse: ErrorResponse;

    if (error.error && typeof error.error === 'object' && 'code' in error.error) {
      // El backend devolvió un objeto ErrorResponse estructurado
      errorResponse = error.error as ErrorResponse;
    } else {
      // Error genérico
      errorResponse = {
        code: `HTTP_${error.status}`,
        message: error.message || 'Error desconocido en la solicitud de imagen.',
        details: [error.statusText || 'Error sin detalles'],
        timestamp: new Date().toISOString()
      };
    }

    console.error('API Error (ImageService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
