import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, ActivatedRoute } from '@angular/router';                                     // Router and Activated Route Interface
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';               // Reactive form handling tools
import { SharedPropertiesService } from '@shared/services/shared-properties.service';         // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';           // Shared Functions
import { ValidateDocumentsService } from '@shared/services/validate-documents.service';       // Validate documents service
import { I18nService } from '@shared/services/i18n.service';                                  // I18n Service
import { ISO_3166, objectKeys, regexObjectId } from '@env/environment';                       // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-form-documents',
  templateUrl: './form-documents.component.html',
  styleUrls: ['./form-documents.component.css']
})
export class FormDocumentsComponent implements OnInit {
  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Lookup data used by country and document type selectors:
  public country_codes    : any = ISO_3166;
  public documentTypesKeys: string[] = objectKeys.documentTypesKeys;

  //Duplicate document warnings (keyed by document index):
  public duplicateWarnings: { [key: number]: any } = {};

  //Allow hiding warning message without removing duplicate conflict:
  public dismissedDuplicateWarnings: { [key: number]: boolean } = {};

  //Per-row document validation status:
  public documentsValidation: { [key: number]: any } = {};

  //User data for right panel display:
  public user_data: any = {};

  //Form destiny and IDs:
  public destiny   : string = 'users';
  public person_id : string = '';
  public user_id   : string = '';

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Inject services, components and router to the constructor:
  constructor(
    private router          : Router,
    private objRoute        : ActivatedRoute,
    private formBuilder     : FormBuilder,
    public  sharedProp      : SharedPropertiesService,
    private sharedFunctions : SharedFunctionsService,
    private sharedValidate  : ValidateDocumentsService,
    private i18n            : I18nService
  ){
    //Expose utility helper so the template can iterate dynamic object keys:
    this.getKeys = this.sharedFunctions.getKeys;

    //Cache authenticated user info to evaluate permissions in shared UI parts:
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();

    this.sharedProp.actionSetter({
      content_title : this.i18n.instant('DOCUMENTS_ADMINISTRATION.FORM.CONTENT_TITLE'),
      content_icon  : 'badge',
      add_button    : false,
      filters_form  : false,
    });

    //Set element:
    sharedProp.elementSetter('users');

    //Create the empty form before the view binds to it:
    this.setReactiveForm([]);
  }

  ngOnInit(): void {
    //Read route params once at start:
    this.user_id = this.objRoute.snapshot.params['_id'];

    //Optional navigation target when this form is opened from another module:
    if(this.objRoute.snapshot.params['destiny']){
      this.destiny = this.objRoute.snapshot.params['destiny'];
    }

    //Load the user and hydrate the document rows:
    if(this.user_id && regexObjectId.test(this.user_id)){
      const params = {
        'filter[_id]'    : this.user_id,
        //Exclude password field from the response for security:
        'proj[password]' : 0
      };

      //Fetch the user data and populate the form with existing documents:
      this.sharedFunctions.find('users', params, (res) => {
        if(res.success === true && res.data.length > 0){
          this.user_data = res.data[0];

          //Store person_id separately since document updates target the person entity, not the user:
          this.person_id = res.data[0].fk_person;

          //Populate form rows with existing documents or an empty array if none:
          this.setDocuments(res.data[0].person.documents || []);

           //Run initial validation on all pre-loaded rows so errors are visible immediately:
          for(let i = 0; i < this.documentsArray.length; i++){
            this.validateDocument(i);
          }
        } else {
          //Return to the list with request error message:
          this.sharedFunctions.sendMessage(this.i18n.instant('DOCUMENTS_ADMINISTRATION.FORM.EDIT_ERROR') + res.message);
          this.router.navigate(['/' + this.destiny + '/list']);
        }
      });
    }
  }

  //Build the reactive form structure and optionally preload the rows:
  private setReactiveForm(documents: any[] = []): void {
    this.form = this.formBuilder.group({
      documents: this.formBuilder.array([])
    });

    this.setDocuments(documents);
  }

