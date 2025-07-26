import { Routes } from '@angular/router';
import { TasksComponent } from './components/tasks/tasks.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksComponent,
    title: 'My Tasks'
    // TODO: Agregar guard de autenticación
  }
];
