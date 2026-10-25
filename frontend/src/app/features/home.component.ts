
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isDarkTheme = true;
  readonly currentYear = new Date().getFullYear();

  private readonly themeStorageKey = 'nexora_theme';

  ngOnInit(): void {
    const savedTheme = localStorage.getItem(this.themeStorageKey);

    if (savedTheme === 'light') {
      this.isDarkTheme = false;
    } else if (savedTheme === 'dark') {
      this.isDarkTheme = true;
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;

    localStorage.setItem(
      this.themeStorageKey,
      this.isDarkTheme ? 'dark' : 'light'
    );
  }
}
