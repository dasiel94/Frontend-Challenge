import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {AuthService} from './core/services/auth.service';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'atom-challenge-fe';
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/auth') {
        return;
      }
      const token = this.authService.getAuthToken();
      if (token && !this.authService.isAuthenticated()) {
        this.authService.forceLogout();
      }
    });
  }
}
