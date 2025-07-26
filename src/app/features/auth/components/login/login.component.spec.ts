import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of, throwError} from 'rxjs';
import {LoginComponent} from './login.component';
import {AuthService} from '../../../../core/services/auth.service';
import {ConfirmDialogComponent} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM0NTE2MjUsImV4cCI6MTc1MzUzODAyNX0.test';
  const mockEmail = 'test@example.com';

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'createUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        {provide: AuthService, useValue: authServiceSpy},
        {provide: Router, useValue: routerSpy},
        {provide: MatSnackBar, useValue: snackBarSpy},
        {provide: MatDialog, useValue: dialogSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.valid).toBeFalsy();
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({email: 'invalid-email'});

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should not submit if already loading', () => {
      component.isLoading = true;
      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle successful login', () => {
      const mockResponse = {access_token: mockToken};
      authService.login.and.returnValue(of(mockResponse));
      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(mockEmail);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Successfully signed in',
        'Close',
        jasmine.any(Object)
      );
      expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
      expect(component.loginForm.get('email')?.value).toBe('');
    });

    it('should handle 401 error and show registration dialog', () => {
      const errorResponse = {status: 401, error: {message: 'User not found'}};
      authService.login.and.returnValue(throwError(() => errorResponse));

      const mockDialogRef = {
        afterClosed: () => of(true)
      };
      dialog.open.and.returnValue(mockDialogRef as any);

      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(mockEmail);
      expect(dialog.open).toHaveBeenCalledWith(
        ConfirmDialogComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title: 'User not found',
            message: 'This email is not registered. Do you want to create a new user with this email?'
          })
        })
      );
    });

    it('should handle registration flow when user confirms', () => {
      const errorResponse = {status: 401};
      authService.login.and.returnValue(throwError(() => errorResponse));

      const mockConfirmDialogRef = {
        afterClosed: () => of(true)
      };
      const mockRegisterDialogRef = {
        afterClosed: () => of({email: mockEmail, name: 'Test User'})
      };

      dialog.open.and.returnValues(
        mockConfirmDialogRef as any,
        mockRegisterDialogRef as any
      );

      authService.createUser.and.returnValue(of({id: '1', email: mockEmail, name: 'Test User'}));
      authService.login.and.returnValue(of({access_token: 'mock-token'}));

      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(dialog.open).toHaveBeenCalledTimes(2);
      expect(authService.createUser).toHaveBeenCalledWith({
        email: mockEmail,
        name: 'Test User'
      });
      expect(authService.login).toHaveBeenCalledWith(mockEmail);
      expect(snackBar.open).toHaveBeenCalledWith(
        'User created successfully',
        'Close',
        jasmine.any(Object)
      );
      expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    });

    it('should not proceed with registration if user cancels', () => {
      const errorResponse = {status: 401};
      authService.login.and.returnValue(throwError(() => errorResponse));

      const mockDialogRef = {
        afterClosed: () => of(false)
      };
      dialog.open.and.returnValue(mockDialogRef as any);

      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(authService.createUser).not.toHaveBeenCalled();
    });

    it('should handle other errors', () => {
      const errorResponse = {status: 500, error: {message: 'Server error'}};
      authService.login.and.returnValue(throwError(() => errorResponse));
      component.loginForm.patchValue({email: mockEmail});

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(mockEmail);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Server error',
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('form validation', () => {
    it('should mark form as touched when invalid form is submitted', () => {
      spyOn(component.loginForm, 'markAllAsTouched');

      component.onSubmit();

      expect(component.loginForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should be valid with correct email format', () => {
      component.loginForm.patchValue({email: mockEmail});

      expect(component.loginForm.valid).toBeTruthy();
    });

    it('should be invalid with incorrect email format', () => {
      component.loginForm.patchValue({email: 'invalid-email'});

      expect(component.loginForm.valid).toBeFalsy();
    });
  });
});
