jQuery(document).ready( function () {
	var Core = _budgetter;
		
	var Menu = function () {						
		var _container,
			_groupTemplate = '<li data-group-id="{id}" />',
			_itemTemplate = '<button data-item-id="{id}" data-item-modal="{modal}" data-modal-window="{box}">{text}</button>';
			
		var templateStr = function (str, data) {
			return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
				return data[tag] || '';
			});
		};
		
		return {
			setContainer: function (container) {
				_container = container;
			},
			getContainer: function () {
				return _container;
			},
			addMenuGroup: function (group_id) {
				if (typeof _container === 'undefined') {
					throw new Error('Container item must be set');
				}
				
				_container.append( templateStr(_groupTemplate, { id: group_id }) );
				
				return {
					addMenuItem: function (item_id, item_info) {
						return Menu.addMenuItem(group_id, item_id, item_info);
					}
				};
			},
			addMenuItem: function(group_id, item_id, item_info) {
				if (typeof _container === 'undefined') {
					throw new Error('Container item must be set');
				}
				item_info = item_info || {};
				var item = $(templateStr(_itemTemplate, { id: item_id, text: item_info.text, modal: item_info.modal, box: item_info.box }));
				
				_container.find('li[data-group-id="' + group_id + '"]').append( item );
				
				return item;
			}
		};
	}();
	
	/*
	 * Test */

	Core.addModule('menu', Menu);
});