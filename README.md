# API-tools

For installation of required node modules, run

	npm install

##For scanning the drupal API for taxonomy issues

	cd drupal
	node run.js

You can add additional commands for the drupal api tool:

	USAGE \drupal\node run.js [OPTION] ... arg1 arg2...
	The following options are supported:                       
		-l, --list                    Lists all available sites
		-t, --types <ARG1>            List available content types for a specific site   
		-c, --clear                   Removes any existing logfiles
		-s, --scan <ARG1>...<ARGN>    Accepts multiple arguments:
			<ARG1>: ALL for all sites, or specific by shortname ex. NAT.
			<ARG2>: ALL for all content types, or specific machine name ex. ngm_article.
			<ARG3>: API pagenumber to start from, ex. 30

If any missing taxonomy is found, it will be logged to a CSV file within a (new, if doesn't exist) folder named logs. There will be created one file for each content type and brand.

*Note: You need to have your IP adress whitelisted on each drupal site (brandwise, not domain) - otherwise you cannot access API.*

---

##For testing the White Album Shell API

	cd whitealbum
	node shell.js
	
When you see the server is runnig from console - simply visit your browser on http://127.0.0.1/ and click a site you want to test.
A browser window should open, making it easy for you to continue.

*Note: You need a file in the whitealbum folder named token.json.*

It should contain a single value

	{
		"basic": "Basic ..." 
	}

It should contain the Base64 encryption of the combined token and secret key - this is required in order to use the shell test script.
It can be found by: node -e "require('crypto').randomBytes(48, function(ex, buf) { console.log(buf.toString('hex')) });".
