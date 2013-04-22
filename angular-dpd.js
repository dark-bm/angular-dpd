angular.module('dpd',[]).value('dpdConfig',[]).factory('dpd',function($http, $rootScope, dpdConfig){
	var dpd = {};
	dpd.errors = [];
	
	if ( !Array.prototype.forEach ) {
	  Array.prototype.forEach = function(fn, scope) {
	    for(var i = 0, len = this.length; i < len; ++i) {
	      fn.call(scope, this[i], i, this);
	    }
	  }
	}
	
	var ef = function(data, status, headers, config){
		dpd.errors.push(data);
	}
	
	var checkUndefinedFunc = function(f){
		if (typeof f == 'undefined')
			f = function(){}
		
		return f;
	}
	
	dpdConfig.forEach(function(d){
		dpd[d] = {};
		dpd[d].cache = {
			all: [],
			get: function(id){
				for (var i in dpd[d].cache.all){
					if (dpd[d].cache.all[i].id == id)
						return dpd[d].cache.all[i];
				}
			}
		};
		
		dpd[d].get = function(o, s, e){
			if (typeof o == "string"){
				$http.get('/'+d+'/'+o).success(function(data, status, headers, config){
					var t = dpd[d].cache.get(o);
					if (typeof t != 'undefined'){
						t = data;
					}
				}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
			} else{
				if (typeof o == "function"){
					e = s;
					s = o;
					$http.get('/'+d).success(function(data, status, headers, config){
						dpd[d].cache.all = data;
					}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
				} else {
					$http.get('/'+d,{params:o}).success(function(data, status, headers, config){
						dpd[d].cache.all = data;
					}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
				}
			}
		};
		
		dpd[d].put = function(id, o, s, e){
			$http.put('/'+d+'/'+id,o).success(function(data, status, headers, config){
				for (var i in dpd[d].cache.all){
					if (dpd[d].cache.all[i].id == id){
						dpd[d].cache.all[i] = data;
					}
				}
			}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
		};
		
		dpd[d].post = function(o, s, e){
			$http.post('/'+d+'/',o).success(function(data, status, headers, config){
				dpd[d].cache.all.push(data);
			}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
		};
		
		dpd[d].del = function(id, s, e){
			$http.delete('/'+d+'/'+id).success(function(data, status, headers, config){
				for (var i in dpd[d].cache.all){
					if (dpd[d].cache.all[i].id == id){
						dpd[d].cache.all.slice(i,1);
					}
				}
			}).success(checkUndefinedFunc(s)).error(ef).error(checkUndefinedFunc(e));
		};
		
		dpd[d].save = function(obj, s, e){
			if (typeof obj.id == 'string'){
				dpd[d].put(obj.id,obj,s,e);
			} else {
				dpd[d].post(obj,s,e);
			}
		};
		
	});
	
	
	$rootScope.dpd = dpd;
	return dpd;
});