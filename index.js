'use strict';

var OAuth = require('oauth').OAuth;
var _ = require('lodash');
var request = require('supertest');

exports = module.exports = function SuperTestOAuthSigner(options) {
    options = _.defaults(options || {}, {
        version: '1.0',
        signatureMethod: 'HMAC-SHA1'
    });
    if (!options.consumerKey || !options.consumerSecret) {
        throw new Error('You must supply an options object with consumerKey and consumerSecret');
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

    function sign(url, method, data, key, secret) {
        key = key || options.accessKey;
        secret = secret || options.accessSecret;

        method = method.toUpperCase();
        var params = oauth._prepareParameters(
            key, secret, method, url, data);

        var header = oauth._isEcho ? 'X-Verify-Credentials-Authorization' : 'Authorization' ,
            signature = oauth._buildAuthorizationHeaders(params);

        return {header: header, signature: signature};
    }

    function oauthGet(url, data, key, secret) {
        return sign(url, 'GET', data, key, secret);
    }

    function oauthPost(url, data, key, secret) {
        return sign(url, 'POST', data, key, secret);
    }

    function oauthDel(url, data, key, secret){
        return sign(url, 'DELETE', data, key, secret);
    }

    /**
     * Wrap supertest get/post methods with OAuth Headers.
     */
    return function (express) {
        var wrapped = request(express);
        var originalGet = wrapped.get;
        var originalPost = wrapped.post;
        var originalDelete = wrapped.del;

        wrapped.get = function (url, data, token, secret) {
            var gotten = originalGet(url);
            var oauthSig = oauthGet(gotten.url, data, token, secret);
            return gotten.set(oauthSig.header, oauthSig.signature);
        };

        wrapped.post = function(url, data, token, secret){
            var posted = originalPost(url);
            var oauthSig = oauthPost(posted.url, data, token, secret);
            return posted.set(oauthSig.header, oauthSig.signature);
        };

        wrapped.del = function(url, token, secret){
            var deleted = originalDelete(url);
            var oauthSig = oauthDel(deleted.url, {}, token, secret);
            return deleted.set(oauthSig.header, oauthSig.signature);
        };


        /**
         * 01 - Request Token.
         * Retrieve requesttoken from oauth server.
         * @param url
         * @param data {oauth_callback:'yourcallback'}
         */
        wrapped.requestToken = function(url, data){
            return wrapped.post(url, data);
        };

        /**
         * 02 - Authorize
         * Authorize a request token.
         * @param url
         * @param token
         * @param secret
         * @param scope
         */
        wrapped.authorize = function (url, token, scope){
            url += '?';
            if(scope){
                url += 'scope=' + scope + '&';
            }
            url += 'oauth_token=' + token;
            return wrapped.get(url);
        };

        /**
         * 04 - Access Token
         * @param url
         * @param token
         * @param secret
         * @param verifier
         */
        wrapped.accessToken = function(url, token, secret, verifier){
            return wrapped.post(url, {oauth_verifier:verifier}, token, secret);
        };

        return wrapped;
    };
};