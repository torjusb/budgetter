(function (window) {
	var Core = function () {		
		var db = {
			setup: function () {},
			open: function () {
				return openDatabase('Budgetter', '0.1', '', 200000);
			},
			error: function (err) {
				console.log(err);
			}
		}
		var _db = db.open();
		
		var modules = {};
		
		return {
			executeSql: function (sql, data, callback) {
				console.log(data);
				_db.transaction( function (tx) {
					tx.executeSql(sql, data || [], function (tx, res) {
						callback(res);
					}, db.error);
				});
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