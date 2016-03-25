'use strict'; // Enable ES6

// Require modules
var request = 	require("request"),		//Used for http requests
	fs = 		require('fs'),			//Used for filesystem; ex. reading / writing files
	stdio = 	require('stdio');		//Used for command line arguements

// Read the drupal site settings file
var drupalsites = JSON.parse(require('fs').readFileSync('drupalsites.json', 'utf8'));

//Configure available commands for this script
var commands = stdio.getopt({
	'list': {key: 'l', description: 'Lists all available sites'},
	'types': {key: 't', args: 1, description: 'List available content types for a specific site'},
	'clear': {key: 'c', description: 'Removes any existing logfiles'},
	'scan': {key: 's', args: '*', minArgs: 1, maxArgs: 3, description: 'Accepts multiple arguments:\n\n'+
				'<ARG1>: ALL for all sites, or specific by shortname ex. NAT.\n'+
				'<ARG2>: ALL for all content types, or specific machine name ex. ngm_article.\n'+
			 	'<ARG3>: API pagenumber to start from, ex. 30'
			}
	
});

/**
* Scan scope - contains all methods for this script.
*/
var scan = {
	tmp: {
		overwrite: true,
        site: 0,
        pages: -1,
        errors: 0,
		type: 0,
		scanSites: 'ALL',
		scanTypes: 'ALL'
    },
	init: function(){
		//If command is sites, print list of all sites
		if(commands.list){ console.log( this.getAvailableSites() ); }
		
		//If types is listed, check site and return list if exists
		else if(commands.types){ 
			if(commands.types.length > 0){
				console.log( this.getAvailableContentTypes( commands.types.toUpperCase() ) );
			} else {
				commands.printHelp();
			}
		}
		
		//Remove any existing logfiles
		else if(commands.clear){
			scan.removeLogFiles('logs');
			console.log('All logfiles has been cleared')
		}
		
		//If scan is set, launch the API scanning part
		else if(commands.scan && scan.doesSiteExist(commands.scan[0].toUpperCase())){
			
			
			
			//If first argument is set to all, set site to id 0, otherwise define specific site
			if(commands.scan[0] == 'ALL'){
				scan.tmp.site = 0;
				scan.tmp.scanSites = 'ALL';
			} else {
				scan.tmp.scanSites = commands.scan[0];
				scan.tmp.site = scan.getSiteID(commands.scan[0]);	
			}
			
			//If second argument is set to all, set type to id 0, otherwise define specific type
			if(commands.scan[1].toUpperCase() == 'ALL'){
				scan.tmp.type = 0;
				scan.tmp.scanTypes = 'ALL';
			} else {
				scan.tmp.type = scan.getTypeID(scan.getSiteshortname(scan.tmp.site),commands.scan[1]);
				scan.tmp.scanTypes = scan.getContentTypeName(scan.tmp.type,scan.tmp.site);
			}
			
			//If a third argument is set - AND second was set to all - use the third argument for pagination start number
			var page = 1;
			if(typeof commands.scan[2] != undefined && parseInt(commands.scan[2]) > page && commands.scan[1].toLowerCase() != 'all'){
				page = commands.scan[2];
			}
			scan.apiRequest(scan.tmp.site,scan.tmp.type,page,scan.worker);
		}
		
		//If no command was recognized, print help
		else { commands.printHelp(); }
	},
	
	/**
	* Primary worker metod used for callback from apiRequests.
	* @param {Object} body contains the JSON from the api request.
	* @param {Number} page Number of the page iteration.
	* @param {apiCallback} callback.
	*/	
	worker: function(body, page){
		
		//Iterate through articles
        for(var a = 0; a < body.contents.length; a++){

			//Set / reset found counter. Used to detect if node element got the taxonomy
			var found = 0;
			
			//Iterate through the taxonomy objects on the specific node
			for(var t in body.contents[a].taxonomy){
				
				//If category (vid:1) is found, set found variable and print category name
				if(body.contents[a].taxonomy[t].vid == "1"){ 
					scan.print({category:body.contents[a].taxonomy[t].name});
					found = found + 1;
				}
			}

			//If no category was found, log the node to file - and add 1 to the error counter
            if(found == 0){
				scan.logToFile({
					name: scan.getSiteshortname(scan.tmp.site),
					type: scan.getContentTypeName(scan.tmp.site,scan.tmp.type),
					page: page,
					contents: {
						nid: body.contents[a].nid,
						language: body.contents[a].language,
						status:  body.contents[a].status,
						content_path: body.contents[a].content_path
					},
					overwrite: scan.tmp.overwrite
				});
				scan.tmp.overwrite = false;
                scan.tmp.errors++;
            }
        }
		
		//After all node ID's been checked in the response body, write out the aggreated number of errors.
		scan.print({error:'Total errors found:' ,errorMessage:scan.tmp.errors});
		
		
        //If last page is not reached yet, continue to next page
        if(page <= scan.tmp.pages){ 
            scan.apiRequest(scan.tmp.site,scan.tmp.type,page++,scan.worker);
		
		//If last page was reached, decide what to do next
        } else {
			//Allow overwriting of logfiles, and set pagecount to 0. 
			//Dissallow worker to continue as default (may be set to true later)
			scan.tmp.overwrite = true;
			scan.tmp.pages = 0;
			var continueWorker = false;
			
			//If all types where set, and there are additional types in the list - allow worker to continue and increase to next type.
			if(scan.tmp.scanTypes == 'ALL' && scan.tmp.type <= drupalsites.sites[scan.tmp.site].types.length){
                scan.tmp.type = parseInt(scan.tmp.type) + 1;
				continueWorker = true;
				
			//If types where set to a specific - dont allow worker to continue after complition.
			} else if(scan.tmp.scanTypes != 'ALL'){
				continueWorker = false;
			} else {
			
				//If sites where set to all, and the end is not reached yet - increase site id and allow worker to continue to next.
				if(scan.tmp.scanSites == 'ALL' && scan.tmp.site <= drupalsites.sites.length){
					scan.tmp.site = parseInt(scan.tmp.site) + 1;
					continueWorker = true;
				}
			}
			
			//If Worker was allowed to continue - run it again.
			if(continueWorker){
				scan.apiRequest(scan.tmp.site,scan.tmp.type, scan.tmp.pages, scan.worker);
			} else {
				//The succesfull completion of the script has been reached. Congratulations!
				//TODO: Make fireworks :)
			}
        }
	},
	/**
	* Remove exisiting log files from specified directory - Use with care.
	* @param {String} path Directory name with the logfiles
	*/
	removeLogFiles: function(path){
		//Use with care!
		//Accepts a directory path - will iterate through all files in the directory and remove them.
		if( fs.existsSync(path) ) {
			fs.readdirSync(path).forEach(function(file,index){
				var curPath = path + "/" + file;
				if(fs.lstatSync(curPath).isDirectory()) { // recurse
					deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
		}
	},
	
	/**
	* Check if shortname exists in sites.
	* @param {String} shortname A three character shortname ex: NAT
	* @returns {Bolean}
	*/
	doesSiteExist: function(shortname){
		return (scan.getAvailableSites().indexOf(shortname) >= 0) ? true : false;
	},
	
	/**
	* Return array of available sites in shortname format .
	* @returns {Array} EX: ['NAT','KOM'...].
	*/
	getAvailableSites: function(){
		return drupalsites.sites.map(function(arr){ return arr['shortname']; });
	},
	
	/**
	* Return array of available types in machine format.
	* @param {String} shortname A three character shortname ex: NAT
	*/
	getAvailableContentTypes: function(shortname){
		//If site exist return array of content types, in machinename format. EX: ['bp_product','bp_type_test'..]
		if(scan.doesSiteExist(shortname)){
			return drupalsites.sites[scan.getAvailableSites().indexOf(shortname)].types;
			
		//Write an error when the requested site was not found
		} else {
			scan.print({error: `${site} was not found`, errorMessage: 'See --list for available sites'});
		}
	},
	
	/**
	* Returns the shortname of a site based on the site ID.
	* @param {Number} a site ID.
	* @returns {String} Ex 'NAT'.
	*/
	getSiteshortname: function(siteID){
		return drupalsites.sites[siteID].shortname;
	},
	
	/**
	* Returns the machine name of a type based on the type ID.
	* @param {Number} a type ID.
	* @returns {String} Ex 'bp_type_test'.
	*/
	getContentTypeName: function(siteID,typeID){
		return drupalsites.sites[siteID].types[typeID];
	},
	
	/**
	* Returns the ID of a site based on the shortname.
	* @param {String} shortname of the site
	* @returns {Number} the site ID.
	*/
	getSiteID: function(shortname){
		var siteId = scan.getAvailableSites().indexOf(shortname.toUpperCase());
		var error = `${shortname} does not exist in the sitelist`;
		
		try{
            if (siteId <= -1) throw error;
            if (siteId > -1) return siteId;
        }
        catch(err){
            scan.print({error:err,errorMessage:[]});
            return false;
        }
	},
	
	/**
	* Returns the ID of a type based on the site shortname and type machine name.
	* @param {String} shortname Shortname of the site
	* @param {String} type Machine name of the type
	* @returns {Number} the site ID.
	*/
	getTypeID: function(shortname,type){
        var siteId = scan.getSiteID(shortname);
        var siteTypeList = drupalsites.sites[siteId].types;
        var typeId = siteTypeList.indexOf(type);
        var error = `"${type}" does not exist for site: ${shortname}. See --types ${shortname} for available types`;

        try{
            if (typeId <= -1) throw error;
            if (typeId > -1) return typeId;
        }
        catch(err){
            scan.print({error:err,errorMessage:[]});
            return false;
        }
	},
	
	/**
	* Returns response body from http request to callback function.
	* @param {Number} siteID Number.
	* @param {Number} typeID Number.
	* @param {Number} page Number of the page iteration.
	* @param {apiCallback} callback.
	*/	
	apiRequest: function(siteID,typeID,page,callback){		
		
		var apiUrl = drupalsites.sites[siteID].api + drupalsites.sites[siteID].types[typeID] + ".json?page="+page;
		//console.log(apiUrl);
        request({
            url: apiUrl,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                scan.tmp.pages = body.total_pages;
				
				//Print the API request
				scan.print({
					name: scan.getSiteshortname(siteID),
					type: scan.getContentTypeName(siteID,typeID),
					page: page,
					pages: scan.tmp.pages
				});
				
                callback(body,parseInt(page)+1);
				
				
            } else if(error){
				
				//If timeout, retry in one minute, otherwise print out the error message
                if(response.statusCode === 503){
					scan.print({error:'Server timeout, retrying in 1 minute',errormessage:response.statusCode});
                    setTimeout(function(){scan.apiRequest(siteID,type,page,callback)},60*1000);
                } else {
					scan.print({error:`HTTP response status code: ${response.statusCode}`,errormessage:error});
                }
            }
        })
	},
	
	/**
	* Print to console, depending on data within object.
	* @param {Object} obj Conaining name, type, page, pages OR category OR error and errorMessage.
	*/	
	print: function(obj /*containing shortname, content type, page OR category OR error and errorMessage */){
		let str = ``;
		if(obj.name && obj.type && obj.page && obj.pages){
			str = `-------------- Scanning ${obj.name}, type: ${obj.type}, page: ${obj.page} / ${obj.pages} --------------`;
		} else if(obj.category){
			str = `Category found: ${obj.category}`;
		} else if(obj.error && obj.errorMessage){
			str = `Error: ${obj.error} - ${JSON.stringify(obj.errorMessage)}`;
		}
		console.log(str);
	},
	
	/**
	* Write to log files, based on data given in the object.
	* @param {Object} obj Containing name, type, overwrite and contents-object.
	*/	
	logToFile: function(obj /*containing shortname, type, overwrite and contents*/){
		if(obj.name && obj.type){
			var fileName = obj.name + '-' + obj.type + '.csv';
			let logDirectory = 'logs';
			// check if logDirectory exist and create if not (shorthand code)
			fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
			
			//If overwrite is true, and the file exists - delete file and create new
			if(obj.overwrite && fs.existsSync(logDirectory + '\\' + fileName)){
				fs.unlink(logDirectory + '\\' + fileName);
				
				//Add first line to the file in a descriptive format
				fs.appendFile(
					logDirectory+'\\'+fileName,
					'NodeID,Status,Language,Path,API-Page\r\n',
					function(err){
						if(err){
							scan.print({ error: `Appending to ${fileName} gave an error`, errorMessage: err});
						}
					}
				);
			}
			
			fs.appendFile(
				logDirectory+'\\'+fileName,
				`${obj.contents.nid},${obj.contents.status},${obj.contents.language},${obj.contents.content_path},${obj.page}\r\n`,
				function(err){
					if(err){
						scan.print({ error: `Appending to ${fileName} gave an error`, errorMessage: err});
					}
				}
		  	);
		}
		
	}
}

//Initialize this script
scan.init();