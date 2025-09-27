import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function bootstrapApplication(language?: string): void {
  if (language) {
    localStorage.setItem('sirius_language', language);
    document.documentElement.lang = language;
  }

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}

fetch('assets/main-settings.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Unable to load main-settings.json: ${response.statusText}`);
    }
    return response.json();
  })
  .then(settings => {
    const language = settings?.appSettings?.language || 'es';
    bootstrapApplication(language);
  })
  .catch(error => {
    console.error('[main.ts] Failed to preload main-settings.json', error);
    bootstrapApplication('es');
  });
