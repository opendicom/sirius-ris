import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchesRoutingModule } from '@modules/branches/branches-routing.module';

import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/branches/components/list/list.component';
import { FormComponent } from '@modules/branches/components/form/form.component';


@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    BranchesRoutingModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BranchesModule { }
