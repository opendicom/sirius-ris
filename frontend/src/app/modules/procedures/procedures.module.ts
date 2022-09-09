import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProceduresRoutingModule } from '@modules/procedures/procedures-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/procedures/components/list/list.component';
import { FormComponent } from '@modules/procedures/components/form/form.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    ProceduresRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //CKEditor:
    CKEditorModule,
  ]
})
export class ProceduresModule { }
