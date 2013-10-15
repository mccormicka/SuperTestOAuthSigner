'use strict';

var OAuth = require('oauth').OAuth;
var _ = require('lodash');
var request = require('supertest');

exports = module.exports = function SuperTestOAuthSigner(options) {
    options = _.defaults(options || {}, {
        version: '1.0',
        signatureMethod: 'HMAC-SHA1'
    });
    if (!options.consumerKey || !options.consumerSecret || !options.accessKey || !options.accessSecret) {
        throw new Error('You must supply an options object with consumerKey: consumerSecret: accessKey: accessSecret:');
    }
    var oauth = new OAuth(
        null,
        null,
        options.consumerKey,
        options.consumerSecret,
        options.version,
        null,
        options.signatureMethod
    );

    function sign(url, method, data) {
        method = method.toUpperCase();
        var params = oauth._prepareParameters(
            options.accessKey, options.accessSecret, method, url, data);

        var header = oauth._isEcho ? 'X-Verify-Credentials-Authorization' : 'Authorization' ,
            signature = oauth._buildAuthorizationHeaders(params);

        return {header: header, signature: signature};
    }

    function oauthGet(url) {
        return sign(url, 'GET', {});
    }

    function oauthPost(url, data) {
        return sign(url, 'POST', data);
    }

    /**
     * Wrap supertest get/post methods with OAuth Headers.
     */
    return function (express) {
        var wrapped = request(express);
        var originalGet = wrapped.get;
        var originalPost = wrapped.post;

        wrapped.get = function (url) {
            var gotten = originalGet(url);
            var oauthSig = oauthGet(gotten.url);
            return gotten.set(oauthSig.header, oauthSig.signature);
        };

        wrapped.post = function(url, data){
            var posted = originalPost(url, data);
            var oauthSig = oauthPost(url, data);
            return posted.set(oauthSig.header, oauthSig.signature);
        };

        return wrapped;
    };
};