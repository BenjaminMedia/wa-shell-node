var request = require("request")
var fs = require('fs');

//var url = "http://old.iform.dk/bp_api/v1/contents/contents/ifo_article.json";
var url = "http://aktivtraening.dk/bp_api/v1/contents/contents/article.json";
var brand = "aktivtraening";


var count = (process.argv[2]) ? process.argv[2] : 1;
var totalPages = 1;
//var maxCount = 10;






function callUrl(){
    request({
        url: url + "?page="+count,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //console.log(body) // Print the json response
            totalPages = body.total_pages;
            //console.log(totalPages);
            fs.writeFile("download/" + brand + "/article_" + count + ".json", JSON.stringify(body),function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("article_" + count + ".json saved");
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