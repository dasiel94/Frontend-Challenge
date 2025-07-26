import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let nextHandler: jasmine.SpyObj<HttpHandler>;

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAuthToken', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const nextHandlerSpy = jasmine.createSpyObj('HttpHandler', ['handle']);

    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    interceptor = TestBed.inject(AuthInterceptor);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    nextHandler = nextHandlerSpy;
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('intercept', () => {
    it('should add Authorization header when token exists', () => {
      const request = new HttpRequest('GET', '/api/test');
      const mockResponse = { status: 200 };
      const mockEvent = { type: 0 } as HttpEvent<any>;

      authService.getAuthToken.and.returnValue(mockToken);
      nextHandler.handle.and.returnValue(of(mockEvent));

      interceptor.intercept(request, nextHandler).subscribe();

      expect(authService.getAuthToken).toHaveBeenCalled();
      expect(nextHandler.handle).toHaveBeenCalledWith(
        jasmine.objectContaining({
          headers: jasmine.objectContaining({
            lazyUpdate: jasmine.arrayContaining([
              jasmine.objectContaining({
                name: 'Authorization',
                value: `Bearer ${mockToken}`
              })
            ])
          })
        })
      );
    });

    it('should not add Authorization header when token does not exist', () => {
      const request = new HttpRequest('GET', '/api/test');
      const mockResponse = { status: 200 };
      const mockEvent = { type: 0 } as HttpEvent<any>;

      authService.getAuthToken.and.returnValue(null);
      nextHandler.handle.and.returnValue(of(mockEvent));

      interceptor.intercept(request, nextHandler).subscribe();

      expect(authService.getAuthToken).toHaveBeenCalled();
      expect(nextHandler.handle).toHaveBeenCalledWith(request);
    });

    it('should handle 401 error and logout user', () => {
      const request = new HttpRequest('GET', '/api/test');
      const errorResponse = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized'
      });

      authService.getAuthToken.and.returnValue(mockToken);
      nextHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, nextHandler).subscribe({
        error: (error) => {
          expect(error).toBe(errorResponse);
        }
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth']);
    });

    it('should not logout for non-401 errors', () => {
      const request = new HttpRequest('GET', '/api/test');
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error'
      });

      authService.getAuthToken.and.returnValue(mockToken);
      nextHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, nextHandler).subscribe({
        error: (error) => {
          expect(error).toBe(errorResponse);
        }
      });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should pass through successful responses', () => {
      const request = new HttpRequest('GET', '/api/test');
      const mockEvent = { type: 0 } as HttpEvent<any>;

      authService.getAuthToken.and.returnValue(mockToken);
      nextHandler.handle.and.returnValue(of(mockEvent));

      interceptor.intercept(request, nextHandler).subscribe(response => {
        expect(response).toBe(mockEvent);
      });
    });
  });
}); 