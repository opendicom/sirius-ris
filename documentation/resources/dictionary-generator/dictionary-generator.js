//Import external modules:
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Define paths:
const MODULES_DIR = path.join(__dirname, '../../../backend/src/modules');
const OUTPUT = path.join(__dirname, './data_dictionary.md');

//--------------------------------------------------------------------------------------------------------------------//
// FK REFERENCES (MANUAL RULES):
//--------------------------------------------------------------------------------------------------------------------//
const fkByFullPath = {
  'domain.organization': '_id.organizations',
  'domain.branch': '_id.branches',
  'domain.service': '_id.services',

  'imaging.organization': '_id.organizations',
  'imaging.branch': '_id.branches',
  'imaging.service': '_id.services',

  'referring.organization': '_id.organizations',
  'referring.branch': '_id.branches',
  'referring.service': '_id.services',
  'referring.fk_referring': '_id.users',

  'reporting.organization': '_id.organizations',
  'reporting.branch': '_id.branches',
  'reporting.service': '_id.services',
  'reporting.fk_reporting[x]': '_id.users',

  'fk_person': '_id.people',
  'fk_appointment_request': '_id.appointment_requests',

  'injection.pet_ct.laboratory_user': '_id.users',
  'acquisition.console_technician': '_id.users',

  'fk_patient': '_id.users',
  'fk_coordinator': '_id.users',
  'authenticated.fk_user': '_id.users',

  'extra_procedures[x]': '_id.procedures',
  'fk_procedures[x]': '_id.procedures',
  'findings[x].fk_procedure': '_id.procedures',

  'equipments[x].fk_equipment': '_id.equipments',

  'consents.informed_consent': '_id.files',
  'consents.clinical_trial': '_id.files',
  'attached_files[x]': '_id.files',

  'medical_signatures[x]': '_id.signatures',
  'fk_pathologies[x]': '_id.pathologies'
};
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// MARKDOWN HEADER:
//--------------------------------------------------------------------------------------------------------------------//
let md = `# Data dictionary

_Automatically generated from Mongoose schemas._

---

`;
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// HELPERS:
//--------------------------------------------------------------------------------------------------------------------//
function getType(node) {
  if (!node) return 'Mixed';
  if (node.type === 'MemberExpression' && node.property.name === 'ObjectId') {
    return 'ObjectId';
  }
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'StringLiteral') return 'String';
  if (node.type === 'NumericLiteral') return 'Number';
  if (node.type === 'BooleanLiteral') return 'Boolean';
  if (node.type === 'ArrayExpression') return 'Array';
  return 'Mixed';
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// FK RESOLUTION (FINAL):
//--------------------------------------------------------------------------------------------------------------------//
function resolveReference(field) {
  // Exact full path:
  if (fkByFullPath[field]) return fkByFullPath[field];

  // Remove [x]:
  const noArray = field.replace(/\[x\]/g, '');
  if (fkByFullPath[noArray]) return fkByFullPath[noArray];

  // Last segment exception:
  const last = noArray.split('.').pop();
  if (fkByFullPath[last]) return fkByFullPath[last];

  // Automatic fk_<schema> → _id.<schema_plural> (Consider exceptions):
  if (last.startsWith('fk_')) {
    const schema = last.replace('fk_', '');
    // Check plural exceptions and generate automatic fk_<schema>:
    switch (`${schema.endsWith('s') ? schema : `${schema}s`}`){
      case 'modalitys':
        return '_id.modalities';
      case 'modalitiess':
        return '_id.modalities';
      case 'peoples':
        return '_id.people';
      case 'persons':
        return '_id.people';
      case 'branchs':
        return '_id.branches';
      case 'equipmentss':
        return '_id.equipments';
      case 'proceduress':
        return '_id.procedures';
      case 'pathologiess':
        return '_id.pathologies';
      case 'organizationss':
        return '_id.organizations';
      case 'userss':
        return '_id.users';
      case 'appointment_requestss':
        return '_id.appointment_requests';
      default:
        return `_id.${schema.endsWith('s') ? schema : `${schema}s`}`;
    }
  }

  return '';
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// SCHEMA PARSING:
//--------------------------------------------------------------------------------------------------------------------//
function parseFields(properties, subSchemas, prefix = '') {
  const rows = [];

  properties.forEach(prop => {
    if (!prop.key || prop.value.type !== 'ObjectExpression') return;

    const name = prop.key.name;
    const fullName = prefix ? `${prefix}.${name}` : name;

    const typeProp = prop.value.properties.find(p => p.key.name === 'type');
    const required = prop.value.properties.some(p => p.key.name === 'required');
    const unique = prop.value.properties.some(p => p.key.name === 'unique');
    const def = prop.value.properties.find(p => p.key.name === 'default');

    if (!typeProp) {
      rows.push({
        field: fullName,
        type: 'Mixed',
        required,
        unique,
        default: def?.value?.value ?? ''
      });
      return;
    }

    const typeNode = typeProp.value;

    // Arrays
    if (typeNode.type === 'ArrayExpression') {
      const inner = typeNode.elements[0];

      if (inner?.type === 'Identifier' && subSchemas[inner.name]) {
        rows.push(
          ...parseFields(subSchemas[inner.name], subSchemas, `${fullName}[x]`)
        );
        return;
      }

      rows.push({
        field: `${fullName}[x]`,
        type: getType(inner),
        required,
        unique,
        default: def?.value?.value ?? ''
      });
      return;
    }

    // SubSchema
    if (typeNode.type === 'Identifier' && subSchemas[typeNode.name]) {
      rows.push(
        ...parseFields(subSchemas[typeNode.name], subSchemas, fullName)
      );
      return;
    }

    // Simple field
    rows.push({
      field: fullName,
      type: getType(typeNode),
      required,
      unique,
      default: def?.value?.value ?? ''
    });
  });

  return rows;
}
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// MAIN PROCESSING LOOP:
//--------------------------------------------------------------------------------------------------------------------//
fs.readdirSync(MODULES_DIR).forEach(moduleName => {
  const schemaPath = path.join(MODULES_DIR, moduleName, 'schemas.js');
  if (!fs.existsSync(schemaPath)) return;

  const code = fs.readFileSync(schemaPath, 'utf8');
  const ast = parser.parse(code, { sourceType: 'module' });

  const subSchemas = {};
  const schemasFound = {};

  traverse(ast, {
    VariableDeclarator(path) {
      const init = path.node.init;
      if (
        init?.type === 'NewExpression' &&
        init.callee.property?.name === 'Schema'
      ) {
        const name = path.node.id.name;
        const props = init.arguments[0]?.properties;
        if (!props) return;

        schemasFound[name] = props;
        if (name.startsWith('subSchema')) {
          subSchemas[name] = props;
        }
      }
    }
  });

  const mainSchemaProps =
    schemasFound.Schema ||
    schemasFound.preSchema;

  if (!mainSchemaProps) return;

  md += `## ${moduleName}\n\n`;
  md += `| Field | Type | Required | Unique | Default | References |\n`;
  md += `|------|------|----------|--------|---------|------------|\n`;
  md += `| _id | ObjectId | Yes | Yes | Auto | PK |\n`;

  const rows = parseFields(mainSchemaProps, subSchemas);

  rows.forEach(r => {
    md += `| ${r.field} | ${r.type} | ${r.required ? 'Yes' : 'No'} | ${r.unique ? 'Yes' : 'No'} | ${r.default} | ${resolveReference(r.field)} |\n`;
  });

  md += `\n---\n\n`;
});
//--------------------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------------------//
// WRITE OUTPUT FILE:
//--------------------------------------------------------------------------------------------------------------------//
fs.writeFileSync(OUTPUT, md, 'utf8');
console.log('Data dictionary generated with explicit + automatic FK references.');
//--------------------------------------------------------------------------------------------------------------------//
