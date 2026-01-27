import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private router: Router) { }

    // Check if user is logged in
    isLoggedIn(): boolean {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    // Get current user data
    getCurrentUser(): any {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Get user name
    getUserName(): string {
        return localStorage.getItem('username') || 'User';
    }

    // Get user email
    getUserEmail(): string {
        return localStorage.getItem('email') || '';
    }

    // Get user profile picture
    getUserPicture(): string {
        return localStorage.getItem('userPicture') || '';
    }

    // Get login method
    getLoginMethod(): string {
        return localStorage.getItem('loginMethod') || '';
    }

    // Login with email/password
    loginWithEmail(email: string, password: string, rememberMe: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            // Simulate API call
            setTimeout(() => {
                const userData = {
                    email: email,
                    name: this.extractNameFromEmail(email),
                    picture: this.generateDefaultAvatar(email),
                    loginMethod: 'email_password',
                    isLoggedIn: true,
                    loginTime: new Date().toISOString(),
                    rememberMe: rememberMe
                };

                this.storeUserData(userData);
                resolve(userData);
            }, 1000);
        });
    }

    // Logout
    logout(): void {
        // Clear all auth-related data
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('userPicture');
        localStorage.removeItem('loginMethod');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');

        // Keep rememberMe and savedEmail if set
        const rememberMe = localStorage.getItem('rememberMe');
        const savedEmail = localStorage.getItem('savedEmail');

        localStorage.clear();

        // Restore rememberMe if needed
        if (rememberMe === 'true' && savedEmail) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', savedEmail);
        }

        this.router.navigate(['/login']);
    }

    // Check if remember me is enabled
    hasRememberMe(): boolean {
        return localStorage.getItem('rememberMe') === 'true';
    }

    // Get saved email if remember me is enabled
    getSavedEmail(): string {
        return localStorage.getItem('savedEmail') || '';
    }

    // Private helper methods
    private storeUserData(userData: any): void {
        localStorage.setItem('username', userData.name);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('userPicture', userData.picture);
        localStorage.setItem('loginMethod', userData.loginMethod);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('lastLogin', userData.loginTime);
        localStorage.setItem('userData', JSON.stringify(userData));

        if (userData.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', userData.email);
        }
    }

    private extractNameFromEmail(email: string): string {
        if (!email) return 'User';

        const username = email.split('@')[0];
        return username
            .replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private generateDefaultAvatar(email: string): string {
        const hash = this.hashString(email);
        const colors = [
            '00d2ff', '3a7bd5', '667eea', '764ba2',
            'f093fb', 'f5576c', '4facfe', '00f2fe',
            '43e97b', '38f9d7', 'fa709a', 'fee140'
        ];
        const color = colors[hash % colors.length];

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.extractNameFromEmail(email))}&background=${color}&color=fff&size=256`;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }
}