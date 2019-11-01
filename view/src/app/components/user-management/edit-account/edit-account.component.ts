import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ManagementService } from 'src/app/services/management.service';
import { ActivatedRoute } from "@angular/router";
import { tick } from '@angular/core/src/render3';



@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.css']
})
export class EditAccountComponent implements OnInit {

  uid; first_name; last_name; organization; username;
  password = '123';
  rePassword = '123';
  errorMsg = '';

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _managementService: ManagementService ) { 
      this._route.params.subscribe( param => {
        this.uid = param.uid 
        this._managementService.getAccount(param.uid)
          .subscribe( res => {
            this.uid = param.uid;
            this.username = res.username;
            this.first_name = res.first_name;
            this.last_name = res.last_name;
            this.organization = res.organization;
          })
      })
    }

  ngOnInit() {
  }

  onSubmit(): void { // Submit file for upload
    // If Title is empty
    if (this.first_name === '' || 
        this.last_name === '' || 
        this.organization === '' ||
        this.username === '' ||
        this.password === '' ||
        this.rePassword === ''  
        ) {
        this.errorMsg = "Missing fields";
    } else { 
        if (!this.checkPassword(this.password, this.rePassword)) {
          this.errorMsg = 'Passwords don\'t match'; // No error
          this.password = '';
          this.rePassword = '';
          return;
        }
        
        this.errorMsg = ''; // No error
        const registerNewUser  = new FormData();
        registerNewUser.append('userid', this.uid);
        registerNewUser.append('first_name', this.first_name);
        registerNewUser.append('last_name', this.last_name);
        registerNewUser.append('organization', this.organization);
        registerNewUser.append('password', this.password);
                
        this._managementService.updateUserData(registerNewUser)
          .subscribe(
            response => {
              console.log('Server response => ', response as any);
            },
            err => {
              console.log('Update failed: ', err.message);
            },
            () => {
              //this.dataSource._updateChangeSubscription();
              this.goBack();
            }
          );
          
    }


  }

  checkPassword (pass1: string, pass2: string ){
    return true 
  }

  goBack() {
    this._router.navigate(['/user-management']);
  }

}
