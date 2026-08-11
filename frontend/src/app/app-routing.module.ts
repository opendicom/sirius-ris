import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//Auth Guard:
import { AuthGuard } from '@guards/auth.guard';

//Shared components:
import { StartPageComponent } from '@shared/components/start-page/start-page.component';
import { SettingsComponent } from '@shared/components/settings/settings.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

const routes: Routes = [
  // Main Page and Signin:
  { path: 'signin', loadChildren: () => import('@auth/auth.module').then( m => m.AuthModule ) },
  { path: '', redirectTo: 'signin', pathMatch: 'full' }, // Redirection from main page to signin.

  // Start Page:
  { path: 'start', component: StartPageComponent, canActivate: [AuthGuard], data: { array_roles: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },

  // Modules:
  { path: 'modalities', loadChildren: () => import('@modules/modalities/modalities.module').then( m => m.ModalitiesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1] } },
  
  
  // 1: Superusuario
  { path: 'organizations', loadChildren: () => import('@modules/organizations/organizations.module').then( m => m.OrganizationsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1] } },
  
  
  { path: 'branches', loadChildren: () => import('@modules/branches/branches.module').then( m => m.BranchesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1] } },
  { path: 'services', loadChildren: () => import('@modules/services/services.module').then( m => m.ServicesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },
  { path: 'equipments', loadChildren: () => import('@modules/equipments/equipments.module').then( m => m.EquipmentsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1], array_concessions: [11] } },
  { path: 'slots', loadChildren: () => import('@modules/slots/slots.module').then( m => m.SlotsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2, 7], array_concessions: [1] } },
  { path: 'procedures', loadChildren: () => import('@modules/procedures/procedures.module').then( m => m.ProceduresModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },
  { path: 'procedure_categories', loadChildren: () => import('@modules/procedure-categories/procedure-categories.module').then( m => m.ProcedureCategoriesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },
  { path: 'files', loadChildren: () => import('@modules/files/files.module').then( m => m.FilesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1] } },
  

  // 1: Superusuario, 2: Administrador, 7: Coordinador, Concesiones: [13: Gestión de solicitudes) canactivate: [AuthGuard]
  { path: 'appointments', loadChildren: () => import('@modules/appointments/appointments.module').then( m => m.AppointmentsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2, 7], array_concessions: [1, 2, 13] } },
  

  { path: 'check-in', loadChildren: () => import('@modules/check-in/check-in.module').then( m => m.CheckInModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2, 5, 6, 8], array_concessions: [4] } },
  { path: 'calendar', loadChildren: () => import('@modules/calendar/calendar.module').then( m => m.CalendarModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2, 7], array_concessions: [3] } },
  { path: 'pathologies', loadChildren: () => import('@modules/pathologies/pathologies.module').then( m => m.PathologiesModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },
  { path: 'performing', loadChildren: () => import('@modules/performing/performing.module').then( m => m.PerformingModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2, 3, 4], array_concessions: [5, 25] } },
  { path: 'reports', loadChildren: () => import('@modules/reports/reports.module').then( m => m.ReportsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 3], array_concessions: [7, 8, 9] } },

  //Advanced options:
  { path: 'advanced-search', loadChildren: () => import('@modules/advanced-search/advanced-search.module').then( m => m.AdvancedSearchModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [14] } },
  { path: 'stats', loadChildren: () => import('@modules/stats/stats.module').then( m => m.StatsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [15, 16, 17, 18, 19] } },
  { path: 'billing', loadChildren: () => import('@modules/billing/billing.module').then( m => m.BillingModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [24] } },

  { path: 'logs', loadChildren: () => import('@modules/logs/logs.module').then( m => m.LogsModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },
  { path: 'users', loadChildren: () => import('@modules/users/users.module').then( m => m.UsersModule ), canActivate: [AuthGuard], canLoad: [AuthGuard], data: { array_roles: [1, 2], array_concessions: [11] } },

  // Settings:
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], data: { array_roles: [1, 2] } },

  // Not Found Page (404 Not Found):
  { path: '404', component: NotFoundComponent},
  { path: '**', redirectTo: '/404'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
