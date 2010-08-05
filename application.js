jQuery( function ($) {
	/*
	 * Modules */
	var Budget 	= _budgetter.getModule('budget'),
		Modal	= _budgetter.getModule('modal'),
		Menu	= _budgetter.getModule('menu');

	/*
	 * Menu setup */
	Menu.setContainer( $('#menuContainer') );
	    	
	var fileGroup = Menu.addMenuGroup('budget');
	
	var newBudgetInput = $('#newBudget').find('input');
	fileGroup.addMenuItem('new', {
		text: 'New budget'
	}).click( function () {
		Modal.open({
			content: $('#newBudget'),
			buttons: {
				'Add budget': {
					'class': 'confirm',
					callback: function () {
						newBudgetInput.focus();
						
						Budget.newBudget( newBudgetInput.val() );
						
						Modal.close();
					}
				},
				'Cancel': {
					'class': 'cancel',
					callback: function () {
						Modal.close();
					}
				}
			}
		});
	});
	
	$('#budgets').delegate('li', 'click', function () {
		var item = $(this);
		
		item.siblings().removeClass('selected').end().addClass('selected');
	});
	fileGroup.addMenuItem('load', {
		text: 'Load budget'
	}).click( function () {
		Modal.open({
			content: $('#budgets'),
			buttons: {
				'Open': {
					class: 'confirm',
					disabled: true, // Work
					callback: function () {
					
					}
				},
				'Cancel': {
					callback: function () {
						
					}
				}				
			}
		});
	});
	
	var dbGroup = Menu.addMenuGroup('db');
	dbGroup.addMenuItem('export', {
		modal: true,
		box: 'db',
		text: 'Export budget'
	});
	dbGroup.addMenuItem('import').text('Import budget');
	
	var shareGroup = Menu.addMenuGroup('share');
	shareGroup.addMenuItem('print').text('Print budget');
	shareGroup.addMenuItem('share').text('Share budget');
});