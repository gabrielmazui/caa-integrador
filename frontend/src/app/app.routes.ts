import { inject } from '@angular/core';
import { ResolveFn, Routes, Router } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AuthService } from './core/auth/auth.service';
import { CriancaService } from './shared/services/crianca.service';
import { Crianca } from './shared/models/crianca.models';

const criancaResolver: ResolveFn<Crianca> = route =>
  inject(CriancaService).get(route.params['id']);

const profissionalGuard = () => {
  if (inject(AuthService).isProfissional()) return true;
  return inject(Router).createUrlTree(['../feed'], { relativeTo: undefined });
};

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard-shell').then(m => m.DashboardShellComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        children: [
          { path: '', loadComponent: () => import('./features/dashboard/home/home').then(m => m.HomeComponent) },
          { path: 'nova-crianca', loadComponent: () => import('./features/dashboard/new-crianca/new-crianca').then(m => m.NewCriancaComponent) },
        ],
      },
      {
        path: 'crianca/:id',
        resolve: { crianca: criancaResolver },
        loadComponent: () => import('./features/crianca/crianca-shell').then(m => m.CriancaShellComponent),
        children: [
          { path: '', redirectTo: 'feed', pathMatch: 'full' },
          { path: 'feed', loadComponent: () => import('./features/crianca/feed/feed').then(m => m.FeedComponent) },
          { path: 'chat', loadComponent: () => import('./features/crianca/chat/chat').then(m => m.ChatComponent) },
          { path: 'pei', canActivate: [profissionalGuard], loadComponent: () => import('./features/crianca/pei/pei').then(m => m.PeiComponent) },
          { path: 'glossario', loadComponent: () => import('./features/crianca/glossario/glossario').then(m => m.GlossarioComponent) },
          { path: 'equipe', loadComponent: () => import('./features/crianca/equipe/equipe').then(m => m.EquipeComponent) },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
