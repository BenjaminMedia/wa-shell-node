// Args: page, siteID

var request = require("request");
var fs = require('fs');
var drupalsites = JSON.parse(require('fs').readFileSync('drupalsites.json', 'utf8'));
var startPage = 1;
var site = 0;


var scan = {
    tmp: {
        site: site,
        pages: -1,
        errors: 0
    },

    init: function(contenttype){//TODO
        scan.APIrequest(drupalsites.sites[scan.tmp.site].api,contenttype,startPage,scan.worker);
    },

    worker: function(body, page, contenttype){//TODO
        
        //Iterate through articles
        for(var a = 0; a < body.contents.length; a++){
            var found = 0;
            //Iterate through taxonomy
            for(t in body.contents[a].taxonomy){
                if(body.contents[a].taxonomy[t].vid == "1"){ 
                    console.log("Category found: " + body.contents[a].taxonomy[t].name); 
                    found = found + 1;
                }
            }
            if(found == 0){
                //log issue to file
                fs.appendFile(
                    'errors\\' +drupalsites.sites[scan.tmp.site].shortname + '.txt', 
                    body.contents[a].nid
                    + ',' + body.contents[a].status
                    + ',' + body.contents[a].language
                    + ',' + body.contents[a].content_path
                    + ',' + page
                    + '\r\n', 
                    function (err) { 
                        if(err){ 
                            console.log('FS error', err) 
                        }; 
                    }
                );
                console.log("WARNING - NO CATEGORY FOUND ON THIS TYPE NODEID: " + body.contents[a].nid);
                scan.tmp.errors++;
                console.log("Total errors found: " + scan.tmp.errors);
            }
        }
        //If last page is not reached yet
        if(page < scan.tmp.pages){ 
            console.log(" ");
            scan.APIrequest(drupalsites.sites[scan.tmp.site].api,contenttype,page++,scan.worker);
        } else {
            //continue to next site
            if(site <= drupalsites.sites.length){
                scan.tmp.pages = 0;
                scan.tmp.site = parseInt(scan.tmp.site) + 1;
                scan.APIrequest(drupalsites.sites[scan.tmp.site].api, contenttype, scan.tmp.pages, scan.worker);
            }
        }
    },

    DoesShortnameExist: function(shortname){
        var sname =  scan.GetAllSites();
        var error = "Shortname "+ shortname + " does not exist. \n"+
                    "To get a list of valid shortnames type 'list sites'. \n"+
                    "To get a list of possible commands delete any arguments.";
        try{
            if (sname.indexOf(shortname) <= -1) throw error;
            if (sname.indexOf(shortname) > -1) return true;
            //else return false;
        }
        catch(err){
            console.log("Error: ", err);
        }
    },

    GetAllSites: function(){
        return drupalsites
                    .sites
                    .map(function(sitelist){ return sitelist['shortname']; });
    },

    ReturnTypeID: function(site,type){ 
        var site = site.toUpperCase();
        var siteId = scan.GetAllSites()
                    .indexOf(site);
        var typeList = drupalsites.sites[siteId].types;
        var id = typeList.indexOf(type);
        var error = type + " does not exist in " + site;

        try{
            //if (id <= -1) return false;
            if (id <= -1) throw error;
            if (id > -1) return id;
        }
        catch(err){
            console.log(err);
            return false;
        }
    },

    APIrequest: function(url, type, page, callback){ //TODO
        
        console.log('----------- Scanning ' + drupalsites.sites[scan.tmp.site].shortname + ', page: ' + page + ' / ' + scan.tmp.pages + ' -----------');
        request({
            url: url + type + ".json?page="+page,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                //If init, then set total page count
                scan.tmp.pages = body.total_pages;
                //setTimeout(function(){callback(body,page)},0);
                callback(body,parseInt(page)+1);
            } else {
                if(response.statusCode === 503){
                    console.log('server timeout, retrying in 1 minute');
                    setTimeout(function(){scan.APIrequest(url,type,page,callback)},60*1000);
                } else {
                    console.log(error);
                }
            }
        })
    }/*,
    iteratePagination: function(page){
        return page++;
    }*/
}

//scan.init();

//***** Helper info *****
//If no arguments are passed - helper text
if(process.argv.length <= 2){
    console.log("Site + content type: e.g. 'tax NAT ngm_article'. \n" +
                "All content types for site: e.g. 'tax NAT'. \n" +
                "List valid content types for site: e.g. 'list NAT'. \n" +
                "List all sites: 'list sites'.");
}
//To get sites or content types listed
else if(process.argv[2] == "list" && process.argv[3]){
    var arg = process.argv[3];
    if (arg == "sites"){
        sites = scan.GetAllSites();
        console.log(sites);
    } 
    else if (scan.DoesShortnameExist(arg.toUpperCase())){
        var id = scan.GetAllSites()
                .indexOf(arg.toUpperCase());
        console.log(drupalsites.sites[id].types);
    }
//Get taxonomy help
}else if (process.argv[2] == "tax" && !process.argv[3]) {
    console.log("All sites and their content types: 'tax all' \n" +
                "All content types for a site: e.g. 'tax NAT' \n");
}else if (process.argv[2] == "tax" && process.argv[3] && !process.argv[4]) {
    var arg = process.argv[3];
    //All the sites
    if (arg == "all"){
    console.log("Fetching taxonomy for all "+ scan.GetAllSites().length + " sites and their content types.");
    console.log(drupalsites.sites[0].types.length);
    
        for (var siteid = 0; siteid < scan.GetAllSites().length; siteid++){
            console.log(drupalsites.sites[siteid].shortname);
            for (var typeid = 0; typeid < drupalsites.sites[siteid].types.length; typeid++){
                console.log(drupalsites.sites[siteid].types[typeid]);
                scan.init(drupalsites.sites[siteid].types[typeid]);
            }
        }
    }
    //Specific site
    else if (scan.GetAllSites().indexOf(arg.toUpperCase()) > -1){
        console.log("Fetching taxonomy for " + arg.toUpperCase() + ".");
    }
    else{
        console.log("Invalid argument. Type 'tax' without other arguments to get a list of possible commands.");
    }
}else if (process.argv[2] == "tax" && process.argv[3] && process.argv[4]){
    //Specific site and type
    if (scan.ReturnTypeID(process.argv[3], process.argv[4])) {
        console.log("Fetching taxonomy for site: " + process.argv[3].toUpperCase() + ", type: " + process.argv[4]);
    }
}
else {
    console.log("Invalid argument. Delete any arguments to get a list of valid arguments.");
}
