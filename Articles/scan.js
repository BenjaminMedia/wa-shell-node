var request = require("request")
var fs = require('fs');
var domain;


var path = require('path');
var dirPath = "download/akrivtraening";  //directory path
var fileType = ".json"; //file extension
var files = [];
var currentFile = (process.argv[2]) ? process.argv[2] : 0;
var success = 0;
var errors = 0;
var maxFile = (process.argv[3]) ? process.argv[3] : 9999999;
var count = 0;

fs.readdir(dirPath, function(err,list){
    if(err) throw err;
    for(var i=0; i<list.length; i++)
    {
        if(path.extname(list[i])===fileType)
        {
            //console.log(list[i]); //print the file
            files.push(list[i]); //store the file name into the array files
        }
    }
    readMyFile(files,currentFile);
    //console.log(files.indexOf('ifo_article_1118.json'));
})


function readMyFile(files,currentFile){
    console.log('+++ Reading file: ' + dirPath + files[currentFile] + ' [' + currentFile + ']'+ ' - Successful: ' + success + ' / Errors: ' + errors);
    fs.readFile(dirPath + files[currentFile], 'utf8', function (err, data) {
        if (err) throw err;
        var file = JSON.parse(data);
        scanUrl(0,file.contents,files,currentFile)
    });
}


function scanUrl(i,obj,files,currentFile){
    //console.log(currentFile);
    if(obj[i] == undefined){
        console.log('WTF');
    }
    //obj = JSON.parse(obj);
    if(obj[i].language == "da-DK"){ domain = "http://iform.dk/"; }
    if(obj[i].language == "sv-SE"){ domain = "http://iform.se/"; }
    if(obj[i].language == "nb-NO"){ domain = "http://iform.nu/"; }
    //if(obj[i].language == "fi-FI"){ domain = "http://kuntoplus.fi/"; }
        
    
    
        request({
            url: domain+obj[i].path
        },function (error, response, body){
            
                        
            try{
                
                

                if(!error && response.statusCode != 200){
                    errors++;
                    console.log('ERROR LOGGED');
                    fs.appendFile('errors.txt', response.statusCode + ',' + obj[i].nid + ',' + domain + obj[i].path + ',\n', function (err) {});
                }
                if (!error && response.statusCode === 200) {
                    success++;
                    //console.log(response.statusCode + ' /' + obj[i].path);
                    //console.log("BODY: " + body)
                } else {
                    //console.log('/' + obj[i].path + ' NOT FOUND - returned http ' + response.statusCode);
                }

                console.log(response.statusCode + ',' + obj[i].nid + ',' + domain + obj[i].path);


                if(i < obj.length-1){
                    setTimeout(function(){
                        i++;
                        scanUrl(i,obj,files,currentFile);    
                    },50)
                } 
            } catch(e){
                console.log('error happened: ' + e)
                setTimeout(function(){
                    console.log('patiently retrying :)')
                    scanUrl(i,obj,files,currentFile);  
                },8000);
            }
    
            if(i >= obj.length-1 && count < maxFile){
                
                currentFile++;
                count++;
                readMyFile(files,currentFile);
            }
        });
    
    
    
}


