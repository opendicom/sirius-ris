import { Component } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                           // Activated Route Interface
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                                    // I18n Service
import { ListComponent as BoardsListComponent } from '@modules/boards/components/list/list.component';  // Boards list
//--------------------------------------------------------------------------------------------------------------------//

// Lists the boards available for the logged user (The backend scopes boards by the JWT domain).
// It reuses the boards list (Logic and styles) without modifying it, the actions column opens the check-in details.
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['../../../boards/components/list/list.component.css']
})
export class ListComponent extends BoardsListComponent {
  //Inject services to the constructor:
  constructor(
    objRoute: ActivatedRoute,
    sharedProp: SharedPropertiesService,
    sharedFunctions: SharedFunctionsService,
    i18n: I18nService
  ){
    //Boards list setup:
    super(objRoute, sharedProp, sharedFunctions, i18n);

    //Adjust action properties (Read-only list):
    this.sharedProp.action.content_title = i18n.instant('CHECK-IN-BOARDS.LIST.TITLE');
    this.sharedProp.action.add_button = false;

    //Only active boards can be used:
    this.sharedProp.status = 'true';

    //Refresh request params:
    this.sharedProp.paramsRefresh();
  }
}
