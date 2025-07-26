import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Router, RouterModule} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {finalize} from 'rxjs/operators';
import {MatTableModule} from '@angular/material/table';

import {AuthService} from '../../../../core/services/auth.service';
import {TaskService} from '../../../../core/services/task.service';
import {Task} from '../../../../core/models/task.model';
import {ConfirmDialogComponent} from '../../../../shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ConfirmDialogComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  tasks: Task[] = [];
  taskForm: FormGroup;
  isEditing = false;
  currentTaskId: string | null = null;
  showTaskForm = false;
  isLoading = false;
  userEmail: string | null = null;

  displayedColumns: string[] = ['title', 'description', 'completed', 'createdAt', 'actions'];

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      completed: [false]
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.userEmail = currentUser?.email || null;

    if (this.userEmail) {
      this.loadTasks(this.userEmail);
    } else {
      this.snackBar.open('User not authenticated', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/auth']);
    }
  }

  private loadTasks(email: string): void {
    this.isLoading = true;
    this.taskService.getTasks(email)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (tasks) => {
          // Convert Firestore Timestamp format to Date objects si es necesario
          this.tasks = tasks.map(task => ({
            ...task,
            createdAt: this.convertFirestoreTimestamp(task.createdAt),
            updatedAt: this.convertFirestoreTimestamp(task.updatedAt)
          }));
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.snackBar.open(
            error.error?.message || 'Error loading tasks. Please try again later.',
            'Close',
            {duration: 5000, panelClass: ['error-snackbar']}
          );
        }
      });
  }

  private convertFirestoreTimestamp(timestamp: any): Date {
    if (!timestamp) {
      return new Date();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  }

  onSubmit(): void {
    if (this.taskForm.valid && !this.isLoading) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        this.snackBar.open('User not authenticated', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/auth']);
        return;
      }

      const taskData = {
        ...this.taskForm.value,
        userEmail: currentUser.email
      };

      this.isLoading = true;

      const taskOperation = this.isEditing && this.currentTaskId
        ? this.taskService.updateTask(this.currentTaskId, taskData)
        : this.taskService.createTask(taskData);

      taskOperation
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.snackBar.open(
              `Task ${this.isEditing ? 'updated' : 'created'} successfully`,
              'Close',
              {duration: 3000, panelClass: ['success-snackbar']}
            );
            this.resetForm();
            const currentUser = this.authService.getCurrentUser();
            if (currentUser?.email) {
              this.loadTasks(currentUser.email);
            }
          },
          error: (error) => {
            console.error('Error saving task:', error);
            this.snackBar.open(
              `Error ${this.isEditing ? 'updating' : 'creating'} task. Please try again.`,
              'Close',
              {duration: 5000, panelClass: ['error-snackbar']}
            );
          }
        });
    }
  }

  editTask(task: Task): void {
    this.isEditing = true;
    this.currentTaskId = task.taskId;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      completed: task.completed
    });
    this.showTaskForm = true;
  }

  deleteTask(taskId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this task?',
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.taskService.deleteTask(taskId)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.snackBar.open('Task deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              const currentUser = this.authService.getCurrentUser();
              if (currentUser?.email) {
                this.loadTasks(currentUser.email);
              }
            },
            error: (error) => {
              console.error('Error deleting task:', error);
              this.snackBar.open(
                'Error deleting task. Please try again.',
                'Close',
                {duration: 5000, panelClass: ['error-snackbar']}
              );
            }
          });
      }
    });
  }

  toggleTaskStatus(task: Task): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.email) {
      this.snackBar.open('User not authenticated', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/auth']);
      return;
    }

    // Optimistic UI update
    const previousState = task.completed;
    task.completed = !task.completed;

    this.taskService.updateTask(task.taskId, {completed: task.completed})
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Task marked as ${task.completed ? 'completed' : 'incomplete'}`,
            'Close',
            {duration: 3000, panelClass: ['info-snackbar']}
          );
          // Refresh the tasks list to ensure consistency
          this.loadTasks(currentUser.email);
        },
        error: (error) => {
          console.error('Error updating task status:', error);
          // Revert the UI change on error
          task.completed = previousState;
          this.snackBar.open(
            error.error?.message || 'Error updating task status. Please try again.',
            'Close',
            {duration: 5000, panelClass: ['error-snackbar']}
          );
        }
      });
  }

  resetForm(): void {
    this.taskForm.reset({completed: false});
    this.isEditing = false;
    this.currentTaskId = null;
    this.showTaskForm = false;
  }

  logout(): void {
    this.authService.logout();
    this.snackBar.open('You have been logged out', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
    this.router.navigate(['/auth']);
  }
}
