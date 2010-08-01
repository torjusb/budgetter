jQuery(document).ready( function () {
	var Core = _budgetter;
		
	var Menu = function () {						
		var container = $('<menu id="menuContainer"/>').appendTo('header'),
			groupTemplate = '<li data-group-id="{id}" />',
			itemTemplate = '<button data-item-id="{id}" />';
			
		var templateStr = function (str, data) {
			return str.replace(/\{([a-zA-Z1-9]+)\}/, function (match, tag) {
				return data[tag] || '';
			});
		};
		
		templateStr(itemTemplate, {id:'test'});
		return {
			addMenuGroup: function (group_id) {
				container.append( templateStr(groupTemplate, { id: group_id }) );
				
				return {
					addMenuItem: function (item_id) {
						return Menu.addMenuItem(group_id, item_id);
					}
				};
			},
			addMenuItem: function(group_id, item_id) {
				var item = $(templateStr(itemTemplate, { id: item_id }));
				
				container.find('li[data-group-id="' + group_id + '"]').append( item );
				
				return item;
			}
		};
	}();
	
	/*
	 * Test */
	
	var itemGroup = Menu.addMenuGroup('test');
	itemGroup.addMenuItem('test2').text('test');
	itemGroup.addMenuItem('test3').text('test2');
	
	Core.addModule('menu', Menu);
});