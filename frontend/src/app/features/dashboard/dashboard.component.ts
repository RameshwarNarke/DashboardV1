
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main style="font-family: sans-serif; padding: 48px; max-width: 900px; margin: auto">
      <p style="color: #6558e8; font-weight: bold">NEXORA WORKSPACE</p>
      <h1>You're signed in.</h1>
      <p>Your dashboard will be built here next.</p>
      <a routerLink="/login">Return to login</a>
    </main>
  `
})
export class DashboardComponent {}