import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-delete-items',
  templateUrl: './delete-items.component.html',
  styleUrls: ['./delete-items.component.css']
})
export class DeleteItemsComponent implements OnInit {

  //Inject services to the constructor:
  constructor(
    public sharedFunctions: SharedFunctionsService
  ){ }

  ngOnInit(): void {
    //Initialize delete code:
    this.sharedFunctions.delete_code = '';
  }

}
