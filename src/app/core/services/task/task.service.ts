import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse, // Importar HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators'; // Importar switchMap

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

  constructor() {}

  /**
   * Obtiene una tarea por su ID desde el backend.
   * Ruta: GET /tasks/v1/{id}
   */
  findById(id: number): Observable<Task> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Task>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene tareas por el ID del proyecto desde el backend.
   * Ruta: GET /tasks/v1/project/{projectId}
   */
  findByProjectId(projectId: number): Observable<Task[]> {
    const url = `${this.apiUrl}/project/${projectId}`;
    return this.http.get<Task[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene tareas por el ID del usuario asignado desde el backend.
   * Ruta: GET /tasks/v1/assigned/{userId}
   */
  findByAssignedUserId(userId: number): Observable<Task[]> {
    const url = `${this.apiUrl}/assigned/${userId}`;
    return this.http.get<Task[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene tareas por ID de proyecto y estado desde el backend.
   * Ruta: GET /tasks/v1/project/{projectId}/status/{status}
   */
  findByProjectIdAndStatus(
    projectId: number,
    status: TaskStatus,
  ): Observable<Task[]> {
    const url = `${this.apiUrl}/project/${projectId}/status/${status}`;
    return this.http.get<Task[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Guarda una nueva tarea en el backend.
   * Extrae el ID de la cabecera Location y usa findById para obtener la tarea.
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
   * Actualiza una tarea existente en el backend.
   * Ruta: PUT /tasks/v1/{taskId}
   */
  update(taskId: number, taskUpdateRequest: TaskRequest): Observable<Task> {
    const url = `${this.apiUrl}/${taskId}`;
    return this.http.put<Task>(url, taskUpdateRequest).pipe(
      // Podrías añadir un tap() aquí para notificar cambios
      catchError(this.handleError),
    );
  }

  /**
   * Elimina una tarea por su ID en el backend.
   * Ruta: DELETE /tasks/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      // Podrías añadir un tap() aquí para notificar cambios
      catchError(this.handleError),
    );
  }

  /**
   * Adjunta un archivo a una tarea (multipart/form-data, parte `file`).
   * Respuesta 201 Created sin cuerpo en caso de éxito.
   * Ruta: POST /tasks/v1/{taskId}/add-file
   */
  addFile(taskId: number, file: globalThis.File): Observable<void> {
    const url = `${this.apiUrl}/${taskId}/add-file`;
    const body = new FormData();
    body.append('file', file);
    return this.http.post<void>(url, body).pipe(catchError(this.handleError));
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
