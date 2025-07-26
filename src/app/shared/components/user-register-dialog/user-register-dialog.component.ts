import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

export interface UserRegisterDialogData {
  email: string;
}

@Component({
  selector: 'app-user-register-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>User Registration</h2>
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput [value]="data.email" disabled/>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" required/>
        <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
          Name is required
        </mat-error>
      </mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!registerForm.valid">Create</button>
      </div>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }

    form {
      min-width: 300px;
    }
  `]
})
export class UserRegisterDialogComponent {
  registerForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UserRegisterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserRegisterDialogData,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.dialogRef.close({
        email: this.data.email,
        name: this.registerForm.value.name
      });
    }
  }
}
