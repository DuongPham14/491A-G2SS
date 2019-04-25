import { Component, OnInit } from '@angular/core';

// Begin manually added code
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { Subscription } from 'rxjs';
// End manually added code

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private router: Router, private loginService: LoginService) { }

  // For login
  username: string;
  password: string;

  ngOnInit() { }

  // Login function used when the Login button is clicked.
  login(): void {
    this.loginService.login({
      username: this.username,
      password: this.password,
    }).subscribe(
      (data: any) => {
        const message = data.message;
        if (message === 'Authentication successful') {
          console.log(message);
          this.router.navigate(["main"]);
        } else {
          alert(message);
        }
      },
      (_) => {
        alert('Invalid credentials');
      },
    );
  }
}
