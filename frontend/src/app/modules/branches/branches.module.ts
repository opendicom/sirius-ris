import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BranchesRoutingModule } from '@modules/branches/branches-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/branches/components/list/list.component';
import { FormComponent } from '@modules/branches/components/form/form.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent
  ],
  imports: [
    CommonModule,
    BranchesRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //CKEditor:
    CKEditorModule,
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class BranchesModule { }
