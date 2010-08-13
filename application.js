$(document).bind('ALL_MODULES_LOADED', function () {
	/*
	 * Modules */
	var Budget 	= _budgetter.getModule('budget'),
		View 	= _budgetter.getModule('view'),
		
		allViews = $('.view');

	View.addView('budget', $('#budgetView'))
		.addView('trashcan', $('#trashView'))
		.addView('logbook', $('#logbookView'))
		.setActiveView('budget');
			
	
	Budget.addCalculation(0, /\d+/, function (string, regex) {
		return parseFloat(string.match(regex));
	});
	Budget.addCalculation(50, /(\d+).*\sa\s(\d+)/, function (string, regex) {
	 	var matches = string.match(regex);
	 	
	 	return parseFloat(matches[1] * matches[2]);
	});
	Budget.addCalculation(50, /m\((.+)\)/, function (string, regex) {
	 	var equation = string.match(regex)[1];
	 	
	 	return Parser.parse( equation ).evaluate();
	});
	
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
	
	/*
	 * Budget navigation */
 	var budgetList = $('#budgets'),
	
	refreshBudgetList = function (budgets) {
		var html, template = '<li data-budget-id="{id}">{name}</li>';
		
		budgetList.empty();
		
		for (i = 0; i < budgets.length; i++) {
			html += templateStr( template, { id: budgets[i].id, name: budgets[i].name } );
		}
		
		$( html ).appendTo(budgetList);
		
		Budget.loadBudget( localStorage.getItem('loadedBudget') || 1 );
		
		View.setActiveView('budget');
	}; 
	
	( function () {
		
		$(document).bind('click', function (e) {
			$('#contextMenu').hide();
		});
		
		var openContextMenu = function (e, budget_id) {
			var contextMenu = $('#contextMenu'), budgetId;
			
			contextMenu.delegate('li', 'click', function () {
				var elem = $(this),
					action = elem.attr('data-menu-action'),
					menuElem = budgetList.find('li[data-budget-id="' + budgetId + '"]'),
					loadNewBudgetId = parseInt(menuElem.prev().attr('data-budget-id') || menuElem.next().attr('data-budget-id'));

				switch (action) {
					case 'rename':
						menuElem.attr('contenteditable', true).focus();	
						break;
					case 'delete':
						Budget.removeBudget(budgetId, function () {
							Budget.getBudgets( refreshBudgetList );
							Budget.loadBudget( loadNewBudgetId );
						});
						break;
					case 'log':
						Budget.logBudget(budgetId, function () {
							Budget.getBudgets( refreshBudgetList );
							Budget.loadBudget( loadNewBudgetId );
						});
						break;
				}
				
				contextMenu.hide();
			});
			
			return function (e, budget_id) {
				e.preventDefault();
				
				budgetId = budget_id;
				
				contextMenu.css({
					top: e.pageY,
					left: e.pageX
				}).show();
			}
		}();
		
		
		budgetList.bind('CREATED_NEW_BUDGET', function () {
			Budget.getBudgets( refreshBudgetList );
		});
		Budget.getBudgets( refreshBudgetList );
		budgetList.delegate('li', 'click contextmenu focusout keydown', function (e) {
			var elem = $(this),
				budgetId = elem.attr('data-budget-id'),
				contextMenu;

			switch (e.type) {
				case 'click':
					Budget.loadBudget( elem.attr('data-budget-id') );
					break;
				case 'contextmenu':
					openContextMenu(e, elem.attr('data-budget-id'));
					break;
				case 'focusout':
					elem.removeAttr('contenteditable');
					Budget.setTitle( elem.text(), budgetId );
					break;
				case 'keydown':
					if (e.keyCode === 13) { // enter
						e.preventDefault();
						elem.blur();
					}
					break;
			}
		}).bind('BUDGET_LOADED', function (e, data) {
			allViews.hide().filter('#budgetView').show();
			budgetList.find('li').removeClass('selected').filter('[data-budget-id="' + data.budget_id + '"]').addClass('selected');
		});
	})();
	
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
						e.preventDefault();
						field.blur();
					}
			}
		});
	})();
	
	/*
	 * Add expense */
	( function () {
		var newCalcForm = $('#newCalculation'),
			budgetTable = $('#budget');
		
		budgetTable.find('tbody').bind('LINE_ADDED', function (e, data) {
			var tbody = $(this),
				template = '<tr><th contenteditable data-id="{id}">{text}</th><td>{calcRes}</td></tr>',
				
				res = Budget.parseExpense(data.text);
			
			var elem = $(templateStr(template, { id: data.newId, text: data.text, calcRes: res }));
			tbody.append( elem );
			elem.children('th').attr('data-parent-id', elem.prev().children('th').attr('data-id') || 0);
		});
		
		newCalcForm.bind('submit', function (e) {
			e.preventDefault();
			
			var calcField = $(this).find('input[name="calculation"]'),
				value = calcField.val(),
				parId = $('tbody', budgetTable).find('tr:last th').attr('data-id') || 0;
							
			calcField.val('');
			
			Budget.addLine( value, parId );
		});
	})();
	
	/*
	 * Window management */
	 ( function () {
	 	var left = $('#left'),
	 		right = $('#right'),
	 		leftColSizer = $('<div id="col-sizer" />').appendTo(left),
	 		
	 		budgetCol = $('#col1'),
	 		totalLabel = $('#totalFixed').find('.label'),
	 		budgetColSizer = $('<div id="budget-col-sizer" />').appendTo('div.budget-wrap', right),
	 		
	 		leftValues = {
	 			min: parseFloat(left.css('minWidth')),
		 		max: parseFloat(left.css('maxWidth')),
		 		savedWidth: parseFloat(localStorage.getItem('col-width'))
		 	},
		 	budgetValues = {
		 		min: parseFloat(budgetCol.css('minWidth')),
		 		max: parseFloat(budgetCol.css('maxWidth')),
		 		savedWidth: parseFloat(localStorage.getItem('budget-col-width'))
		 	},
		 	
	 		mouseKeyDown = false,
	 		movingCol;


	 	if (leftValues.savedWidth) {
	 		left.width(leftValues.savedWidth);
 			right.css('marginLeft', leftValues.savedWidth);
	 	}
	 	if (budgetValues.savedWidth) {
	 		budgetCol.add(totalLabel).width(budgetValues.savedWidth);
 			budgetColSizer.css('left', budgetValues.savedWidth);
	 	}
	 			 		
	 	$(document).bind('mousemove mouseup', function (e) { 		
	 		if (mouseKeyDown && e.type === 'mousemove') {
	 			e.preventDefault();	 			 			
	 			
	 			var x = e.clientX;

	 			if (movingCol === 'left') {
		 			if (x <= leftValues.min || x >= leftValues.max) {
		 				return false;
		 			}
		 			
		 			left.width(x);
		 			right.css('marginLeft', x);
		 		} else if (movingCol === 'budget') {
		 			x -= left.width();
		 			
		 			if (x <= budgetValues.min || x >= budgetValues.max) {
		 				return false;
		 			}
		 			
		 			budgetCol.add(totalLabel).width(x);
		 			budgetColSizer.css('left', x);
		 		}
	 		}
			
	 		if (e.type === 'mouseup' && movingCol) {
	 			localStorage.setItem('budget-col-width', totalLabel.width());
	 			localStorage.setItem('col-width', left.width());
	 			mouseKeyDown = movingCol = false;
	 		}
	 	});
	 	
	 	leftColSizer.bind('mousedown mouseup', function (e) {
	 		movingCol = 'left';
			mouseKeyDown = e.type === 'mousedown' ? true : false;
			
		});
		budgetColSizer.bind('mousedown mouseup', function (e) {
			movingCol = 'budget';
			mouseKeyDown = e.type === 'mousedown' ? true : false;
		});	 	
	 })();
	 
	 
	 /*
	  * Table height  TODO: Move to window mangagment? */
	 ( function () {
	 	var scrollAreas = $('.scroll-area', allViews),
	 		doc = $(document),
	 		win = $(window),
	 	
	 		docHeight = doc.height(),
	 		
	 		scrollArea, offset, exclude
	 		
	 		resizeScrollArea = function () {
	 			scrollArea.css('height', (win.height() - offset - exclude));	
	 		};
	 		
	 	$(document).bind('NEW_VIEW_SET', function (e, data) {
	 		scrollArea = data.view.find('div.scroll-area');
	 		offset = scrollArea.offset().top;
	 		exclude = parseFloat(scrollArea.nextAll().outerHeight()) || 0;
	 		
	 		resizeScrollArea();
	 	});
	 		
	 	
	 	win.bind('resize', resizeScrollArea);

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
	 
	 /*
	  * Total amount update */
	 (function () {
	 	var totalTable = $('#totalAmount'),
	 		totalFixed = $('#totalFixed').find('.amount');
	 	
	 	totalTable.bind('BUDGET_LOADED LINE_ADDED', function () {
	 		totalTable.add(totalFixed).text( Budget.getTotal() );
	 	});
	 })();
	 
	 /*
	  * Edit budget lines */
	 ( function () {
	 	var budget = $('#budget');

	 	budget.delegate('th', 'keydown focusout', function (e) {
	 		var elem = $(this),
	 			value = elem.text();
	 			 		
	 		switch (e.type) {
	 			case 'focusout':
	 				Budget.updateLine( value, elem.attr('data-id') );
	 				break;
	 			case 'keydown':
	 				if (e.keyCode === 13 && !e.shiftKey) {
	 					e.preventDefault();
	 					elem.blur();
	 				}
	 				break;
	 		}
	 	});
	 })();
	 
	 /*
	  * UI Sortable */
	(function () {
		var fixHelper = function(e, ui) {
			var orgChild = ui.children(),
				clone = ui.clone();
				
			clone.addClass('ui-drag-helper').children().each( function (i) {
				$(this).width( orgChild.eq(i).width() );
			});
			
			return clone;
		};

	 	$('#budget').bind('BUDGET_LOADED', function () {
	 		var movedFromNextElem, movedFromPrevElem, movedElem;
	 		
	 		$('#budget').find('tbody').sortable({
	 			helper: fixHelper,
	 			axis: 'y',
	 			
	 			start: function (e, ui) {
	 				movedFromNextElem = ui.item.next().next().children('th');
	 				movedFromPrevElem = ui.item.prev().children('th');
	 			},	 		
	 			stop: function (e, ui) {
					movedElem = ui.item;
					
					movedElem.children().css('width', 'auto');
					
					var movedToNextElem = movedElem.next().children('th'),
						movedToPrevElem = movedElem.prev().children('th'),
						movedTh = movedElem.children('th');
												
					movedFromNextElem.attr('data-parent-id', movedFromPrevElem.attr('data-id') || 0); // Next / prev from start
					
					movedTh.attr('data-parent-id', movedToPrevElem.attr('data-id') || 0); // New location of moved elem
					
					movedToNextElem.attr('data-parent-id', movedTh.attr('data-id')); // Moved to next elem
										
					var newPositions = [
						{ id: parseInt(movedFromNextElem.attr('data-id')), setParent: parseInt(movedFromPrevElem.attr('data-id')) || 0 },
						{ id: parseInt(movedTh.attr('data-id')), setParent: parseInt(movedToPrevElem.attr('data-id')) || 0 },
						{ id: parseInt(movedToNextElem.attr('data-id')), setParent: parseInt(movedTh.attr('data-id')) }
					];
					
					Budget.updateLinePositions( newPositions );
	 			}
	 		}).disableSelection();
	 	});
	})();
	 
	 /*
	  * Logbook view */
	( function () {
	 	var menuElem = $('#openLog'),
	 		viewElem = $('#logbookView.view'),	 		
	 		loggedBudgets = $('#loggedBudgets', viewElem),
	 		noLogged = $('p.empty-list', viewElem),
	 		
	 		template = '<li data-id="{id}" title="{desc}">{name}<button>Make active</button></li>';
	 		
	 	menuElem.bind('click', function (e) {
	 		var html = '';
	 		
	 		View.setActiveView('logbook');
	 		
	 		allViews.hide();
	 		viewElem.show();
	 		
	 		Budget.getBudgetsByStatus('logged', function (res) {
	 			for (i = 0; i < res.rows.length; i++) {
	 				var row = res.rows.item(i);
	 				
	 				html += templateStr(template, { id: row.id, desc: row.description, name: row.name });
	 			}
	 			
	 			if (res.rows.length > 0) { // Have logged items
	 				noLogged.hide();
	 				loggedBudgets.empty().show().append( html );
	 			} else {
	 				noLogged.show();
	 				loggedBudgets.hide();
	 			}
	 		});
	 	});
	 	
	 	loggedBudgets.delegate('button', 'click', function (e) {
	 		var elem = $(this).parent(),
	 			id = parseInt(elem.attr('data-id'));
	 			
	 		Budget.setBudgetStatus('active', id, function () {
	 			elem.remove();	 			
				Budget.getBudgets( refreshBudgetList ); 
				Budget.loadBudget(id);
				
				if (loggedBudgets.children().length < 1) {
					noLogged.show();
				}
	 		});
	 	});
	})();
	
	/*
	 * Trashbook view; TODO: Merge with above? */
	( function () {
		var menuElem = $('#openTrash'),
			viewElem = $('#trashView.view'),
			trashedBudgets = $('#trashedBudgets', viewElem),
			noTrashed = $('p.empty-list', viewElem),
			
			template = '<li data-id="{id}" title="{desc}">{name}<button>Make active</button></li>';
			
		menuElem.bind('click', function () {
			var html = '';

			allViews.hide();
			viewElem.show();
			
			View.setActiveView('trashcan');
			
			Budget.getBudgetsByStatus('deleted', function (res) {
				for (i = 0; i < res.rows.length; i++) {
	 				var row = res.rows.item(i);
	 				
	 				html += templateStr(template, { id: row.id, desc: row.description, name: row.name });
	 			}
	 			
	 			if (res.rows.length > 0) {
	 				noTrashed.hide();
	 				trashedBudgets.empty().show().append( html );
	 			} else {
	 				noTrashed.show();
	 				trashedBudgets.hide();
	 			}
			});
		});
		
		trashedBudgets.delegate('button', 'click', function (e) {
	 		var elem = $(this).parent(),
	 			id = parseInt(elem.attr('data-id'));
	 			
	 		Budget.setBudgetStatus('active', id, function () {
	 			elem.remove();	 			
				Budget.getBudgets( refreshBudgetList ); 
				Budget.loadBudget(id);
				
				if (trashedBudgets.children().length < 1) {
					noTrashed.show();
				}
	 		});
	 	});
	})();
});