  //Create one row in the FormArray with required validators:
  private createDocumentGroup(document: any = {}): FormGroup {
    return this.formBuilder.group({
      doc_country_code: [document.doc_country_code || this.sharedProp.mainSettings.appSettings.default_country, [Validators.required]],
      doc_type: [(document.doc_type || this.sharedProp.mainSettings.appSettings.default_doc_type).toString(), [Validators.required]],
      document: [document.document || '', [Validators.required]],
    });
  }

  //Replace the current rows with data coming from the backend:
  private setDocuments(documents: any[]): void {
    const nextDocuments = Array.isArray(documents) ? documents : [];
    const formDocuments = this.formBuilder.array(nextDocuments.map((document) => this.createDocumentGroup(document)));

    //Always keep one editable row visible:
    if(formDocuments.length === 0){
      formDocuments.push(this.createDocumentGroup());
    }

    this.form.setControl('documents', formDocuments);
  }

  //Shortcut for accessing the FormArray in the template and component:
  public get documentsArray(): FormArray {
    return this.form.get('documents') as FormArray;
  }

  //Return a specific row as a FormGroup:
  public getDocumentGroup(index: number): FormGroup {
    return this.documentsArray.at(index) as FormGroup;
  }

  //Add a new empty document row:
  addDocument(): void {
    this.documentsArray.push(this.createDocumentGroup());
    this.validateDocument(this.documentsArray.length - 1);
  }

  //Prevent removing the last remaining row:
  canRemoveDocuments(): boolean {
    return this.documentsArray.length > 1;
  }

  //Remove a row and keep warning state indexes aligned:
  removeDocument(index: number): void {
    if(!this.canRemoveDocuments()){
      this.sharedFunctions.sendMessage(this.i18n.instant('DOCUMENTS_ADMINISTRATION.FORM.MIN_ONE_DOCUMENT_WARNING'));
      return;
    }

    if(index < 0 || index >= this.documentsArray.length){
      return;
    }

    this.documentsArray.removeAt(index);
    this.reindexRowStatesAfterRemove(index);
  }

  //Shift auxiliary state maps after deleting a row to keep indexes consistent:
  private reindexRowStatesAfterRemove(removedIndex: number): void {
    const nextDuplicateWarnings: { [key: number]: any } = {};
    const nextDismissedDuplicateWarnings: { [key: number]: boolean } = {};
    const nextDocumentsValidation: { [key: number]: any } = {};

    //Rebuild duplicate warnings map with shifted indexes:
    for(const key of Object.keys(this.duplicateWarnings)){
      const currentIndex = Number(key);
      if(currentIndex < removedIndex){
         //Rows before the removed index keep their position:
        nextDuplicateWarnings[currentIndex] = this.duplicateWarnings[currentIndex];
      } else if(currentIndex > removedIndex){
         //Rows after the removed index shift down by one:
        nextDuplicateWarnings[currentIndex - 1] = this.duplicateWarnings[currentIndex];
      }
    }

    //Rebuild dismissed warnings map with shifted indexes:
    for(const key of Object.keys(this.dismissedDuplicateWarnings)){
      const currentIndex = Number(key);
      if(currentIndex < removedIndex){
        nextDismissedDuplicateWarnings[currentIndex] = this.dismissedDuplicateWarnings[currentIndex];
      } else if(currentIndex > removedIndex){
        nextDismissedDuplicateWarnings[currentIndex - 1] = this.dismissedDuplicateWarnings[currentIndex];
      }
    }

    //Rebuild validation results map with shifted indexes:
    for(const key of Object.keys(this.documentsValidation)){
      const currentIndex = Number(key);
      if(currentIndex < removedIndex){
        nextDocumentsValidation[currentIndex] = this.documentsValidation[currentIndex];
      } else if(currentIndex > removedIndex){
        nextDocumentsValidation[currentIndex - 1] = this.documentsValidation[currentIndex];
      }
    }

    //Update the component state with the re-indexed maps:
    this.duplicateWarnings = nextDuplicateWarnings;
    this.dismissedDuplicateWarnings = nextDismissedDuplicateWarnings;
    this.documentsValidation = nextDocumentsValidation;
  }

