var http = require('http'), 
    fs = require('fs'); 
    var url = require('url'); 
var request = require('request'); 
var parseString = require('xml2js').parseString; 
  
  
/* 
Set MongoDB Database : 
*/
var databaseUrl = "rss";                /*Database Name : rss*/
var collections = ["channel", "item"];  /*Two tables*/
var db = require("mongojs").connect(databaseUrl, collections); 
var RSS_LINK = 'http://www.wikihow.com/feed.rss'; 
  
  
var express = require('express'); 
var app = express(); 
app.set('views', __dirname + '/views'); 
app.engine('jade', require('jade').__express); 
app.engine('html', require('ejs').renderFile); 
app.use("/css",express.static(__dirname + '/css')); 
app.use("/js",express.static(__dirname + '/js')); 
app.use(express.bodyParser()); 
app.use(express.methodOverride()); 
app.use(app.router); 
  
app.get('/', function (req, res) { 
    res.render('index.html'); 
}); 
  
app.get('/load_items', function (req, res) { 
  
    var url_parts = url.parse(req.url,true); 
    var channeltitle = url_parts.query.channel; 
    console.log(channeltitle); 
     getItemsByChannelTitle(function(obj) { 
        res.end(JSON.stringify(obj)); 
    }); 
}); 
  
app.get('/all', function (req, res) { 
    getChannels(function(obj) { 
        res.end(JSON.stringify(obj)); 
    }); 
  
}); 
  
app.get('/add_channel', function (req, res) { 
  
var url_parts = url.parse(req.url,true); 
var rsslink = url_parts.query.channel; 
  
    /*Connect to rss source*/
request(rsslink, function (error, response, body) { 
  
    var contentType = response.headers['content-type']; 
  
        if(!(contentType.indexOf("application/rss+xml")>=0 || contentType.indexOf("text/xml")>=0)) { 
            return; 
        } 
  
  if (!error && response.statusCode == 200) { 
    parseString(body, function (err, result) { 
        var channel = result.rss.channel; 
        var items = result.rss.channel[0].item; 
        save_channel(channel[0]); 
  
    for(var i in items) { 
        save_item(items[i], channel[0].title[0]); 
    } 
  
  
    }); 
  } 
  
}); 
  
  
}); 
  
  
app.listen(3000); 
console.log('Listening on port 3000'); 
  
  
function getChannels(callback) { 
    db.channel.find({}, function(error, rssChannelObj) { 
        if(error || !rssChannelObj || rssChannelObj.length==0) { 
            console.log(error); 
            return; 
        } 
  
        callback(rssChannelObj); 
    }); 
} 
  
function getItemsByChannelTitle(callback) { 
  
    db.item.find({}, function(error, itemObj) { 
         if(error || !itemObj || itemObj.length==0) { 
            console.log(error); 
            return; 
        } 
        callback(itemObj); 
    }); 
} 
  
function save_channel(channel) { 
//console.log(channel); 
db.channel.save({_id: channel.link[0], channel_title: channel.title[0], channel_desc: channel.description[0], rss_link: RSS_LINK, channel_update: channel.lastBuildDate[0], channel_ttl: channel.ttl[0]}, function(err, saved) { 
      if( err || !saved ) console.log("Channel not saved : " + err); 
      else console.log("Channel saved : "+ channel.title[0]); 
    }); 
} 
  
function save_item(item, title) { 
    //console.log(item.content); 
    db.item.save({_id: item.guid[0]['_'], item_link: item.link[0], channel_title: title, item_title: item.title[0], item_desc: item.description[0]}, function(err, saved) { 
      if( err || !saved ) console.log("Link not saved :" + err); 
      else console.log("Item saved : "+ item.title); 
    }); 
}