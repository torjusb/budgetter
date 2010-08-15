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
			addView: function (id, view) {
				_views[id] = view;
				
				return View;
			},
			setActiveView: function (id) {
				_activeView = _views[id];
				
				for (i in _views) {
					_views[i].hide();
				}
				_activeView.show();
				
				jQuery.event.trigger('NEW_VIEW_SET', { view: _activeView });
			},
			getActiveView: function () {
				return _activeView;
			},
			getAllViews: function () {
				return _views;
			}
		};
		
		return View;
	};

	
	Core.addModule('view', View); 
})();