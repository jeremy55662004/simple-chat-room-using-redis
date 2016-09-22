var redis = require('redis'),
	client = redis.createClient();

exports.throw = function(bottle, callback){
	bottle.time = bottle.time || Date.now();
	var bottleId = Math.random().toString(16);
	var type = {male: 0, female: 1};

	client.SELECT(type[bottle.type], function(){
		client.HMSET(bottleId, bottle, function (err, result){
			if (err){
				return callback({code: 0, msg: "Try again later !"});
			}

			callback({code: 1, msg: result});
			client.EXPIRE(bottleId, 86400);
		});
	});
}

exports.pick = function (info, callback){
	
	if (Math.random() <= 0.2){
		return callback({code: 0, msg: "Starfish"});
	}


	var type = {all: Math.round(Math.random()), male: 0, female: 1};
	info.type = info.type || 'all';            //choose first one

	client.SELECT(type[info.type], function(){
		client.RANDOMKEY(function (err, bottleId){
			if(!bottleId){
				return callback({code: 0, msg: "Starfish"});
			}

			client.HGETALL(bottleId, function (err,bottle){
				if(err){
					return callback({code: 0, msg: "Water ballon is damage !"});
				}
				callback({code: 1, msg: bottle});
				client.DEL(bottleId);
			});
		});
	});
}