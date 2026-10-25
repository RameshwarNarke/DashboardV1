import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
getToken(): string | null {
  return sessionStorage.getItem('access_token')
    ?? localStorage.getItem('access_token');
}
  getRole(): string | null {
  const token = this.getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = atob(
      base64.padEnd(
        base64.length + (4 - base64.length % 4) % 4,
        '='
      )
    );

    const claims = JSON.parse(decoded) as {
      role?: unknown;
      exp?: unknown;
    };

    if (
      typeof claims.exp === 'number' &&
      claims.exp * 1000 <= Date.now()
    ) {
      return null;
    }

    return typeof claims.role === 'string'
      ? claims.role
      : null;
  } catch {
    return null;
  }
}

hasRole(role: string): boolean {
  return this.getRole() === role;
}
}
