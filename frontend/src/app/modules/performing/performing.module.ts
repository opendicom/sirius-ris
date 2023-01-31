import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformingRoutingModule } from './performing-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/performing/components/list/list.component';
import { FormComponent } from '@modules/performing/components/form/form.component';
import { TabDetailsComponent } from '@modules/performing/components/form/tab-details/tab-details.component';
import { TabPreparationComponent } from '@modules/performing/components/form/tab-preparation/tab-preparation.component';
import { TabAnesthesiaComponent } from '@modules/performing/components/form/tab-anesthesia/tab-anesthesia.component';
import { TabAcquisitionComponent } from '@modules/performing/components/form/tab-acquisition/tab-acquisition.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

@NgModule({
    declarations: [
        ListComponent,
        FormComponent,
        TabDetailsComponent,
        TabPreparationComponent,
        TabAnesthesiaComponent,
        TabAcquisitionComponent
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
    ]
})
export class PerformingModule { }
