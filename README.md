# wa-shell-node

For installation of required node modules, run

	npm install


##For testing the White Album Shell API

	cd whitealbum
	node shell.js
	
When you see the server is runnig from console - simply visit your browser on http://localhost:5000/ and click a site you want to test.
A browser window should open, making it easy for you to continue.

*Note: You need a file in the root folder named token.json.*

It should contain a single value (basic64 encoded string)

	{
		"basic": "Basic ..." 
	}

It should contain the Base64 encryption of the combined token and secret key - this is required in order to use the shell test script.
It can be found by: node -e "require('crypto').randomBytes(48, function(ex, buf) { console.log(buf.toString('hex')) });".
