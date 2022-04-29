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
