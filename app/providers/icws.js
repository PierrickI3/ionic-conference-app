import {Injectable} from 'angular2/core';
import {HTTP_PROVIDERS, Http, Headers, Request, RequestMethod} from 'angular2/http';
import {IcwsData} from './icws-data';


@Injectable()
export class Icws {

  constructor(http: Http, icwsData: IcwsData) {

    // inject the Http provider and set to this instance
    this.http = http;
    this.icwsData = icwsData;

    this.ICWS = {
      applicationName: 'ICWS Node Module',
      URI_SCHEME: 'http://',
      URI_SERVER: 'localhost', // IC Server hostname or IP
      URI_PORT: '8018',
      URI_PATH: '/icws',
      PULL_MESSAGES_TIMEOUT: 2000,
      baseURI: function () {
          return this.URI_SCHEME + this.URI_SERVER + ':' + this.URI_PORT;
      },
      REQUEST_TIMEOUT_MS: 60000,
      MEDIA_TYPE: 'application/vnd.inin.icws+JSON',
      MEDIA_CHARSET: 'charset=utf-8',
    }

    this.ICWS.URL = {
      UserActivations: '/activations/users', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/activations/users/(userId)/index.htm#resource
      ImageResources: '/configuration/image-resources', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/image-resources/index.htm#resource
      Layouts: '/configuration/layouts', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/layouts/index.htm#resource
      Positions: '/configuration/positions', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/positions/(id)/index.htm#resource
      Users: '/configuration/users', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/users/(id)/index.htm#resource
      StatusMessages: '/status/status-messages', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/status-messages/(id)/index.htm#resource
      UserStatuses: '/status/user-statuses', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/status/user-statuses/(userId)/index.htm#resource
      Interactions: '/interactions/', // https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/interactions/Interactions.htm#application
      StructuredParameters: '/configuration/structured-parameters', //https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/structured-parameters
      ServerParameters: '/configuration/server-parameters', //https:developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/configuration/server-parameters
      Messages: '/messaging/messages', //https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/messaging/messages
      Connection: '/connection', //https://developer.inin.com/documentation/Documents/ICWS/WebHelp/icws/(sessionId)/connection/Connection.htm
    }
  }

  init(applicationName, uriScheme, server, port) {
    this.ICWS.applicationName = applicationName;
    this.ICWS.URI_SCHEME = uriScheme;
    this.ICWS.URI_SERVER = server;
    this.ICWS.URI_PORT = port;
    this.ICWS.connected = false;

    // return new Promise(resolve => {
    //   // We're using Angular Http provider to request the data,
    //   // then on the response it'll map the JSON data to a parsed JS object.
    //   // Next we process the data and resolve the promise with the new data.
    //   this.http.get(this.ICWS.baseURI() + this.ICWS.URI_PATH + this.ICWS.URL.Connection)
    //     .subscribe(res => {
    //       // we've got back the raw data, now generate the core schedule data
    //       // and save the data for later reference
    //       this.data = this.processData(res.json());
    //       resolve(this.data);
    //     }, error => {
    //       console.error('Error with http.get:', JSON.stringify(error));
    //     });
    // });
  }

