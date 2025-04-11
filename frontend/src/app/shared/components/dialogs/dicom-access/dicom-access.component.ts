import { Component, OnInit, Inject } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';                  // MatDialog Data
import { MatDialogRef } from '@angular/material/dialog';                                // MatDialog Ref
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ISO_3166, document_types, gender_types } from '@env/environment';              // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-dicom-access',
  templateUrl: './dicom-access.component.html',
  styleUrls: ['./dicom-access.component.css']
})
export class DicomAccessComponent implements OnInit {
  //Set component properties:
  public country_codes          : any = ISO_3166;
  public document_types         : any = document_types;
  public gender_types           : any = gender_types;

  //Initializate Paths:
  public ohifPath               : string = '';
  public dicomZipURL            : string = '';

  //Initializate isMac Property:
  public isMac                  : boolean = false;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data:,
    public current_dialog   : MatDialog,
    private dialogRef       : MatDialogRef<any>,
    public sharedProp       : SharedPropertiesService,
    public sharedFunctions  : SharedFunctionsService
  ) { }

  ngOnInit(): void {
    //Check if study contain images and set dicom.zip link:
    this.getStudyDICOM(this.data._id, 'dicom.zip');

    //Check if the host computer is a Mac: 
    this.isMac = this.sharedFunctions.isMac();
  }

  getStudyDICOM(fk_performing: string, accessType: string){
    //Request DICOM image query path:
    this.sharedFunctions.wezenStudyToken(fk_performing, accessType, (wezenStudyTokenRes) => {
      if(wezenStudyTokenRes.success === true){
        //Switch by accessType:
        switch(accessType){
          case 'ohif':
            //Set ohifPath:
            this.ohifPath = wezenStudyTokenRes.path;

            //Get native element to remove:
            const dialogTitle = document.getElementById('IDdialogTitle');
            dialogTitle?.remove();

            //Rezise MatDialog:
            this.dialogRef.updateSize('1200px', '960px');
            break;

          case 'osirix':
            //Redirect to osirix service:
            window.location.href = "osirix://?methodName=downloadURL&URL='" + this.dicomZipURL + "'";
            this.current_dialog.closeAll();
            break;

          case 'weasis':
            //Redirect to weasis:
            window.location.href = 'weasis://' + encodeURIComponent('$dicom:get -w "' + wezenStudyTokenRes.path + '"');
            this.current_dialog.closeAll();            
            break;

          case 'dicom.zip':
            //Set dicomZipURL:
            this.dicomZipURL = wezenStudyTokenRes.path;
            break;
        }
        
      } else {
        //Send Console Warn Message:
        console.warn('Error al intentar buscar las imágenes DICOM del elemento: ' + wezenStudyTokenRes.message);
      }
    });
  }
}
