import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCreateFormComponent } from './task-create-form.component';

describe('TaskCreateFormComponent', () => {
  let component: TaskCreateFormComponent;
  let fixture: ComponentFixture<TaskCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
