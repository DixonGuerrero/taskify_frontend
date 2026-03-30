import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, tap, shareReplay } from 'rxjs/operators';

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

  // Cache de proyectos individuales: Map<projectId, Observable<Project>>
  private projectCache = new Map<number, Observable<Project>>();
  // Cache de listas de proyectos
  private projectsListCache: Observable<Project[]> | null = null;
  // Cache de proyectos por creador
  private projectsByCreatorCache = new Map<number, Observable<Project[]>>();
  // Cache de proyectos por miembro
  private projectsByMemberCache = new Map<number, Observable<Project[]>>();

  constructor() {}

  /**
   * Limpia toda la caché de proyectos
   */
  clearCache(): void {
    this.projectCache.clear();
    this.projectsListCache = null;
    this.projectsByCreatorCache.clear();
    this.projectsByMemberCache.clear();
  }

  /**
   * Limpia la caché de un proyecto específico
   */
  clearProjectCache(projectId: number): void {
    this.projectCache.delete(projectId);
  }

  /**
   * Limpia la caché de proyectos por miembro
   */
  clearProjectsByMemberCache(memberId: number): void {
    this.projectsByMemberCache.delete(memberId);
  }

  /**
   * Limpia la caché de proyectos por creador
   */
  clearProjectsByCreatorCache(creatorId: number): void {
    this.projectsByCreatorCache.delete(creatorId);
  }

  /**
   * Obtiene todos los proyectos desde el backend.
   * Usa caché para evitar consultas repetidas.
   */
  findAll(): Observable<Project[]> {
    if (!this.projectsListCache) {
      this.projectsListCache = this.http
        .get<Project[]>(this.apiUrl)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
    }
    return this.projectsListCache;
  }

  /**
   * Obtiene un proyecto por su ID desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /projects/v1/{id}
   */
  findById(id: number): Observable<Project> {
    if (!this.projectCache.has(id)) {
      const url = `${this.apiUrl}/${id}`;
      const request$ = this.http
        .get<Project>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.projectCache.set(id, request$);
    }
    return this.projectCache.get(id)!;
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
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /projects/v1/creator-id/{creatorId}
   */
  findByCreatorId(creatorId: number): Observable<Project[]> {
    if (!this.projectsByCreatorCache.has(creatorId)) {
      const url = `${this.apiUrl}/creator-id/${creatorId}`;
      const request$ = this.http
        .get<Project[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.projectsByCreatorCache.set(creatorId, request$);
    }
    return this.projectsByCreatorCache.get(creatorId)!;
  }

  /**
   * Obtiene proyectos por el ID de un miembro desde el backend.
   * Usa caché para evitar consultas repetidas.
   * Ruta: GET /projects/v1/by-member/{memberId}
   */
  findByMemberId(memberId: number): Observable<Project[]> {
    if (!this.projectsByMemberCache.has(memberId)) {
      const url = `${this.apiUrl}/by-member/${memberId}`;
      const request$ = this.http
        .get<Project[]>(url)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(this.handleError),
        );
      this.projectsByMemberCache.set(memberId, request$);
    }
    return this.projectsByMemberCache.get(memberId)!;
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
   * Invalida las cachés de listas para actualizar el sidebar.
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
                  locationUrl,
                );
                return throwError(
                  () => new Error('ID inválido en la cabecera Location.'),
                );
              }

              // Clear list caches to force refresh in sidebar
              this.projectsByCreatorCache.clear();
              this.projectsByMemberCache.clear();
              this.projectsListCache = null;
              this.projectStateService.notifyProjectListChanged();

              return this.findById(projectId);
            } catch (e) {
              console.error('Error al procesar la URL de Location:', e);
              return throwError(
                () =>
                  new Error(
                    'Error al procesar la ubicación del nuevo proyecto.',
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
                  'No se pudo obtener la ubicación del nuevo proyecto (falta cabecera Location).',
                ),
            );
          }
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Actualiza un proyecto existente en el backend.
   * Invalida la caché del proyecto actualizado.
   * Ruta: PUT /projects/v1/{projectId}
   */
  update(
    projectId: number,
    projectUpdateRequest: ProjectUpdateRequest,
  ): Observable<Project> {
    const url = `${this.apiUrl}/${projectId}`;
    return this.http.put<Project>(url, projectUpdateRequest).pipe(
      tap(() => {
        this.clearProjectCache(projectId);
        this.projectStateService.notifyProjectListChanged();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Añade un miembro a un proyecto en el backend.
   * Invalida la caché del proyecto.
   * Espera una respuesta 204 No Content en caso de éxito.
   * Ruta: POST /projects/v1/{projectId}/add-member/{userId}
   */
  addMember(projectId: number, userId: number): Observable<void> {
    const url = `${this.apiUrl}/${projectId}/add-member/${userId}`;
    return this.http.post<void>(url, {}).pipe(
      tap(() => {
        console.log(
          `Member ${userId} added to project ${projectId} successfully.`,
        );
        this.clearProjectCache(projectId);
        this.projectStateService.notifyProjectListChanged();
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Elimina un proyecto por su ID en el backend.
   * Invalida la caché del proyecto eliminado y las listas.
   * Ruta: DELETE /projects/v1/{id}
   */
  deleteById(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.clearProjectCache(id);
        // Clear list caches to force refresh in sidebar
        this.projectsByCreatorCache.clear();
        this.projectsByMemberCache.clear();
        this.projectsListCache = null;
        this.projectStateService.notifyProjectListChanged();
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
