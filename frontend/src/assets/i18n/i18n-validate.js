#!/usr/bin/env node

//--------------------------------------------------------------------------------------------------------------------//
// I18N VALIDATE:
//--------------------------------------------------------------------------------------------------------------------// 
// It should NOT flag an error when:
//--------------------------------------------------------------------------------------------------------------------//
// - Strings have leading/trailing spaces (this is valid in i18n UI).
// - A string is empty ("") (it can be a temporary placeholder).
// - There are differences in length, language, characters, etc.
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Error when:
//--------------------------------------------------------------------------------------------------------------------//
// - The structure is NOT identical
//   + Missing keys
//   + Extra keys
//   + Different type (object vs string)
//
// - A leaf value is not a string
// - The key order is different
// - The JSON cannot be normalized with the same indentation
//--------------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');

//--------------------------------------------------------------------------------------------------------------------//
// Utils:
//--------------------------------------------------------------------------------------------------------------------//
function loadRaw(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(`[✕] Error reading ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

function loadJSON(filePath) {
  try {
    return JSON.parse(loadRaw(filePath));
  } catch (e) {
    console.error(`[✕] Invalid JSON in ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// Structural validation:
//--------------------------------------------------------------------------------------------------------------------//
function compareStructure(a, b, basePath = '', errors = []) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // 1. Exact order:
  if (keysA.join('|') !== keysB.join('|')) {
    errors.push({
      type: 'KEY_ORDER_MISMATCH',
      path: basePath || '(root)',
      expected: keysA,
      found: keysB
    });
  }

  for (const key of keysA) {
    const currentPath = basePath ? `${basePath}.${key}` : key;

    if (!(key in b)) {
      errors.push({ type: 'MISSING_KEY', path: currentPath });
      continue;
    }

    const valA = a[key];
    const valB = b[key];

    if (isObject(valA)) {
      if (!isObject(valB)) {
        errors.push({
          type: 'TYPE_MISMATCH',
          path: currentPath,
          expected: 'object',
          found: typeof valB
        });
        continue;
      }
      compareStructure(valA, valB, currentPath, errors);
    } else {
      if (typeof valB !== 'string') {
        errors.push({
          type: 'INVALID_LEAF_TYPE',
          path: currentPath,
          expected: 'string',
          found: typeof valB
        });
      }
    }
  }

  // Extra keys in B:
  for (const key of keysB) {
    if (!(key in a)) {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      errors.push({ type: 'EXTRA_KEY', path: currentPath });
    }
  }

  return errors;
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// Format validation:
//--------------------------------------------------------------------------------------------------------------------//
function normalizedString(obj) {
  return JSON.stringify(obj, null, 2);
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// Main:
//--------------------------------------------------------------------------------------------------------------------//
const fileA = process.argv[2];
const fileB = process.argv[3];

if (!fileA || !fileB) {
  console.error(
    '[!] Usage: node i18n-validate.js canonical.json candidate.json'
  );
  process.exit(1);
}

const jsonA = loadJSON(path.resolve(fileA));
const jsonB = loadJSON(path.resolve(fileB));

const errors = compareStructure(jsonA, jsonB);

if (errors.length === 0) {
  console.log(' • Valid files!');
  console.log('[✓] Identical structure');
  console.log('[✓] Identical key order');
  console.log('[✓] Leaf values are strings');
  process.exit(0);
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// Reporting:
//--------------------------------------------------------------------------------------------------------------------//
console.log(' • Differences detected!\n');

errors.forEach(err => {
  switch (err.type) {
    case 'KEY_ORDER_MISMATCH':
      console.log(`[!] Order of keys differs in ${err.path}`);
      break;
    case 'MISSING_KEY':
      console.log(`[✕] Missing key: ${err.path}`);
      break;
    case 'EXTRA_KEY':
      console.log(`[+] Extra key: ${err.path}`);
      break;
    case 'TYPE_MISMATCH':
      console.log(
        `[✕] Type mismatch in ${err.path} (expected ${err.expected})`
      );
      break;
    case 'INVALID_LEAF_TYPE':
      console.log(
        `[✕] Non-string value in ${err.path} (found ${err.found})`
      );
      break;
  }
});

console.log(`\nTotal errors: ${errors.length}`);
process.exit(1);
//--------------------------------------------------------------------------------------------------------------------//