import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalitiesRoutingModule } from '@modules/modalities/modalities-routing.module';

import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/modalities/components/list/list.component';
import { FormComponent } from '@modules/modalities/components/form/form.component';

import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    ModalitiesRoutingModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class ModalitiesModule { }
