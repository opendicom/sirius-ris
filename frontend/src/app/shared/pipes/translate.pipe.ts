import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService } from '@shared/services/i18n.service';                          // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Pipe({
  name: 'translate',
  pure: false // Make it impure to detect language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private lastLanguage: string = '';
  
  constructor(private i18nService: I18nService) {
    // Subscribe to language changes to trigger pipe updates
    this.i18nService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.lastLanguage = language;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  transform(key: string, params?: { [key: string]: any }): string {
    if (!key) {
      return '';
    }
    
    return this.i18nService.translate(key, params);
  }
}
