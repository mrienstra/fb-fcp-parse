var settings = {
  fbAppId: '',
  parse: {
    appId: '',
    jsKey: ''
  },
  fbInitialPermissions: [
    'basic_info', 'email', 'user_likes'
    // Asking for "'publish_actions', 'publish_stream'" using fcp (iOS Simulator)
    // throws an error: "You can only ask for read permissions initially"
  ],
  log: {
    toDOM: true,
    showAlert: true,
    toConsole: true
  }
};



/* Remote: FB, facebookConnectPlugin, Parse */

var remote = {
  fb: {
    getLoginStatus: function(){
      log('remote.fb.getLoginStatus: Calling FB.init / FB.getLoginStatus');
 
      FB.init({
        appId: settings.fbAppId,
        status: true
      });

      FB.getLoginStatus(remote.fb.getLoginStatusCallback);
    },
    getLoginStatusCallback: function (response) {
        log('FB.getLoginStatus:', response);

      if (response.status === 'connected') {
        remote.parse.loginWithFBAuthResponse(response.authResponse);
      } else {
        showFBLoginButton(remote.fb.login);
      }
    },
    login: function(){
      FB.login(
        remote.fb.loginCallback,
        {scope: fbInitialPermissions.join(',')}
      );
    },
    loginCallback: function (response) {
      log('remote.fbloginCallback:', response);

      if (response.status === 'connected') {
        remote.parse.loginWithFBAuthResponse(response.authResponse);
      } else {
        log('Game over!');
      }
    },
  },
  fcp: {
    getLoginStatus: function(){
      log('remote.fcp.getLoginStatus: Calling facebookConnectPlugin.getLoginStatus');

      facebookConnectPlugin.getLoginStatus(this.getLoginStatusCallback);
    },
    getLoginStatusCallback: function (response) {
      log('remote.fcp.getLoginStatus:', response);
      if (response.status === 'connected') {
        remote.parse.loginWithFBAuthResponse(response.authResponse);
      } else {
        showFBLoginButton(remote.fcp.login);
      }
    },
    login: function(){
      facebookConnectPlugin.login(
        fbInitialPermissions,
        remote.fb.loginCallback, // Done with `fcp`-specific code, switching to `fb`
        remote.fcp.loginFailureCallback // Todo: this is not being called in iOS Simulator!
      );
    },
    loginFailureCallback: function(){
      log('remote.fcp.loginFailureCallback:', arguments);
    },
  },
  parse: {
    init: function(){
      Parse.initialize(settings.parse.appId, settings.parse.jsKey);
    },
    loginWithFBAuthResponse: function (authResponse) {
      remote.parse.init();

      var myExpDate = new Date();
      myExpDate.setMonth(myExpDate.getMonth() + 2);
      myExpDate = myExpDate.toISOString();

      var facebookAuthData = {
        'id': authResponse.userID,
        'access_token': authResponse.accessToken,
        'expiration_date': myExpDate
      }

      Parse.FacebookUtils.logIn(facebookAuthData, {
        success: function(_user) {
          log('User is logged into Parse!');
        },
        error: function(){
          log('Unable to create/login to Parse as Facebook user:', arguments);
        }
      });
    },
  }
};

var app = {
  initialize: function() {
    if (!settings.fbAppId || !settings.parse.appId || !settings.parse.jsKey) {
      log('You must add your app settings (Facebook app ID, Parse app ID, Parse JS key) to `js/index.js`!');
      return;
    }

    if (window.cordova) {
      document.addEventListener('deviceready', this.onDeviceReady, false);
    } else {
      if (window.FB) {
        remote.fb.getLoginStatus();
      } else {
        window.fbAsyncInit = remote.fb.getLoginStatus;
      }
    }
  },
  onDeviceReady: function() {
    if (window.cordova.logger) {
      window.cordova.logger.__onDeviceReady();
    }

    remote.fcp.getLoginStatus();
  }
};

var showFBLoginButton = function (handleLogin) {
  var fbLoginButton = document.getElementById('fbLogin');
  fbLoginButton.setAttribute('style', 'display:block;');
  fbLoginButton.addEventListener('click', handleLogin);
};



/* Logging */

var logEl = document.getElementById('log');

var log = function(){
  if (settings.log.toDOM && logEl) {
    var li = document.createElement('li');
    [].forEach.call(
      arguments,
      function (v) {
        var a = document.createElement('a');
        if (typeof v === 'object') {
          v = JSON.stringify(v);
          a.classList.add('logToggle');
          a.setAttribute('data-logToggle', v);
          v = '[object]';
        }
        a.textContent = v;
        li.appendChild(a);
      }
    );
    logEl.appendChild(li);
  }

  if (settings.log.showAlert) {
    alert([].reduce.call(
      arguments,
      function (p, c) {
        if (typeof c === 'object') {
          c = JSON.stringify(c);
        }
        return p + ' ' + c;
      },
      ''
    ));
  }

  if (settings.log.toConsole && window.console && console.log) {
    console.log.apply(console, arguments);
  }
};

handleLogToggleClick = function (e) {
  var node = e.target;

  if (node.classList.contains('logToggle')) {
    e.preventDefault();
    var newContent = node.getAttribute('data-logToggle');
    var oldContent = node.textContent;
    node.setAttribute('data-logToggle', oldContent);
    node.textContent = newContent || '[object]';
  }
};
document.addEventListener('click', handleLogToggleClick);