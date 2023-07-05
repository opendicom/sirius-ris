import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { FormGroup } from '@angular/forms';                                                   // Reactive form handling tools
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  //Radio buttons individual disable controller:
  public disableRadioOrganization  : boolean = false;
  public disableRadioBranch        : boolean = false;
  public disableRadioService       : boolean = false;

  //Inject services to the constructor:
  constructor(
    private sharedFunctions: SharedFunctionsService
  ) { }

  //--------------------------------------------------------------------------------------------------------------------//
  // ADD PERMISSION:
  //--------------------------------------------------------------------------------------------------------------------//
  addPermission(form: FormGroup, permissions: any[], selectedConcession: number[]){
    //Check fields contents:
    if(form.value.domain_type !== '' && form.value.domain !== '' && form.value.role !== ''){
      //Parse role to base10 integer:
      form.value.role = parseInt(form.value.role, 10);

      //Create current permission object:
      let currentPermission: any = {
        role: form.value.role
      }

      //Add domain type and domain:
      currentPermission[form.value.domain_type] = form.value.domain;

      //Add concessions if not empty:
      if(selectedConcession.length > 0){
        currentPermission['concession'] = [...selectedConcession]; //Clone array with spread operator.
      }

      //Add currentPermission to permissions object:
      permissions.push(currentPermission);
    } else {
      //Send message:
      this.sharedFunctions.sendMessage('Debe cargar los datos necesarios para agregar el permiso al usuario.');
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // REMOVE PERMISSION:
  //--------------------------------------------------------------------------------------------------------------------//
  removePermission(permissionIndex: number, permissions: any[]){
    permissions.splice(permissionIndex, 1);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET CONCESSION:
  //--------------------------------------------------------------------------------------------------------------------//
  setConcession(event: any, key: any, selectedConcession: number[]): number[] {
    //Parse key to base10 integer:
    key = parseInt(key, 10);

    //Check if input is check or uncheck:
    if(event.checked){
      //Set current check into selectedDays array:
      selectedConcession.push(key);
    } else {
      //Remove from array by value:
      selectedConcession = selectedConcession.filter((e: number) => { return e !== key });
    }

    //Return selected Concession:
    return selectedConcession;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET PERSON:
  //--------------------------------------------------------------------------------------------------------------------//
  setPerson(personData: any = false, person_id: string, form: FormGroup): string {
    //Initialize current _id:
    let current_id = person_id;

    //Check person data:
    if(personData){
      //Set person _id:
      current_id = personData._id;

      //Send data to FormControl elements (Set person fields):
      form.get('person.doc_country_code')?.setValue(personData.documents[0].doc_country_code);
      form.get('person.doc_type')?.setValue(personData.documents[0].doc_type.toString());
      form.get('person.document')?.setValue(personData.documents[0].document);
      form.get('person.name_01')?.setValue(personData.name_01);
      form.get('person.name_02')?.setValue(personData.name_02);
      form.get('person.surname_01')?.setValue(personData.surname_01);
      form.get('person.surname_02')?.setValue(personData.surname_02);
      form.get('person.gender')?.setValue(personData.gender.toString());
      form.get('person.phone_numbers[0]')?.setValue(personData.phone_numbers[0]);
      form.get('person.phone_numbers[1]')?.setValue(personData.phone_numbers[1]);
      form.get('person.birth_date')?.setValue(new Date(personData.birth_date.split('T')[0].replace(/-/g, '/'))); //Replace '-' by '/' to prevent one day off JS Date error.
    }

    //Return current _id:
    return current_id;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET USER:
  //--------------------------------------------------------------------------------------------------------------------//
  setUser(userData: any = false, user_id: string, form: FormGroup): string {
    //Initialize current _id:
    let current_id = user_id;

    //Check user data:
    if(userData){
      //Set current _id:
      current_id = userData._id;

      //Send data to FormControl elements (Set user fields):
      if(userData.username) { form.get('user.username')?.setValue(userData.username); }
      if(userData.email) { form.get('user.email')?.setValue(userData.email); }
      form.get('user.status')?.setValue(`${userData.status}`); //Use back tip notation to convert string

      //If cointain professional data:
      if(userData.professional){
        form.get('user.professional[id]')?.setValue(userData.professional.id);
        form.get('user.professional[description]')?.setValue(userData.professional.description);
        form.get('user.professional[workload]')?.setValue(userData.professional.workload);
        form.get('user.professional[vacation]')?.setValue(`${userData.professional.vacation}`); //Use back tip notation to convert string
      }
    }

    //Return current _id:
    return current_id;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // SET ROLE:
  //--------------------------------------------------------------------------------------------------------------------//
  onSetRole(event: any, form: FormGroup){
    //Switch by selected role:
    switch(event.value){
      //Superusuario and Administrador:
      case '1':
      case '2':
        //Set domain type value as organization:
        form.controls['domain_type'].setValue('organization');

        //Disable other domain types options:
        this.disableRadioBranch = true;
        this.disableRadioService = true;
        break;

      //Remaining roles:
      default:
        //Enable other domain types options:
        this.disableRadioBranch = false;
        this.disableRadioService = false;
        break;
    }
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
