import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskEditFormComponent } from './task-edit-form.component';

describe('TaskEditFormComponent', () => {
  let component: TaskEditFormComponent;
  let fixture: ComponentFixture<TaskEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskEditFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskEditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
