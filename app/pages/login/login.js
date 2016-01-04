import {IonicApp, Page, NavController} from 'ionic/ionic';
import {Icws} from '../../providers/icws';
import {TabsPage} from '../tabs/tabs';
import {SignupPage} from '../signup/signup';


@Page({
  templateUrl: 'build/pages/login/login.html'
})
export class LoginPage {
  constructor(nav: NavController, app: IonicApp, icws: Icws) {
    this.nav = nav;
    this.app = app;
    this.icws = icws;
  }

  login() {
    this.icws.init('ionic test app', 'http://', 'test-windows', '8018', 'vagrant', 'vagrant');
    this.icws.login('vagrant', '1234')
      .then(function(status, response) {
        alert('success:' + status + ':' + response);
      })
      .catch(function(error) {
        alert('error:' + error);
      });
  }

  success(status, response) {
    console.log('Success');
    this.nav.push(TabsPage);
  }

  signup() {
    this.nav.push(SignupPage);
  }
}
