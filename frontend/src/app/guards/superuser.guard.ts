import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, Router, UrlSegment } from '@angular/router';
import { UsersAuthService } from '@auth/services/users-auth.service';
import { SharedFunctionsService } from '@shared/services/shared-functions.service';
import { SharedPropertiesService } from '@shared/services/shared-properties.service';

@Injectable({
  providedIn: 'root'
})
export class SuperuserGuard implements CanActivate {

  constructor(
    private userAuth: UsersAuthService,
    private router: Router,
    private sharedFunctions: SharedFunctionsService,
    public sharedProp: SharedPropertiesService,
  ) { }

  canActivate(): boolean {
    return this.hasSuperuserRole();
  }

  canActivateChild(): boolean {
    return this.hasSuperuserRole();
  }

  canLoad(_route: Route, _segments: UrlSegment[]): boolean {
    return this.hasSuperuserRole();
  }

  private hasSuperuserRole(): boolean {
    if (!this.userAuth.userIsLogged()) {
      this.router.navigate(['/signin']);
      return false;
    }

    try {
      this.sharedProp.userLogged = this.sharedFunctions.getUserInfo();
    } catch (_error) {
      this.sharedProp.userLogged = null;
    }

    this.sharedProp.checkIsLogged();

    const permissions = Array.isArray(this.sharedProp.userLogged?.permissions)
      ? this.sharedProp.userLogged.permissions
      : (this.sharedProp.userLogged?.permissions ? Object.values(this.sharedProp.userLogged.permissions) : []);

    const currentRole = Number(permissions?.[0]?.role ?? this.sharedProp.userLogged?.role ?? 0);
    const isSuperuser = currentRole === 1 || currentRole === 1.0;

    if (!isSuperuser) {
      this.router.navigate(['/start']);
      return false;
    }

    return true;
  }
}
