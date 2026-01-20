import { Routes } from '@angular/router';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: GoogleLoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '' }
];
