import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FormComponent } from '@modules/reports/components/form/form.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'form/:action/:_id', component: FormComponent },
      { path: 'form/:action/:_id/:tabIndex', component: FormComponent },
      
      // Not Found Page (404 Not Found):
      { path: '404', component: NotFoundComponent},
      { path: '**', redirectTo: '/404'},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
