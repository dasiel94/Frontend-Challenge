import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {RegisterUserDto, User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const token = this.getAuthToken();
      if (token) {
        this.isAuthenticatedSubject.next(true);
      } else {
        this.clearAuthData(false);
      }
    }
  }

  login(email: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, {email}).pipe(
      tap(response => {
        this.setAuthData(response.access_token);
      })
    );
  }

  register(userData: RegisterUserDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData);
  }

  createUser(userData: RegisterUserDto): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users`, userData);
  }


  logout(): void {
    this.clearAuthData();
    this.forceLogout();
  }

  forceLogout(): void {
    // Clear all auth data without navigating (to prevent loops)
    this.clearAuthData(false);

    // Clear any stored tokens or user data
    if (this.isBrowser) {
      // Clear all items from localStorage that start with 'auth_'
      Object.keys(localStorage)
        .filter(key => key.startsWith('auth_') || key === 'user_email')
        .forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage as well
      sessionStorage.clear();

      // Only navigate if we're not already on the auth page
      if (!window.location.pathname.includes('/auth')) {
        this.router.navigate(['/auth']);
      }
    }
  }

  private setAuthData(token: string): void {
    this.setStorageItem('auth_token', token);

    // Decode JWT to get user email
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: '1',
        email: payload.email,
        name: payload.email.split('@')[0] // Extract name from email
      };
      this.currentUserSubject.next(user);
      this.setStorageItem('user_email', payload.email);
    } catch (error) {
      this.currentUserSubject.next(null);
    }

    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(navigateToAuth: boolean = true): void {
    this.removeStorageItem('auth_token');
    this.removeStorageItem('user_email');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    if (navigateToAuth && this.isBrowser) {
      this.router.navigate(['/auth']);
    }
  }

  getAuthToken(): string | null {
    return this.getStorageItem('auth_token');
  }

  private getStorageItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private setStorageItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private removeStorageItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}
