import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogsRoutingModule } from '@modules/logs/logs-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListByUserComponent } from '@modules/logs/components/list-by-user/list-by-user.component';
import { ListByElementComponent } from '@modules/logs/components/list-by-element/list-by-element.component';


@NgModule({
  declarations: [
    ListByUserComponent,
    ListByElementComponent
  ],
  imports: [
    CommonModule,
    LogsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class LogsModule { }
