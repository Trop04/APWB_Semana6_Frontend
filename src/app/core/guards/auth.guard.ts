import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../servicios/auth.service';


export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // si no hay usuario, skip
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // validar con el backend
  return authService.validateSession().pipe(
    map(() => true),
    catchError(() => {
      authService.forceLogout();
      return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, reason: 'expired' } }));
    })
  );
};