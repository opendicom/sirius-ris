import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Global Functions
import { BaseElementService } from '@shared/services/base-element.service';             // Base Element
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  //Set component properties:
  public params: any;
  public api_response: any = {};

  //Set visible columns of the list:
  public displayedColumns: string[] = ['element_action', 'code_meaning', 'code_value', 'status'];

  //Inject services to the constructor:
  constructor(
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService,
    private objElement: BaseElementService
  ){
    //Set element:
    objElement.setElement('modalities');

    //Set action properties:
    sharedProp.actionSetter({
      content_title : 'Listado de modalidades',
      content_icon  : 'multiple_stop',
      add_button    : '/modalities/form/new/0', //Zero indicates empty :id (Activated Route) [content is ignored]
      filters_form  : true,
      filters : {
        search        : true,
        date_range    : false,
        status        : true,
        madalities    : false,
        institutions  : false,
      }
    });

    //Initial request params:
    this.params =  {
      //Projection:
      'proj[createdAt]': 0,
      'proj[updatedAt]': 0,
      'proj[__v]': 0,

      //Sort:
      'sort[status]' : -1,

      //Pager:
      'pager[page_number]': 1,
      'pager[page_limit]': 10,
    };
  }

  ngOnInit(): void {
    //First search (List):
    this.findElement(this.params);
  }

  onSearch(){
    alert('onSearch works!')
  }

  findElement(params: any): void{
    //Observe content (Subscribe):
    this.objElement.find(params).subscribe({
      next: (data) => {
        this.api_response = data;
      },
      error: (res) => {
        //Send snakbar message:
        this.sharedFunctions.sendMessage(res.error.message);
      }
    });
  }
}
