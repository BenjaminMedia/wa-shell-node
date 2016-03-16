var request = require("request")
var fs = require('fs');
var readline = require('readline');
var errorList = [];

var nodeList = fs.readFileSync('errors-nodeids-no-dupes.txt').toString().split(/\r?\n/);
//var nodeList = [4,18,33,43,45,47,48,51,110,112,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,147,148,149,150,151,152,153,154,156,177,178,179,186,216,217,218,219,220,221,222,223,224,225,226,245,246,258,262,304,324,328,355,377,402,414,415,422,424,425,428,429,430,433,449,450,469,472,478,487,503,504,519,529,530,531,532,533,534,535,540,541,546,547,548,549,553,554,555,556,557,558,559,560,565,577,578,582,587,590,591,600,601,608,636,638,639,642,651,652,653,655,656,660,670,671,672,673,674,675,679,680,681,688,689,691,692,694,700,701,702,703,706,716,717,729,751,752,755,756,757,759,778,779,780,783,785,786,787,788,801,805,806,817,837,840,841,842,844,854,855,856,857,858,859,861,863,864,865,866,868,869,878,879,880,936,937,938,939,944,945,946,952,959,961,976,977,980,989,990]

//console.log(nodeList);
var currentNode = (process.argv[2]) ? process.argv[2] : 0;

function downloadNode(id){
    request({
        url: "http://old.iform.dk/bp_api/v1/contents/node/" + nodeList[id] + ".json",
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if(body.status == "1"){
                fs.writeFile("download/nodes/" + nodeList[id] + ".json", JSON.stringify(body),function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log(nodeList[id] + ".json saved " + id);
                    if(id < nodeList.length -1){
                        setTimeout(function(){
                            id++;
                            downloadNode(id);    
                        },50)

                    }

                }); 
            } else {
                console.log('Node: ' + nodeList[id] + ' is unpublished, skipping node...');
                if(id < nodeList.length -1){
                    setTimeout(function(){
                        id++;
                        downloadNode(id);    
                    },50)

                }
            }
        } else {
            console.log(error);
            errorList.push(nodeList[id]);
            setTimeout(function(){
                id++;
                downloadNode(id);    
            },50)
        }
        if(id >= nodeList.length -1){
            console.log(JSON.stringify(errorList));
        }
    })
}

downloadNode(currentNode);

/*
var rd = readline.createInterface({
    input: fs.createReadStream('errors-nodeids-no-dupes.txt'),
    output: process.stdout,
    terminal: false
});

rd.on('line', function(line) {
    
    request({
        url: "http://old.iform.dk/bp_api/v1/contents/node/" + line + ".json",
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            fs.writeFile("download/nodes/" + line + ".json", JSON.stringify(body),function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log(line + ".json saved");

            }); 
        } else {
            console.log(error);
        }
    })
    
});
*/


/*

function callUrl(){
    request({
        url: url + "?page="+count,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //console.log(body) // Print the json response
            totalPages = body.total_pages;
            //console.log(totalPages);
            fs.writeFile("download/nodes/" + count + ".json", JSON.stringify(body),function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("ifo_article_" + count + ".json saved");
                if(count <= totalPages){
                    count++;
                    callUrl();
                }

            }); 
        } else {
            console.log(error,respose,body);
        }
    })
}

callUrl();
*/

//var fs = require('fs');
/*
var path = require('path');
var dirPath = "download/";  //directory path
var fileType = ".json"; //file extension
var files = [];
fs.readdir(dirPath, function(err,list){
    if(err) throw err;
    for(var i=0; i<list.length; i++)
    {
        if(path.extname(list[i])===fileType)
        {
            console.log(list[i]); //print the file
            files.push(list[i]); //store the file name into the array files
        }
    }
});*/