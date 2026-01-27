import { Routes } from '@angular/router';
import { GoogleLoginComponent } from './google-login/google-login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: GoogleLoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },

  { path: '**', redirectTo: '' }
];