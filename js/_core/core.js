(function (window) {
	var Core = function () {		
		var _db,
			modules = [], loadedModules = {};

		return {
			/**
			 * Get the database
			 *
			 * @return {Object} Database object
			 */
			getDB: function () {
				if (!_db) {
					_db = window.openDatabase('Budgetter', '0.1', '', 200000);
				}
				return _db;
			},
			
			/**
			 * Generic error handler for databases
			 *
			 * @param {Object} e Error object
			 */
			dbErrorHandler: function (e) {
				console && console.log(e);
			},
			
			/**
			 * Add a module to the core
			 *
			 * @param {Int} id Identifier of the module
			 * @param {Function} api Function to be executed once the module is started
			 */
			addModule: function (id, api) {
				var module = {
					id: id,
					api: api
				};
				
				modules.push(module);
			},
			
			/**
			 * Get a module's API
			 *
			 * @param {Int} id Identifier of the module
			 * @return {Object} The modules API
			 */
			getModule: function (id) {
				return loadedModules[id];
			},
			
			/**
			 * Loads all availible modules 
			 */
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
			
	window._budgetter = Core;
})(window);