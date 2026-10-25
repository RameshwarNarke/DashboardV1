
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loading = false;
  showPassword = false;
  error = '';
  registered = false;

  form;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    route: ActivatedRoute
  ) {
    this.registered =
      route.snapshot.queryParamMap.get('registered') === '1';

    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.error = '';
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading) {
      return;
    }

    const { username, password, rememberMe } =
      this.form.getRawValue();

    if (!username?.trim() || !password) {
      return;
    }

    this.loading = true;

    this.auth.login({
      username: username.trim(),
      password,
      rememberMe: rememberMe ?? false
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: err => {
        if (err.status === 0) {
          this.error =
            'Cannot connect to the server. Check that the backend is running.';
        } else if (err.status === 401) {
          this.error =
            'Invalid username or password, or your account is inactive.';
        } else {
          this.error =
            err.error?.detail ||
            err.error?.message ||
            'Login failed. Please try again.';
        }
      }
    });
  }
}