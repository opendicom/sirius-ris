import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';                          // MatDialog Data
import { SharedPropertiesService } from '@shared/services/shared-properties.service';           // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';             // Shared Functions
import { ReportsService } from '@modules/reports/services/reports.service';                     // Reports Services
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                            // Reactive form handling tools
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-report-review',
  templateUrl: './report-review.component.html',
  styleUrls: ['./report-review.component.css']
})
export class ReportReviewComponent implements OnInit {
  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public  data            : any,  //Inject MAT_DIALOG_DATA to pass data
    private current_dialog  : MatDialog,
    public  reportsService  : ReportsService,
    public  formBuilder     : FormBuilder,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ){
    //Set Reactive Form (First time):
    this.setReactiveForm({
      'password' : [ '', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  onSubmit(operation: any){
    //Force validation (Submit event not executed):
    this.form.markAllAsTouched();

    //Validate fields:
    if(this.form.valid){
      //Get fk_report and password:
      const fk_report = this.data.last_report._id;
      const password  = this.form.controls['password'].value;

      //Switch by operation:
      switch(operation){
        case 'sign':
          this.reportsService.sign(fk_report, password, () => {
            //Close dialog:
            this.current_dialog.closeAll();

            //Reload last search (Performing list or Advanced search (reports)):
            this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
          });
          break;

        case 'authenticate':
          this.reportsService.authenticate(fk_report, password, () => {
            //Close dialog:
            this.current_dialog.closeAll();

            //Reload last search (Performing list or Advanced search (reports)):
            this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
          });
          
          break;

        case 'sign-authenticate':
          this.reportsService.sign(fk_report, password, () => {
            this.reportsService.authenticate(fk_report, password, () => {
              //Close dialog:
              this.current_dialog.closeAll();
  
              //Reload last search (Performing list or Advanced search (reports)):
              this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
            });
          });
          break;
      }

    //Amend case (Form without password field):
    } else if (operation === 'amend'){
      this.reportsService.amend(this.data.last_report._id, () => {
        //Close dialog:
        this.current_dialog.closeAll();

        //Reload last search (Performing list or Advanced search (reports)):
        this.sharedFunctions.find(this.sharedProp.element, this.sharedProp.params);
      });
    }
  }
}
