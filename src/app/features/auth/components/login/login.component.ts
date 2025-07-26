import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatIcon} from "@angular/material/icon";
import {finalize} from 'rxjs/operators';
import {AuthService} from "../../../../core/services/auth.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatDialog} from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  UserRegisterDialogComponent
} from '../../../../shared/components/user-register-dialog/user-register-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIcon,
    MatProgressSpinner
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  loginForm: FormGroup;
  isLoading = false;

  constructor() {
    // Initialize the login form with email field and validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const {email} = this.loginForm.value;

      this.authService.login(email).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          console.log('Login successful, navigating to tasks...');
          this.loginForm.reset(); // Reset the form
          this.snackBar.open('Successfully signed in', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/tasks']);
        },
        error: (error) => {
          this.isLoading = false;

          if (error.status === 401) {
            // User does not exist, show confirmation dialog
            const dialogData: ConfirmDialogData = {
              title: 'User not found',
              message: 'This email is not registered. Do you want to create a new user with this email?',
              confirmText: 'Create User',
              cancelText: 'Cancel',
              confirmColor: 'primary'
            };

            this.dialog.open(ConfirmDialogComponent, {data: dialogData})
              .afterClosed().subscribe(result => {
              if (result) {
                // Open registration dialog with name and email
                this.dialog.open(UserRegisterDialogComponent, {
                  data: {email},
                  disableClose: true
                }).afterClosed().subscribe((registerData: { email: string, name: string }) => {
                  if (registerData && registerData.name) {
                    this.authService.createUser(registerData).pipe(
                      finalize(() => this.isLoading = false)
                    ).subscribe({
                      next: () => {
                        this.snackBar.open('User created successfully', 'Close', {
                          duration: 3000,
                          horizontalPosition: 'end',
                          verticalPosition: 'top',
                          panelClass: ['success-snackbar']
                        });
                        // After creating user, login automatically and then redirect to tasks
                        this.authService.login(registerData.email).subscribe({
                          next: () => {
                            this.router.navigate(['/tasks']);
                          },
                          error: (loginError) => {
                            this.snackBar.open(
                              'User created but login failed. Please try logging in again.',
                              'Close',
                              {
                                duration: 5000,
                                horizontalPosition: 'end',
                                verticalPosition: 'top',
                                panelClass: ['error-snackbar']
                              }
                            );
                          }
                        });
                      },
                      error: (createError) => {
                        this.isLoading = false;
                        this.snackBar.open(
                          createError.error?.message || 'An error occurred during user creation. Please try again.',
                          'Close',
                          {
                            duration: 5000,
                            horizontalPosition: 'end',
                            verticalPosition: 'top',
                            panelClass: ['error-snackbar']
                          }
                        );
                      }
                    });
                  } else {
                    this.isLoading = false;
                  }
                });
              }
            });
          } else {
            // Other errors
            this.snackBar.open(
              error.error?.message || 'An error occurred during sign in. Please try again.',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
