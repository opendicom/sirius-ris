import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';       // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  //Set references objects:
  public availableOrganizations: any;
  public availableBranches: any;

  //Filtered list used by the branch matAutocomplete:
  public filteredBranches: any[] = [];
  public availableProcedures: any;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Define id and form_action variables (Activated Route):
  public _id: string = '';
  private keysWithValues: Array<string> = [];
  public form_action: any;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services, components and router to the constructor:
  constructor(
    public formBuilder: FormBuilder,
    private router: Router,
    private objRoute: ActivatedRoute,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ){
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;

    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : this.i18n.instant('PROCEDURE_CATEGORIES.FORM.CONTENT_TITLE'),
      content_icon  : 'category',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('procedure_categories');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      domain          : [ '', [Validators.required] ],
      domain_input    : [ '' ], //Visible text input for branch matAutocomplete.
      name            : [ '', [Validators.required] ],
      fk_procedures : new FormControl({ value: [], disabled: true }, Validators.required)
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();

    //Extract sent data (Parameters by routing):
    this.form_action = this.objRoute.snapshot.params['action'];

    //Get data from the DB (Only in case that form_action == update):
    if(this.form_action == 'update'){
      //Extract sent data (Parameters by routing):
      this._id = this.objRoute.snapshot.params['_id'];

      //Check if element is not empty:
      if(this._id != ''){
        //Request params:
        const params = { 'filter[_id]': this._id };

        //Find element to update:
        this.sharedFunctions.find(this.sharedProp.element, params, (res) => {
          //Check operation status:
          if(res.success === true){
            //Find references (disabled inputs):
            this.onChangeBranch(false, res.data[0]);

            //Send data to the form:
            this.setReactiveForm({
              domain          : res.data[0].domain.organization + '.' + res.data[0].domain.branch,
              domain_input    : [ '' ],
              name            : res.data[0].name,
              fk_procedures : new FormControl({ value: [] }, Validators.required),
            });

            //Set visible branch text (matAutocomplete):
            this.setBranchInput();

            //Send data to FormControl elements (Arrays - Mat-Select Multiple):
            this.form.controls['fk_procedures'].setValue(res.data[0].fk_procedures);

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('PROCEDURE_CATEGORIES.FORM.EDIT_ERROR') + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
  }

  onChangeBranch(event: any, updateData: any = false){
    //Initialize fk_branch:
    let fk_branch = '';

    //Check update data case:
    if(updateData == false){
      fk_branch = event.value.split('.')[1];
    } else {
      fk_branch = updateData.domain.branch;
    }

    //Find procedures for selected branch:
    const paramsProcedures = {
      'filter[status]': true,
      'filter[domain.branch]': fk_branch
    };

    //Set available procedures:
    this.sharedFunctions.find('procedures', paramsProcedures, async (resProcedures) => {
      //Check data:
      if(resProcedures.data){
        //Set available procedures:
        this.availableProcedures = resProcedures.data;

        //Enable fk_procedures input:
        this.form.controls['fk_procedures'].enable();
      }
    });
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Remove visible matAutocomplete text:
      delete this.form.value.domain_input;

      //Data normalization - Domain:
      const domain = this.form.value.domain.split('.');
      this.form.value.domain = {
        organization  : domain[0],
        branch        : domain[1]
      }

      //Save data:
      this.sharedFunctions.save(this.form_action, this.sharedProp.element, this._id, this.form.value, this.keysWithValues, (res) => {
        //Response the form according to the result:
        this.sharedFunctions.formResponder(res, this.sharedProp.element, this.router);
      });
    }
  }

  onCancel(){
    //Redirect to the list:
    this.sharedFunctions.gotoList(this.sharedProp.element, this.router);
  }

  findReferences(){
    //Initialize params:
    let params: any;

    //Switch params:
    switch(this.objRoute.snapshot.params['action']){
      case 'insert':
        params = { 'filter[status]': true };
        break;

      case 'update':
        params = {};
        break;
    }

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;

      //Refresh visible branch text (Labels depend on organizations):
      this.setBranchInput();
    });

    //Find branches:
    this.sharedFunctions.find('branches', params, (res) => {
      this.availableBranches = res.data;
      this.filteredBranches = res.data || [];

      //Set visible branch text (Update case, if the form data arrived first):
      this.setBranchInput();
    });
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // FILTER BRANCHES (matAutocomplete):
  //--------------------------------------------------------------------------------------------------------------------//
  getBranchLabel(currentBranch: any): string{
    //Guard against missing item:
    if(!currentBranch){ return ''; }

    const currentOrganization = (this.availableOrganizations || []).find((currentOrg: any) => currentOrg._id == currentBranch.fk_organization);
    return `${currentOrganization ? currentOrganization.short_name + ' ► ' : ''}${currentBranch.short_name} (${currentBranch.name})`;
  }

  filterBranches(event: any){
    //Set filter value and to upper case:
    const filterValue = event.target.value.toUpperCase();

    //Filter branches by their built label:
    this.filteredBranches = (this.availableBranches || []).filter((currentBranch: any) => this.getBranchLabel(currentBranch).toUpperCase().includes(filterValue));
  }

  selectBranch(currentBranch: any){
    //Set hidden ObjectId control and visible input text (matAutocomplete):
    this.form.get('domain')?.setValue(currentBranch.fk_organization + '.' + currentBranch._id);
    this.form.get('domain_input')?.setValue(this.getBranchLabel(currentBranch));

    //Find dependent references for the selected branch:
    this.onChangeBranch({ value: this.form.get('domain')?.value });
  }

  setBranchInput(){
    //Find the selected branch and set the visible input text:
    const selectedBranch = (this.availableBranches || []).find((currentBranch: any) => (currentBranch.fk_organization + '.' + currentBranch._id) == this.form.value.domain);
    if(selectedBranch){
      this.form.get('domain_input')?.setValue(this.getBranchLabel(selectedBranch));
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
