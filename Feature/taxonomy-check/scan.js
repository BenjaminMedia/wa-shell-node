// Args: page, siteID

var request = require("request");
var fs = require('fs');
var drupalsites = JSON.parse(require('fs').readFileSync('../drupalsites.json', 'utf8'));
var startPage = (process.argv[2]) ? process.argv[2] : 1;
var site = (process.argv[3]) ? parseInt(process.argv[3]) : 0;

var scan = {
    tmp: {
        site: site,
        pages: -1,
        errors: 0
    },
    init: function(){
        scan.APIrequest(drupalsites.sites[scan.tmp.site].api.feature,startPage,scan.worker);
    },
    worker: function(body, page){
        
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

                console.log("WARNING - NO CATEGORY FOUND ON THIS FEATURE NODEID: " + body.contents[a].nid);
                scan.tmp.errors++;
                console.log("Total errors found: " + scan.tmp.errors);
            }
            
        }
        //If last page is not reached yet
        if(page < scan.tmp.pages){ 
            console.log(" ");
            scan.APIrequest(drupalsites.sites[scan.tmp.site].api.feature,page++,scan.worker);
        } else {
            //continue to next site
            
            if(site <= drupalsites.sites.length){
                scan.tmp.pages = 0;
                scan.tmp.site = parseInt(scan.tmp.site) + 1;
                scan.APIrequest(drupalsites.sites[scan.tmp.site].api.feature,scan.tmp.pages,scan.worker);
            }
        }
        
    },
    APIrequest: function(url, page, callback){
        //console.log(page);
        
        console.log('----------- Scanning ' + drupalsites.sites[scan.tmp.site].shortname + ', page: ' + page + ' / ' + scan.tmp.pages + ' -----------');
        request({
            url: url + "?page="+page,
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
    },
    iteratePagination: function(page){
        return page++;
    }
}

scan.init();