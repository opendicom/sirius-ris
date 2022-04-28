import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from '@auth/components/login/login.component';
import { ChangePassComponent } from '@auth/components/change-pass/change-pass.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'change-pass', component: ChangePassComponent },
      { path: '**', redirectTo: 'login' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
