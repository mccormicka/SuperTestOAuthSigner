'use strict';

describe('SHOULD', function () {

    var express = require('express');
    var oauthSigner = require('../index')(
        {
            consumerKey: '$2a$04$x2jefs5s63LvWzU9i.pReOhXuTqrIopguZgad6g9BUZbOrDuVdVom',
            consumerSecret: '$2a$04$x2jefs5s63LvWzU9i.pReOKDGTFptcIFt2OLp5HS68VnlWYVJSmMW',
            accessKey: '$2a$04$7c0KPLpXDjDVsRhqs2MTw.iOjwVI/SrZ.3ST2yqr/5LBSwhvnWH42',
            accessSecret: '$2a$04$7c0KPLpXDjDVsRhqs2MTw.AR22oIHvfrmWL.hALyeJo0h8gq4gItG'
        }
    );
    var app;
    beforeEach(function () {
        app = express();
    });

    it('Be able to acquire index', function () {
        var test = require('../index');
        expect(test).not.toBeNull();
    });

    it('Be able to perform a get request with signed headers', function (done) {
        var signed = oauthSigner(app)
            .get('/api/v1/resource');
        expect(signed.req._headers.authorization).toBeDefined();
        expect(signed.req._headers.authorization).toContain('oauth_consumer_key="%242a%2404%24x2jefs5s63LvWzU9i.pReOhXuTqrIopguZgad6g9BUZbOrDuVdVom"');
        expect(signed.req._headers.authorization).toContain('oauth_token="%242a%2404%247c0KPLpXDjDVsRhqs2MTw.iOjwVI%2FSrZ.3ST2yqr%2F5LBSwhvnWH42"');
        done();
    });

});