  //Parse and validate one row using the document validation service:
  validateDocument(index: number): void {
    const docGroup = this.getDocumentGroup(index);
    if(!docGroup){ return; }

    //Parse the document using the registered parser for the selected country and type, if available:
    const doc = docGroup.value;
    const simplifiedType = `${doc.doc_country_code}.${doc.doc_type}`;
    const parsed = this.sharedValidate.parseDocument(simplifiedType, doc.document || '');

    //Update the document field with the parsed result if parsing was successful:
    if(parsed.is_parsed === true){
      docGroup.get('document')?.setValue(parsed.parser_result, { emitEvent: false });
    }

    //Run the validation and store the result for this row:
    const result = this.sharedValidate.validate(doc.doc_country_code, doc.doc_type, docGroup.get('document')?.value || '');

    //Store the validation result for this row to be used in the template for error display:
    this.documentsValidation[index] = {
      registered_doc_type : result.registered_doc_type,
      validation_result   : result.validation_result
    };
  }

  //Re-run validation on any edit and optionally re-check duplicates:
  onDocumentChange(index: number, checkDuplicate: boolean = false): void {
    delete this.dismissedDuplicateWarnings[index];

    this.validateDocument(index);

    if(checkDuplicate){
      this.checkDocumentDuplicate(index);
    }
  }

  //Search for another person using the same document data:
  checkDocumentDuplicate(index: number): void {
    const doc = this.documentsArray.at(index)?.value;
    //Skip backend lookup while the row is incomplete:
    if(!doc || !doc.document || doc.document.trim() === '' || !doc.doc_country_code || !doc.doc_type){
      delete this.duplicateWarnings[index];
      delete this.dismissedDuplicateWarnings[index];
      return;
    }

    //Prepare elemMatch filter to find a person with the same normalized document:
    const people_params = {
      'filter[elemMatch][documents][document]'          : doc.document.trim().toUpperCase(),
      'filter[elemMatch][documents][doc_country_code]'  : doc.doc_country_code,
      'filter[elemMatch][documents][doc_type]'          : doc.doc_type
    };

    //Perform the backend lookup for duplicates:
    this.sharedFunctions.find('people', people_params, (res: any) => {
      if(res.success === true && res.data && res.data.length > 0){
        const foundPerson = res.data[0];
        // If the found person is not the same as the current person, mark it as a duplicate warning:
        if(foundPerson._id !== this.person_id){
          this.duplicateWarnings[index] = foundPerson;
        } else {
          //Same person editing their own document, clear any previous duplicate warning for this row:
          delete this.duplicateWarnings[index];
          delete this.dismissedDuplicateWarnings[index];
        }
      } else {
        delete this.duplicateWarnings[index];
        delete this.dismissedDuplicateWarnings[index];
      }
    });
  }

  //Hide the warning, but keep the duplicate conflict active:
  clearWarning(index: number): void {
    this.dismissedDuplicateWarnings[index] = true;
  }

  //True when any row still has an unresolved duplicate conflict:
  hasDuplicateWarnings(): boolean {
    return Object.keys(this.duplicateWarnings).some((key) => !!this.duplicateWarnings[Number(key)]);
  }

  //True when any registered document type fails its validator:
  hasInvalidDocuments(): boolean {
    for(const key of Object.keys(this.documentsValidation)){
      const current = this.documentsValidation[Number(key)];

      //If the document type is registered and the validation failed, return true to indicate an invalid document exists:
      if(current && current.registered_doc_type === true && current.validation_result === false){
        return true;
      }
    }

    return false;
  }

  //Submit only when the form and all custom checks are valid:
  onSubmit(): void {
    if(this.form.invalid || this.hasDuplicateWarnings() || this.hasInvalidDocuments() || !regexObjectId.test(this.person_id)){
      this.form.markAllAsTouched();
      return;
    }

    //Update only documents sub-field of the linked person:
    const personSaveData = { documents: this.documentsArray.value };

    //Use the RxJS version of save to handle the asynchronous operation and subscribe to the result:
    this.sharedFunctions.saveRxJS('update', 'people', this.person_id, personSaveData, ['documents'])
      .subscribe({
        next: (res: any) => {
          this.sharedFunctions.formResponder(res, this.destiny, this.router);
        }
      });
  }

  //Return to the list using the current destination:
  onCancel(): void {
    this.sharedFunctions.gotoList(this.destiny, this.router);
  }
}
