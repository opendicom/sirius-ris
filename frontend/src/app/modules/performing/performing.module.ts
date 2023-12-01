import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformingRoutingModule } from './performing-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/performing/components/list/list.component';
import { FormComponent } from '@modules/performing/components/form/form.component';
import { TabDetailsComponent } from '@modules/performing/components/form/tab-details/tab-details.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

@NgModule({
    declarations: [
        ListComponent,
        FormComponent,
        TabDetailsComponent
    ],
    imports: [
        CommonModule,
        PerformingRoutingModule,
        SharedModule,
        SharedMaterialModule,
        FormsModule,
        ReactiveFormsModule,

        //CKEditor:
        CKEditorModule
    ],
    providers: [
      // If you enter this module directly having an authentication file in the browser, it is necessary to 
      // initialize the app from the module (For example: entry from a marker of a specific component):
      AppInitializer,
      { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
    ]
})
export class PerformingModule { }
