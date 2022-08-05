import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProcedureCategoriesRoutingModule } from '@modules/procedure-categories/procedure-categories-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/procedure-categories/components/list/list.component';
import { FormComponent } from '@modules/procedure-categories/components/form/form.component';


@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    ProcedureCategoriesRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ProcedureCategoriesModule { }
