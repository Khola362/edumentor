import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router'; 

declare var google: any;
function parseJwt(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

@Component({
  selector: 'app-google-login',
  standalone: true,
  templateUrl: './google-login.component.html',
  styleUrls: ['./google-login.component.css']
})
export class GoogleLoginComponent implements OnInit {

  constructor(
    private ngZone: NgZone,
    private router: Router       
  ) {}

  ngOnInit(): void {
    google.accounts.id.initialize({
      client_id: '359342476310-jh4n5q3csvlg5ff5k34q1e5bcd764m2r.apps.googleusercontent.com',
      callback: (response: any) => this.handleLogin(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      {
        theme: 'outline',
        size: 'large',
        width: 280
      }
    );

    google.accounts.id.disableAutoSelect();
  }

  handleLogin(response: any): void {
  this.ngZone.run(() => {
    const payload = parseJwt(response.credential);

    localStorage.setItem('username', payload.name);

    this.router.navigate(['/dashboard']);
  });
}

}
