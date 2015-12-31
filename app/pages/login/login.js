import {IonicApp, Page, NavController} from 'ionic/ionic';
import {Icws} from '../../providers/icws';
import {IcwsData} from '../../providers/icws-data';
import {TabsPage} from '../tabs/tabs';
import {SignupPage} from '../signup/signup';


@Page({
  templateUrl: 'build/pages/login/login.html',
  providers: [Icws, IcwsData]
})
export class LoginPage {
  constructor(nav: NavController, app: IonicApp, icws: Icws, icwsData: IcwsData) {
    this.nav = nav;
    this.app = app;
    this.icws = icws;
    this.icwsData = icwsData;
  }

  login() {
    this.icws.init('ionic test app', 'http://', 'test-windows', '8018', 'vagrant', 'vagrant');
    this.icws.login('vagrant', '1234', this.loginsuccess, this.loginerror);
  }

  loginsuccess(status, response) {
    this.nav.push(TabsPage);
  }

  loginerror(status, message) {
    alert(status + ':' + message);
  }

  signup() {
    this.nav.push(SignupPage);
  }
}
