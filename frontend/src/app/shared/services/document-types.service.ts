import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentTypesService {
  
  constructor(private i18nService: I18nService) {}

  /**
   * Get translated document types
   */
  getDocumentTypes(): { [key: number]: string } {
    const currentLang = this.i18nService.getCurrentLanguage();
    
    if (currentLang === 'en') {
      return {
        1: this.i18nService.translate('doc_type.national_id'),
        2: this.i18nService.translate('doc_type.passport'),
        3: this.i18nService.translate('doc_type.civic_credential'),
        4: this.i18nService.translate('doc_type.drivers_license'),
        5: this.i18nService.translate('doc_type.residence_permit'),
        6: this.i18nService.translate('doc_type.visa'),
        7: this.i18nService.translate('doc_type.temporary_document'),
        100: this.i18nService.translate('doc_type.anonymous_document')
      };
    } else {
      // Spanish (default)
      return {
        1: this.i18nService.translate('doc_type.national_id'),
        2: this.i18nService.translate('doc_type.passport'),
        3: this.i18nService.translate('doc_type.civic_credential'),
        4: this.i18nService.translate('doc_type.drivers_license'),
        5: this.i18nService.translate('doc_type.residence_permit'),
        6: this.i18nService.translate('doc_type.visa'),
        7: this.i18nService.translate('doc_type.temporary_document'),
        100: this.i18nService.translate('doc_type.anonymous_document')
      };
    }
  }

  /**
   * Get translated user roles
   */
  getUserRoles(): { [key: number]: string } {
    const currentLang = this.i18nService.getCurrentLanguage();
    
    if (currentLang === 'en') {
      return {
        1: this.i18nService.translate('role.superuser'),
        2: this.i18nService.translate('role.administrator'),
        3: this.i18nService.translate('role.supervisor'),
        4: this.i18nService.translate('role.doctor'),
        5: this.i18nService.translate('role.technician'),
        6: this.i18nService.translate('role.nurse'),
        7: this.i18nService.translate('role.coordinator'),
        8: this.i18nService.translate('role.receptionist'),
        9: this.i18nService.translate('role.patient'),
        10: this.i18nService.translate('role.functional')
      };
    } else {
      // Spanish (default)
      return {
        1: this.i18nService.translate('role.superuser'),
        2: this.i18nService.translate('role.administrator'),
        3: this.i18nService.translate('role.supervisor'),
        4: this.i18nService.translate('role.doctor'),
        5: this.i18nService.translate('role.technician'),
        6: this.i18nService.translate('role.nurse'),
        7: this.i18nService.translate('role.coordinator'),
        8: this.i18nService.translate('role.receptionist'),
        9: this.i18nService.translate('role.patient'),
        10: this.i18nService.translate('role.functional')
      };
    }
  }
}
