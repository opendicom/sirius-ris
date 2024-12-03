//--------------------------------------------------------------------------------------------------------------------//
// ENVIROMENT:
//--------------------------------------------------------------------------------------------------------------------//
// Set Enviroment:
export const environment = {
  production: false
};

// Set ObjectId regular expression to validate ObjectIds:
export const regexObjectId = /^[0-9a-fA-F]{24}$/;

// Event logs:
export const events_log = {
  1 : 'Inicio de sesión',
  2 : 'Creación',
  3 : 'Edición',
  4 : 'Eliminación',
  5 : 'Firma',            // Only for report element.
  6 : 'Autenticación',    // Only for report element.
  7 : 'Envío de correo'   // For appointments and reports.
};

// Document types:
export const document_types = {
  1: 'ID Nacional (DNI, CI, CURP, RUT)',
  2: 'Pasaporte',
  3: 'Credencial cívica',
  4: 'Licencia de conducir',
  5: 'Permiso de residencia',
  6: 'Visa',
  7: 'Documento transitorio',
  100: 'Documento anónimo'
};

// User Roles:
export const user_roles = {
  1:  'Superusuario',
  2:  'Administrador',
  3:  'Supervisor',
  4:  'Médico',
  5:  'Técnico',
  6:  'Enfermero',
  7:  'Coordinador',
  8:  'Recepcionista',
  9:  'Paciente',
  10: 'Funcional'  // Empty role for concessions (Generic user)
};

// User Concessions:
export const user_concessions = {
  1   : 'Gestión de turnos',
  2   : 'Gestión de citas',
  3   : 'Calendario de citas',
  4   : 'Gestión de recepciones',
  5   : 'Gestión de estudios',
  6   : 'Gestión de informes',
  7   : 'Firmar informes',
  8   : 'Autenticar informes',
  9   : 'Enmendar informes',    // This concession depends on being a Supervisor, Médico or higher user or having the '6' concession [Gestión de informes].
  10  : 'Acceso a logs del usuario',
  11  : 'Acceso a logs de elementos',
  12  : 'Reenvío de correos',
  13  : 'Gestión de solicitudes',
  14  : 'Búsquedas avanzadas',
  //15  : 'Estadísticas sobre solicitudes',
  16  : 'Estadísticas sobre citas',
  17  : 'Estadísticas sobre estudios',
  //18  : 'Estadísticas sobre informes',
  //19  : 'Estadísticas sobre la organización',
  20  : 'Acceso al módulo de exportación',          // Backend access only
  21  : 'Acceso al servicio de imágenes del PACS',
  22  : 'Edición de identificación de pacientes',
  23  : 'Sobreagenda (overbooking)'
  //24  : 'Listados de facturación',
};

// User Types:
export const user_types = {
  1: 'Humano',
  2: 'Maquina'
};

// Gender types:
export const gender_types = {
  1: 'Macsulino',
  2: 'Femenino',
  3: 'Otros',
};

// Appointments flow states:
export const appointments_flow_states = {
  'A01': 'Coordinada',                // Correspond with AR05 -> appointment_requests_flow_states.
  'A02': 'Cancelada-suspendida'
};

// Appointment requests flow states:
export const appointment_requests_flow_states = {
  'AR01': 'Administración', 
  'AR02': 'Retenida en administración',
  'AR03': 'Área médica',
  'AR04': 'Retenida en área médica',

  // Flow states controlled from backend:
  // appointment_drafts and appointments save handlers.
  'AR05': 'Cita en curso creada',      // Correspond with appointment_draft creation.
  'AR06': 'Cita creada',               // Correspond with A01 -> appointments_flow_states.

  'AR07': 'Cancelada'
};

// Performing flow states:
export const performing_flow_states = {
  'P01': 'Recepción',
  'P02': 'Entrevista',
  'P03': 'Preparación/Inyección',
  'P04': 'Adquisición',
  'P05': 'Verificación de imágenes',  // Algoritmo y pantallas de corrección/asociación de imágenes.
  'P06': 'Para informar',

  // Flow states controlled from backend:
  // Report and signature save handlers.
  'P07': 'Informe borrador',          // Al momento que exista un report con fk_performing = _id | insert report.
  'P08': 'Informe firmado',           // Condición anterior + Que exista una firma al menos con fk_report = _id (report) | insert signature.
  'P09': 'Terminado (con informe)',   // Condiciones anteriores + autenticated object exist (Estado sin remoción, solo enmiendas).

  'P10': 'Terminado (sin informe)',
  'P11': 'Cancelado'
};

// Cancellation reasons (Appointment and performing):
export const cancellation_reasons = {
  1   : "Falla en equipo",
  2   : "Falta consentimiento",
  3   : "Indicacion incorrecta",
  4   : "No se presentó",
  5   : "Sin preparacion o preparación incorrecta",
	6   : "Claustrofóbia",
  7   : "Embarazo",
  8   : "Hiperglicemia",
	9   : "Hipoglicemia",
  10  : "Cursando infección",
  11  : "Fallecimiento",
  12  : "Otro"
};

