import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators} from '@angular/forms';                     // Reactive form handling tools
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Action Properties
import { BaseElementService } from '@shared/services/base-element.service';             // Base Element
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  constructor(){ }

  ngOnInit(): void { }

  onSubmit(){ }

}
