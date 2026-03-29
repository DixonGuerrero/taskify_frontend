import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCalendarDetailComponent } from './task-calendar-detail.component';

describe('TaskCalendarDetailComponent', () => {
  let component: TaskCalendarDetailComponent;
  let fixture: ComponentFixture<TaskCalendarDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCalendarDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskCalendarDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
