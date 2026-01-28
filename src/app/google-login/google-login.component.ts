import { Component, OnInit, NgZone, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

// Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';

declare var google: any;

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './google-login.component.html',
  styleUrls: ['./google-login.component.css']
})
export class GoogleLoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Load Google API script
    this.loadGoogleScript();
  }

  loadGoogleScript(): void {
    // Check if script is already loaded
    if (typeof google !== 'undefined') {
      this.initializeGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  }

  initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '359342476310-jh4n5q3csvlg5ff5k34q1e5bcd764m2r.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      const buttonContainer = document.getElementById('googleBtn');
      if (buttonContainer) {
        google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: 'outline',
            size: 'large',
            width: 280,
            text: 'signin_with',
            shape: 'pill'
          }
        );
      }
    }
  }

  // Email/Password Login
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      // Simulate API call delay
      setTimeout(() => {
        this.performLogin();
        this.isLoading = false;
      }, 1500);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private performLogin(): void {
    const formValue = this.loginForm.value;
    const email = formValue.email;

    // Store user data in localStorage
    this.storeUserData({
      email: email,
      name: this.extractNameFromEmail(email),
      picture: this.generateDefaultAvatar(email),
      loginMethod: 'email_password',
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
      rememberMe: formValue.rememberMe
    });

    // Show success message
    this.snackBar.open(`Welcome back ${this.extractNameFromEmail(email)}!`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // Navigate to home page
    this.ngZone.run(() => {
      this.router.navigateByUrl('/dashboard');
    });

  }

  // Google Login Handler
  handleGoogleLogin(response: any): void {
    this.ngZone.run(() => {
      const payload = this.parseJwt(response.credential);

      // Store Google user data in localStorage
      this.storeUserData({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        loginMethod: 'google',
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
        rememberMe: false
      });

      // Show success message
      this.snackBar.open(`Welcome ${payload.name}!`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });

      // Navigate to home page
      this.ngZone.run(() => {
        this.router.navigateByUrl('/dashboard');
      });

    });
  }

  // Helper method to store user data
  private storeUserData(userData: any): void {
    // Store basic user info
    localStorage.setItem('username', userData.name);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('userPicture', userData.picture);
    localStorage.setItem('loginMethod', userData.loginMethod);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lastLogin', userData.loginTime);

    // Store remember me preference
    if (userData.rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedEmail', userData.email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
    }

    // Store complete user object for easy access
    localStorage.setItem('userData', JSON.stringify(userData));

    console.log('User data stored in localStorage:', userData);
  }

  // Helper method to extract name from email
  private extractNameFromEmail(email: string): string {
    if (!email) return 'User';

    const username = email.split('@')[0];
    // Capitalize first letter of each word
    return username
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Helper method to generate default avatar based on email
  private generateDefaultAvatar(email: string): string {
    // Using a placeholder avatar service
    const hash = this.hashString(email);
    const colors = [
      '00d2ff', '3a7bd5', '667eea', '764ba2',
      'f093fb', 'f5576c', '4facfe', '00f2fe',
      '43e97b', '38f9d7', 'fa709a', 'fee140'
    ];
    const color = colors[hash % colors.length];

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.extractNameFromEmail(email))}&background=${color}&color=fff&size=256`;
  }

  // Simple string hash function
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  // Helper method to mark all form fields as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // JWT parsing for Google login
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return {};
    }
  }
}