jQuery(document).ready( function () {
	var Core = _budgetter;
		
	var Menu = function () {						
		var container = $('<menu id="menuContainer"/>').appendTo('header'),
			groupTemplate = '<li data-group-id="{id}" />';
		
		return {
			addMenuGroup: function (group_id) {
				return container.append( groupTemplate );
			},
			addMenuItem: function(group_id) {
				
			}
		};
	}();
	
	/*
	 * Test */
	 
	Menu.addMenuGroup('test');
	
	Core.addModule('menu', Menu);
});