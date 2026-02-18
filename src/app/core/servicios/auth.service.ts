import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserState {
  username: string;
  displayName: string;
}


const LS_USERNAME     = 'auth.username';
const LS_DISPLAY_NAME = 'auth.displayName';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:5178/api/auth';

  // true solo en el navegador; false en SSR/Node.js (donde localStorage no existe)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));


  private readonly _user    = signal<UserState | null>(null);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly error      = this._error.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {

    this._user.set(this.loadFromStorage());
  }

  // CSRF bootstrap 
  initializeCsrf(): Observable<void> {
    return this.http.get<void>(`${this.apiBase}/csrf`, { withCredentials: true });
  }

  // Login

  login(payload: LoginPayload): Observable<UserState> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<UserState>(`${this.apiBase}/login`, payload, { withCredentials: true }).pipe(
      tap(user => {
        this.persistToStorage(user);
        this._user.set(user);
        this.router.navigateByUrl('/dashboard');
      }),
      catchError(err => {
        const msg = this.parseError(err);
        this._error.set(msg);
        return throwError(() => new Error(msg));
      }),
      finalize(() => this._loading.set(false))
    );
  }

  // Logout 

  logout(): void {
    this.http.post<void>(`${this.apiBase}/logout`, {}, { withCredentials: true })
      .subscribe({ complete: () => this.clearSession() });
  }

  // Logout forzado 
  forceLogout(): void {
    this.clearSession();
    this.router.navigateByUrl('/login?reason=expired');
  }

  // Session validation

  validateSession(): Observable<{ isValid: boolean; username: string; displayName: string }> {
    return this.http.get<{ isValid: boolean; username: string; displayName: string }>(
      `${this.apiBase}/session`, { withCredentials: true }
    ).pipe(
      tap(res => {
        const user: UserState = { username: res.username, displayName: res.displayName };
        this.persistToStorage(user);
        this._user.set(user);
      })
    );
  }

  clearError(): void { this._error.set(null); }

  // helpers

  private persistToStorage(user: UserState): void {
    if (!this.isBrowser) return;
    localStorage.setItem(LS_USERNAME,     user.username);
    localStorage.setItem(LS_DISPLAY_NAME, user.displayName);
  }

  private loadFromStorage(): UserState | null {
    if (!this.isBrowser) return null;   
    const username    = localStorage.getItem(LS_USERNAME);
    const displayName = localStorage.getItem(LS_DISPLAY_NAME);
    if (username && displayName) return { username, displayName };
    return null;
  }

  private clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem(LS_USERNAME);
      localStorage.removeItem(LS_DISPLAY_NAME);
    }
    this._user.set(null);
  }

  private parseError(err: any): string {
    if (err.status === 401) return 'Usuario o contraseña incorrectos.';
    if (err.status === 429) {
      const retry = err.headers?.get('Retry-After') ?? '300';
      return `Demasiados intentos. Intenta en ${retry} segundos.`;
    }
    if (err.status === 0)   return 'No se puede conectar al servidor.';
    return err.error?.message ?? 'Error inesperado.';
  }
}