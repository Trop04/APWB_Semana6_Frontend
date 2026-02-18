import { Component } from '@angular/core';
import { AuthService } from '../core/servicios/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-wrapper">
      <header class="dashboard-header">
        <h1>Panel de control</h1>
        <div class="user-info">
          <span>Hola, <strong>{{ user?.displayName }}</strong></span>
          <button class="btn-secondary" (click)="logout()">Cerrar sesión</button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="card">
          <h2>Sesión activa</h2>
          <p>Usuario: <code>{{ user?.username }}</code></p>
          <p>Nombre: <code>{{ user?.displayName }}</code></p>
          <p class="hint">
            El nombre de usuario se almacena en <code>localStorage</code>.
            El token de sesión viaja en una cookie <code>HttpOnly</code> invisible para JavaScript.
          </p>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  constructor(private authService: AuthService) {}

  get user() { return this.authService.user(); }

  logout(): void { this.authService.logout(); }
}