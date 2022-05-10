import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedRoutingModule } from '@shared/shared-routing.module';

// Angular Material Modules and Components:
import { SharedMaterialModule } from '@shared/shared-material.module';

// Shared components:
import { HeaderComponent } from '@shared/components/main-structure/header/header.component';
import { SidenavComponent } from '@shared/components/main-structure/sidenav/sidenav.component';
import { ActionComponent } from '@shared/components/main-structure/action/action.component';
import { FooterComponent } from '@shared/components/main-structure/footer/footer.component';
import { StartPageComponent } from '@shared/components/start-page/start-page.component';
import { SettingsComponent } from '@shared/components/settings/settings.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';        //Required for bidirectional binding (ngModule).

@NgModule({
  declarations: [
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent
  ],
  imports: [
    CommonModule,
    SharedRoutingModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent,
    SharedMaterialModule
  ]
})
export class SharedModule { }
