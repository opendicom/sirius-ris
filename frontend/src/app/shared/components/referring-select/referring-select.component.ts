import { Component, OnInit, Input } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { FormGroup } from '@angular/forms';                                                     // Reactive form handling tools
import { AppointmentsService } from '@modules/appointments/services/appointments.service';      // Appointments service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-referring-select',
  templateUrl: './referring-select.component.html'
})
export class ReferringSelectComponent implements OnInit {
  //Parent form:
  @Input() form!        : FormGroup;
  @Input() label        : string = '';
  @Input() placeholder  : string = '';

  //Label of the last selected option (Detects manual edits of the text):
  private selectedLabel : string | null = null;

  constructor(
    public appointmentsService : AppointmentsService
  ) { }

  ngOnInit(): void {
    //Find referring options (Organizations and their branches):
    this.appointmentsService.findReferringOptions();
  }

  onInput(value: string){
    //Filter options:
    this.appointmentsService.filterReferringOptions(value);

    //Invalidate previous selection if the text was edited manually:
    if(value !== this.selectedLabel){
      this.selectedLabel = null;
      this.appointmentsService.clearReferringSelection(this.form);
    }
  }

  onSelect(currentOption: any){
    this.selectedLabel = currentOption.label;
    this.appointmentsService.selectReferringOption(currentOption, this.form);
  }
}
