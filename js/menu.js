jQuery(document).ready( function () {
	var Core = _budgetter;
		
	var Menu = function () {						
		var _container,
			_groupTemplate = '<li data-group-id="{id}" />',
			_itemTemplate = '<button data-item-id="{id}" />';
			
		var templateStr = function (str, data) {
			return str.replace(/\{([a-zA-Z1-9]+)\}/, function (match, tag) {
				return data[tag] || '';
			});
		};
		
		return {
			setContainer: function (container) {
				_container = container;
			},
			addMenuGroup: function (group_id) {
				if (typeof _container === 'undefined') {
					throw new Error('Container item must be set');
				}
				
				_container.append( templateStr(_groupTemplate, { id: group_id }) );
				
				return {
					addMenuItem: function (item_id) {
						return Menu.addMenuItem(group_id, item_id);
					}
				};
			},
			addMenuItem: function(group_id, item_id) {
				if (typeof _container === 'undefined') {
					throw new Error('Container item must be set');
				}
				
				var item = $(templateStr(_itemTemplate, { id: item_id }));
				
				_container.find('li[data-group-id="' + group_id + '"]').append( item );
				
				return item;
			}
		};
	}();
	
	/*
	 * Test */

	Core.addModule('menu', Menu);
});