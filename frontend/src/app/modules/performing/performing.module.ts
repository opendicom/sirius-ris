import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformingRoutingModule } from './performing-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/performing/components/list/list.component';
import { FormComponent } from '@modules/performing/components/form/form.component';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    PerformingRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PerformingModule { }
