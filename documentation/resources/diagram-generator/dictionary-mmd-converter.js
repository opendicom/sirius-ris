//Import external modules:
const fs = require('fs');
const path = require('path');

// Define paths:
const INPUT = path.join(__dirname, '../dictionary-generator/data_dictionary.md');
const OUTPUT = path.join(__dirname, './class_diagram.md');

const md = fs.readFileSync(INPUT, 'utf8');

//--------------------------------------------------------------------------------------------------------------------//
// Helpers:
//--------------------------------------------------------------------------------------------------------------------//
function extractTarget(ref) {
  return ref.replace('_id.', '');
}

function isScalar(type) {
  return ['String', 'Number', 'Boolean', 'Date', 'ObjectId', 'Mixed'].includes(type);
}

//--------------------------------------------------------------------------------------------------------------------//
// Parse markdown:
//--------------------------------------------------------------------------------------------------------------------//
const classes = {};
const relations = {};

let currentClass = null;
let contextStack = [];

md.split('\n').forEach(line => { 
  //-----------------------------------------------------------------------------------------------------------------//
  // Section header:
  //-----------------------------------------------------------------------------------------------------------------//
  const section = line.match(/^## (.+)$/);
  if (section) {
    currentClass = section[1];
    classes[currentClass] = [];
    contextStack = [];
    return;
  }

  //-----------------------------------------------------------------------------------------------------------------//
  // Table rows:
  //-----------------------------------------------------------------------------------------------------------------//
  if (
    line.startsWith('|') &&
    currentClass &&
    !line.includes('Field |') &&
    !line.match(/^\|\s*-+/)
  ) {
    const cols = line.split('|').map(c => c.trim());
    if (cols.length < 7) return;

    let fieldPath = cols[1];
    const type = cols[2];
    const ref = cols[6];

    if (!fieldPath || fieldPath === 'Field' || fieldPath === '_id') return;

    //--------------------------------------------------------------------------------------------------------------//
    // Split path parts (permissions[x].organization):
    //--------------------------------------------------------------------------------------------------------------//
    const parts = fieldPath.split('.').map(p => {
      const isArray = p.includes('[x]');
      return {
        name: p.replace('[x]', ''),
        isArray
      };
    });

    //--------------------------------------------------------------------------------------------------------------//
    // Reset context if root changes:
    //--------------------------------------------------------------------------------------------------------------//
    if (!contextStack.length || contextStack[0].name !== parts[0].name) {
      contextStack = [];
    }

    //--------------------------------------------------------------------------------------------------------------//
    // Build context stack (all but last part):
    //--------------------------------------------------------------------------------------------------------------//
    contextStack = parts.slice(0, -1);

    const leaf = parts[parts.length - 1];

    //--------------------------------------------------------------------------------------------------------------//
    // Ignore non-scalar containers:
    //--------------------------------------------------------------------------------------------------------------//
    if (!isScalar(type)) return;

    //--------------------------------------------------------------------------------------------------------------//
    // Build full semantic path preserving [x]:
    //--------------------------------------------------------------------------------------------------------------//
    const fullPath = [
      ...contextStack.map(ctx =>
        ctx.isArray ? `${ctx.name}[x]` : ctx.name
      ),
      leaf.isArray ? `${leaf.name}[x]` : leaf.name
    ].join('.');

    //--------------------------------------------------------------------------------------------------------------//
    // ATTRIBUTE:
    //--------------------------------------------------------------------------------------------------------------//
    classes[currentClass].push(`${fullPath} : ${type}`);

    //--------------------------------------------------------------------------------------------------------------//
    // RELATIONSHIP:
    //--------------------------------------------------------------------------------------------------------------//
    if (ref) {
      const key = `${currentClass}-${extractTarget(ref)}`;
      relations[key] = {
        from: currentClass,
        to: extractTarget(ref),
        cardinality: leaf.isArray ? '*' : '1'
      };
    }
  }
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------------------//
// Generate Mermaid:
//--------------------------------------------------------------------------------------------------------------------//
let out = "# Class diagram\n\n_Automatically generated from Data dictionary._\n\n---\n\n```mermaid\nclassDiagram\n\n";

// Classes:
Object.entries(classes).forEach(([name, attrs]) => {
  out += `class ${name} {\n`;
  attrs.forEach(a => {
    out += `  ${a}\n`;
  });
  out += `}\n\n`;
});

// Relations:
Object.values(relations).forEach(r => {
  out += `${r.from} "1" --> "${r.cardinality}" ${r.to}\n`;
});

fs.writeFileSync(OUTPUT, out, 'utf8');
console.log('✔ Mermaid class diagram generated:', OUTPUT);
//--------------------------------------------------------------------------------------------------------------------//