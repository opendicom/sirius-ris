import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translations: Record<string, any> = {};
  private _language = 'en';

  // Public observable to notify when the language changes or translations are loaded:
  public loaded$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  get language(): string {
    return this._language;
  }

  //--------------------------------------------------------------------------------------------------------------------//
  // LOAD TRANSLATIONS:
  // Load the translation file for the requested language.
  // If loading the requested language fails, it retries with 'en' as a fallback.
  //--------------------------------------------------------------------------------------------------------------------//
  loadTranslations(lang: string): Observable<any> {
    const url = `assets/i18n/${lang}.json`;
    return this.http.get<Record<string, any>>(url).pipe(
      tap((data) => {
        this.translations = data || {};
        this._language = lang;
        this.loaded$.next(true);
      }),
      catchError((err) => {
        // Try english as fallback if requested language failed
        if (lang !== 'en') {
          return this.loadTranslations('en');
        }

        // If english also fails, set empty translations and mark loaded
        this.translations = {};
        this.loaded$.next(true);
        return of({});
      })
    );
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // TRANSLATE:
  // Return a translation given a key like 'A.B.C'.
  // If the key does not exist, return the key itself as a fallback.
  // Optionally supports simple interpolation using {param} tokens.
  //--------------------------------------------------------------------------------------------------------------------//
  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';

    const value = this.getValueByKey(key, this.translations);
    if (value === undefined || value === null) return key;

    if (typeof value !== 'string') return String(value);

    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // INSTANT:
  // Instant (synchronous) access to the currently loaded translations — handy for templates and pipes.
  //--------------------------------------------------------------------------------------------------------------------//
  instant(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // GET VALUE BY KEY:
  // Helper to get nested values from an object using dot notation keys.
  //--------------------------------------------------------------------------------------------------------------------//
  private getValueByKey(key: string, obj: any): any {
    return key.split('.').reduce((acc: any, part: string) => {
      if (acc && typeof acc === 'object' && part in acc) return acc[part];
      return undefined;
    }, obj as any);
  }
  //--------------------------------------------------------------------------------------------------------------------//


  //--------------------------------------------------------------------------------------------------------------------//
  // INTERPOLATE:
  // Simple string interpolation replacing {param} tokens with provided values.
  //--------------------------------------------------------------------------------------------------------------------//
  private interpolate(value: string, params: Record<string, string | number>): string {
    return Object.keys(params).reduce((res, k) => res.split(`{${k}}`).join(String(params[k])), value);
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
