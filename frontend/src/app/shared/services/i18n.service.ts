import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

// Import locale data
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';

//--------------------------------------------------------------------------------------------------------------------//
// IMPORTS:
//--------------------------------------------------------------------------------------------------------------------//
import { SharedPropertiesService } from '@shared/services/shared-properties.service';   // Shared Properties
//--------------------------------------------------------------------------------------------------------------------//

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  
  // Available languages
  public readonly languages: Language[] = [
    { code: 'es', name: 'Español', flag: 'es' },
    { code: 'en', name: 'English', flag: 'us' }
  ];
  
  // Current language subject
  private currentLanguageSubject = new BehaviorSubject<string>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  
  // Translations object
  private translations: { [key: string]: { [key: string]: string } } = {};
  
  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private sharedProp: SharedPropertiesService
  ) {
    // Register locale data
    registerLocaleData(localeEs, 'es');
    registerLocaleData(localeEn, 'en');
    
    // Load translations
    this.loadTranslations();
  }
  
  /**
   * Initialize language from runtime configuration
   */
  initializeLanguage(): void {
    const configLanguage = this.sharedProp.mainSettings?.appSettings?.language || 'es';
    this.setLanguage(configLanguage);
  }
  
  /**
   * Set current language
   */
  setLanguage(languageCode: string): void {
    if (this.languages.find(lang => lang.code === languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      
      // Store in localStorage for persistence
      localStorage.setItem('sirius_language', languageCode);
    }
  }
  
  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }
  
  /**
   * Get language name by code
   */
  getLanguageName(code: string): string {
    const language = this.languages.find(lang => lang.code === code);
    return language ? language.name : code;
  }
  
  /**
   * Get language flag by code
   */
  getLanguageFlag(code: string): string {
    const language = this.languages.find(lang => lang.code === code);
    return language ? language.flag : 'us';
  }
  
  /**
   * Translate a key
   */
  translate(key: string, params?: { [key: string]: any }): string {
    const currentLang = this.getCurrentLanguage();
    let translation = this.translations[currentLang]?.[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }
    
    return translation;
  }
  
  /**
   * Get translations for current language
   */
  getTranslations(): { [key: string]: string } {
    const currentLang = this.getCurrentLanguage();
    return this.translations[currentLang] || {};
  }
  
  /**
   * Load translation files
   */
  private loadTranslations(): void {
    // Spanish translations
    this.translations['es'] = {
      // Common
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.add': 'Agregar',
      'common.search': 'Buscar',
      'common.loading': 'Cargando...',
      'common.yes': 'Sí',
      'common.no': 'No',
      'common.close': 'Cerrar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.submit': 'Enviar',
      'common.reset': 'Restablecer',
      'common.select': 'Seleccionar',
      'common.actions': 'Acciones',
      'common.date': 'Fecha',
      'common.time': 'Hora',
      'common.name': 'Nombre',
      'common.description': 'Descripción',
      'common.status': 'Estado',
      'common.settings': 'Configuración',
      'common.language': 'Idioma',
      
      // Authentication
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión',
      'auth.username': 'Usuario',
      'auth.password': 'Contraseña',
      'auth.document': 'Documento',
      'auth.enter_document': 'Ingrese su documento',
      'auth.enter_password': 'Ingrese su contraseña',
      'auth.document_country': 'País del documento',
      'auth.document_type': 'Tipo de documento',
      'auth.remember_me': 'Recordarme',
      'auth.forgot_password': 'Olvidé mi contraseña',
      
      // Document Types
      'doc_type.national_id': 'ID Nacional (DNI, CI, CURP, RUT)',
      'doc_type.passport': 'Pasaporte',
      'doc_type.civic_credential': 'Credencial cívica',
      'doc_type.drivers_license': 'Licencia de conducir',
      'doc_type.residence_permit': 'Permiso de residencia',
      'doc_type.visa': 'Visa',
      'doc_type.temporary_document': 'Documento transitorio',
      'doc_type.anonymous_document': 'Documento anónimo',

      // User Roles
      'role.superuser': 'Superusuario',
      'role.administrator': 'Administrador',
      'role.supervisor': 'Supervisor',
      'role.doctor': 'Médico',
      'role.technician': 'Técnico',
      'role.nurse': 'Enfermero',
      'role.coordinator': 'Coordinador',
      'role.receptionist': 'Recepcionista',
      'role.patient': 'Paciente',
      'role.functional': 'Funcional',

      // Navigation
      'nav.main_menu': 'Menú principal',
      'nav.coordination': 'Coordinación',
      'nav.requests': 'Solicitudes',
      'nav.slots': 'Turnos',
      'nav.appointments': 'Citas',
      'nav.calendar': 'Calendario',
      'nav.reception': 'Recepción',
      'nav.receptions': 'Recepciones',
      'nav.realization': 'Realización',
      'nav.studies': 'Estudios',
      'nav.advanced_functions': 'Funciones avanzadas',
      'nav.advanced_search': 'Búsqueda avanzada',
      'nav.statistics': 'Estadística',
      'nav.medical_locker': 'Casillero médico',
      'nav.billing': 'Facturación',
      'nav.administrator': 'Administrador',
      'nav.system_configuration': 'Configuración de sistema',
      'nav.study_results': 'Resultado de estudios',
      'nav.dashboard': 'Escritorio',
      'nav.patients': 'Pacientes',
      'nav.reports': 'Informes',
      'nav.administration': 'Administración',
      'nav.performing': 'Realizando',
      'nav.check_in': 'Check-In',

      // Welcome Page
      'welcome.title': 'Bienvenidos a Sirius RIS',
      'welcome.about': 'Acerca de',
      'welcome.description': 'Sirius RIS es un sistema de información radiológica de código abierto que fué desarrollado gracias a las siguientes tecnologías.',
      'welcome.help': 'Ayuda',
      'welcome.documentation': 'Documentación oficial en GitHub & DockerHub',
      'welcome.support': 'Servicio de soporte oficial',
      'welcome.features.simple': 'Simple, eficiente y rápido',
      'welcome.features.robust': 'Robusto, seguro y auditable',
      'welcome.features.interface': 'Interfaz opaca para respetar ambientes radiológicos',
      'welcome.features.identification': 'Identificación inequivoca de personas | ISO-3166 | UNAOID/ICAO v1.0',
      'welcome.features.privileges': 'Sistema de privilegios escalables para usuarios',
      
      // Messages
      'message.success': 'Operación exitosa',
      'message.error': 'Ha ocurrido un error',
      'message.warning': 'Advertencia',
      'message.info': 'Información',
      'message.confirm_delete': '¿Está seguro de que desea eliminar este elemento?',
      
      // System
      'system.configuration': 'Configuración del sistema',
      'system.user_settings': 'Configuración de usuario',
      'system.language_settings': 'Configuración de idioma'
    };
    
    // English translations
    this.translations['en'] = {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.submit': 'Submit',
      'common.reset': 'Reset',
      'common.select': 'Select',
      'common.actions': 'Actions',
      'common.date': 'Date',
      'common.time': 'Time',
      'common.name': 'Name',
      'common.description': 'Description',
      'common.status': 'Status',
      'common.settings': 'Settings',
      'common.language': 'Language',
      
      // Authentication
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.document': 'Document',
      'auth.enter_document': 'Enter your document',
      'auth.enter_password': 'Enter your password',
      'auth.document_country': 'Document Country',
      'auth.document_type': 'Document Type',
      'auth.remember_me': 'Remember me',
      'auth.forgot_password': 'Forgot password',
      
      // Document Types
      'doc_type.national_id': 'National ID (DNI, CI, CURP, RUT)',
      'doc_type.passport': 'Passport',
      'doc_type.civic_credential': 'Civic Credential',
      'doc_type.drivers_license': 'Driver\'s License',
      'doc_type.residence_permit': 'Residence Permit',
      'doc_type.visa': 'Visa',
      'doc_type.temporary_document': 'Temporary Document',
      'doc_type.anonymous_document': 'Anonymous Document',

      // User Roles
      'role.superuser': 'Superuser',
      'role.administrator': 'Administrator',
      'role.supervisor': 'Supervisor',
      'role.doctor': 'Doctor',
      'role.technician': 'Technician',
      'role.nurse': 'Nurse',
      'role.coordinator': 'Coordinator',
      'role.receptionist': 'Receptionist',
      'role.patient': 'Patient',
      'role.functional': 'Functional',

      // Navigation
      'nav.main_menu': 'Main Menu',
      'nav.coordination': 'Coordination',
      'nav.requests': 'Requests',
      'nav.slots': 'Slots',
      'nav.appointments': 'Appointments',
      'nav.calendar': 'Calendar',
      'nav.reception': 'Reception',
      'nav.receptions': 'Receptions',
      'nav.realization': 'Realization',
      'nav.studies': 'Studies',
      'nav.advanced_functions': 'Advanced Functions',
      'nav.advanced_search': 'Advanced Search',
      'nav.statistics': 'Statistics',
      'nav.medical_locker': 'Medical Locker',
      'nav.billing': 'Billing',
      'nav.administrator': 'Administrator',
      'nav.system_configuration': 'System Configuration',
      'nav.study_results': 'Study Results',
      'nav.dashboard': 'Dashboard',
      'nav.patients': 'Patients',
      'nav.reports': 'Reports',
      'nav.administration': 'Administration',
      'nav.performing': 'Performing',
      'nav.check_in': 'Check-In',

      // Welcome Page
      'welcome.title': 'Welcome to Sirius RIS',
      'welcome.about': 'About',
      'welcome.description': 'Sirius RIS is an open-source radiological information system that was developed thanks to the following technologies.',
      'welcome.help': 'Help',
      'welcome.documentation': 'Official documentation on GitHub & DockerHub',
      'welcome.support': 'Official support service',
      'welcome.features.simple': 'Simple, efficient and fast',
      'welcome.features.robust': 'Robust, secure and auditable',
      'welcome.features.interface': 'Opaque interface to respect radiological environments',
      'welcome.features.identification': 'Unequivocal identification of people | ISO-3166 | UNAOID/ICAO v1.0',
      'welcome.features.privileges': 'Scalable privilege system for users',
      
      // Messages
      'message.success': 'Operation successful',
      'message.error': 'An error has occurred',
      'message.warning': 'Warning',
      'message.info': 'Information',
      'message.confirm_delete': 'Are you sure you want to delete this item?',
      
      // System
      'system.configuration': 'System Configuration',
      'system.user_settings': 'User Settings',
      'system.language_settings': 'Language Settings'
    };
  }
}
