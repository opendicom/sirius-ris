import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { Router, CanActivate, CanLoad, Route, UrlSegment, Data } from '@angular/router'; // Router and guard interfaces
import { UsersAuthService } from '@auth/services/users-auth.service';                   // Users Auth Service
import { SharedFunctionsService } from '@shared/services/shared-functions.service';      // Shared Functions
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {

  //Inject services to the constructor:
  constructor(
    private userAuth: UsersAuthService,
    private router: Router,
    private sharedFunctions: SharedFunctionsService,
    public sharedProp: SharedPropertiesService,
  ) { }

  canActivate(route: any): boolean {
    const data = (route && route.data ? route.data : {}) as Data;
    const array_roles = Array.isArray(data['array_roles']) ? data['array_roles'] : [];
    const array_concessions = Array.isArray(data['array_concessions']) ? data['array_concessions'] : [];

    return this.checkAccess(array_roles, array_concessions);
  }

  canLoad(route: Route, _segments: UrlSegment[]): boolean {
    const data = (route && route.data ? route.data : {}) as Data;
    const array_roles = Array.isArray(data['array_roles']) ? data['array_roles'] : [];
    const array_concessions = Array.isArray(data['array_concessions']) ? data['array_concessions'] : [];

    return this.checkAccess(array_roles, array_concessions);
  }

  private checkAccess(array_roles: number[], array_concessions: number[] = []): boolean {
    //Check authentication:
    if (!this.userAuth.userIsLogged()) {
      this.router.navigate(['/signin']);
      return false;
    }

    //Refresh current authenticated user info:
    try {
      this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
    } catch (_error) {
      this.sharedProp.userLogged = null;
    }

    //Refresh isLoged value for display or not the toolbar and sidebar:
    this.sharedProp.checkIsLogged();

    const permissions = Array.isArray(this.sharedProp.userLogged?.permissions)
      ? this.sharedProp.userLogged.permissions
      : (this.sharedProp.userLogged?.permissions ? Object.values(this.sharedProp.userLogged.permissions) : []);

    const currentRole = Number(permissions?.[0]?.role ?? this.sharedProp.userLogged?.role ?? 0);
    const currentConcessions = Array.isArray(permissions?.[0]?.concession)
      ? permissions[0].concession.map((value: any) => Number(value))
      : [];

    const roleMatch = !array_roles.length || array_roles.includes(currentRole);
    const concessionMatch = !array_concessions.length || currentConcessions.some((value: number) => array_concessions.includes(value));

    // A route is accessible if role matches OR concession matches.
    if (!roleMatch && !concessionMatch) {
      this.router.navigate(['/start']);
      return false;
    }

    //In case the authentication is correct, let pass (continue):
    return true;
  }

}
