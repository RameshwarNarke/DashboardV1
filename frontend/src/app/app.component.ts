
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {
  result = '';
  loading = false;

  constructor(
  private http: HttpClient,
  public authService: AuthService
) {}

  testUsersApi(): void {
    this.loading = true;
    this.result = '';

    this.http.get('http://localhost:8081/api/users').subscribe({
      next: (response) => {
        this.result = JSON.stringify(response, null, 2);
        this.loading = false;
      },
      error: (error) => {
        this.result =
          `HTTP ${error.status}: ${error.message}`;
        this.loading = false;
      }
    });
  }
}
