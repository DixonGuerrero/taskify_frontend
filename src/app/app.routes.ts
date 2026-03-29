import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./components/home/home.routes').then((m) => m.homeRoutes),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./components/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./components/dashboard/dashboard.routes').then(
        (m) => m.dashboardRoutes
      ),
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
