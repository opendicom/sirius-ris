import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CheckInRoutingModule } from '@modules/check-in/check-in-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/check-in//components/list/list.component';
import { BoardComponent } from '@modules/check-in/components/board/board.component';


@NgModule({
  declarations: [
    ListComponent,
    BoardComponent
  ],
  imports: [
    CommonModule,
    CheckInRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CheckInModule { }
