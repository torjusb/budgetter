(function () {
	var Core = _budgetter,
		db 	 = Core.getDB();
		
		
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
			
	/*
	 * API */
	var View = function () {
		var _activeView;
		
		return {

		};
	}();

	
	//Core.addModule('view', View); 
})(window);