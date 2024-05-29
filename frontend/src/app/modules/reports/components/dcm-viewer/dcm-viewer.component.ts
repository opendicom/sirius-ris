import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-dcm-viewer',
  templateUrl: './dcm-viewer.component.html',
  styleUrls: ['./dcm-viewer.component.css']
})
export class DcmViewerComponent implements OnInit {
  @Input() src: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
