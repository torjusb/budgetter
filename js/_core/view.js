(function () {
	var Core = _budgetter;		
		
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
			
	/*
	 * API */
	var View = function () {
		var _views = {},
			_activeView;
		
		View = {
			
			/**
			 * Adds a new view
			 *
			 * @param {Int} id Identifier of the view
			 * @param {Object} view The view element
			 * @return {Object} View API for chaining
			 */
			addView: function (id, view) {
				_views[id] = view;
				
				return View;
			},
			
			/**
			 * Make a view active
			 *
			 * @param {Int} id Identifier of view
			 * @return {Object} View API for chaining
			 */ 
			setActiveView: function (id) {
				_activeView = _views[id];
				
				for (i in _views) {
					_views[i].hide();
				}
				_activeView.show();
				
				jQuery.event.trigger('NEW_VIEW_SET', { view: _activeView });
				
				return View;
			},
			
			/**
			 * Get the current view
			 *
			 * @return {Object} jQuery object of the current view
			 */
			getActiveView: function () {
				return _activeView;
			},
			
			/**
			 * Get all registered views
			 *
			 * @return {Object} Object containing all the views
			 */
			getAllViews: function () {
				return _views;
			}
		};
		
		return View;
	};

	
	Core.addModule('view', View); 
})();