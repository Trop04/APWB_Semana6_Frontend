import { ApplicationConfig, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { timeout, catchError, of } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/servicios/auth.service';


function csrfInitializer(authService: AuthService, platformId: object) {
  return () => {
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve();
    }

    return authService.initializeCsrf().pipe(
      timeout(3000),                        // no esperar más de 3 segundos
      catchError(() => {
        console.warn('[auth] CSRF bootstrap omitido: backend no disponible o tardó demasiado.');
        return of(null);                    // resuelve igual
      })
    ).toPromise();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: csrfInitializer,
      deps: [AuthService, PLATFORM_ID],
      multi: true,
    },
  ],
};