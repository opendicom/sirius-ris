import { Component, Input, Output, EventEmitter } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup } from '@angular/forms';                                                     // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { AppointmentsService } from '@modules/appointments/services/appointments.service';      // Appointments service
import * as customBuildEditor from '@assets/plugins/customBuildCKE/ckeditor';                   // CKEditor
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-interview-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.css']
})
export class InterviewDefaultComponent {
  //Parent form (Must contain: anamnesis, indications and private_health):
  @Input() form!                : FormGroup;

  //CKEditor validators (Visual state):
  @Input() anamnesisValidator   : boolean = true;
  @Input() indicationsValidator : boolean = true;

  //Emits the change event of the weight input (Used by performing to recalculate the PET dose):
  @Output() weightChanged       : EventEmitter<any> = new EventEmitter<any>();

  //Create CKEditor component and configure them:
  public customEditor = customBuildEditor;

  constructor(
    public sharedProp           : SharedPropertiesService,
    public appointmentsService  : AppointmentsService
  ) { }
}
