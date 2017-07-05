//////////////////////////////////////////////////////////////////////

var express      = require('express')
  , path         = require('path')
  , fs           = require('fs')
  , yaml         = require('js-yaml')
  , favicon      = require('serve-favicon')
  , logger       = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser   = require('body-parser')
  , config       = require('./config')
  , i18n         = require("i18n")
  ;

 /////////////////////////////////////////////////////////////////////

// Application context variables (holds all slack accounts we want to
// serve). `accounts' is a list of all possible slack accounts.
var accounts   = []
  ;

// If the configuration has been setup to host multiple slack accounts
// then the config.yamlFile property will be set. If this is set, set-
// up the object of slack accounts that we can possibly invite folks
// to.
if (config.yamlFile === null) {
    // Default behavior, the only account used is the one setup from
    // the config.js file. This is legacy behavior.
    accounts = [
        {
            community: config.community,
            slackURL: config.slackURL,
            slackToken: config.slackToken,
            inviteToken: config.inviteToken,
        },
    ];
} else {
    // yaml file specified, this means that we can load multiple slack
    // accounts from the file.
    if (fs.existsSync(config.yamlFile)) {
        accounts = yaml.safeLoad(fs.readFileSync(config.yamlFile, 'utf8'));
    } else {
        console.error('invalid yaml file specified!');
        process.exit(1);
    }
}

//////////////////////////////////////////////////////////////////////

// Application route handling.
var routes = require('./routes/index')(accounts)
  , app = express()
  ;

i18n.configure({
    defaultLocale: config.defaultLocale,
    directory: __dirname + '/locales',
    autoReload: true
});

// default: using 'accept-language' header to guess language settings
app.use(i18n.init);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//////////////////////////////////////////////////////////////////////

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//////////////////////////////////////////////////////////////////////

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

//////////////////////////////////////////////////////////////////////

module.exports = app;

//////////////////////////////////////////////////////////////////////
