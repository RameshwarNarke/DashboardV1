
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  message: string;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8081/api/auth';

  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  constructor(private http: HttpClient) {}

  register(data: {
    username: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: {
    username: string;
    password: string;
    rememberMe: boolean;
  }): Observable<AuthResponse> {
    const { rememberMe, ...credentials } = data;

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (!response.accessToken || !response.refreshToken) {
            throw new Error(
              'Login response did not contain both tokens.'
            );
          }

          this.storeTokens(
            response.accessToken,
            response.refreshToken,
            rememberMe
          );
        })
      );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token is available.');
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {
        refreshToken
      } satisfies RefreshTokenRequest)
      .pipe(
        tap(response => {
          if (!response.accessToken || !response.refreshToken) {
            throw new Error(
              'Refresh response did not contain both tokens.'
            );
          }

          const rememberMe = localStorage.getItem(
            this.refreshTokenKey
          ) !== null;

          this.storeTokens(
            response.accessToken,
            response.refreshToken,
            rememberMe
          );
        })
      );
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey)
      ?? localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey)
      ?? localStorage.getItem(this.refreshTokenKey);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      this.http
        .post(`${this.apiUrl}/logout`, { refreshToken })
        .subscribe({
          error: () => {
            // Clear the local session even if the server is unavailable.
          }
        });
    }

    this.clearTokens();
  }

  private storeTokens(
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
  ): void {
    this.clearTokens();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.accessTokenKey, accessToken);
    storage.setItem(this.refreshTokenKey, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  clearSession(): void {
    this.clearTokens();
  }

  

}
