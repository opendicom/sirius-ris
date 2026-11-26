import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                               // Router and Activated Route Interface (To get information about the routes)
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
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

  //Filtered list used by the organization matAutocomplete:
  public filteredOrganizations: any[] = [];

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
    //Get Logged User Information:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    //Set action properties:
    sharedProp.actionSetter({
      content_title : this.i18n.instant('PATHOLOGIES.FORM.CONTENT_TITLE'),
      content_icon  : 'coronavirus',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('pathologies');

    //Set Reactive Form (First time):
    this.setReactiveForm({
      fk_organization:  ['', [Validators.required]],  //Current organization input (Only Superuser).
      fk_organization_input: [''],                    //Visible text input for organization matAutocomplete.
      name:             ['', [Validators.required]],
      description:      [''],
      status:           ['true'],
    });
  }

  ngOnInit(): void {
    //Find references:
    this.findReferences();

    //Get Logged User Information (Domain and domain type):
    const domain = this.sharedProp.userLogged.permissions[0].domain;
    const domainType = this.sharedProp.userLogged.permissions[0].type;

    //Set current organization (To be able to add patients permissions):
    this.sharedFunctions.getLoggedOrganization(domain, domainType, (result) => {
      //Set organization in shared properties:
      this.sharedProp.current_organization = result;

      //Set organization input value (FormControl):
      this.form.controls['fk_organization'].setValue(result);

      //Set visible organization text (matAutocomplete):
      this.setOrganizationInput();
    });

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
            //Send data to the form:
            this.setReactiveForm({
              fk_organization : res.data[0].fk_organization,
              fk_organization_input : [''],
              name            : res.data[0].name,
              description     : res.data[0].description,
              status          : [ `${res.data[0].status}` ] //Use back tip notation to convert string
            });

            //Set visible organization text (matAutocomplete):
            this.setOrganizationInput();

            //Get property keys with values:
            this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);

          } else {
            //Return to the list with request error message:
            this.sharedFunctions.sendMessage(this.i18n.instant('PATHOLOGIES.FORM.EDIT_ERROR') + res.message);
            this.router.navigate(['/' + this.sharedProp.element + '/list']);
          }
        });
      }
    }
  }

  onSubmit(){
    //Validate fields:
    if(this.form.valid){
      //Data normalization - Booleans types (mat-option cases):
      if(typeof this.form.value.status != "boolean"){ this.form.value.status = this.form.value.status.toLowerCase() == 'true' ? true : false; }

      //Remove visible matAutocomplete text:
      delete this.form.value.fk_organization_input;

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
    //Set params:
    const params = { 'filter[status]': true };

    //Find organizations:
    this.sharedFunctions.find('organizations', params, (res) => {
      this.availableOrganizations = res.data;
      this.filteredOrganizations = res.data || [];

      //Set visible organization text (Update case, if the form data arrived first):
      this.setOrganizationInput();
    });
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // FILTER ORGANIZATIONS (matAutocomplete):
  //--------------------------------------------------------------------------------------------------------------------//
  getOrganizationLabel(currentOrganization: any): string{
    //Guard against missing item:
    if(!currentOrganization){ return ''; }

    return `${currentOrganization.short_name} (${currentOrganization.name})`;
  }

  filterOrganizations(event: any){
    //Set filter value and to upper case:
    const filterValue = event.target.value.toUpperCase();

    //Filter organizations by their built label:
    this.filteredOrganizations = (this.availableOrganizations || []).filter((currentOrganization: any) => this.getOrganizationLabel(currentOrganization).toUpperCase().includes(filterValue));
  }

  selectOrganization(currentOrganization: any){
    //Set hidden ObjectId control and visible input text (matAutocomplete):
    this.form.get('fk_organization')?.setValue(currentOrganization._id);
    this.form.get('fk_organization_input')?.setValue(this.getOrganizationLabel(currentOrganization));
  }

  setOrganizationInput(){
    //Find the selected organization and set the visible input text:
    const selectedOrganization = (this.availableOrganizations || []).find((currentOrganization: any) => currentOrganization._id == this.form.value.fk_organization);
    if(selectedOrganization){
      this.form.get('fk_organization_input')?.setValue(this.getOrganizationLabel(selectedOrganization));
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
