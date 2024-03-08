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
  { path: 'start', component: StartPageComponent, canActivate: [AuthGuard] },

  // Modules:
  { path: 'modalities', loadChildren: () => import('@modules/modalities/modalities.module').then( m => m.ModalitiesModule ), canActivate: [AuthGuard] },
  { path: 'organizations', loadChildren: () => import('@modules/organizations/organizations.module').then( m => m.OrganizationsModule ), canActivate: [AuthGuard] },
  { path: 'branches', loadChildren: () => import('@modules/branches/branches.module').then( m => m.BranchesModule ), canActivate: [AuthGuard] },
  { path: 'services', loadChildren: () => import('@modules/services/services.module').then( m => m.ServicesModule ), canActivate: [AuthGuard] },
  { path: 'equipments', loadChildren: () => import('@modules/equipments/equipments.module').then( m => m.EquipmentsModule ), canActivate: [AuthGuard] },
  { path: 'slots', loadChildren: () => import('@modules/slots/slots.module').then( m => m.SlotsModule ), canActivate: [AuthGuard] },
  { path: 'procedures', loadChildren: () => import('@modules/procedures/procedures.module').then( m => m.ProceduresModule ), canActivate: [AuthGuard] },
  { path: 'procedure_categories', loadChildren: () => import('@modules/procedure-categories/procedure-categories.module').then( m => m.ProcedureCategoriesModule ), canActivate: [AuthGuard] },
  { path: 'files', loadChildren: () => import('@modules/files/files.module').then( m => m.FilesModule ), canActivate: [AuthGuard] },
  { path: 'appointments', loadChildren: () => import('@modules/appointments/appointments.module').then( m => m.AppointmentsModule ), canActivate: [AuthGuard] },
  { path: 'check-in', loadChildren: () => import('@modules/check-in/check-in.module').then( m => m.CheckInModule ), canActivate: [AuthGuard] },
  { path: 'calendar', loadChildren: () => import('@modules/calendar/calendar.module').then( m => m.CalendarModule ), canActivate: [AuthGuard] },
  { path: 'pathologies', loadChildren: () => import('@modules/pathologies/pathologies.module').then( m => m.PathologiesModule ), canActivate: [AuthGuard] },
  { path: 'performing', loadChildren: () => import('@modules/performing/performing.module').then( m => m.PerformingModule ), canActivate: [AuthGuard] },
  { path: 'reports', loadChildren: () => import('@modules/reports/reports.module').then( m => m.ReportsModule ), canActivate: [AuthGuard] },

  //Advanced options:
  { path: 'advanced-search', loadChildren: () => import('@modules/advanced-search/advanced-search.module').then( m => m.AdvancedSearchModule ), canActivate: [AuthGuard] },
  { path: 'stats', loadChildren: () => import('@modules/stats/stats.module').then( m => m.StatsModule ), canActivate: [AuthGuard] },

  { path: 'logs', loadChildren: () => import('@modules/logs/logs.module').then( m => m.LogsModule ), canActivate: [AuthGuard] },
  { path: 'users', loadChildren: () => import('@modules/users/users.module').then( m => m.UsersModule ), canActivate: [AuthGuard] },

  // Settings:
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },

  // Not Found Page (404 Not Found):
  { path: '404', component: NotFoundComponent},
  { path: '**', redirectTo: '/404'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
