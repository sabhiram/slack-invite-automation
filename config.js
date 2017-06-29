module.exports = {

  // setup the default locale to whatever is set in the environment,
  // default will be English (en).
  defaultLocale: process.env.LOCALE || "en",

  // Set the title for the home page by overriding this value.
  title: process.env.TITLE || "Join YOUR-TEAM-NAME slack!",

  // an optional security measure - if it is set, then that token will be required to get invited.
  inviteToken: process.env.INVITE_TOKEN || null,

  //////////////////////////////////////////////////////////////////////

  // Either ...

  // If yamlFile exists, it will be used in place of this config to build
  // the list of sub-slacks that we support (per locale as well as slack
  // type (dev / marketing / trading etc)).
  // NOTE: If `yamlFile' is defined, the system will ignore all options defined
  //       after this one.
  yamlFile: process.env.YAML_FILE || null,

  // Or ...

  // your community or team name to display on join page.
  community: process.env.COMMUNITY_NAME || 'YOUR-TEAM-NAME',

  // your slack team url (ex: socketio.slack.com)
  slackURL: process.env.SLACK_URL || 'YOUR-TEAM.slack.com',

  // access token of slack
  // You can generate it in https://api.slack.com/web#auth
  // You should generate the token in admin user, not owner.
  // If you generate the token in owner user, missing_scope error will be occurred.
  //
  // You can test your token via curl:
  //   curl -X POST 'https://YOUR-SLACK-TEAM.slack.com/api/users.admin.invite' \
  //   --data 'email=EMAIL&token=TOKEN&set_active=true' \
  //   --compressed
  slackToken: process.env.SLACK_TOKEN || 'YOUR-ACCESS-TOKEN',

  //////////////////////////////////////////////////////////////////////
};
