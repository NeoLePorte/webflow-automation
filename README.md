This is Webflow-Automation-cli. A simple tool to export and commit to github from webflow.

to install: 
clone project
npm install . -g  to install globally
Run by typing "webflow-automation"

usage: 
Just type the project name(lower case and seperated by a -. ex. "ralle-homes")
Then type commit message and hit enter
Thats it!

.env: 
a .env file will need to be created and placed at the root of the project that includes: 
USER_NAME= // this will be your git username
USER_PAT= // this is your github personal access token. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
USER_EMAIL= // this should be the loggin email for webflow
USER_PASSWORD= // this is the webflow password
GHUB_EMAIL= //github email
GHUB_USERNAME= //github username
