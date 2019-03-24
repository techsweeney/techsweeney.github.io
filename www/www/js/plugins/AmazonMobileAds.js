
/* 
* Copyright 2014 Amazon.com,
* Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the
* "License"). You may not use this file except in compliance
* with the License. A copy of the License is located at
*
* http://aws.amazon.com/apache2.0/
*
* or in the "license" file accompanying this file. This file is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
* CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and
* limitations under the License.
*/

var cordova = require('cordova');
var exec = require('cordova/exec');

var AmazonMobileAds = function() {
}
var serviceName = 'AmazonMobileAdsPlugin';
AmazonMobileAds.prototype = {
    listeners : [],
    addListener: function(eventId, listener){
               if (typeof this.listeners[eventId] == "undefined") {
                    this.listeners[eventId] = [];
               }
               
               this.listeners[eventId].push(listener);
               console.log('Listener was added for an event');
    },

    removeListener: function(eventId, listener) {
               if (typeof this.listeners[eventId] != "undefined") {
                    for (var i = this.listeners[eventId].length; i--; ) {
                        if (this.listeners[eventId][i] == listener) {
                            this.listeners[eventId].splice(i, 1);
                        }
                    }
               }
    },

    fire: function(event) {   
               if (typeof event == "string") {
                   event = JSON.parse(event
                           .replace(/\n/g, "\\n")
                           .replace(/\r/g, "\\r")
                           .replace(/\t/g, "\\t")
                           .replace(/\f/g, "\\f"));
                }

                if (!event.eventId) {
                    throw new Error("Event object missing 'eventId' property.");
                }
                console.log('Event received');
                if (this.listeners[event.eventId] instanceof Array) {
                    var listeners = this.listeners[event.eventId];
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        listeners[i].call(this, event);
                    }
                }
    }
};

AmazonMobileAds.prototype.setApplicationKey = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'setApplicationKey', options)
};

AmazonMobileAds.prototype.registerApplication = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'registerApplication', options)
};

AmazonMobileAds.prototype.enableLogging = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'enableLogging', options)
};

AmazonMobileAds.prototype.enableTesting = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'enableTesting', options)
};

AmazonMobileAds.prototype.enableGeoLocation = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'enableGeoLocation', options)
};

AmazonMobileAds.prototype.createFloatingBannerAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'createFloatingBannerAd', options)
};

AmazonMobileAds.prototype.createInterstitialAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'createInterstitialAd', options)
};

AmazonMobileAds.prototype.loadAndShowFloatingBannerAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'loadAndShowFloatingBannerAd', options)
};

AmazonMobileAds.prototype.loadInterstitialAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'loadInterstitialAd', options)
};

AmazonMobileAds.prototype.showInterstitialAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'showInterstitialAd', options)
};

AmazonMobileAds.prototype.closeFloatingBannerAd = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'closeFloatingBannerAd', options)
};

AmazonMobileAds.prototype.isInterstitialAdReady = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'isInterstitialAdReady', options)
};

AmazonMobileAds.prototype.areAdsEqual = function(successCallback, errorCallback, options) {
    exec(successCallback, errorCallback, serviceName, 'areAdsEqual', options)
};

AmazonMobileAds.prototype.AdType = {
FLOATING:'FLOATING',
INTERSTITIAL:'INTERSTITIAL'
}

AmazonMobileAds.prototype.Dock = {
TOP:'TOP',
BOTTOM:'BOTTOM'
}

AmazonMobileAds.prototype.HorizontalAlign = {
LEFT:'LEFT',
CENTER:'CENTER',
RIGHT:'RIGHT'
}

AmazonMobileAds.prototype.AdFit = {
FIT_SCREEN_WIDTH:'FIT_SCREEN_WIDTH',
FIT_AD_SIZE:'FIT_AD_SIZE'
}

module.exports = new AmazonMobileAds();

