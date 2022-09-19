import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FilesRoutingModule } from '@modules/files/files-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/files/components/list/list.component';


@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    FilesRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class FilesModule { }
