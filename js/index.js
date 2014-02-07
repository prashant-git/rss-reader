var request = require("request");
var xml2js = require('xml2js');
var mongojs = require("mongojs");
var express = require('express');
var app = express();
var db = mongojs.connect('rssreader', ['rssfeeditems','rssfeed']);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

setInterval(refreshRSSData,1800000);

function refreshRSSData() {
    getAllRSSFeed(function(rssFeedObj) {
        rssFeedObj.forEach(function(rssFeed) {
            makeRSSRequest(rssFeed.rssLink);
        });
    });
}

function getAllRSSFeed(callback) {
    db.rssfeed.find({}, function(error, rssFeedObj) {
        if(error || !rssFeedObj || rssFeedObj.length==0) {
            console.log(error);
            return;
        }

        callback(rssFeedObj);
    });
}

function makeRSSRequest(rssLink) {
    console.log(rssLink);

    request(rssLink, function(error, response, body) {
        if(error) {
            console.log(error);
            return;
        }

        var contentType = response.headers['content-type'];
        console.log(contentType);

        if(!(contentType.indexOf("application/rss+xml")>=0 || contentType.indexOf("text/xml")>=0)) {
            return;
        }

        xml2js.parseString(body, {explicitArray:false}, function (error, rssDocumentObj) {
            if(error) {
                console.log(error);
                return;
            }

            if(!rssDocumentObj) {
                return;
            }

            saveFeed(rssDocumentObj, rssLink);
            saveFeedItems(rssDocumentObj);
        });
    });
}

function mongoDefaultHandler(error, dbObject) {
    if(error) {
        console.log("DB error " + error);
    }
}

function saveFeedItems(rssDocumentObj) {
    console.log("rssDocumentObj.rss.channel.item " + rssDocumentObj.rss.channel.item);

    if(!rssDocumentObj.rss.channel.item) {
        return;
    }

    rssDocumentObj.rss.channel.item = rssDocumentObj.rss.channel.item.map(
        function(thisItem) {
            thisItem.rssId = rssDocumentObj.rss.channel.link;
            thisItem._id = thisItem.link;
            return thisItem;
        }
    );

    rssDocumentObj.rss.channel.item.forEach(function(thisItem) {
        db.rssfeeditems.save(thisItem);
    });
}

function saveFeed(rssDocumentObj, rssLink) {
    db.rssfeed.find({_id:rssDocumentObj.rss.channel.link},function(err,found) {
        if(err || !found || found.length==0) {
            db.rssfeed.save({_id:rssDocumentObj.rss.channel.link,
                title:rssDocumentObj.rss.channel.title,
                description:rssDocumentObj.rss.channel.description,
                copyright:rssDocumentObj.rss.channel.copyright,
                language:rssDocumentObj.rss.channel.language,
                lastBuildDate:rssDocumentObj.rss.channel.lastBuildDate,
                ttl:rssDocumentObj.rss.channel.ttl,
                rssLink:rssLink,
                image:rssDocumentObj.rss.channel.image}, mongoDefaultHandler);
        }
    });
}

function getFeedItems(filter, callback) {
    db.rssfeeditems.find(filter, function(error,rssFeedItems) {
        if(error || !rssFeedItems || rssFeedItems.length==0) {
            console.log(error);
            return;
        }

        callback(rssFeedItems);
    });
}

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

server.listen(3000);

io.sockets.on('connection', function (socket) {
    getAllRSSFeed(function(rssFeedObj) {
        socket.emit('getFeeds', rssFeedObj);
    });

    socket.on('addSub', function (rssLink) {
        makeRSSRequest(rssLink);
    });

    socket.on('getFeedItems', function (feedId) {
        getFeedItems({rssId:feedId}, function(rssFeedItems) {
            socket.emit('feedItems', rssFeedItems);
        });
    });
});