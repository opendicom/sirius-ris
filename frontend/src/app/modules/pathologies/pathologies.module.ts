import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PathologiesRoutingModule } from '@modules/pathologies/pathologies-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/pathologies/components/list/list.component';
import { FormComponent } from '@modules/pathologies/components/form/form.component';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    PathologiesRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PathologiesModule { }
