import { Component, OnInit, Inject } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup, FormBuilder, Validators } from '@angular/forms';                    // Reactive form handling tools
import { MAT_DIALOG_DATA } from '@angular/material/dialog';                             // MatDialog Data
import { PdfService } from '@shared/services/pdf.service';                              // PDF Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-mail-delivery',
  templateUrl: './mail-delivery.component.html',
  styleUrls: ['./mail-delivery.component.css']
})
export class MailDeliveryComponent implements OnInit {
  //Initialize disabled form controllers:
  public appointmentButtonDisabled  = false;
  public reportButtonDisabled       = false;

  //Define Formgroup (Reactive form handling):
  public form!: FormGroup;

  //Set Reactive form:
  private setReactiveForm(fields: any): void{
    this.form = this.formBuilder.group(fields);
  }

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data         : any,        //Inject MAT_DIALOG_DATA to pass data
    public pdfService   : PdfService,
    public formBuilder  : FormBuilder
  ) {
    //Set Reactive Form (First time):
    this.setReactiveForm({
      email : ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    //Send data to the form:
    this.setReactiveForm({
      email : [this.data.patient.email, [Validators.required]]
    });
  }

  resendEmail(type: string, _id: string){
    //Validate fields:
    if(this.form.valid){
      //Disable send button:
      switch(type){
        case 'appointment':
          this.appointmentButtonDisabled = true;
          break;

        case 'report':
          this.reportButtonDisabled = true;
          break;
      }

      //Create PDF (Data or base64) and send by email (Not open):
      this.pdfService.createPDF(type, _id, undefined, true, false, this.form.controls['email'].value);
    }
  }
}
