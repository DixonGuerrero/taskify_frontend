import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthCallbackComponent } from './pages/callback/auth-callback.component';
import { SessionGuard } from '../../core/guards/session.guard';

export const authRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [SessionGuard],
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'callback',
        component: AuthCallbackComponent,
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];
