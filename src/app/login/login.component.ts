import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/servicios/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  sessionExpiredMsg = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'expired') {
      this.sessionExpiredMsg.set('Tu sesión expiró. Inicia sesión de nuevo.');
    }
  }

  get loading() { return this.authService.loading(); }
  get error()   { return this.authService.error(); }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.authService.clearError();
    this.authService.login(this.form.getRawValue()).subscribe();
  }
}