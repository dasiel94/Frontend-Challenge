import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {Router} from '@angular/router';
import {PLATFORM_ID} from '@angular/core';
import {AuthService} from './auth.service';
import {environment} from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM0NTE2MjUsImV4cCI6MTc1MzUzODAyNX0.test';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        {provide: Router, useValue: routerSpy},
        {provide: PLATFORM_ID, useValue: 'browser'}
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should make POST request to auth/login and store token', () => {
      const mockResponse = {access_token: mockToken};

      service.login(mockEmail).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({email: mockEmail});
      req.flush(mockResponse);

      // Verify token is stored
      expect(localStorage.getItem('auth_token')).toBe(mockToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should decode JWT and set user data', () => {
      const mockResponse = {access_token: mockToken};

      service.login(mockEmail).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      // Verify user data is set from JWT
      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.email).toBe('test@example.com');
      expect(currentUser?.name).toBe('test');
      expect(localStorage.getItem('user_email')).toBe('test@example.com');
    });

    it('should handle JWT decode errors gracefully', () => {
      const invalidToken = 'invalid.token.format';
      const mockResponse = {access_token: invalidToken};

      service.login(mockEmail).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      // Should still be authenticated but no user data
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('should make POST request to users endpoint', () => {
      const userData = {email: mockEmail, name: 'Test User'};
      const mockResponse = {id: '1', ...userData};

      service.register(userData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });
  });

  describe('createUser', () => {
    it('should make POST request to users endpoint', () => {
      const userData = {email: mockEmail, name: 'Test User'};
      const mockResponse = {id: '1', ...userData};

      service.createUser(userData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });
  });

  describe('authentication state', () => {
    it('should initialize with stored token', () => {
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_email', mockEmail);

      // Create new service instance to test initialization
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should clear auth data when no token exists', () => {
      // Don't set any tokens
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should return current user email', () => {
      const mockResponse = {access_token: mockToken};

      service.login(mockEmail).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(service.getCurrentUser()?.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('should clear all auth data and navigate to auth', () => {
      // First login to set auth data
      const mockResponse = {access_token: mockToken};
      service.login(mockEmail).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      // Verify auth data exists
      expect(service.isAuthenticated()).toBe(true);

      // Now logout
      service.logout();

      // Verify auth data is cleared
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_email')).toBeNull();
    });

    it('should clear localStorage items with auth_ prefix', () => {
      // Set some auth-related items
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_refresh', 'refresh-token');
      localStorage.setItem('user_email', mockEmail);
      localStorage.setItem('other_data', 'should-remain');

      service.forceLogout();

      // Verify auth items are cleared
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh')).toBeNull();
      expect(localStorage.getItem('user_email')).toBeNull();
      // Other data should remain
      expect(localStorage.getItem('other_data')).toBe('should-remain');
    });
  });

  describe('token management', () => {
    it('should return stored auth token', () => {
      localStorage.setItem('auth_token', mockToken);
      expect(service.getAuthToken()).toBe(mockToken);
    });

    it('should return null when no token exists', () => {
      expect(service.getAuthToken()).toBeNull();
    });
  });
});
