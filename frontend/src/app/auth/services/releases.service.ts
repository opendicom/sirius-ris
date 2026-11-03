import { Injectable } from '@angular/core';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
//--------------------------------------------------------------------------------------------------------------------//

@Injectable({
  providedIn: 'root'
})
export class ReleasesService {
  // Markdown already loaded, indexed by '{version}/{lang}':
  private cache: Record<string, string> = {};

  constructor(private http: HttpClient) {}

  //--------------------------------------------------------------------------------------------------------------------//
  // GET RELEASE DETAILS:
  //--------------------------------------------------------------------------------------------------------------------//
  getReleaseDetails(version: string, lang: string): Observable<string> {
    // Build the cache key for this version and language:
    const cacheKey = `${version}/${lang}`;

    // Return the cached markdown if it was already loaded:
    if(this.cache[cacheKey] !== undefined){
      return of(this.cache[cacheKey]);
    }

    // Request the markdown file as plain text:
    return this.http.get(`assets/releases/${version}/${lang}.md`, { responseType: 'text' }).pipe(
      // Validate the response before using it:
      map((markdown) => {
        if(/^\s*<(!doctype|html)/i.test(markdown)){
          throw new Error('Release details not found');
        }

        // Valid markdown:
        return markdown;
      }),

      // Save the markdown in the cache:
      tap((markdown) => this.cache[cacheKey] = markdown),

      // On error retry with english, or return empty if english also failed:
      catchError(() => (lang !== 'en') ? this.getReleaseDetails(version, 'en') : of(''))
    );
  }
  //--------------------------------------------------------------------------------------------------------------------//
}
