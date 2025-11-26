import { Pipe, PipeTransform } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';
//--------------------------------------------------------------------------------------------------------------------//

@Pipe({
  name: 'i18n',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.instant(key, params);
  }
}
