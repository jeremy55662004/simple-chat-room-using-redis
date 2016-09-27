var express = require('express');
var redis = require('./models/redis.js');
var bodyParser = require('body-parser');
var mongodb = require('./models/mongodb.js');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

//Post owner=xxx&type=xxx&content=xxx[&time=xxx]
app.post('/', function (req, res){
	if(!(req.body.owner && req.body.type && req.body.content)){
		return res.json({code: 0, msg: "Information is not complete"});
	}
	if (req.body.type && (["male", "female"].indexOf(req.body.type) === -1)){
		return res.json({code: 0, msg: "Type error"});
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
	if (req.query.type && (["male", "female", "all"].indexOf(req.query.type) === -1)){
		return res.json({code: 0, msg: "Type error"});
	}
	redis.pick(req.query, function (result){
		if (result.code === 1){
			mongodb.save(req.query.user, result.msg, function (err){
				if(err){
					return res.json({code: 0, msg: "Fail, please try again"});
				}
				return res.json(result);
			});
		}
		else{
			res.json(result);
		}
	});
});

//POST owner=xxx&type=xxx&content=xxx&time=xxx
app.post('/back', function(req, res){
	redis.throwBack(req.body, function (result){
		res.json(result);
	});
});

app.get('/user/:user', function(req, res){
	mongodb.getAll(req.params.user, function (result){
		res.json(result);
	});
});

app.get('/bottle/:_id', function (req,res){
	mongodb.getOne(req.params._id, function (result){
		res.json(result);
	});
});

app.post('/reply/:_id', function (req, res){
	if(!(req.body.user && req.body.content)){
		res.json({code: 0, msg: "Reply information is not complete !"});
	}
	mongodb.reply(req.params._id, req.body, function (result){
		res.json(result);
	});
});

app.get('/delete/:_id', function (req, res){
	mongodb.delete(req.params._id, function (result){
		res.json(result);
	});
});

app.listen(3000, function (){
	console.log('Express server listening on port 3000');
});