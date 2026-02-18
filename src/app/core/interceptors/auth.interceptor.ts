import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../servicios/auth.service';


export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));

  // En SSR solo propagamos el request sin tocar cookies
  if (!isBrowser) {
    return next(req);
  }

  const xsrfToken = getCookie('XSRF-TOKEN');
  const cloned = req.clone({
    withCredentials: true,
    ...(xsrfToken ? { setHeaders: { 'X-XSRF-TOKEN': xsrfToken } } : {}),
  });

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 en ruta protegida → sesión expirada
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        authService.forceLogout();
      }
      return throwError(() => err);
    })
  );
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}