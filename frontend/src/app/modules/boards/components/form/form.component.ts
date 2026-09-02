import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { I18nService } from '@shared/services/i18n.service';
import { SharedPropertiesService } from '@shared/services/shared-properties.service';
import { SharedFunctionsService } from '@shared/services/shared-functions.service';

@Component({
  selector: 'app-boards-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {
  public form: FormGroup;
  public availableBranches: any[] = [];
  public _id: string = '';
  public form_action: string = '';
  private keysWithValues: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private objRoute: ActivatedRoute,
    private i18n: I18nService,
    public sharedProp: SharedPropertiesService,
    private sharedFunctions: SharedFunctionsService
  ) {
    this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
    this.sharedProp.actionSetter({ content_title: this.i18n.instant('BOARDS.FORM.TITLE'), content_icon: 'tv', add_button: false, filters_form: false });
    this.sharedProp.elementSetter('boards');
    this.form = this.formBuilder.group({
      fk_branch: ['', [Validators.required]],
      name: ['', [Validators.required]],
      details: ['']
    });
  }

  ngOnInit(): void {
    this.form_action = this.objRoute.snapshot.params['action'];

    // Branches are loaded for the selector and are restricted by backend domain rules.
    this.sharedFunctions.find('branches', {}, (res) => {
      this.availableBranches = res.data || [];
    });

    if(this.form_action === 'update'){
      // Populate the form from the existing board only for edit routes.
      this._id = this.objRoute.snapshot.params['_id'];
      this.sharedFunctions.find('boards', { 'filter[_id]': this._id }, (res) => {
        if(res.success && res.data[0]){
          this.form.patchValue(res.data[0]);
          this.keysWithValues = this.sharedFunctions.getKeys(this.form.value, false, true);
        } else {
          this.sharedFunctions.gotoList('boards', this.router);
        }
      });
    }
  }

  onSubmit(): void {
    if(this.form.valid){
      // Shared save handles the insert/update endpoint and response navigation.
      this.sharedFunctions.save(this.form_action, 'boards', this._id, this.form.value, this.keysWithValues, (res) => {
        this.sharedFunctions.formResponder(res, 'boards', this.router);
      });
    }
  }

  onCancel(): void {
    this.sharedFunctions.gotoList('boards', this.router);
  }
}