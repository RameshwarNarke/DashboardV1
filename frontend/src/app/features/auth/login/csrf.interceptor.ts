
import { HttpInterceptorFn } from '@angular/common/http';

function getCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find(value => value.startsWith(prefix));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.substring(prefix.length));
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    console.log('[CSRF] Interceptor running:', req.url);

    // LOG 2: Checks whether JavaScript can read the CSRF cookie
    console.log(
        '[CSRF] Cookie visible:',
        document.cookie.includes('XSRF-TOKEN=')
    );
    const backendUrl = 'http://localhost:8081';
    const isBackendRequest = req.url.startsWith(`${backendUrl}/`);
    const isStateChangingRequest = !['GET', 'HEAD', 'OPTIONS']
        .includes(req.method.toUpperCase());
    // LOG 3: Checks whether the request passes the interceptor conditions
    console.log('[CSRF] Is backend request:', isBackendRequest);
    console.log('[CSRF] Is state-changing request:', isStateChangingRequest);
    if (!isBackendRequest || !isStateChangingRequest) {
        return next(req);
    }

    const token = getCookie('XSRF-TOKEN');
    // LOG 4: Checks whether a token was retrieved; does not print the secret
    console.log('[CSRF] Token found:', !!token);

    if (!token) {
        return next(req);
    }
    console.log('[CSRF] Adding X-XSRF-TOKEN header');

    return next(req.clone({
        withCredentials: true,
        setHeaders: {
            'X-XSRF-TOKEN': token
        }
    }));
};