// Logs element types Lang:
export const elementTypesLang = {
  'ES' : {
    'appointments'          : 'cita',
    'appointments_drafts'   : 'cita en curso',
    'appointment_requests'  : 'solicitud',
    'branches'              : 'sucursal',
    'equipments'            : 'equipo',
    'files'                 : 'archivo',
    'modalities'            : 'modalidad',
    'mwl'                   : 'MWL',
    'organizations'         : 'organización',
    'pathologies'           : 'patología',
    'people'                : 'persona',
    'performing'            : 'estudio',
    'procedure_categories'  : 'categoría de procedimiento',
    'procedures'            : 'procedimiento',
    'reports'               : 'informe',
    'services'              : 'servicio',
    'signatures'            : 'firma',
    'slots'                 : 'turno',
    'users'                 : 'usuario'
  }
};

// Private health Lang:
export const privateHealthLang = {
  'ES' : {
    'diabetes'                : 'Diabetes',
    'hypertension'            : 'Hipertensión',
    'epoc'                    : 'EPOC',
    'smoking'                 : 'Tabaquismo',
    'malnutrition'            : 'Desnutrición',
    'obesity'                 : 'Obesidad',
    'asthma'                  : 'Asma',
    'pregnancy'               : 'Embarazo',
    'claustrophobia'          : 'Claustrofobia',
    'renal_insufficiency'     : 'Insuficiencia renal',
    'heart_failure'           : 'Insuficiencia cardíaca',
    'ischemic_heart_disease'  : 'Cardiopatía isquémica',
    'valvulopathy'            : 'Valvulopatía',
    'arrhythmia'              : 'Arritmia',
    'hiv'                     : 'HIV',
    'cancer'                  : 'Cáncer',
    'dementia'                : 'Demencia',
    'hyperthyroidism'         : 'Hipertiroidismo',
    'hypothyroidism'          : 'Hipotiroidismo',
    'other'                   : 'Otro antecedente/patología',

    //Medication and allergies:
    'medication'              : 'Medicación',
    'allergies'               : 'Alergias',

    //Implants:
    'implants': {
      'cochlear_implant'      : 'Implante coclear',
      'cardiac_stent'         : 'Stent cardíaco',
      'metal_prostheses'      : 'Prótesis metálicas',
      'metal_shards'          : 'Esquirlas metálicas',
      'pacemaker'             : 'Marcapasos',
      'other'                 : 'Otro tipo de implante'
    },

    //COVID-19:
    'covid19': {
      'had_covid'             : 'Tuvo COVID-19',
      'vaccinated'            : 'Posee vacunación contra COVID-19',
      'details'               : 'Detalles (Ej. tipo de dosis Sinovac, Phizer).',
    }
  }
};

// Inpatient types:
export const inpatient_types = {
  1 :'Cuidados intensivos',
  2 :'Emergencia',
  3 :'Internación'
};

// Anonymous patient document case:
export const anonymous_doc = {
  doc_country_code: '001',  // Available in ISO-3166.
  document_types: 100,      // Reserved in document_types for this case.
  description: 'Anónimo'
};

