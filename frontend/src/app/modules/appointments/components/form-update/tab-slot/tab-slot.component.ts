import { Component, OnInit } from '@angular/core';

import { SharedPropertiesService } from '@shared/services/shared-properties.service';       // Shared Properties

@Component({
  selector: 'app-tab-slot',
  templateUrl: './tab-slot.component.html',
  styleUrls: ['./tab-slot.component.css']
})
export class TabSlotComponent implements OnInit {

  constructor(
    public sharedProp: SharedPropertiesService
  ) { }

  ngOnInit(): void {
  }

}