  query(method, requestPath, payload) {
    var ICWS = this.ICWS;
    var http = this.http;
    return new Promise(function(resolve, reject) {
      console.debug('Query:' + method + ' ' + requestPath);

      // Validate parameters
      if (!method)
      {
        console.error('Missing method');
        reject(Error('Missing method'));
      }

      if (!requestPath)
      {
        console.error('Missing requestPath');
        reject(Error('Missing requestPath'));
      }

      // Already connected?
      var connected = ICWS.csrfToken ? true: false;
      console.debug('Connected? ' + connected);

      var headers = {};

      // URI and Headers
      var uri = ICWS.URI_PATH;
      if (connected) {
        headers['ININ-ICWS-CSRF-Token'] = ICWS.csrfToken;
        headers['ININ-ICWS-Session-ID'] = ICWS.sessionId;
        headers['Cookie'] = ICWS.cookie;
        uri += '/' + ICWS.sessionId;
      }
      else {
        headers['Accept-Language'] = 'en';
      }
      if (requestPath.substring(0, 1) !== '/') {
        uri += '/';
      }
      uri += requestPath;

      // Convert payload to string if JSON was sent
      if(typeof payload !== 'string' && !(payload instanceof String)) {
        payload = JSON.stringify(payload);
      }

      // Payload headers
      if (payload) {
        headers['Content-Type'] = ICWS.MEDIA_TYPE + ';' + ICWS.MEDIA_CHARSET;
        headers['Content-Length'] = payload.length;
      }

      // Build request
      var request = new Request({
        url: ICWS.URI_SCHEME + ICWS.URI_SERVER + ':' + ICWS.URI_PORT + uri,
        method: method,
        headers: headers,
        body: payload,
        withCredentials: false
      });
      console.debug('Request:' + JSON.stringify(request));

      // We're using Angular Http provider to request the data,
      // Next we process the data and resolve the promise with the new data.
      http.request(request)
      .subscribe(res => {
        //this.data = this.processData(res.json());
        resolve(res);
      }, error => {
        console.error('Query Error:', error);
        if (error._body.type === 'error') {
          reject('Unknown server');
        } else {
          reject(JSON.stringify(error));
        }
      });
    });
  }

  resolveold(data, successcallback, errorcallback) {
    console.log('status:', data.status);
    console.debug('headers:', JSON.stringify(data.headers));

    switch (data.status) {
      case 200: // OK
        console.debug('Ok');
        //TODO Could be a DNS lookup issue
        if (successcallback) {
          successcallback(data.status, data.message);
        }
        break;
      case 201: // Created
        console.debug('Connected');
        this.ICWS.sessionId = data.sessionId;
        this.ICWS.csrfToken = data.csrfToken;
        this.ICWS.cookie = data.headers['Set-Cookie'];
        this.ICWS.URI_SERVER = data.icServer;

        if (successcallback) {
          successcallback(data.status, 'Connected');
        }
        break;
      case 400: // Bad Request
        console.error('Bad request. Please check your credentials and server name.', data.message);
        if (errorcallback) {
          errorcallback(400, 'Bad request. Please check your credentials.');
        }
        break;
      case 401: // Authentication Failure
        console.error('Authentication Failure. Please check your credentials and server name.', data.message);
        if (errorcallback) {
          errorcallback(401, 'Authentication Failure. Please check your credentials.');
        }
        break;
      case 404: // Not found
        console.error('Not found. Please check your server name.', data.message);
        if (errorcallback) {
          errorcallback(404, 'Not Found');
        }
        break;
      case 410: // Gone
        console.error('Resource is gone. Please check your credentials and server name.', data.message);
        if (errorcallback) {
          errorcallback(410, 'Resource is gone');
        }
        break;
      case 500: // Internal Server Error
        console.error('Internal Server Error. Please check your credentials and server name.', data.message);
        if (errorcallback) {
          errorcallback(500, 'Internal Server Error');
        }
        break;
      case 503: // Service unavailable
        if (!gotBackup(data)) {
          // No switchover
          console.error('Connection Error: 503. No other servers found.');
          if (errorcallback) {
            errorcallback(503, 'No other servers found');
          }
        }
        else {
          if (response.hasOwnProperty('alternateHostList')) {
            console.warn('Connection failed. Trying alternate hosts');
            //TODO To test and improve
            // Connect to the alternate hosts in the order they are listed
            // for(alternateHost of response.alternateHostList) {
            //   ICWS.URI_SERVER = alternateHost;
            //   login(userID, password, function(alternateResponse) {
            //     if (gotBackup(alternateResponse)) {
            //       return; // Try next server
            //     }
            //     else {
            //     }
            //   });
            // }
          }
          else {
            // No alternate hosts
            console.error('Connection Error: 503. No other servers found.');
            if (errorcallback) {
              errorcallback(503, 'No other servers found');
            }
          }
        }
        break;
      case 599: // Network Connect Timeout Error
        console.error('Network Connect Timeout Error. Please check your server name.', data.message);
        if (errorcallback) {
          errorcallback(599, 'Network Connect Timeout Error');
        }
        break;
        case 600: // Socket Hang Up
          console.error('Socket Hang Up. Not sure why.');
          if (errorcallback) {
            errorcallback(600, 'Socket Hang Up');
          }
          break;
      default:
        console.error('Unknown error code:', data.status);
    }
  }

