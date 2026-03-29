import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import {
  Project,
  ProjectCreateRequest,
} from '../../models/project/project.model';
import { ProjectUpdateRequest } from '../../models/project/project.model';

// Cambiado a environment general
import { environment } from '../../../../environments/environment.development';
import { ErrorResponse } from '../../models/error/error.model';
import { ProjectStateService } from './project-state.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private http = inject(HttpClient);
  private projectStateService = inject(ProjectStateService);
  private apiUrl = `${environment.API_URL}/projects/v1`;

  constructor() {}

  /**
   * Obtiene todos los proyectos desde el backend.
   */
  findAll(): Observable<Project[]> {
    return this.http
      .get<Project[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene un proyecto por su ID desde el backend.
   * Ruta: GET /projects/v1/{id}
   */
  findById(id: number): Observable<Project> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Project>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene proyectos por el codigo de invitacion
   * Ruta: GET /projects/v1/invite-code/{invitationCode}
   **/
  findByInvitationCode(invitationCode: string): Observable<Project> {
    const url = `${this.apiUrl}/invite-code/${invitationCode}`;
    return this.http.get<Project>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene proyectos por el ID del creador desde el backend.
   * Ruta: GET /projects/v1/creator-id/{creatorId}
   */
  findByCreatorId(creatorId: number): Observable<Project[]> {
    const url = `${this.apiUrl}/creator-id/${creatorId}`;
    return this.http.get<Project[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene proyectos por el ID de un miembro desde el backend.
   * Ruta: GET /projects/v1/by-member/{memberId}
   */
  findByMemberId(memberId: number): Observable<Project[]> {
    const url = `${this.apiUrl}/by-member/${memberId}`;
    return this.http.get<Project[]>(url).pipe(catchError(this.handleError));
  }

  /**
   * Obtiene múltiples proyectos por sus IDs desde el backend.
   * Ruta: GET /projects/v1/by-ids?ids=id1&ids=id2...
   */
  findAllByIds(ids: number[]): Observable<Project[]> {
    let params = new HttpParams();
    ids.forEach((id) => {
      params = params.append('ids', id.toString());
    });
    const url = `${this.apiUrl}/by-ids`;
    return this.http
      .get<Project[]>(url, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Guarda un nuevo proyecto en el backend.
   * Extrae el ID de la cabecera Location y usa findById para obtener el proyecto.
   * Ruta: POST /projects/v1
   */
  save(projectData: ProjectCreateRequest): Observable<Project> {
    return this.http
      .post<void>(`${this.apiUrl}`, projectData, { observe: 'response' })
      .pipe(
        switchMap((response: HttpResponse<void>) => {
          const locationUrl = response.headers.get('Location');
          if (locationUrl) {
            try {
              const urlParts = locationUrl.split('/');
              const idString = urlParts[urlParts.length - 1];
              const projectId = parseInt(idString, 10);

              if (isNaN(projectId)) {
                console.error(
                  'Error: No se pudo extraer un ID numérico de la URL:',
                  locationUrl
                );
                return throwError(
                  () => new Error('ID inválido en la cabecera Location.')
                );
              }
              return this.findById(projectId);
            } catch (e) {
              console.error('Error al procesar la URL de Location:', e);
              return throwError(
                () =>
                  new Error(
                    'Error al procesar la ubicación del nuevo proyecto.'
                  )
              );
            }
          } else {
            console.error(
              'Error: No se encontró la cabecera Location en la respuesta.'
            );
            return throwError(
              () =>
                new Error(
                  'No se pudo obtener la ubicación del nuevo proyecto (falta cabecera Location).'
                )
            );
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza un proyecto existente en el backend.
   * Ruta: PUT /projects/v1/{projectId}
   */
  update(
    projectId: number,
    projectUpdateRequest: ProjectUpdateRequest
  ): Observable<Project> {
    const url = `${this.apiUrl}/${projectId}`;
    return this.http.put<Project>(url, projectUpdateRequest).pipe(
      tap(() => this.projectStateService.notifyProjectListChanged()),
      catchError(this.handleError)
    );
  }

  /**
   * Añade un miembro a un proyecto en el backend.
   * Espera una respuesta 204 No Content en caso de éxito.
   * Ruta: POST /projects/v1/{projectId}/add-member/{userId}
   */
  addMember(projectId: number, userId: number): Observable<void> {
    const url = `${this.apiUrl}/${projectId}/add-member/${userId}`;
    return this.http.post<void>(url, {}).pipe(
      tap(() => {
        console.log(`Member ${userId} added to project ${projectId} successfully.`);
        this.projectStateService.notifyProjectListChanged();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un proyecto por su ID en el backend.
   * Ruta: DELETE /projects/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.projectStateService.notifyProjectListChanged()),
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
        message:
          error.message || 'Error desconocido en la solicitud de proyecto.',
        details: [error.statusText || 'Error sin detalles'],
        timestamp: new Date().toISOString(),
      };
    }
    console.error('API Error (ProjectService):', errorResponse);
    return throwError(() => errorResponse);
  }
}
