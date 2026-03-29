import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse, // Importar HttpResponse
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, tap, shareReplay } from 'rxjs/operators';

import { Task, TaskRequest } from '../../models/task/task.model';
import { TaskStatus } from '../../models/task/task-status.model';

// Cambiado a environment general
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/tasks/v1`;

  // Cache de tareas individuales: Map<taskId, Observable<Task>>
  private taskCache = new Map<number, Observable<Task>>();
  // Cache de tareas por proyecto: Map<projectId, Observable<Task[]>>
  private tasksByProjectCache = new Map<number, Observable<Task[]>>();
  // Cache de tareas por usuario asignado: Map<userId, Observable<Task[]>>
  private tasksByAssignedCache = new Map<number, Observable<Task[]>>();
  // Cache de tareas por proyecto y estado: Map<projectId-status, Observable<Task[]>>
  private tasksByProjectAndStatusCache = new Map<string, Observable<Task[]>>();

  constructor() {}

  /**
   * Limpia toda la caché de tareas
   */
  clearCache(): void {
    this.taskCache.clear();
    this.tasksByProjectCache.clear();
    this.tasksByAssignedCache.clear();
    this.tasksByProjectAndStatusCache.clear();
  }

  /**
   * Limpia la caché de una tarea específica
   */
  clearTaskCache(taskId: number): void {
    this.taskCache.delete(taskId);
  }

  /**
   * Limpia la caché de tareas por proyecto
   */
  clearProjectTasksCache(projectId: number): void {
    this.tasksByProjectCache.delete(projectId);
  }

  /**
   * Obtiene una tarea por su ID desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /tasks/v1/{id}
   */
  findById(id: number): Observable<Task> {
    if (!this.taskCache.has(id)) {
      const url = `${this.apiUrl}/${id}`;
      const request$ = this.http
        .get<Task>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.taskCache.set(id, request$);
    }
    return this.taskCache.get(id)!;
  }

  /**
   * Obtiene tareas por el ID del proyecto desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /tasks/v1/project/{projectId}
   */
  findByProjectId(projectId: number): Observable<Task[]> {
    if (!this.tasksByProjectCache.has(projectId)) {
      const url = `${this.apiUrl}/project/${projectId}`;
      const request$ = this.http
        .get<Task[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.tasksByProjectCache.set(projectId, request$);
    }
    return this.tasksByProjectCache.get(projectId)!;
  }

  /**
   * Obtiene tareas por el ID del usuario asignado desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /tasks/v1/assigned/{userId}
   */
  findByAssignedUserId(userId: number): Observable<Task[]> {
    if (!this.tasksByAssignedCache.has(userId)) {
      const url = `${this.apiUrl}/assigned/${userId}`;
      const request$ = this.http
        .get<Task[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.tasksByAssignedCache.set(userId, request$);
    }
    return this.tasksByAssignedCache.get(userId)!;
  }

  /**
   * Obtiene tareas por ID de proyecto y estado desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /tasks/v1/project/{projectId}/status/{status}
   */
  findByProjectIdAndStatus(
    projectId: number,
    status: TaskStatus,
  ): Observable<Task[]> {
    const cacheKey = `${projectId}-${status}`;
    if (!this.tasksByProjectAndStatusCache.has(cacheKey)) {
      const url = `${this.apiUrl}/project/${projectId}/status/${status}`;
      const request$ = this.http
        .get<Task[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.tasksByProjectAndStatusCache.set(cacheKey, request$);
    }
    return this.tasksByProjectAndStatusCache.get(cacheKey)!;
  }

  /**
   * Guarda una nueva tarea en el backend.
   * Extrae el ID de la cabecera Location y usa findById para obtener la tarea.
   * Invalida caché del proyecto al crear nueva tarea.
   * Ruta: POST /tasks/v1
   */
  save(taskRequest: TaskRequest): Observable<Task> {
    return this.http
      .post<void>(this.apiUrl, taskRequest, { observe: 'response' })
      .pipe(
        switchMap((response: HttpResponse<void>) => {
          const locationUrl = response.headers.get('Location');
          if (locationUrl) {
            try {
              const urlParts = locationUrl.split('/');
              const idString = urlParts[urlParts.length - 1];
              const taskId = parseInt(idString, 10);

              if (isNaN(taskId)) {
                console.error(
                  'Error: No se pudo extraer un ID numérico de la URL:',
                  locationUrl,
                );
                return throwError(
                  () => new Error('ID inválido en la cabecera Location.'),
                );
              }
              // Invalidar cache del proyecto
              this.clearProjectTasksCache(taskRequest.project_id);
              this.clearCacheByProjectAndStatus(taskRequest.project_id);
              return this.findById(taskId);
            } catch (e) {
              console.error('Error al procesar la URL de Location:', e);
              return throwError(
                () =>
                  new Error(
                    'Error al procesar la ubicación de la nueva tarea.',
                  ),
              );
            }
          } else {
            console.error(
              'Error: No se encontró la cabecera Location en la respuesta.',
            );
            return throwError(
              () =>
                new Error(
                  'No se pudo obtener la ubicación de la nueva tarea (falta cabecera Location).',
                ),
            );
          }
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Limpia la caché de tareas por proyecto y estado
   */
  private clearCacheByProjectAndStatus(projectId: number): void {
    const keysToDelete: string[] = [];
    this.tasksByProjectAndStatusCache.forEach((_, key) => {
      if (key.startsWith(`${projectId}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) =>
      this.tasksByProjectAndStatusCache.delete(key),
    );
  }

  /**
   * Actualiza una tarea existente en el backend.
   * Invalida la caché de la tarea actualizada.
   * Ruta: PUT /tasks/v1/{taskId}
   */
  update(taskId: number, taskUpdateRequest: TaskRequest): Observable<Task> {
    const url = `${this.apiUrl}/${taskId}`;
    return this.http.put<Task>(url, taskUpdateRequest).pipe(
      tap(() => {
        this.clearTaskCache(taskId);
        this.clearProjectTasksCache(taskUpdateRequest.project_id);
        this.clearCacheByProjectAndStatus(taskUpdateRequest.project_id);
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Elimina una tarea por su ID en el backend.
   * Invalida la caché de la tarea eliminada.
   * Ruta: DELETE /tasks/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.clearTaskCache(id);
        // Limpiar todas las caches de listas ya que no sabemos de qué proyecto era
        this.tasksByProjectCache.clear();
        this.tasksByProjectAndStatusCache.clear();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Adjunta un archivo a una tarea (multipart/form-data, parte `file`).
   * Invalida la caché de la tarea.
   * Respuesta 201 Created sin cuerpo en caso de éxito.
   * Ruta: POST /tasks/v1/{taskId}/add-file
   */
  addFile(taskId: number, file: globalThis.File): Observable<void> {
    const url = `${this.apiUrl}/${taskId}/add-file`;
    const body = new FormData();
    body.append('file', file);
    return this.http.post<void>(url, body).pipe(
      tap(() => {
        this.clearTaskCache(taskId);
      }),
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
        message: error.message || 'Error desconocido en la solicitud de tarea.',
        details: [error.statusText || 'Error sin detalles'], // Añadido fallback
        timestamp: new Date().toISOString(),
      };
    }
    console.error('API Error (TaskService):', errorResponse);
    // Lanzar el error estructurado
    return throwError(() => errorResponse);
  }
}
