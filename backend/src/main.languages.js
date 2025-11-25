//--------------------------------------------------------------------------------------------------------------------//
// LANGUAGE MODULE (Dynamic Loader):
// This module centralizes the internationalization (i18n) system of the backend.
//--------------------------------------------------------------------------------------------------------------------//
// Import external modules:
const fs = require('fs');
const path = require('path');

// Directory where all JSON translation files are stored:
const I18N_DIR = path.join(__dirname, 'i18n');

// Object that will hold all loaded languages in memory:
let loadedLanguages = {};

//--------------------------------------------------------------------------------------------------------------------//
// LOAD ALL LANGUAGES FROM /i18n DIRECTORY
//--------------------------------------------------------------------------------------------------------------------//
// This function runs once when the module is initialized.
// It reads every *.json file inside the "i18n" directory and loads its contents
// into the "loadedLanguages" object, using the filename as the language key.
//--------------------------------------------------------------------------------------------------------------------//
function loadAllLanguages() {
    // If the directory doesn't exist, continue without throwing:
    if (!fs.existsSync(I18N_DIR)) {
        console.warn(`[ WARN ] i18n directory does not exist at: ${I18N_DIR}`);
        return;
    }

    // Read all files in i18n directory:
    const files = fs.readdirSync(I18N_DIR);
    const loaded = [];

    files.forEach((file) => {
        // Only process *.json files:
        if (!file.endsWith('.json')) return;

        // Extract the language code from filename > "es", "BR", "en", etc.:
        const langCode = file.replace('.json', '').toUpperCase();

        try {
            const filePath = path.join(I18N_DIR, file);
            const jsonContent = fs.readFileSync(filePath, 'utf8');

            // Parse the JSON file into a translation object:
            loadedLanguages[langCode] = JSON.parse(jsonContent);
            loaded.push(langCode);

        } catch (err) {
            // Send console error:
            console.error(`[ ERROR ] Could not load language file ${file}:`, err);
        }
    });

    // Show loaded languages in console:
    console.log(`[ i18n ] Available languages: ${loaded.join(', ')}.`);
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Load all language files when the module is initialized:
//--------------------------------------------------------------------------------------------------------------------//
console.log('\n• LOADING LANGUAGES FILES:');
loadAllLanguages();
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// GET LANGUAGE:
// Returns the translation object associated with the provided language code.
//--------------------------------------------------------------------------------------------------------------------//
function getLanguage(langCode = 'EN') {
    const code = String(langCode).toUpperCase();

    // Language exists > return it:
    if (loadedLanguages[code]) {
        return loadedLanguages[code];
    }

    // Fallback > Default language:
    console.warn(`[ i18n ] Language "${code}" not found. Using EN as fallback.`);
    return loadedLanguages['EN'] || {};
}
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// EXPORT MODULE:
//--------------------------------------------------------------------------------------------------------------------//
module.exports = getLanguage;
//--------------------------------------------------------------------------------------------------------------------//
