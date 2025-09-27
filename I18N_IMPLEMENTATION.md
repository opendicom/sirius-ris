# Sirius RIS Internationalization (i18n) Implementation

This document describes the English/Spanish internationalization implementation for the Sirius RIS frontend.

## Overview

The implementation adds runtime language switching capabilities to the Sirius RIS Angular frontend, supporting both English and Spanish languages. The language is configurable via Docker environment variables and does not require image rebuilding to change languages.

## Architecture

### Runtime Configuration Flow
1. `docker-compose.env` → `entrypoint.sh` → `main-settings.template` → `main-settings.json`
2. `AppInitializer` loads `main-settings.json` and initializes the `I18nService`
3. The application uses the configured language for UI and CKEditor

### Key Components

#### 1. Environment Configuration
- **File**: `docker-compose.env`
- **Variable**: `SIRIUS_FRONTEND_LANGUAGE='es'` (es | en)
- **Default**: Spanish ('es')

#### 2. Docker Configuration
- **entrypoint.sh**: Exports `SIRIUS_FRONTEND_LANGUAGE` environment variable
- **main-settings.template**: Uses `${SIRIUS_FRONTEND_LANGUAGE}` for both app and CKEditor language configuration

#### 3. Angular Services

##### I18nService (`src/app/shared/services/i18n.service.ts`)
- Manages language state and translations
- Provides translation methods
- Handles language switching with localStorage persistence
- Initializes from runtime configuration

##### TranslatePipe (`src/app/shared/pipes/translate.pipe.ts`)
- Angular pipe for easy template translation: `{{ 'key' | translate }}`
- Automatically updates when language changes

#### 4. Components

##### LanguageSelectorComponent (`src/app/shared/components/language-selector/`)
- Dropdown component for language selection
- Integrated into the header component
- Uses flag icons and language names
- Triggers page reload on language change (necessary for Angular i18n)

### 5. Configuration Files

#### Updated Files
- `package.json`: Added `@angular/localize` dependency
- `angular.json`: Removed hard-coded Spanish CKEditor translation
- `app.module.ts`: Added dynamic locale provider and i18n service
- `polyfills.ts`: Added `@angular/localize/init` import
- `shared.module.ts`: Added new i18n components and pipes

## Usage

### Changing Language via Docker

1. **Development**: Update `docker-compose.env`:
   ```bash
   SIRIUS_FRONTEND_LANGUAGE='en'  # or 'es'
   ```

2. **Production**: Set environment variable:
   ```bash
   export SIRIUS_FRONTEND_LANGUAGE=en
   ```

3. **Restart containers** (no image rebuild required)

### Using Translations in Templates

```html
<!-- Using the translate pipe -->
<span>{{ 'common.save' | translate }}</span>

<!-- Using the translate pipe with parameters -->
<span>{{ 'message.welcome' | translate:{'name': userName} }}</span>
```

### Using Translations in Components

```typescript
import { I18nService } from '@shared/services/i18n.service';

constructor(private i18nService: I18nService) {}

// Get translation
const saveText = this.i18nService.translate('common.save');

// Get translation with parameters
const welcomeText = this.i18nService.translate('message.welcome', { name: 'John' });
```

### Language Switching

Users can switch languages using the language selector in the header. The change:
1. Updates the i18n service state
2. Stores preference in localStorage
3. Reloads the page to apply locale changes
4. Persists across browser sessions

## Translation Keys

### Common Keys
- `common.save`, `common.cancel`, `common.delete`, `common.edit`
- `common.add`, `common.search`, `common.loading`
- `common.yes`, `common.no`, `common.close`

### Authentication Keys
- `auth.login`, `auth.logout`, `auth.username`, `auth.password`

### Navigation Keys
- `nav.dashboard`, `nav.appointments`, `nav.patients`, `nav.reports`

### Message Keys
- `message.success`, `message.error`, `message.warning`, `message.info`

### System Keys
- `system.configuration`, `system.user_settings`, `system.language_settings`

## CKEditor Integration

The CKEditor configuration automatically uses the language set via `SIRIUS_FRONTEND_LANGUAGE`:
- UI language matches application language
- Content language matches application language
- No manual intervention required

## Supported Languages

1. **Spanish (es)** - Default
   - Locale: `es`
   - Flag: Spanish flag
   - Name: "Español"

2. **English (en)**
   - Locale: `en`
   - Flag: US flag
   - Name: "English"

## Adding New Languages

To add a new language:

1. **Update I18nService**:
   ```typescript
   languages: Language[] = [
     { code: 'es', name: 'Español', flag: 'es' },
     { code: 'en', name: 'English', flag: 'us' },
     { code: 'fr', name: 'Français', flag: 'fr' }  // New language
   ];
   ```

2. **Add translations** to the `loadTranslations()` method
3. **Register locale data** in `app.module.ts`
4. **Update Docker environment** validation if needed

## Testing

### Manual Testing
1. Set `SIRIUS_FRONTEND_LANGUAGE=en` in `docker-compose.env`
2. Restart the frontend container
3. Verify English UI and CKEditor
4. Use language selector to switch to Spanish
5. Verify persistence across browser sessions

### Automated Testing
- Unit tests for I18nService translation methods
- Component tests for LanguageSelectorComponent
- Integration tests for language switching workflow

## Backward Compatibility

- Default language remains Spanish
- Existing functionality unchanged
- No breaking changes to existing components
- Hard-coded Spanish text gradually replaceable with translation keys

## Performance Considerations

- Translations loaded at application startup
- Language switching requires page reload (Angular i18n limitation)
- localStorage used for persistence (minimal overhead)
- Flag icons cached by browser

## Future Enhancements

1. **Server-side translation loading** for dynamic content
2. **Pluralization support** for complex grammar rules
3. **RTL language support** for Arabic, Hebrew, etc.
4. **Translation management** interface for administrators
5. **Date/time formatting** per locale
6. **Number formatting** per locale

## Troubleshooting

### Language not changing
- Verify `SIRIUS_FRONTEND_LANGUAGE` environment variable
- Check browser console for JavaScript errors
- Ensure `main-settings.json` contains correct language value

### CKEditor still in wrong language
- Verify `main-settings.json` CKEditor configuration
- Check browser network tab for CKEditor translation file loading

### Translations not showing
- Verify translation keys exist in I18nService
- Check browser console for pipe errors
- Ensure TranslatePipe is properly imported

---

**Note**: This implementation provides a solid foundation for internationalization while maintaining the existing Docker-based configuration approach and ensuring no image rebuilds are required for language changes.
