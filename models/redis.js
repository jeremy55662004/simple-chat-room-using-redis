var redis = require('redis'),
	uuid = require('node-uuid'),
	poolModule = require('generic-pool');

var pool = poolModule.Pool({
	name : 'redisPool',
	create: function(callback){
		var client = redis.createClient();
		callback(null, client);
	},
	destroy : function(client){
		client.quit();
	},
	max: 100,
	min: 5,
	idleTimeoutMillis: 30000,
	log: true
});

function throwOneBottle(bottle, callback){
	bottle.time = bottle.time || Date.now();
	var bottleId = uuid.v4();
	var type = {male: 0, female: 1};
	pool.acquire(function (err, client){
		if (err){
			return callback({code: 0, msg:err});
		}

		client.SELECT(type[bottle.type], function(){
			client.HMSET(bottleId, bottle, function (err, result){
				if (err){
					return callback({code: 0, msg: "Try again later !"});
				}

				client.EXPIRE(bottleId, 86400000 + bottle.time - Date.now(), function(){
					pool.release(client);
				});

				callback({code: 1, msg: result});
			});
		});
	});
}

exports.throw = function (bottle, callback){
	checkThrowTimes(bottle.owner, function (result){
		if(result.code === 0){
			return callback(result);
		}
		throwOneBottle(bottle, function(result){
			callback(result);
		});
	});
}

function pickOneBottle(info, callback){
	
	var type = {all: Math.round(Math.random()), male: 0, female: 1};
	info.type = info.type || 'all';            //choose first one

	pool.acquire(function (err, client){
		if(err){
			return callback({code:0, msg: err});
		}

		client.SELECT(type[info.type], function(){
			client.RANDOMKEY(function (err, bottleId){
				if(!bottleId){
					return callback({code: 0, msg: "Starfish"});
				}

				client.HGETALL(bottleId, function (err,bottle){
					if(err){
						return callback({code: 0, msg: "Water ballon is damage !"});
					}
					client.DEL(bottleId, function(){
						pool.release(client);
					});

					callback({code: 1, msg: bottle});
				});
			});
		});
	});
}

exports.pick = function (info, callback){

	checkPickTimes(info.user, function(result){
		if (result.code === 0){
			return callback(result);
		}

		if(Math.random() <= 0.2){
			return callback({code:1, msg:"Starfish"});
		}

		pickOneBottle(info, function(result){
			callback(result);
		});
	});
}

function checkThrowTimes(owner, callback){
	pool.acquire(function (err, client){
		if(err){
			return callback({code: 0, msg: err});
		}

		client.SELECT(2, function(){
			client.GET(owner, function(err,result){
				if (result >= 10){
					return callback({code: 0, msg: "You have no changes to throw bottles !"});
				}

				client.INCR(owner, function(){
					client.TTL(owner, function (err, ttl){
						if(ttl === -1){
							client.EXPIRE(owner, 86400, function(){
								pool.release(client);
							});
						} else {
							pool.release(client);
						}
						callback({code: 1, msg: ttl});
					});
				});
			});
		});
	});
}

function checkPickTimes(owner, callback){
	pool.acquire(function (err, client){
		if(err){
			return callback({code: 0, msg: err});
		}

		client.SELECT(3, function(){
			client.GET(owner, function(err,result){
				if (result >= 10){
					return callback({code: 0, msg: "You have no changes to pick bottles !"});
				}

				client.INCR(owner, function(){
					client.TTL(owner, function (err, ttl){
						if(ttl === -1){
							client.EXPIRE(owner, 86400, function(){
								pool.release(client);
							});
						} else {
							pool.release(client);
						}
						callback({code: 1, msg: ttl});
					});
				});
			});
		});
	});
}