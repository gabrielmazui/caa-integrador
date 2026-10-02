import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        auth.logout();
      } else if (err.status >= 500) {
        toast.error('Erro inesperado. Tente novamente.');
      }
      return throwError(() => err);
    }),
  );
};
