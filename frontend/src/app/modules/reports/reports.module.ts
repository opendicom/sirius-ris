import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FormComponent } from '@modules/reports/components/form/form.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';


@NgModule({
  declarations: [
    FormComponent
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //CKEditor:
    CKEditorModule
  ]
})
export class ReportsModule { }
