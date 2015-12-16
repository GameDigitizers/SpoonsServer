(function() {

var CastPlayer = function() {
  console.log("made it to constructor");
  this.initializeCastPlayer();
};


CastPlayer.prototype.initializeCastPlayer = function() {

  if (!chrome.cast || !chrome.cast.isAvailable) {
    setTimeout(this.initializeCastPlayer.bind(this), 1000);
    return;
  }
  // default set to the default media receiver app ID
  // optional: you may change it to point to your own
  //var applicationID = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
  var applicationID = 'C5A43FAE';

  // auto join policy can be one of the following three
  var autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;
  //var autoJoinPolicy = chrome.cast.AutoJoinPolicy.PAGE_SCOPED;
  //var autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;

  // request session
  var sessionRequest = new chrome.cast.SessionRequest(applicationID);
  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    this.sessionListener.bind(this),
    this.receiverListener.bind(this),
    autoJoinPolicy);

  console.log('initializing castiness');
  chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.onError.bind(this));

};

// Callbacks for ApiConfig (sessionListener also a launch callback)
CastPlayer.prototype.sessionListener = function(e) {
  this.session = e;
  console.log('this has happened to the session', this.session);

  if (this.session) {
    console.log("adding update listener to session");
    this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
  }
};

CastPlayer.prototype.receiverListener = function(e) {
  console.log('receiverListener this happend', e);
  if( e === 'available' ) {
    // this.receivers_available = true;
    // this.updateMediaControlUI();
    console.log("receiver found");
  }
  else {
    console.log("receiver list empty");
  }
};

// Callbacks to chrome.cast.initialize
CastPlayer.prototype.onInitSuccess = function() {
  console.log("success initializing cast device");
  // this.updateMediaControlUI();
};


CastPlayer.prototype.onError = function() {
  console.log("error finding a cast device around here");
};


// Added once we get a session from ApiConfig callback
CastPlayer.prototype.sessionUpdateListener = function(isAlive) {
    console.log('sessionUpdateListener:', isAlive)
};



/**
 * Requests that a receiver application session be created or joined. By default, the SessionRequest
 * passed to the API at initialization time is used; this may be overridden by passing a different
 * session request in opt_sessionRequest. 
 */
CastPlayer.prototype.launchApp = function() {
  console.log("launching app...");
  chrome.cast.requestSession(
    this.sessionListener.bind(this),
    this.onLaunchError.bind(this));
};

// Launch callbacks
CastPlayer.prototype.onLaunchError = function() {
  console.log("launch error");
};


window.CastPlayer = CastPlayer;

})();