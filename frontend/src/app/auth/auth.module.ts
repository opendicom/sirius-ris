import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from '@auth/auth-routing.module';

import { LoginComponent } from '@auth/components/login/login.component';
import { ChangePassComponent } from '@auth/components/change-pass/change-pass.component';

import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';  //Required for bidirectional binding (ngModule).

@NgModule({
  declarations: [
    LoginComponent,
    ChangePassComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,

    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
