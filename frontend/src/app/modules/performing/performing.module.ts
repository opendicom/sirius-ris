import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformingRoutingModule } from './performing-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/performing/components/list/list.component';
import { FormComponent } from '@modules/performing/components/form/form.component';
import { TabDetailsComponent } from '@modules/performing/components/form/tab-details/tab-details.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

// Import all Input Control directives:
import * as IC from '@shared/directives/input-control.directive';

@NgModule({
    declarations: [
        ListComponent,
        FormComponent,
        TabDetailsComponent,

        //Input Control:
        IC.numbersDirective,
        IC.numbersWSDirective,
        IC.numbersWDDirective,
        IC.lettersDirective,
        IC.lettersWSDirective,
        IC.specialCharsDirective,
        IC.specialCharsWSDirective
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
