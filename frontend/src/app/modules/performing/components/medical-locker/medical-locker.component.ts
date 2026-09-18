import { Component } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-medical-locker',
  templateUrl: './medical-locker.component.html',
  styleUrls: ['./medical-locker.component.css']
})
export class MedicalLockerComponent {
  //Inject services to the constructor:
  constructor(
    private i18n            : I18nService,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title       : i18n.instant('MEDICAL_LOCKER.CONTENT_TITLE'),
      content_icon        : 'all_inbox',
      add_button          : false,
      duplicated_surnames : false,                          // Check duplicated surnames
      nested_element      : false,                          // Set nested element
      filters_form        : false,
      advanced_search     : false
    });
  }
}