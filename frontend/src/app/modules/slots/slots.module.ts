import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SlotsRoutingModule } from './slots-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/slots/components/list/list.component';
import { FormComponent } from '@modules/slots/components/form/form.component';
import { BatchComponent } from '@modules/slots/components/batch/batch.component';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent,
    BatchComponent
  ],
  imports: [
    CommonModule,
    SlotsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SlotsModule { }