(function (window) {
	var Core = function () {		
		var _db,
			modules = [], loadedModules = {};

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
				if (!_db) {
					_db = window.openDatabase('Budgetter', '0.1', '', 200000);
				}
				return _db;
			},
			dbErrorHandler: function (e) {
				console && console.log(e);
			},
			
			addModule: function (id, api) {
				var module = {
					id: id,
					api: api
				};
				
				modules.push(module);
			},
			getModule: function (id) {
				return loadedModules[id];
			},
			loadAllModules: function () {
				for (i = 0; i < modules.length; i++) {
					var module = modules[i],
						id = module.id,
						instance = module.api();
						
					loadedModules[id] = instance;
				}
				
				jQuery(document).trigger('ALL_MODULES_LOADED');
			}
		};
	}();
		
	//jQuery(document).ready( Core.loadAllModules );
	
	window._budgetter = Core;
})(window);