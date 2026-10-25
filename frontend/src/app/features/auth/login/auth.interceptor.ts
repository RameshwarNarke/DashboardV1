
import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
  finalize
} from 'rxjs';

import { AuthService, AuthResponse } from './auth.service';

interface RefreshState {
  token: string | null;
  error?: unknown;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  private refreshTokenSubject =
    new BehaviorSubject<RefreshState>({ token: null });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const excludedUrls = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/logout'
    ];

    if (excludedUrls.some(url => request.url.includes(url))) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    const authRequest = token
      ? this.addToken(request, token)
      : request;

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 || !token) {
          return throwError(() => error);
        }

        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.refreshTokenSubject.next({ token: null });

          return this.authService.refreshAccessToken().pipe(
            switchMap((response: AuthResponse) => {
              const newToken = response.accessToken;

              if (!newToken) {
                return throwError(
                  () => new Error('Refresh returned no access token.')
                );
              }

              this.refreshTokenSubject.next({
                token: newToken
              });

              return next.handle(
                this.addToken(request, newToken)
              );
            }),
            catchError(refreshError => {
              this.authService.clearSession();

              this.refreshTokenSubject.next({
                token: null,
                error: refreshError
              });

              void this.router.navigateByUrl('/login');

              return throwError(() => refreshError);
            }),
            finalize(() => {
              this.isRefreshing = false;
            })
          );
        }

        return this.refreshTokenSubject.pipe(
          filter(
            state =>
              state.token !== null ||
              state.error !== undefined
          ),
          take(1),
          switchMap(state => {
            if (state.error !== undefined) {
              return throwError(() => state.error);
            }

            return next.handle(
              this.addToken(request, state.token!)
            );
          })
        );
      })
    );
  }

  private addToken(
    request: HttpRequest<unknown>,
    token: string
  ): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
