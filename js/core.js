(function (window) {
	var Core = function () {		
		var db = {
			setup: function () {},
			open: function () {
				return openDatabase('Budgetter', '0.1', '', 200000);
			}
		}
		var _db = db.open();
		
		var modules = {};
		
		return {
			executeSql: function (sql, data, callback) {
				_db.transaction( function (tx) {
					tx.executeSql(sql, data || [], function (tx, res) {
						if (callback) {
							callback(res);
						}
					}, db.error);
				});
			},
			getDB: function () {
				return _db;
			},
			dbErrorHandler: function (e) {
				console && console.log(e);
			},
			
			addModule: function (id, module) {
				modules[id] = module;
			},
			getModule: function (id) {
				return modules[id];
			}
		};
	}();
	
	window._budgetter = Core;
})(window);