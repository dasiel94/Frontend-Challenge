# Atom Challenge Frontend

A modern Angular application for managing personal tasks, featuring authentication, CRUD operations, and a responsive UI built with Angular Material.

## Features

- **User Authentication:** Secure login and registration for users.
- **Task List Table:** View all your tasks in a sortable, filterable table.
- **Add Task:** Create new tasks with title and description.
- **Edit Task:** Update the details of existing tasks.
- **Delete Task:** Remove tasks with confirmation dialog.
- **Toggle Task Completion:** Mark tasks as completed or pending directly from the table.
- **Responsive Design:** Works on desktop and mobile devices.
- **Feedback & Validation:** Real-time form validation and user feedback via snackbars and dialogs.
- **Logout:** End your session securely.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## UI & Design

This application uses [Angular Material](https://material.angular.io/) for a modern, accessible, and responsive user interface. Key Material components used:

- **MatTable**: For displaying tasks in a structured, sortable table.
- **MatCard**: For form and content containers.
- **MatButton**: For all action buttons (including raised, icon, and colored variants).
- **MatIcon**: For visual icons in buttons and status.
- **MatCheckbox**: For toggling task completion.
- **MatDialog**: For confirmation dialogs (e.g., deleting a task).
- **MatSnackBar**: For user feedback and notifications.
- **MatFormField, MatInput**: For styled and validated form fields.
- **MatProgressSpinner**: For loading indicators.
- **MatList**: (Legacy) For listing tasks in previous versions.

Custom SCSS styles are used to:
- Provide a clean, card-based layout.
- Ensure responsive design for mobile and desktop.
- Add subtle shadows, rounded corners, and color cues for status.
- Animate actions and transitions for a smooth user experience.

## Testing & Code Quality

- **Unit Testing:**
  - Framework: [Jasmine](https://jasmine.github.io/)
  - Runner: [Karma](https://karma-runner.github.io/)
  - Run tests: `npm test`
- **Linting:**
  - [ESLint](https://eslint.org/) with TypeScript and Prettier integration
  - Run linter: `npm run lint`
  - Auto-fix: `npm run lint:fix`
- **Formatting:**
  - [Prettier](https://prettier.io/) for consistent code style
  - Format all code: `npm run format`

## User Experience Highlights

- **Dialog Confirmations:** All destructive actions (like deleting a task) require user confirmation via a Material dialog.
- **Snackbar Feedback:** All important actions (create, update, delete, errors) provide instant feedback via snackbars.
- **Form Validation:** Real-time validation with clear error messages for all forms.
- **Accessibility:** Uses Material's accessibility features and ARIA roles.
- **Mobile Friendly:** Responsive layout adapts to all screen sizes.

## Author

- Developed By Dasiel Pedrero
