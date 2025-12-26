import { Component, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';                           // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-search-info',
  templateUrl: './search-info.component.html',
  styleUrls: ['./search-info.component.css']
})
export class SearchInfoComponent implements OnInit {

  constructor(
    public i18n: I18nService
  ) { }

  ngOnInit(): void {
  }

}
