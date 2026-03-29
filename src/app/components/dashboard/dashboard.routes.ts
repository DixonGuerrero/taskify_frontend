import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { SettingsPageComponent } from './features/settings/pages/settings-page/settings-page.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ProjectsPageComponent } from './features/projects/pages/projects-page/projects-page.component';
import { ProjectDetailComponent } from './features/projects/pages/project-detail/project-detail.component';
import { CalendarPageComponent } from './features/calendar/pages/calendar-page/calendar-page.component';


export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: 'projects', component: ProjectsPageComponent
      },
      // Move the detail route to be a sibling of projects, not a child
      {
        path: 'projects/detail', component: ProjectDetailComponent
      },
      {
        path: 'calendar', component: CalendarPageComponent
      },
      {
        path: 'profile', component: ProfileComponent
      },
      {
        path: 'settings', component: SettingsPageComponent
      },
      {
        path: '', redirectTo: 'projects', pathMatch: 'full'
      }
    ]
  },
];
