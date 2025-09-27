import { Injectable } from '@angular/core';
import { I18nService } from '@shared/services/i18n.service';

@Injectable({
  providedIn: 'root'
})
export class FlowStatesService {

  constructor(private i18nService: I18nService) { }

  getAppointmentRequestsFlowStates(): { [key: string]: string } {
    return {
      'AR01': this.i18nService.translate('flow_state.administration'),
      'AR02': this.i18nService.translate('flow_state.retained_administration'),
      'AR03': this.i18nService.translate('flow_state.medical_area'),
      'AR04': this.i18nService.translate('flow_state.retained_medical_area'),
      'AR05': this.i18nService.translate('flow_state.appointment_in_progress'),
      'AR06': this.i18nService.translate('flow_state.appointment_created'),
      'AR07': this.i18nService.translate('flow_state.cancelled')
    };
  }

  getAppointmentsFlowStates(): { [key: string]: string } {
    return {
      'A01': this.i18nService.translate('flow_state.appointment_created')
    };
  }

  getPerformingFlowStates(): { [key: string]: string } {
    return {
      'P01': this.i18nService.translate('flow_state.reception'),
      'P02': this.i18nService.translate('flow_state.interview'),
      'P03': this.i18nService.translate('flow_state.preparation_injection'),
      'P04': this.i18nService.translate('flow_state.acquisition'),
      'P05': this.i18nService.translate('flow_state.image_verification'),
      'P06': this.i18nService.translate('flow_state.to_report'),
      'P07': this.i18nService.translate('flow_state.draft_report'),
      'P08': this.i18nService.translate('flow_state.signed_report'),
      'P09': this.i18nService.translate('flow_state.completed_with_report'),
      'P10': this.i18nService.translate('flow_state.completed_without_report'),
      'P11': this.i18nService.translate('flow_state.cancelled')
    };
  }
}
