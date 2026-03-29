import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCreateFormComponent } from './project-create-form.component';

describe('ProjectCreateFormComponent', () => {
  let component: ProjectCreateFormComponent;
  let fixture: ComponentFixture<ProjectCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
