import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {CreateTaskDto, Task, UpdateTaskDto} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksUrl = `${environment.apiUrl}/tasks`;
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  constructor(
    private http: HttpClient,
  ) {
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  getTasks(email: string): Observable<Task[]> {
    if (!email) {
      return throwError(() => new Error('User email is required'));
    }

    const params = new HttpParams().set('userEmail', email);

    return this.http.get<Task[]>(this.tasksUrl, {params}).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(this.handleError)
    );
  }


  createTask(taskData: CreateTaskDto): Observable<Task> {
    if (!taskData.userEmail) {
      return throwError(() => new Error('User email is required'));
    }

    return this.http.post<Task>(this.tasksUrl, taskData).pipe(
      tap(newTask => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([newTask, ...currentTasks]);
      }),
      catchError(this.handleError)
    );
  }

  updateTask(id: string, taskData: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.tasksUrl}/${id}`, taskData).pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === id);
        if (index !== -1) {
          const newTasks = [...currentTasks];
          newTasks[index] = updatedTask;
          this.tasksSubject.next(newTasks);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}/${id}`).pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next(currentTasks.filter(task => task.id !== id));
      }),
      catchError(this.handleError)
    );
  }
}
