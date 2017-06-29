//////////////////////////////////////////////////////////////////////

var express = require('express')
  , request = require('request')
  , config  = require('../config')
  ;

//////////////////////////////////////////////////////////////////////

module.exports = function(accounts) {
  var router        = express.Router()
    , currentLocale = config.defaultLocale || 'en'
    ;

  // HTTP GET / : Handle serving the index view based on the currentLocale
  router.get('/', function(req, res) {
    res.setLocale(currentLocale);
    res.render('index', {
      title: config.title,
      accounts: accounts,
      tokenRequired: !!config.inviteToken
    });
  });

  // HTTP POST /invite : Payload {email: <string, required>, community: <string, required>}
  router.post('/invite', function(req, res) {
    if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
      request.post({
          url: 'https://'+ config.slackURL + '/api/users.admin.invite',
          form: {
            email: req.body.email,
            token: config.slackToken,
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
              community: config.community,
              message: 'Success! Check &ldquo;'+ req.body.email +'&rdquo; for an invite from Slack.'
            });
          } else {
            var error = body.error;
            if (error === 'already_invited' || error === 'already_in_team') {
              res.render('result', {
                community: config.community,
                message: 'Success! You were already invited.<br>' +
                         'Visit <a href="https://'+ config.slackURL +'">'+ config.community +'</a>'
              });
              return;
            } else if (error === 'invalid_email') {
              error = 'The email you entered is an invalid email.';
            } else if (error === 'invalid_auth') {
              error = 'Something has gone wrong. Please contact a system administrator.';
            }

            res.render('result', {
              community: config.community,
              message: 'Failed! ' + error,
              isFailed: true
            });
          }
        });
    } else {
      var errMsg = [];
      if (!req.body.email) {
        errMsg.push('your email is required');
      }

      if (!!config.inviteToken) {
        if (!req.body.token) {
          errMsg.push('valid token is required');
        }

        if (req.body.token && req.body.token !== config.inviteToken) {
          errMsg.push('the token you entered is wrong');
        }
      }

      if (accounts.length > 1 && !req.body.community) {
        errMsg.push('no community specified!');
      }

      res.render('result', {
        community: config.community,
        message: 'Failed! ' + errMsg.join(' and ') + '.',
        isFailed: true
      });
    }
  });

  return router;
}

//////////////////////////////////////////////////////////////////////
