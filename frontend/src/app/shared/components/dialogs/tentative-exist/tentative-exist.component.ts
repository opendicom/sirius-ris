import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';                           // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-tentative-exist',
  templateUrl: './tentative-exist.component.html',
  styleUrls: ['./tentative-exist.component.css']
})
export class TentativeExistComponent implements OnInit {

  constructor(private i18n: I18nService) { }

  ngOnInit(): void {
  }

}
