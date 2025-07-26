export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  completed: boolean;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  completed?: boolean;
  userEmail: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  completed?: boolean;
}
