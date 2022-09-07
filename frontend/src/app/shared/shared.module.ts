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

//Dialogs components:
import { DeleteItemsComponent } from '@shared/components/dialogs/delete-items/delete-items.component';
import { FoundPersonComponent } from '@shared/components/dialogs/found-person/found-person.component';
import { SlotSelectComponent } from '@shared/components/dialogs/slot-select/slot-select.component';
import { OverlapEventsComponent } from '@shared/components/dialogs/overlap-events/overlap-events.component';
import { TentativeExistComponent } from '@shared/components/dialogs/tentative-exist/tentative-exist.component';

// Shared pipes:
import { HighlighterPipe } from '@shared/pipes/highlighter.pipe';

// Required for bidirectional binding (ngModule):
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    // Shared components:
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent,

    //Dialogs components:
    DeleteItemsComponent,
    FoundPersonComponent,
    SlotSelectComponent,
    OverlapEventsComponent,
    TentativeExistComponent,

    // Shared pipes:
    HighlighterPipe
  ],
  imports: [
    CommonModule,
    SharedRoutingModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    // Shared components:
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent,
    SharedMaterialModule,

    //Dialogs components:
    DeleteItemsComponent,
    FoundPersonComponent,
    SlotSelectComponent,
    OverlapEventsComponent,
    TentativeExistComponent,

    // Shared pipes:
    HighlighterPipe
  ]
})
export class SharedModule { }
