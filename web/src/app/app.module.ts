// Start of default Angular imports
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { LoginComponent } from './components/login/login.component';
import { MainComponent } from './components/main/main.component';
import { DeleteConfirmationComponent } from './components/main/upload-details/delete-confirmation.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
// End of Default Angular imports

// Manually added this Angular import - for routing.
import { RouterModule, Routes } from '@angular/router';

// Manually added for making HTTP requests
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { InOutInterceptor } from './inout.interceptor';

import { GuardService } from './guard/guard.service';

// Imports Angular Material
import { CustomMaterialModule } from './material.module';

// Imports for Main Page
import { FileSizePipe } from "src/app/services/filesize.pipe";

// Manually added HTTP provider
import { AuthenticationService } from './services/authentication.service';
import { UploadformComponent } from './components/main/uploadform/uploadform.component';
import { HeaderComponent } from './components/main/header/header.component';
import { UploadDetailsComponent } from './components/main/upload-details/upload-details.component';
import { CreateAccountComponent } from './components/user-management/create-account/create-account.component';
import { EditAccountComponent } from './components/user-management/edit-account/edit-account.component';
import { CountdownComponent } from './components/login/countdown.component';
import { DeleteUserConfirmationComponent } from './components/user-management/edit-account/delete-user-confirmation.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

/**
 * Manually added
 * Added the routing configuration as an array of Routes.
 * Uses the factory method RouterModule.forRoot to hand over our routing config.
 * Connects a URL extension (like 'login') to a component (LoginComponent).
 */
const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'main', component: MainComponent, canActivate: [GuardService], data: { role: ['user','admin']} },
  { path: 'user-management', component: UserManagementComponent, canActivate: [GuardService], data: {role: ['admin']} },
  //{ path: 'create-account', component: CreateAccountComponent, canActivate: [GuardService], data: {role: ['admin']}  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Display Login first when navigating to root
  { path: 'edit-account/:uid', component: EditAccountComponent, canActivate: [GuardService], data: {role: ['admin']}  },

  { path: '**', redirectTo: '/login' },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    DeleteConfirmationComponent,
    DeleteUserConfirmationComponent,
    UserManagementComponent,
    UploadformComponent,
    HeaderComponent,
    UploadDetailsComponent,
    CreateAccountComponent,
    EditAccountComponent,
    CountdownComponent,
    FileSizePipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    /**
     * Manually added
     * To activate the routing configuration for the Angular app.
     */
    RouterModule.forRoot(
      appRoutes,
      //{ enableTracing: true } // <-- debugging purposes only
    ),

    // Manually added - used in app.component.html
    // MatToolbarModule,

    // For login page
    CustomMaterialModule,
    FormsModule,

    // For login service
    HttpClientModule,

    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  // For Delete Confirmation on Main Page
  entryComponents: [DeleteConfirmationComponent, DeleteUserConfirmationComponent, CreateAccountComponent, EditAccountComponent, UploadformComponent],

  providers: [AuthenticationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InOutInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],

})
export class AppModule { }