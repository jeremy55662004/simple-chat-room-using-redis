var express = require('express');
var redis = require('./models/redis.js');
var bodyParser = require('body-parser');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

//Post owner=xxx&type=xxx&content=xxx[&time=xxx]
app.post('/', function (req, res){
	if(!(req.body.owner && req.body.type && req.body.content)){
		if (["male", "female", "all"].indexOf(req.body.type) === -1){
			return res.json({code: 0, msg: "Type error"});
		}
			return res.json({code: 0, msg: "Information is not complete"});
	}
	redis.throw(req.body, function (result){
		res.json(result);
	});
});

//GET /?user=xxx[&type=xxx]
app.get('/', function (req, res){
	if(!req.query.user){
		return res.json({code: 0, msg: "Information is not complete"});
	}
	if (["male", "female", "all"].indexOf(req.query.type) === -1){
		return res.json({code: 0, msg: "Type error"});
	}
	redis.pick(req.query, function (result){
		res.json(result);
	});
});

app.listen(3000, function (){
	console.log('Express server listening on port 3000');
});