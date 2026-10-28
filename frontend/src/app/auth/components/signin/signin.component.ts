import { Component, OnDestroy, OnInit } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { ActivatedRoute } from '@angular/router';                                       // Activated Route Interface (To get information about the routes)
import { NgForm } from '@angular/forms';                                                // NgForm (bidirectional binding)
import { Subscription } from 'rxjs';                                                    // Subscription
import { filter } from 'rxjs/operators';                                                // Filter operator
import { marked } from 'marked';                                                        // Markdown parser
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { ReleasesService } from '@auth/services/releases.service';                      // Releases Service
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
import { SharedFunctionsService } from '@shared/services/shared-functions.service';     // Shared Functions
import { ThemesService } from '@shared/services/themes.service';                        // Themes Service
import { I18nService } from '@shared/services/i18n.service';                            // I18n Service
import { ISO_3166, objectKeys, environment } from '@env/environment';                   // Enviroments
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit, OnDestroy {
  public country_codes: any = ISO_3166;
  public documentTypesKeys: string[] = objectKeys.documentTypesKeys;

  //Release notes: current release (environment) and available releases (newest first):
  public currentVersion: string = environment.version;
  public versions: string[] = environment.releases.includes(environment.version)
    ? environment.releases
    : [environment.version, ...environment.releases];
  public selectedVersion: string = this.currentVersion;

  //Rendered markdown:
  public releaseDetailsHtml: string = '';
  public releaseLoading: boolean = false;
  private langSubscription?: Subscription;

  //Re-define method in component to use in HTML view:
  public getKeys: any;

  //Initializate full status information and theme controllers:
  public GET_full_status: any = false;
  public GET_initial_forced_theme: any = undefined;

  //Last white labeling used (read from sirius_settings on init):
  public lastWhiteLabeling: any = null;

  //Create unsorted function to prevent Angular from sorting 'wrong' ngFor keyvalue:
  unsorted = () => { return 0 }

  //Inject services to the constructor:
  constructor(
    private userAuth        : UsersAuthService,
    public  sharedProp      : SharedPropertiesService,
    public  sharedFunctions : SharedFunctionsService,
    private objRoute        : ActivatedRoute,
    public  themesService   : ThemesService,
    public  i18n            : I18nService,
    private releasesService : ReleasesService
  ) {
    //Pass Service Method:
    this.getKeys = this.sharedFunctions.getKeys;
  }

  ngOnInit(): void {
    //Extract sent data (GET parameters):
    this.GET_full_status = this.sharedFunctions.stringToBoolean(this.objRoute.snapshot.queryParams['full_status']);
    this.GET_initial_forced_theme = this.objRoute.snapshot.queryParams['theme'];

    //Check full status info:
    if(this.GET_full_status){
      //Remove token manually (Prevent redirect to /signin without GET params):
      this.userAuth.removeToken();
    } else {
      //Logout if is entered in this component:
      this.userAuth.userLogout();

      //Refresh isLoged value not display the toolbar and sidebar:
      this.sharedProp.checkIsLogged();
    }

    // Initializate or Force CSS theme (Initial):
    if(this.GET_initial_forced_theme !== undefined && this.GET_initial_forced_theme !== null && this.GET_initial_forced_theme !== ''){
      this.themesService.initializeTheme(this.GET_initial_forced_theme);
    } else {
      // Initializate CSS theme:
      this.themesService.initializeTheme();
    }

    // Read last white labeling from sirius_settings:
    const stored = localStorage.getItem('sirius_settings');
    if(stored){
      const objSettings = JSON.parse(stored);
      this.lastWhiteLabeling = objSettings['last_white_labeling'] || null;
    }

    // Load release details (and reload on language change) once translations are available:
    this.langSubscription = this.i18n.loaded$.pipe(filter((loaded) => loaded)).subscribe(() => this.loadReleaseDetails());
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  onSubmit(form_data: NgForm): void {
    //Validate input fields:
    if(form_data.valid){
      //Signin:
      this.userAuth.userSignin(form_data);
    }
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // RELEASE NOTES:
  //--------------------------------------------------------------------------------------------------------------------//
  get selectedIndex(): number {
    return this.versions.indexOf(this.selectedVersion);
  }

  get hasOlder(): boolean {
    return this.selectedIndex < this.versions.length - 1;
  }

  get hasNewer(): boolean {
    return this.selectedIndex > 0;
  }

  get isCurrentVersion(): boolean {
    return this.selectedVersion === this.currentVersion;
  }

  selectVersion(version: string): void {
    this.selectedVersion = version;
    this.loadReleaseDetails();
  }

  goOlder(): void {
    if(this.hasOlder) this.selectVersion(this.versions[this.selectedIndex + 1]);
  }

  goNewer(): void {
    if(this.hasNewer) this.selectVersion(this.versions[this.selectedIndex - 1]);
  }

  private loadReleaseDetails(): void {
    const requestedVersion = this.selectedVersion;
    this.releaseLoading = true;

    this.releasesService.getReleaseDetails(requestedVersion, this.i18n.language).subscribe((markdown) => {
      // Ignore late responses of a version that is no longer selected:
      if(requestedVersion !== this.selectedVersion) return;

      this.releaseDetailsHtml = markdown ? marked.parse(markdown, { mangle: false, headerIds: false }) : '';
      this.releaseLoading = false;
    });
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
