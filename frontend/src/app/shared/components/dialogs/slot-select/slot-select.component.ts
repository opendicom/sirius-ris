import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';                           // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-slot-select',
  templateUrl: './slot-select.component.html',
  styleUrls: ['./slot-select.component.css']
})
export class SlotSelectComponent implements OnInit {

  constructor(private i18n: I18nService) { }

  ngOnInit(): void {
  }

}
