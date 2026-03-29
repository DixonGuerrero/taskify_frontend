import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';

import { Image, ImageCreateRequest, ImageType } from '../../models/image';
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/images/v1`;

  // Cache de imágenes individuales: Map<imageId, Observable<Image>>
  private imageCache = new Map<number, Observable<Image>>();
  // Cache de lista de imágenes
  private imagesListCache: Observable<Image[]> | null = null;
  // Cache de imágenes por tipo: Map<type, Observable<Image[]>>
  private imagesByTypeCache = new Map<string, Observable<Image[]>>();

  constructor() {}

  /**
   * Limpia toda la caché de imágenes
   */
  clearCache(): void {
    this.imageCache.clear();
    this.imagesListCache = null;
    this.imagesByTypeCache.clear();
  }

  /**
   * Limpia la caché de una imagen específica
   */
  clearImageCache(imageId: number): void {
    this.imageCache.delete(imageId);
  }

  /**
   * Obtiene todas las imágenes desde el backend.
   * Usa caché para evitar consultas repetidas.
   */
  findAll(): Observable<Image[]> {
    if (!this.imagesListCache) {
      this.imagesListCache = this.http
        .get<Image[]>(this.apiUrl)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
    }
    return this.imagesListCache;
  }

  /**
   * Obtiene una imagen por su ID desde el backend.
   * Usa caché para evitar consultas repetidas.
   */
  findById(id: number): Observable<Image> {
    if (!this.imageCache.has(id)) {
      const url = `${this.apiUrl}/${id}`;
      const request$ = this.http
        .get<Image>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.imageCache.set(id, request$);
    }
    return this.imageCache.get(id)!;
  }

  /**
   * Obtiene imágenes por tipo desde el backend.
   * Usa caché para evitar consultas repetidas.
   */
  findByType(type: ImageType): Observable<Image[]> {
    if (!this.imagesByTypeCache.has(type)) {
      const url = `${this.apiUrl}/type/${type}`;
      const request$ = this.http
        .get<Image[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.imagesByTypeCache.set(type, request$);
    }
    return this.imagesByTypeCache.get(type)!;
  }

  /**
   * Guarda una nueva imagen en el backend.
   * Invalida la caché de listas.
   */
  save(imageRequest: ImageCreateRequest): Observable<Image> {
    return this.http.post<Image>(this.apiUrl, imageRequest).pipe(
      tap(() => {
        // Invalida cachés de listas ya que hay una nueva imagen
        this.imagesListCache = null;
        this.imagesByTypeCache.clear();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Elimina una imagen por su ID en el backend.
   * Invalida la caché de la imagen eliminada.
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.clearImageCache(id);
        // Invalida cachés de listas
        this.imagesListCache = null;
        this.imagesByTypeCache.clear();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Manejo centralizado de errores para todos los métodos del servicio.
   * Lanza un ErrorResponse que puede ser capturado desde el componente.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorResponse: ErrorResponse;

    if (
      error.error &&
      typeof error.error === 'object' &&
      'code' in error.error
    ) {
      // El backend devolvió un objeto ErrorResponse estructurado
      errorResponse = error.error as ErrorResponse;
    } else {
      // Error genérico
      errorResponse = {
        code: `HTTP_${error.status}`,
        message:
          error.message || 'Error desconocido en la solicitud de imagen.',
        details: [error.statusText || 'Error sin detalles'],
        timestamp: new Date().toISOString(),
      };
    }

    console.error('API Error (ImageService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
