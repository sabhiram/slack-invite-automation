//////////////////////////////////////////////////////////////////////

var express = require('express')
  , request = require('request')
  , _       = require('underscore')._
  , util    = require('util')
  , config  = require('../config')
  ;

//////////////////////////////////////////////////////////////////////

module.exports = function(accounts) {
  var router        = express.Router()
    , currentLocale = config.defaultLocale || 'en'
    , locales       = [
      {code: "en", name: "English"},
      {code: "cs", name: "Czech"},
      {code: "de", name: "German"},
      {code: "es", name: "Spanish"},
      {code: "fr", name: "French"},
      {code: "it", name: "Italian"},
      {code: "ja", name: "Japanese"},
      {code: "ko", name: "Korean"},
      {code: "pl", name: "Polish"},
      {code: "pt-BR", name: "Portuguese-BR"},
      {code: "pt", name: "Portuguese"},
      {code: "ru", name: "Russian"},
      {code: "tr", name: "Turkish"},
      {code: "zh-CN", name: "Cantonese"},
      {code: "zh-TW", name: "Taiwanese"},
    ]
    ;

  ////////////////////////////////////////////////////////////////////
  // HTTP GET / : Handle serving the index view based on the
  //              currentLocale.
  router.get('/', function(req, res) {
    res.setLocale(req.getLocale());
    res.render('index', {
      style: config.styleOverride,
      title: config.title,
      accounts: accounts,
      locales: locales,
      currentLocale: req.getLocale(),
      tokenRequired: !!config.inviteToken
    });
  });

  ////////////////////////////////////////////////////////////////////
  // HTTP GET/lang/:lang : Handle serving a locale based view of the
  //                       index page. If the lang parameter is
  //                       nonsense, the default lang is used.
  router.get('/lang/:lang', function(req, res) {
    res.setLocale(req.params.lang);
    res.render('index', {
      style: config.styleOverride,
      title: config.title,
      accounts: accounts,
      locales: locales,
      currentLocale: req.params.lang,
      tokenRequired: !!config.inviteToken
    });
  });

  ////////////////////////////////////////////////////////////////////
  // HTTP POST /invite
  //    Payload {email: <string, required>, community: <string, required>}
  router.post('/invite', function(req, res) {
    // Check to see that a valid community has been set for this request, if the accounts
    // only include one type, then automatically insert the community into the request.
    if (req.body.community && req.body.community == "") {
      if (accounts.length == 1) {
        req.body.community = accounts[0].community;
      } else {
        res.render('result', {
          community: "MISSING",
          message: "Failed invitation due to unspecified community!<br>",
        });
        return;
      }
    }

    if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
      // Grab the community from the accounts list, if we don't find a match,
      // we bail out!
      var account = _.find(accounts, function(account, idx) {
        return (account.community == req.body.community);
      });
      if (!account) {
        res.render('result', {
          community: req.body.community,
          message: "is not a invite-able community!<br>",
        });
        return;
      }

      request.post({
          url: 'https://'+ account.slackURL + '/api/users.admin.invite',
          form: {
            email: req.body.email,
            token: account.slackToken,
            set_active: true
          }
        }, function(err, httpResponse, body) {
          // body looks like:
          //   {"ok":true}
          //       or
          //   {"ok":false,"error":"already_invited"}
          if (err) { return res.send('Error:' + err); }
          body = JSON.parse(body);
          if (body.ok) {
            res.render('result', {
              community: account.community,
              message: 'Success! Check &ldquo;'+ req.body.email +'&rdquo; for an invite from Slack.'
            });
          } else {
            var error = body.error;
            if (error === 'already_invited' || error === 'already_in_team') {
              res.render('result', {
                community: account.community,
                message: 'Success! You were already invited.<br>' +
                         'Visit <a href="https://'+ account.slackURL +'">'+ account.community +'</a>'
              });
              return;
            } else if (error === 'invalid_email') {
              error = 'The email you entered is an invalid email.';
            } else if (error === 'invalid_auth') {
              error = 'Something has gone wrong. Please contact a system administrator.';
            }

            res.render('result', {
              community: account.community,
              message: 'Failed! ' + error,
              isFailed: true
            });
          }
        });
    } else {
      var errMsg = [];
      // Email validation
      if (!req.body.email) {
        errMsg.push('your email is required');
      }

      // Invite token validation
      if (!!config.inviteToken) {
        if (!req.body.token) {
          errMsg.push('valid token is required');
        }
        if (req.body.token && req.body.token !== config.inviteToken) {
          errMsg.push('the token you entered is wrong');
        }
      }

      // Community validation
      if (accounts.length > 1 && !req.body.community) {
        errMsg.push('no community specified!');
      }

      // Tell the client what's wrong
      res.render('result', {
        community: account.community,
        message: 'Failed! ' + errMsg.join(' and ') + '.',
        isFailed: true
      });
    }
  });

  ////////////////////////////////////////////////////////////////////

  return router;
}

//////////////////////////////////////////////////////////////////////
