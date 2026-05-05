import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const userGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  if (currentUser.role !== 'user') {
    router.navigate(['/seller']);
    return false;
  }

  return true;
};

export const sellerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  if (currentUser.role !== 'seller') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

export const sellerBlockGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.getCurrentUser();

  if (currentUser?.role === 'seller') {
    router.navigate(['/seller']);
    return false;
  }

  return true;
};