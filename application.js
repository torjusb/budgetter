jQuery( function ($) {
	/*
	 * Modules */
	var Budget 	= _budgetter.getModule('budget'),
		Modal	= _budgetter.getModule('modal'),
		Menu	= _budgetter.getModule('menu');
	 
	 
	 Budget.addCalculation(0, /\d+/, function (string, regex) {
	 	return parseFloat(string.match(regex));
	 });
	 Budget.addCalculation(50, /(\d+).*\sa\s(\d+)/, function (string, regex) {
	 	var matches = string.match(regex);
	 	
	 	return parseFloat(matches[1] * matches[2]);
	 });		
	
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
	
	/*
	 * Budget info functionality */
	( function () {
		var budgetInfo = $('#budgetInfo'),
			budgetTitle = $('h1', budgetInfo),
			budgetDesc = $('p', budgetInfo);
		
		
		var updateBudgetInfo = function () {
			Budget.getTitle( function (title) {
				budgetTitle.text( title );
			});
			
			Budget.getDescription( function (description) {
				budgetDesc.text( description );
			});
		}
		updateBudgetInfo();
		budgetInfo.bind('BUDGET_LOADED', updateBudgetInfo)
				
		budgetTitle.bind('focusout focusin keydown', function (e) {
			var field = $(this),
				value = field.text();
			
			switch (e.type) {
				case 'focusout':
					if (/^\s*$/.test(value)) {
						// todo: throw error, reset name
						field.blur();
						updateBudgetInfo();
					} else {
						Budget.setTitle( value );
					}
				case 'keydown':
					if (e.keyCode === 13) {
						e.preventDefault();
						field.blur();
					}
			}
		});
		
		budgetDesc.bind('focusout focusin keydown', function (e) {
			var field = $(this),
				value = field.text();
				
			switch (e.type) {
				case 'focusin':
					
				case 'focusout':
					if (/^\s*$/.test(value)) {
						field.text( 'Description' );
						Budget.setDescription( null );
					} else {
						Budget.setDescription( value );
					}
				case 'keydown':
					if (e.keyCode === 13 && !e.shiftKey) {
						console.log(e);
						e.preventDefault();
						field.blur();
					}
			}
		});
	})();
	
	/*
	 * Add calculation */
	( function () {
		var newCalcForm = $('#newCalculation'),
		
			addRow = function (text) {
				var template = '<tr><th contenteditable>{text}</th><td>{calcRes}</td></tr>',
					budgetTbody = $('#budget').find('tbody');
				
				return function (text) {
					var res = Budget.parseExpense(text);
					budgetTbody.append( $(templateStr(template, { text: text, calcRes: res })) );
					Budget.addLine( text );
				}
			}();
		
		newCalcForm.bind('submit', function (e) {
			e.preventDefault();
			
			var calcField = $(this).find('input[name="calculation"]'),
				value = calcField.val();
							
			calcField.val('');
			
			addRow( value );
		});
	})();
	
	/*
	 * Window management */
	 ( function () {
	 	var left = $('#left'),
	 		right = $('#right'),
	 		colSizer = $('<div id="col-sizer" />').appendTo(left),
	 		
	 		min = parseFloat(left.css('minWidth')),
	 		max = parseFloat(left.css('maxWidth')),
	 		mouseKeyDown = false,
	 		
	 		savedWidth = parseFloat(localStorage.getItem('col-width'));
	 	
	 	if (savedWidth) {
	 		left.width(savedWidth);
 			right.css('marginLeft', savedWidth);
	 	}
	 			 		
	 	$(document).bind('mousemove mouseup', function (e) { 		
	 		if (mouseKeyDown && e.type === 'mousemove') {
	 			e.preventDefault();	 			 			
	 			
	 			var x = e.clientX;
	 			
	 			if (x <= min || x >= max) {
	 				return false;
	 			}
	 			
	 			left.width(x);
	 			right.css('marginLeft', x);
	 		}
	 		
	 		if (e.type === 'mouseup') {
	 			localStorage.setItem('col-width', left.width());
	 			mouseKeyDown = false;
	 		}
	 	});
	 	
	 	colSizer.bind('mousedown mouseup', function (e) {
			mouseKeyDown = e.type === 'mousedown' ? true : false;
		});
	 		 	
	 })();
	 
	 /*
	  * Table height  TODO: Move to window mangagment? */
	 ( function () {
	 	var budgetBox = $('div.budget-wrap'),
	 		doc = $(document),
	 		win = $(window),
	 		
	 		offset = budgetBox.offset().top,
	 		docHeight = doc.height();
	 		 	
	 	budgetBox.height(docHeight - offset + 3);
	 	
	 	win.bind('resize', function (e) {
	 		budgetBox.height(win.height() - offset + 3); // TODO: Figure out if I need to hardcore 3
	 	});
	 })();
	 
	 /*
	  * Add new budget form handler */
	 ( function () {
	 	var addBudget = $('#addBudget');

	 	addBudget.bind('submit', function (e) {
	 		e.preventDefault();
	 		
	 		var nameField = $('input[name="budget-name"]', this),
	 			value = nameField.val();

	 		if (/^\s*$/.test(value)) {
	 			return false;	
	 		}
	 			 			
	 		Budget.newBudget( value );
	 		
	 		nameField.val('').blur();
	 	});
	 })();
	 
	 
 	var budgetList = $('#budgets');
	
	var refreshBudgetList = function (budgets) {
		var html, template = '<li data-budget-id="{id}">{name}</li>';
		
		budgetList.empty();
		
		for (i = 0; i < budgets.length; i++) {
			html += templateStr( template, { id: budgets[i].id, name: budgets[i].name } );
		}
		
		$( html ).appendTo(budgetList);
		
		Budget.loadBudget( localStorage.getItem('loadedBudget') || 1 );
	};
	
	Budget.getBudgets( refreshBudgetList );
	budgetList.bind('CREATED_NEW_BUDGET', function () {
		Budget.getBudgets( refreshBudgetList );
	});

	budgetList.delegate('li', 'click contextmenu', function (e) {
		e.preventDefault();
		var elem = $(this),
			budgetId = elem.attr('data-budget-id'),
			contextMenu;
		console.log(e);
		switch (e.type) {
			case 'click':
				Budget.loadBudget( elem.attr('data-budget-id') );
			case 'contextmenu':
				e.preventDefault();
				contextMenu = $('#contextMenu');
				
				contextMenu.css({
					top: e.pageY,
					left: e.pageX
				});
		}
	}).bind('BUDGET_LOADED', function (e, data) {
		budgetList.find('li').removeClass('selected').filter('[data-budget-id="' + data.budget_id + '"]').addClass('selected');
	});
});