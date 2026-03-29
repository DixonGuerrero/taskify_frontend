import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Project } from '../../models/project/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private currentProjectSubject = new BehaviorSubject<Project | null>(null);
  
  constructor() {}

  /**
   * Set the current project in the application state
   */
  setCurrentProject(project: Project): void {
    this.currentProjectSubject.next(project);
  }

  /**
   * Get the current project as an observable
   */
  getCurrentProject(): Observable<Project | null> {
    return this.currentProjectSubject.asObservable();
  }

  /**
   * Get the current project value
   */
  getCurrentProjectValue(): Project | null {
    return this.currentProjectSubject.getValue();
  }

  /**
   * Clear the current project from state
   */
  clearCurrentProject(): void {
    this.currentProjectSubject.next(null);
  }

  // Add a new subject to emit when projects are added or joined
  private projectListChangedSubject = new Subject<void>();
  
  // Observable that components can subscribe to
  public projectListChanged$: Observable<void> = this.projectListChangedSubject.asObservable();

  // Method to call when a project is created or joined
  public notifyProjectListChanged(): void {
    this.projectListChangedSubject.next();
  }
}