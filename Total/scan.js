// Args: page, siteID

var request = require("request");
var fs = require('fs');
var drupalsites = JSON.parse(require('fs').readFileSync('drupalsites.json', 'utf8'));
var startPage = (process.argv[2]) ? process.argv[2] : 1;
var site = (process.argv[3]) ? parseInt(process.argv[3]) : 0;


var scan = {
    tmp: {
        site: site,
        pages: -1,
        errors: 0
    },

    init: function(){//TODO
        scan.APIrequest(drupalsites.sites[scan.tmp.site].api.type[a],startPage,scan.worker);
    },

    worker: function(body, page){//TODO
        
        //Iterate through articles
        for(var a = 0; a < body.contents.length; a++){
            var found = 0;
            //Iterate through taxonomy
            for(t in body.contents[a].taxonomy){
                //console.log(t);
                //var tax = body.contents[a].taxonomy[b];
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
            scan.APIrequest(drupalsites.sites[scan.tmp.site].type[a],page++,scan.worker);
        } else {
            //continue to next site
            
            if(site <= drupalsites.sites.length){
                scan.tmp.pages = 0;
                scan.tmp.site = parseInt(scan.tmp.site) + 1;
                scan.APIrequest(drupalsites.sites[scan.tmp.site].api.type[a],scan.tmp.pages,scan.worker);
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
            else return false;
        }
        catch(err){
            console.log("Error: ", err);
        }
    },

    GetAllSites: function(){
        var sname = drupalsites
                    .sites
                    .map(function(sitelist){ return sitelist['shortname']; });
        return sname;
    },

    ReturnTypeID: function(typeArray,type){ //TODO
        //inArray der tjekker om en given content type eksisterer i et array

        //Hvis denne eksisterer så returner id i array
        //returner false hvis ikke findes
    },

    APIrequest: function(url, page, callback){ //TODO
        
        console.log('----------- Scanning ' + drupalsites.sites[scan.tmp.site].shortname + ', page: ' + page + ' / ' + scan.tmp.pages + ' -----------');
        request({
            url: url + ".json?page="+page,
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
                    setTimeout(function(){scan.APIrequest(url,page,callback)},60*1000);
                } else {
                    console.log(error,response,body);
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
}else if (process.argv[2] == "tax" && process.argv[3]) {
    var arg = process.argv[3];
    //All the sites
    if (arg == "all")
    console.log("Fetching taxonomy for all sites and their content types.");
    //Specific site
    else if (scan.GetAllSites().indexOf(arg.toUpperCase()) > -1){
        console.log("Fetching taxonomy for " + arg.toUpperCase() + ".");
    }
    else{
        console.log("Invalid argument. Type 'tax' without other arguments to get a list of possible commands.");
    }
}
else {
    console.log("Invalid argument. Delete any arguments to get a list of valid arguments.");
}
