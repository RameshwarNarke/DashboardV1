
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  loading = false;
  showPassword = false;
  error = '';

  form;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(255)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.error = '';
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading) return;

    const { username, email, password } = this.form.getRawValue();
    if (!username || !email || !password) return;

    this.loading = true;

    this.auth.register({
      username: username.trim(),
      email: email.trim(),
      password
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => this.router.navigate(['/login'], {
        queryParams: { registered: '1' }
      }),
      error: err => {
        this.error = err.status === 409
          ? 'That username or email is already registered.'
          : err.status === 0
            ? 'Cannot connect to the server. Check that the backend is running.'
            : err.error?.detail || err.error?.message ||
              'Registration failed. Please try again.';
      }
    });
  }
}