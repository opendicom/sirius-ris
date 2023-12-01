import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from '@modules/users/users-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/users/components/list/list.component';
import { FormComponent } from '@modules/users/components/form/form.component';
import { FormMachineComponent } from '@modules/users/components/form-machine/form-machine.component';

@NgModule({
  declarations: [
    FormComponent,
    ListComponent,
    FormMachineComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class UsersModule { }