// Country codes (ISO-3166):
export const ISO_3166 = {
  "100": {
    "name": "Bulgaria",
    "alpha_2": "BG",
    "alpha_3": "BGR"
  },
  "104": {
    "name": "Myanmar",
    "alpha_2": "MM",
    "alpha_3": "MMR"
  },
  "108": {
    "name": "Burundi",
    "alpha_2": "BI",
    "alpha_3": "BDI"
  },
  "112": {
    "name": "Belarus",
    "alpha_2": "BY",
    "alpha_3": "BLR"
  },
  "116": {
    "name": "Cambodia",
    "alpha_2": "KH",
    "alpha_3": "KHM"
  },
  "120": {
    "name": "Cameroon",
    "alpha_2": "CM",
    "alpha_3": "CMR"
  },
  "124": {
    "name": "Canada",
    "alpha_2": "CA",
    "alpha_3": "CAN"
  },
  "132": {
    "name": "Cabo Verde",
    "alpha_2": "CV",
    "alpha_3": "CPV"
  },
  "136": {
    "name": "Cayman Islands",
    "alpha_2": "KY",
    "alpha_3": "CYM"
  },
  "140": {
    "name": "Central African Republic",
    "alpha_2": "CF",
    "alpha_3": "CAF"
  },
  "144": {
    "name": "Sri Lanka",
    "alpha_2": "LK",
    "alpha_3": "LKA"
  },
  "148": {
    "name": "Chad",
    "alpha_2": "TD",
    "alpha_3": "TCD"
  },
  "152": {
    "name": "Chile",
    "alpha_2": "CL",
    "alpha_3": "CHL"
  },
  "156": {
    "name": "China",
    "alpha_2": "CN",
    "alpha_3": "CHN"
  },
  "158": {
    "name": "Taiwan, Province of China",
    "alpha_2": "TW",
    "alpha_3": "TWN"
  },
  "162": {
    "name": "Christmas Island",
    "alpha_2": "CX",
    "alpha_3": "CXR"
  },
  "166": {
    "name": "Cocos (Keeling) Islands",
    "alpha_2": "CC",
    "alpha_3": "CCK"
  },
  "170": {
    "name": "Colombia",
    "alpha_2": "CO",
    "alpha_3": "COL"
  },
  "174": {
    "name": "Comoros",
    "alpha_2": "KM",
    "alpha_3": "COM"
  },
  "175": {
    "name": "Mayotte",
    "alpha_2": "YT",
    "alpha_3": "MYT"
  },
  "178": {
    "name": "Congo",
    "alpha_2": "CG",
    "alpha_3": "COG"
  },
  "180": {
    "name": "Congo, Democratic Republic of the",
    "alpha_2": "CD",
    "alpha_3": "COD"
  },
  "184": {
    "name": "Cook Islands",
    "alpha_2": "CK",
    "alpha_3": "COK"
  },
  "188": {
    "name": "Costa Rica",
    "alpha_2": "CR",
    "alpha_3": "CRI"
  },
  "191": {
    "name": "Croatia",
    "alpha_2": "HR",
    "alpha_3": "HRV"
  },
  "192": {
    "name": "Cuba",
    "alpha_2": "CU",
    "alpha_3": "CUB"
  },
  "196": {
    "name": "Cyprus",
    "alpha_2": "CY",
    "alpha_3": "CYP"
  },
  "203": {
    "name": "Czechia",
    "alpha_2": "CZ",
    "alpha_3": "CZE"
  },
  "204": {
    "name": "Benin",
    "alpha_2": "BJ",
    "alpha_3": "BEN"
  },
  "208": {
    "name": "Denmark",
    "alpha_2": "DK",
    "alpha_3": "DNK"
  },
  "212": {
    "name": "Dominica",
    "alpha_2": "DM",
    "alpha_3": "DMA"
  },
  "214": {
    "name": "Dominican Republic",
    "alpha_2": "DO",
    "alpha_3": "DOM"
  },
  "218": {
    "name": "Ecuador",
    "alpha_2": "EC",
    "alpha_3": "ECU"
  },
  "222": {
    "name": "El Salvador",
    "alpha_2": "SV",
    "alpha_3": "SLV"
  },
  "226": {
    "name": "Equatorial Guinea",
    "alpha_2": "GQ",
    "alpha_3": "GNQ"
  },
  "231": {
    "name": "Ethiopia",
    "alpha_2": "ET",
    "alpha_3": "ETH"
  },
  "232": {
    "name": "Eritrea",
    "alpha_2": "ER",
    "alpha_3": "ERI"
  },
  "233": {
    "name": "Estonia",
    "alpha_2": "EE",
    "alpha_3": "EST"
  },
  "234": {
    "name": "Faroe Islands",
    "alpha_2": "FO",
    "alpha_3": "FRO"
  },
  "238": {
    "name": "Falkland Islands (Malvinas)",
    "alpha_2": "FK",
    "alpha_3": "FLK"
  },
  "239": {
    "name": "South Georgia and the South Sandwich Islands",
    "alpha_2": "GS",
    "alpha_3": "SGS"
  },
  "242": {
    "name": "Fiji",
    "alpha_2": "FJ",
    "alpha_3": "FJI"
  },
  "246": {
    "name": "Finland",
    "alpha_2": "FI",
    "alpha_3": "FIN"
  },
  "248": {
    "name": "Åland Islands",
    "alpha_2": "AX",
    "alpha_3": "ALA"
  },
  "250": {
    "name": "France",
    "alpha_2": "FR",
    "alpha_3": "FRA"
  },
  "254": {
    "name": "French Guiana",
    "alpha_2": "GF",
    "alpha_3": "GUF"
  },
  "258": {
    "name": "French Polynesia",
    "alpha_2": "PF",
    "alpha_3": "PYF"
  },
  "260": {
    "name": "French Southern Territories",
    "alpha_2": "TF",
    "alpha_3": "ATF"
  },
  "262": {
    "name": "Djibouti",
    "alpha_2": "DJ",
    "alpha_3": "DJI"
  },
  "266": {
    "name": "Gabon",
    "alpha_2": "GA",
    "alpha_3": "GAB"
  },
  "268": {
    "name": "Georgia",
    "alpha_2": "GE",
    "alpha_3": "GEO"
  },
  "270": {
    "name": "Gambia",
    "alpha_2": "GM",
    "alpha_3": "GMB"
  },
  "275": {
    "name": "Palestine, State of",
    "alpha_2": "PS",
    "alpha_3": "PSE"
  },
  "276": {
    "name": "Germany",
    "alpha_2": "DE",
    "alpha_3": "DEU"
  },
  "288": {
    "name": "Ghana",
    "alpha_2": "GH",
    "alpha_3": "GHA"
  },
  "292": {
    "name": "Gibraltar",
    "alpha_2": "GI",
    "alpha_3": "GIB"
  },
  "296": {
    "name": "Kiribati",
    "alpha_2": "KI",
    "alpha_3": "KIR"
  },
  "300": {
    "name": "Greece",
    "alpha_2": "GR",
    "alpha_3": "GRC"
  },
  "304": {
    "name": "Greenland",
    "alpha_2": "GL",
    "alpha_3": "GRL"
  },
  "308": {
    "name": "Grenada",
    "alpha_2": "GD",
    "alpha_3": "GRD"
  },
  "312": {
    "name": "Guadeloupe",
    "alpha_2": "GP",
    "alpha_3": "GLP"
  },
  "316": {
    "name": "Guam",
    "alpha_2": "GU",
    "alpha_3": "GUM"
  },
  "320": {
    "name": "Guatemala",
    "alpha_2": "GT",
    "alpha_3": "GTM"
  },
  "324": {
    "name": "Guinea",
    "alpha_2": "GN",
    "alpha_3": "GIN"
  },
  "328": {
    "name": "Guyana",
    "alpha_2": "GY",
    "alpha_3": "GUY"
  },
  "332": {
    "name": "Haiti",
    "alpha_2": "HT",
    "alpha_3": "HTI"
  },
  "334": {
    "name": "Heard Island and McDonald Islands",
    "alpha_2": "HM",
    "alpha_3": "HMD"
  },
  "336": {
    "name": "Holy See",
    "alpha_2": "VA",
    "alpha_3": "VAT"
  },
  "340": {
    "name": "Honduras",
    "alpha_2": "HN",
    "alpha_3": "HND"
  },
  "344": {
    "name": "Hong Kong",
    "alpha_2": "HK",
    "alpha_3": "HKG"
  },
  "348": {
    "name": "Hungary",
    "alpha_2": "HU",
    "alpha_3": "HUN"
  },
  "352": {
    "name": "Iceland",
    "alpha_2": "IS",
    "alpha_3": "ISL"
  },
  "356": {
    "name": "India",
    "alpha_2": "IN",
    "alpha_3": "IND"
  },
  "360": {
    "name": "Indonesia",
    "alpha_2": "ID",
    "alpha_3": "IDN"
  },
  "364": {
    "name": "Iran (Islamic Republic of)",
    "alpha_2": "IR",
    "alpha_3": "IRN"
  },
  "368": {
    "name": "Iraq",
    "alpha_2": "IQ",
    "alpha_3": "IRQ"
  },
  "372": {
    "name": "Ireland",
    "alpha_2": "IE",
    "alpha_3": "IRL"
  },
  "376": {
    "name": "Israel",
    "alpha_2": "IL",
    "alpha_3": "ISR"
  },
  "380": {
    "name": "Italy",
    "alpha_2": "IT",
    "alpha_3": "ITA"
  },
  "384": {
    "name": "Côte d'Ivoire",
    "alpha_2": "CI",
    "alpha_3": "CIV"
  },
  "388": {
    "name": "Jamaica",
    "alpha_2": "JM",
    "alpha_3": "JAM"
  },
  "392": {
    "name": "Japan",
    "alpha_2": "JP",
    "alpha_3": "JPN"
  },
  "398": {
    "name": "Kazakhstan",
    "alpha_2": "KZ",
    "alpha_3": "KAZ"
  },
  "400": {
    "name": "Jordan",
    "alpha_2": "JO",
    "alpha_3": "JOR"
  },
  "404": {
    "name": "Kenya",
    "alpha_2": "KE",
    "alpha_3": "KEN"
  },
  "408": {
    "name": "Korea (Democratic People's Republic of)",
    "alpha_2": "KP",
    "alpha_3": "PRK"
  },
  "410": {
    "name": "Korea, Republic of",
    "alpha_2": "KR",
    "alpha_3": "KOR"
  },
  "414": {
    "name": "Kuwait",
    "alpha_2": "KW",
    "alpha_3": "KWT"
  },
  "417": {
    "name": "Kyrgyzstan",
    "alpha_2": "KG",
    "alpha_3": "KGZ"
  },
  "418": {
    "name": "Lao People's Democratic Republic",
    "alpha_2": "LA",
    "alpha_3": "LAO"
  },
  "422": {
    "name": "Lebanon",
    "alpha_2": "LB",
    "alpha_3": "LBN"
  },
  "426": {
    "name": "Lesotho",
    "alpha_2": "LS",
    "alpha_3": "LSO"
  },
  "428": {
    "name": "Latvia",
    "alpha_2": "LV",
    "alpha_3": "LVA"
  },
  "430": {
    "name": "Liberia",
    "alpha_2": "LR",
    "alpha_3": "LBR"
  },
  "434": {
    "name": "Libya",
    "alpha_2": "LY",
    "alpha_3": "LBY"
  },
  "438": {
    "name": "Liechtenstein",
    "alpha_2": "LI",
    "alpha_3": "LIE"
  },
  "440": {
    "name": "Lithuania",
    "alpha_2": "LT",
    "alpha_3": "LTU"
  },
  "442": {
    "name": "Luxembourg",
    "alpha_2": "LU",
    "alpha_3": "LUX"
  },
  "446": {
    "name": "Macao",
    "alpha_2": "MO",
    "alpha_3": "MAC"
  },
  "450": {
    "name": "Madagascar",
    "alpha_2": "MG",
    "alpha_3": "MDG"
  },
  "454": {
    "name": "Malawi",
    "alpha_2": "MW",
    "alpha_3": "MWI"
  },
  "458": {
    "name": "Malaysia",
    "alpha_2": "MY",
    "alpha_3": "MYS"
  },
  "462": {
    "name": "Maldives",
    "alpha_2": "MV",
    "alpha_3": "MDV"
  },
  "466": {
    "name": "Mali",
    "alpha_2": "ML",
    "alpha_3": "MLI"
  },
  "470": {
    "name": "Malta",
    "alpha_2": "MT",
    "alpha_3": "MLT"
  },
  "474": {
    "name": "Martinique",
    "alpha_2": "MQ",
    "alpha_3": "MTQ"
  },
  "478": {
    "name": "Mauritania",
    "alpha_2": "MR",
    "alpha_3": "MRT"
  },
  "480": {
    "name": "Mauritius",
    "alpha_2": "MU",
    "alpha_3": "MUS"
  },
  "484": {
    "name": "Mexico",
    "alpha_2": "MX",
    "alpha_3": "MEX"
  },
  "492": {
    "name": "Monaco",
    "alpha_2": "MC",
    "alpha_3": "MCO"
  },
  "496": {
    "name": "Mongolia",
    "alpha_2": "MN",
    "alpha_3": "MNG"
  },
  "498": {
    "name": "Moldova, Republic of",
    "alpha_2": "MD",
    "alpha_3": "MDA"
  },
  "499": {
    "name": "Montenegro",
    "alpha_2": "ME",
    "alpha_3": "MNE"
  },
  "500": {
    "name": "Montserrat",
    "alpha_2": "MS",
    "alpha_3": "MSR"
  },
  "504": {
    "name": "Morocco",
    "alpha_2": "MA",
    "alpha_3": "MAR"
  },
  "508": {
    "name": "Mozambique",
    "alpha_2": "MZ",
    "alpha_3": "MOZ"
  },
  "512": {
    "name": "Oman",
    "alpha_2": "OM",
    "alpha_3": "OMN"
  },
  "516": {
    "name": "Namibia",
    "alpha_2": "NA",
    "alpha_3": "NAM"
  },
  "520": {
    "name": "Nauru",
    "alpha_2": "NR",
    "alpha_3": "NRU"
  },
  "524": {
    "name": "Nepal",
    "alpha_2": "NP",
    "alpha_3": "NPL"
  },
  "528": {
    "name": "Netherlands",
    "alpha_2": "NL",
    "alpha_3": "NLD"
  },
  "531": {
    "name": "Curaçao",
    "alpha_2": "CW",
    "alpha_3": "CUW"
  },
  "533": {
    "name": "Aruba",
    "alpha_2": "AW",
    "alpha_3": "ABW"
  },
  "534": {
    "name": "Sint Maarten (Dutch part)",
    "alpha_2": "SX",
    "alpha_3": "SXM"
  },
  "535": {
    "name": "Bonaire, Sint Eustatius and Saba",
    "alpha_2": "BQ",
    "alpha_3": "BES"
  },
  "540": {
    "name": "New Caledonia",
    "alpha_2": "NC",
    "alpha_3": "NCL"
  },
  "548": {
    "name": "Vanuatu",
    "alpha_2": "VU",
    "alpha_3": "VUT"
  },
  "554": {
    "name": "New Zealand",
    "alpha_2": "NZ",
    "alpha_3": "NZL"
  },
  "558": {
    "name": "Nicaragua",
    "alpha_2": "NI",
    "alpha_3": "NIC"
  },
  "562": {
    "name": "Niger",
    "alpha_2": "NE",
    "alpha_3": "NER"
  },
  "566": {
    "name": "Nigeria",
    "alpha_2": "NG",
    "alpha_3": "NGA"
  },
  "570": {
    "name": "Niue",
    "alpha_2": "NU",
    "alpha_3": "NIU"
  },
  "574": {
    "name": "Norfolk Island",
    "alpha_2": "NF",
    "alpha_3": "NFK"
  },
  "578": {
    "name": "Norway",
    "alpha_2": "NO",
    "alpha_3": "NOR"
  },
  "580": {
    "name": "Northern Mariana Islands",
    "alpha_2": "MP",
    "alpha_3": "MNP"
  },
  "581": {
    "name": "United States Minor Outlying Islands",
    "alpha_2": "UM",
    "alpha_3": "UMI"
  },
  "583": {
    "name": "Micronesia (Federated States of)",
    "alpha_2": "FM",
    "alpha_3": "FSM"
  },
  "584": {
    "name": "Marshall Islands",
    "alpha_2": "MH",
    "alpha_3": "MHL"
  },
  "585": {
    "name": "Palau",
    "alpha_2": "PW",
    "alpha_3": "PLW"
  },
  "586": {
    "name": "Pakistan",
    "alpha_2": "PK",
    "alpha_3": "PAK"
  },
  "591": {
    "name": "Panama",
    "alpha_2": "PA",
    "alpha_3": "PAN"
  },
  "598": {
    "name": "Papua New Guinea",
    "alpha_2": "PG",
    "alpha_3": "PNG"
  },
  "600": {
    "name": "Paraguay",
    "alpha_2": "PY",
    "alpha_3": "PRY"
  },
  "604": {
    "name": "Peru",
    "alpha_2": "PE",
    "alpha_3": "PER"
  },
  "608": {
    "name": "Philippines",
    "alpha_2": "PH",
    "alpha_3": "PHL"
  },
  "612": {
    "name": "Pitcairn",
    "alpha_2": "PN",
    "alpha_3": "PCN"
  },
  "616": {
    "name": "Poland",
    "alpha_2": "PL",
    "alpha_3": "POL"
  },
  "620": {
    "name": "Portugal",
    "alpha_2": "PT",
    "alpha_3": "PRT"
  },
  "624": {
    "name": "Guinea-Bissau",
    "alpha_2": "GW",
    "alpha_3": "GNB"
  },
  "626": {
    "name": "Timor-Leste",
    "alpha_2": "TL",
    "alpha_3": "TLS"
  },
  "630": {
    "name": "Puerto Rico",
    "alpha_2": "PR",
    "alpha_3": "PRI"
  },
  "634": {
    "name": "Qatar",
    "alpha_2": "QA",
    "alpha_3": "QAT"
  },
  "638": {
    "name": "Réunion",
    "alpha_2": "RE",
    "alpha_3": "REU"
  },
  "642": {
    "name": "Romania",
    "alpha_2": "RO",
    "alpha_3": "ROU"
  },
  "643": {
    "name": "Russian Federation",
    "alpha_2": "RU",
    "alpha_3": "RUS"
  },
  "646": {
    "name": "Rwanda",
    "alpha_2": "RW",
    "alpha_3": "RWA"
  },
  "652": {
    "name": "Saint Barthélemy",
    "alpha_2": "BL",
    "alpha_3": "BLM"
  },
  "654": {
    "name": "Saint Helena, Ascension and Tristan da Cunha",
    "alpha_2": "SH",
    "alpha_3": "SHN"
  },
  "659": {
    "name": "Saint Kitts and Nevis",
    "alpha_2": "KN",
    "alpha_3": "KNA"
  },
  "660": {
    "name": "Anguilla",
    "alpha_2": "AI",
    "alpha_3": "AIA"
  },
  "662": {
    "name": "Saint Lucia",
    "alpha_2": "LC",
    "alpha_3": "LCA"
  },
  "663": {
    "name": "Saint Martin (French part)",
    "alpha_2": "MF",
    "alpha_3": "MAF"
  },
  "666": {
    "name": "Saint Pierre and Miquelon",
    "alpha_2": "PM",
    "alpha_3": "SPM"
  },
  "670": {
    "name": "Saint Vincent and the Grenadines",
    "alpha_2": "VC",
    "alpha_3": "VCT"
  },
  "674": {
    "name": "San Marino",
    "alpha_2": "SM",
    "alpha_3": "SMR"
  },
  "678": {
    "name": "Sao Tome and Principe",
    "alpha_2": "ST",
    "alpha_3": "STP"
  },
  "682": {
    "name": "Saudi Arabia",
    "alpha_2": "SA",
    "alpha_3": "SAU"
  },
  "686": {
    "name": "Senegal",
    "alpha_2": "SN",
    "alpha_3": "SEN"
  },
  "688": {
    "name": "Serbia",
    "alpha_2": "RS",
    "alpha_3": "SRB"
  },
  "690": {
    "name": "Seychelles",
    "alpha_2": "SC",
    "alpha_3": "SYC"
  },
  "694": {
    "name": "Sierra Leone",
    "alpha_2": "SL",
    "alpha_3": "SLE"
  },
  "702": {
    "name": "Singapore",
    "alpha_2": "SG",
    "alpha_3": "SGP"
  },
  "703": {
    "name": "Slovakia",
    "alpha_2": "SK",
    "alpha_3": "SVK"
  },
  "704": {
    "name": "Viet Nam",
    "alpha_2": "VN",
    "alpha_3": "VNM"
  },
  "705": {
    "name": "Slovenia",
    "alpha_2": "SI",
    "alpha_3": "SVN"
  },
  "706": {
    "name": "Somalia",
    "alpha_2": "SO",
    "alpha_3": "SOM"
  },
  "710": {
    "name": "South Africa",
    "alpha_2": "ZA",
    "alpha_3": "ZAF"
  },
  "716": {
    "name": "Zimbabwe",
    "alpha_2": "ZW",
    "alpha_3": "ZWE"
  },
  "724": {
    "name": "Spain",
    "alpha_2": "ES",
    "alpha_3": "ESP"
  },
  "728": {
    "name": "South Sudan",
    "alpha_2": "SS",
    "alpha_3": "SSD"
  },
  "729": {
    "name": "Sudan",
    "alpha_2": "SD",
    "alpha_3": "SDN"
  },
  "732": {
    "name": "Western Sahara",
    "alpha_2": "EH",
    "alpha_3": "ESH"
  },
  "740": {
    "name": "Suriname",
    "alpha_2": "SR",
    "alpha_3": "SUR"
  },
  "744": {
    "name": "Svalbard and Jan Mayen",
    "alpha_2": "SJ",
    "alpha_3": "SJM"
  },
  "748": {
    "name": "Eswatini",
    "alpha_2": "SZ",
    "alpha_3": "SWZ"
  },
  "752": {
    "name": "Sweden",
    "alpha_2": "SE",
    "alpha_3": "SWE"
  },
  "756": {
    "name": "Switzerland",
    "alpha_2": "CH",
    "alpha_3": "CHE"
  },
  "760": {
    "name": "Syrian Arab Republic",
    "alpha_2": "SY",
    "alpha_3": "SYR"
  },
  "762": {
    "name": "Tajikistan",
    "alpha_2": "TJ",
    "alpha_3": "TJK"
  },
  "764": {
    "name": "Thailand",
    "alpha_2": "TH",
    "alpha_3": "THA"
  },
  "768": {
    "name": "Togo",
    "alpha_2": "TG",
    "alpha_3": "TGO"
  },
  "772": {
    "name": "Tokelau",
    "alpha_2": "TK",
    "alpha_3": "TKL"
  },
  "776": {
    "name": "Tonga",
    "alpha_2": "TO",
    "alpha_3": "TON"
  },
  "780": {
    "name": "Trinidad and Tobago",
    "alpha_2": "TT",
    "alpha_3": "TTO"
  },
  "784": {
    "name": "United Arab Emirates",
    "alpha_2": "AE",
    "alpha_3": "ARE"
  },
  "788": {
    "name": "Tunisia",
    "alpha_2": "TN",
    "alpha_3": "TUN"
  },
  "792": {
    "name": "Turkey",
    "alpha_2": "TR",
    "alpha_3": "TUR"
  },
  "795": {
    "name": "Turkmenistan",
    "alpha_2": "TM",
    "alpha_3": "TKM"
  },
  "796": {
    "name": "Turks and Caicos Islands",
    "alpha_2": "TC",
    "alpha_3": "TCA"
  },
  "798": {
    "name": "Tuvalu",
    "alpha_2": "TV",
    "alpha_3": "TUV"
  },
  "800": {
    "name": "Uganda",
    "alpha_2": "UG",
    "alpha_3": "UGA"
  },
  "804": {
    "name": "Ukraine",
    "alpha_2": "UA",
    "alpha_3": "UKR"
  },
  "807": {
    "name": "North Macedonia",
    "alpha_2": "MK",
    "alpha_3": "MKD"
  },
  "818": {
    "name": "Egypt",
    "alpha_2": "EG",
    "alpha_3": "EGY"
  },
  "826": {
    "name": "United Kingdom of Great Britain and Northern Ireland",
    "alpha_2": "GB",
    "alpha_3": "GBR"
  },
  "831": {
    "name": "Guernsey",
    "alpha_2": "GG",
    "alpha_3": "GGY"
  },
  "832": {
    "name": "Jersey",
    "alpha_2": "JE",
    "alpha_3": "JEY"
  },
  "833": {
    "name": "Isle of Man",
    "alpha_2": "IM",
    "alpha_3": "IMN"
  },
  "834": {
    "name": "Tanzania, United Republic of",
    "alpha_2": "TZ",
    "alpha_3": "TZA"
  },
  "840": {
    "name": "United States of America",
    "alpha_2": "US",
    "alpha_3": "USA"
  },
  "850": {
    "name": "Virgin Islands (U.S.)",
    "alpha_2": "VI",
    "alpha_3": "VIR"
  },
  "854": {
    "name": "Burkina Faso",
    "alpha_2": "BF",
    "alpha_3": "BFA"
  },
  "858": {
    "name": "Uruguay",
    "alpha_2": "UY",
    "alpha_3": "URY"
  },
  "860": {
    "name": "Uzbekistan",
    "alpha_2": "UZ",
    "alpha_3": "UZB"
  },
  "862": {
    "name": "Venezuela (Bolivarian Republic of)",
    "alpha_2": "VE",
    "alpha_3": "VEN"
  },
  "876": {
    "name": "Wallis and Futuna",
    "alpha_2": "WF",
    "alpha_3": "WLF"
  },
  "882": {
    "name": "Samoa",
    "alpha_2": "WS",
    "alpha_3": "WSM"
  },
  "887": {
    "name": "Yemen",
    "alpha_2": "YE",
    "alpha_3": "YEM"
  },
  "894": {
    "name": "Zambia",
    "alpha_2": "ZM",
    "alpha_3": "ZMB"
  },
  "004": {
    "name": "Afghanistan",
    "alpha_2": "AF",
    "alpha_3": "AFG"
  },
  "008": {
    "name": "Albania",
    "alpha_2": "AL",
    "alpha_3": "ALB"
  },
  "012": {
    "name": "Algeria",
    "alpha_2": "DZ",
    "alpha_3": "DZA"
  },
  "016": {
    "name": "American Samoa",
    "alpha_2": "AS",
    "alpha_3": "ASM"
  },
  "020": {
    "name": "Andorra",
    "alpha_2": "AD",
    "alpha_3": "AND"
  },
  "024": {
    "name": "Angola",
    "alpha_2": "AO",
    "alpha_3": "AGO"
  },
  "010": {
    "name": "Antarctica",
    "alpha_2": "AQ",
    "alpha_3": "ATA"
  },
  "028": {
    "name": "Antigua and Barbuda",
    "alpha_2": "AG",
    "alpha_3": "ATG"
  },
  "032": {
    "name": "Argentina",
    "alpha_2": "AR",
    "alpha_3": "ARG"
  },
  "051": {
    "name": "Armenia",
    "alpha_2": "AM",
    "alpha_3": "ARM"
  },
  "036": {
    "name": "Australia",
    "alpha_2": "AU",
    "alpha_3": "AUS"
  },
  "040": {
    "name": "Austria",
    "alpha_2": "AT",
    "alpha_3": "AUT"
  },
  "031": {
    "name": "Azerbaijan",
    "alpha_2": "AZ",
    "alpha_3": "AZE"
  },
  "044": {
    "name": "Bahamas",
    "alpha_2": "BS",
    "alpha_3": "BHS"
  },
  "048": {
    "name": "Bahrain",
    "alpha_2": "BH",
    "alpha_3": "BHR"
  },
  "050": {
    "name": "Bangladesh",
    "alpha_2": "BD",
    "alpha_3": "BGD"
  },
  "052": {
    "name": "Barbados",
    "alpha_2": "BB",
    "alpha_3": "BRB"
  },
  "056": {
    "name": "Belgium",
    "alpha_2": "BE",
    "alpha_3": "BEL"
  },
  "084": {
    "name": "Belize",
    "alpha_2": "BZ",
    "alpha_3": "BLZ"
  },
  "060": {
    "name": "Bermuda",
    "alpha_2": "BM",
    "alpha_3": "BMU"
  },
  "064": {
    "name": "Bhutan",
    "alpha_2": "BT",
    "alpha_3": "BTN"
  },
  "068": {
    "name": "Bolivia (Plurinational State of)",
    "alpha_2": "BO",
    "alpha_3": "BOL"
  },
  "070": {
    "name": "Bosnia and Herzegovina",
    "alpha_2": "BA",
    "alpha_3": "BIH"
  },
  "072": {
    "name": "Botswana",
    "alpha_2": "BW",
    "alpha_3": "BWA"
  },
  "074": {
    "name": "Bouvet Island",
    "alpha_2": "BV",
    "alpha_3": "BVT"
  },
  "076": {
    "name": "Brazil",
    "alpha_2": "BR",
    "alpha_3": "BRA"
  },
  "086": {
    "name": "British Indian Ocean Territory",
    "alpha_2": "IO",
    "alpha_3": "IOT"
  },
  "096": {
    "name": "Brunei Darussalam",
    "alpha_2": "BN",
    "alpha_3": "BRN"
  },
  "090": {
    "name": "Solomon Islands",
    "alpha_2": "SB",
    "alpha_3": "SLB"
  },
  "092": {
    "name": "Virgin Islands (British)",
    "alpha_2": "VG",
    "alpha_3": "VGB"
  }
};
//--------------------------------------------------------------------------------------------------------------------//
