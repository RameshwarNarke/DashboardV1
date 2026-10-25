
import { ApplicationConfig } from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withXsrfConfiguration,
  withInterceptors,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { csrfInterceptor } from './features/auth/login/csrf.interceptor';
import { AuthInterceptor } from './features/auth/login/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      }),
      withInterceptors([csrfInterceptor]),
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