  login(username, password) {
    // Validate parameters
    if (!username) {
      console.error('Missing username');
      reject(Error('Missing username'));
    }

    if (!password) {
      console.error('Missing password');
      reject(Error('Missing password'));
    }

    var payload = {
      "__type": "urn:inin.com:connection:icAuthConnectionRequestSettings",
      "applicationName": this.ICWS.applicationName,
      "userID": username,
      "password": password
    }

    console.debug('Connecting to CIC');
    return this.query('POST', this.ICWS.URL.Connection, payload);
  }

  processData(data) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions

    data.tracks = [];

    // loop through each day in the schedule
    data.schedule.forEach(day => {
      // loop through each timeline group in the day
      day.groups.forEach(group => {
        // loop through each session in the timeline group
        group.sessions.forEach(session => {
          this.processSession(data, session);
        });
      });
    });

    return data;
  }

  processSession(data, session) {
    // loop through each speaker and load the speaker data
    // using the speaker name as the key
    session.speakers = [];
    if (session.speakerNames) {
      session.speakerNames.forEach(speakerName => {
        let speaker = data.speakers.find(s => s.name === speakerName);
        if (speaker) {
          session.speakers.push(speaker);
          speaker.sessions = speaker.sessions || [];
          speaker.sessions.push(session);
        }
      });
    }

    if (session.tracks) {
      session.tracks.forEach(track => {
        if (data.tracks.indexOf(track) < 0) {
          data.tracks.push(track);
        }
      });
    }
  }

  getTimeline(dayIndex, queryText='', excludeTracks=[], segment='all') {
    return this.load().then(data => {
      let day = data.schedule[dayIndex];
      day.shownSessions = 0;

      queryText = queryText.toLowerCase().replace(/,|\.|-/g,' ');
      let queryWords = queryText.split(' ').filter(w => w.trim().length);

      day.groups.forEach(group => {
        group.hide = true;

        group.sessions.forEach(session => {
          // check if this session should show or not
          this.filterSession(session, queryWords, excludeTracks, segment);

          if (!session.hide) {
            // if this session is not hidden then this group should show
            group.hide = false;
            day.shownSessions++;
          }
        });

      });

      return day;
    });
  }

  filterSession(session, queryWords, excludeTracks, segment) {

    let matchesQueryText = false;
    if (queryWords.length) {
      // of any query word is in the session name than it passes the query test
      queryWords.forEach(queryWord => {
        if (session.name.toLowerCase().indexOf(queryWord) > -1) {
          matchesQueryText = true;
        }
      });
    } else {
      // if there are no query words then this session passes the query test
      matchesQueryText = true;
    }

    // if any of the sessions tracks are not in the
    // exclude tracks then this session passes the track test
    let matchesTracks = false;
    session.tracks.forEach(trackName => {
      if (excludeTracks.indexOf(trackName) === -1) {
        matchesTracks = true;
      }
    });

    // if the segement is 'favorites', but session is not a user favorite
    // then this session does not pass the segment test
    let matchesSegment = false;
    if (segment === 'favorites') {
      if (this.user.hasFavorite(session.name)) {
        matchesSegment = true;
      }
    } else {
      matchesSegment = true;
    }

    // all tests must be true if it should not be hidden
    session.hide = !(matchesQueryText && matchesTracks && matchesSegment);
  }

  getSpeakers() {
    return this.load().then(data => {
      return data.speakers.sort((a, b) => {
        let aName = a.name.split(' ').pop();
        let bName = b.name.split(' ').pop();
        return aName.localeCompare(bName);
      });
    });
  }

  getTracks() {
    return this.load().then(data => {
      return data.tracks.sort();
    });
  }

  getMap() {
    return this.load().then(data => {
      return data.map;
    });
  }

}
