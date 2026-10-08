import { Component, Inject, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormBuilder, FormGroup, Validators } from '@angular/forms';                              // Reactive Forms
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';                         // MatDialog Data & Ref
import { SharedFunctionsService } from '@shared/services/shared-functions.service';               // Shared Functions
import { I18nService } from '@shared/services/i18n.service';                                      // I18n Service
import { ISO_3166 } from '@env/environment';                                                  // Enviroment
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-call-patient',
  templateUrl: './call-patient.component.html',
  styleUrls: ['./call-patient.component.css']
})
export class CallPatientComponent implements OnInit {
  //Set component properties:
  public country_codes: any = ISO_3166;
  public form: FormGroup;
  public boards: any[] = [];
  public loading: boolean = true;

  //Inject services to the constructor:
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,  //Inject MAT_DIALOG_DATA to pass data.
    private dialogRef: MatDialogRef<CallPatientComponent>,
    private formBuilder: FormBuilder,
    private sharedFunctions: SharedFunctionsService,
    private i18n: I18nService
  ) {
    //Set form (Insert on check_in_boards):
    this.form = this.formBuilder.group({
      fk_board    : ['', [Validators.required]],
      room_place  : ['', [Validators.maxLength(32)]]
    });
  }

  ngOnInit(): void {
    //Find active boards (The backend scopes boards by the domain of the logged user):
    this.sharedFunctions.find('boards', { 'filter[status]': true, 'proj[_id]': 1, 'proj[name]': 1, 'proj[branch.short_name]': 1, 'sort[name]': 1 }, (res) => {
      //Check result:
      if(res.success === true){
        this.boards = res.data;
      }

      //Set loading state:
      this.loading = false;
    }, false, false, false);
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // CALL PATIENT (Insert on check_in_boards | Update if the patient was already called to the board today):
  //--------------------------------------------------------------------------------------------------------------------//
  onSubmit(): void {
    if(this.form.valid){
      //Set current datetime (Backend datetime format):
      const now = new Date();
      const time = this.sharedFunctions.addZero(now.getHours()) + ':' + this.sharedFunctions.addZero(now.getMinutes());

      //Set data to save:
      const checkInBoard = {
        date        : this.sharedFunctions.setDatetimeFormat(now, time),
        fk_patient  : this.data.patient._id,
        fk_board    : this.form.value.fk_board,
        room_place  : this.form.value.room_place
      };

      //Find the call of the patient to the board today:
      const params = {
        'filter[fk_patient]'    : checkInBoard.fk_patient,
        'filter[fk_board]'      : checkInBoard.fk_board,
        'filter[date][$gte]'    : this.sharedFunctions.setDatetimeFormat(now, '00:00'),
        'filter[date][$lte]'    : this.sharedFunctions.setDatetimeFormat(now, '23:59'),
        'proj[_id]'             : 1,
        'proj[date]'            : 1,
        'proj[room_place]'      : 1
      };

      this.sharedFunctions.find('check_in_boards', params, (res) => {
        //Check if the patient was already called to the board:
        if(res.success === true && res.data.length > 0){
          const existing = res.data[0];

          //Ask for confirmation to update the call (Room/place and time):
          this.sharedFunctions.openDialog('call_patient_exists', { date: existing.date, room_place: existing.room_place, new_room_place: checkInBoard.room_place }, (confirmed) => {
            if(confirmed){
              this.save('update', existing._id, checkInBoard);
            }
          });
        } else {
          this.save('insert', '', checkInBoard);
        }
      }, false, false, false);
    }
  }

  save(operation: string, _id: string, checkInBoard: any): void {
    //Save (Empty room_place is ignored on insert and unset on update):
    this.sharedFunctions.save(operation, 'check_in_boards', _id, checkInBoard, [], (res) => {
      //Check operation status:
      if(res.success === true){
        //Send snakbar message:
        this.sharedFunctions.sendMessage(this.i18n.instant('DIALOGS.CALL_PATIENT.SUCCESS'), { duration: 2000 });

        //Close dialog:
        this.dialogRef.close(true);
      } else {
        //Send snakbar message:
        this.sharedFunctions.sendMessage(res.message);
      }
    }, false);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
