import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { I18nService, Language } from '@shared/services/i18n.service';                 // I18n Service
//--------------------------------------------------------------------------------------------------------------------//

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  
  public languages: Language[] = [];
  public currentLanguage: string = 'es';
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private i18nService: I18nService
  ) {}
  
  ngOnInit(): void {
    this.languages = this.i18nService.languages;
    
    // Subscribe to language changes
    this.i18nService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Change the application language
   */
  changeLanguage(languageCode: string): void {
    this.i18nService.setLanguage(languageCode);
    // Reload the page to apply locale changes (necessary for Angular i18n)
    window.location.reload();
  }
  
  /**
   * Get the display name for a language
   */
  getLanguageName(code: string): string {
    return this.i18nService.getLanguageName(code);
  }
  
  /**
   * Get the flag code for a language
   */
  getLanguageFlag(code: string): string {
    return this.i18nService.getLanguageFlag(code);
  }
}
