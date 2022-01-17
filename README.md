This is Webflow-Automation-cli. A simple tool to export and commit to github from webflow.

to install:<br>
clone project<br>
<code>npm install -g .</code> to install globally<br>
Run by typing "webflow-automation"

usage:<br> 
Just type the project name(lower case and seperated by a -. ex. "ralle-homes")
Then type commit message and hit enter
Thats it!

***Important!***<br>
.env:<br> 
a .env file will need to be created and placed at the root of the project that includes:<br> 
USER_NAME= // this will be your git username<br>
USER_PAT= // this is your github personal access token. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token<br>
USER_EMAIL= // this should be the loggin email for webflow<br>
USER_PASSWORD= // this is the webflow password<br>
GHUB_EMAIL= //github email<br>
GHUB_USERNAME= //github username<br>
