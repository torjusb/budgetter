$(document).bind('ALL_MODULES_LOADED', function () {
	/*
	 * Modules */
	var Budget 	= _budgetter.getModule('budget'),
		View 	= _budgetter.getModule('view'),
		
		allViews = $('.view');

	View.addView('budget', $('#budgetView'))
		.addView('trashcan', $('#trashView'))
		.addView('logbook', $('#logbookView'))
		.addView('nobudgets', $('#nobudgetView'))
		.addView('print', $('#printView'));
		//.setActiveView('budget');
			
	var reg_number = 
	
	Budget.addCalculation(0, /-?(?:0|[1-9]\d{0,2}(?:,?\d{3})*)(?:\.\d+)?/, function (string, regex) {
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
	
	Budget.addCalculation(55, /(\d+)%[\D|\s]*(\d+)/, function (string, regex) {
		var matches = string.match(regex),
			perc = matches[1], of = matches[2];
			
		return (perc * of) / 100 || 0;
	});
	Budget.addCalculation(55, /(\d+)[\D|\s]*(\d+)%\s+discount/, function (string, regex) {
		var matches = string.match(regex),
			perc = matches[2], of = matches[1];
			
			discount = (perc * of) / 100;
			
		return of - discount || 0;
	});
	
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
	
	var getTotals = function (income_col, outcome_col) {
		var amounts = {
			income: 0,
			outcome: 0,
			diff: 0
		};
		
		income_col.each( function () {
			amounts.income += parseFloat( this.innerText );
		});
		outcome_col.each( function () {
			amounts.outcome += parseFloat( this.innerText );
		});
		
		amounts.diff = Math.round((amounts.income - amounts.outcome) * 100) / 100;
		
		return amounts;
	};
	
	
	var loadInactiveBudgets = function (type) {
	 	viewElem = View.getActiveView(),	 		
 		listElem = $('ul.budgetList', viewElem),
	 	emptyElem = $('p.empty-list', viewElem),
	 		
 		template = '<li data-id="{id}" title="{desc}">{name}<input type="button" value="Make active" /></li>',
 		html = '';
 		
 		Budget.getBudgetsByStatus(type, function (res) {
 			for (i = 0; i < res.rows.length; i++) {
 				var row = res.rows.item(i);
 				
 				html += templateStr(template, { id: row.id, desc: row.description, name: row.name });
 			}
 			
 			if (res.rows.length > 0) { // Have logged items
 				emptyElem.hide();
 				listElem.empty().show().append( html );
 			} else {
 				emptyElem.show();
 				listElem.hide();
 			}
	 	});
	};
		
	var loadBudgetCallback = function () {
		var outcomesTable = $('#budgetTables div.outcome').find('tbody'),
			incomesTable = $('#budgetTables div.income').find('tbody'),
			
			makeHtml = function (rows, type) {
				var html = '', parentId = 0;
				for (i = 0; i < rows[type].length; i++) {
					var row = rows[type][i],
						expense = Budget.parseExpense( row.text );
												
					html = html + '<tr><th data-id="' + row.id + '" data-parent-id="' + parentId + '"><input type="button" value="Remove" title="Remove" /><span contenteditable>' + row.text + '</span></th><td>' + expense + '</td></tr>';
					
					parentId = row.id;
				}
				
				return html;
			};
		
		return function (rows) {
			outcomesTable.empty().append( makeHtml(rows, 'outcome') );
			incomesTable.empty().append( makeHtml(rows, 'income') );
		}
	}();
	
	var importBudgetFunc = function () {
		$.get('ajax/import_budget.html', function (res) {
			$.fancybox({
				content: res,
				width: 500,
				height: 500,
				padding: 0,
				scrolling: 'no',
				autoDimensions: false,
				overlayShow: false
			});
		});
	};
	
	var makeCleanBudgetTable = function (rows) {
		var	rowTpl = '<tr><td>{inText}</td><td class="res">{inCalc}</td><td>{outText}</td><td class="res">{outCalc}</td></tr>'
			footTpl = '<th>{text}</th><td>{sum}</td>',
			diffTpl = '<tr><th colspan="3">{text}</th><td class="{class}">{sum}</td></tr>',
			
			table = $('<table><thead><th colspan="2">Incomes</th><th colspan="2">Outcomes</th></thead></table>'),
			tbody = $('<tbody />').appendTo(table),
			tfoot = $('<tfoot />').appendTo(table),
				
			bodyHtml = footHtml = '';
	
		var lines = {
			income: [],
			outcome: []
		},
						
		incomeTotal = outcomeTotal = diff = 0;
						
		// Sort outcomes from incomes
		for (i = 0; i < rows.length; i++) {
			lines[rows[i].type].push( rows[i] );
		}
		
		var numRows = Math.max(lines.income.length, lines.outcome.length);
		
		// Loop through all rows
		for (i = 0; i < numRows; i++) {						
			var inRow = lines.income[i] || '',
				outRow = lines.outcome[i] || '',
				
				inNum = Budget.parseExpense(inRow.text),
				outNum = Budget.parseExpense(outRow.text);
				
			incomeTotal += inNum || 0;
			outcomeTotal += outNum || 0;
				
			
			bodyHtml += templateStr(rowTpl, {
				inText: inRow.text || '',
				inCalc: inNum,
				outText: outRow.text || '',
				outCalc: outNum
			});
		}
		
		tbody.append( bodyHtml );
		
		// Make tfoot
		diff = parseFloat(incomeTotal - outcomeTotal);
		footHtml += '<tr>';
		footHtml += templateStr(footTpl, { text: 'Total', sum: incomeTotal });
		footHtml += templateStr(footTpl, { text: 'Total', sum: outcomeTotal });
		footHtml += '</tr>';
		footHtml += templateStr(diffTpl, { text: 'Difference', sum: diff || '0', 'class': diff >= 0 ? 'positive' : 'negative' });
		
		tfoot.append ( footHtml );

		return table;
	};
	

	/*
	 * Navigation */
	( function () {
		var navContainer = $('#left'),
			navItem = 'li[data-action]';
				
		navContainer.delegate(navItem, 'click', function (e) {
			var elem = $(this),
				view = elem.attr('data-view'),
				action = elem.attr('data-action');
				
			navContainer.find('li.selected').removeClass('selected');
			elem.addClass('selected');
			
			switch (action) {
				case 'loadbudget':
					View.setActiveView( view );
					Budget.loadBudget( elem.attr('data-budget-id'), loadBudgetCallback );
					break;
				case 'loadlog':
					View.setActiveView( view );
					loadInactiveBudgets('logged');
					break;
				case 'loadtrash':
					View.setActiveView( view );
					loadInactiveBudgets('deleted');
					break;
				
			}
		});
	})();
	
	/*
	 * Trashbook / logbook make active button */
	( function () {
		var inactiveViews = $('#right').children('.inactiveView');
	
		inactiveViews.delegate('input[type="button"]', 'click', function (e) {
	 		var elem = $(this).parent(),
	 			view = elem.parents('.view:first'),
	 			emptyElem = $('p.empty-list', view),
	 			id = parseInt(elem.attr('data-id'));
	 			
	 		Budget.setBudgetStatus('active', id, function () {
	 			elem.remove();	 			
				Budget.getBudgets( refreshBudgetList ); 
				Budget.loadBudget(id);
				
				if ($('ul.budgetLis', view).children().length < 1) {
					emptyElem.show();
				}
	 		});
	 	});
	})();
	
	/*
	 * Logbook - view budget */
	( function () {
		var list = $('#logbookView').find('ul.budgetList');
	
		list.delegate('li', 'click', function (e) {
			var elem = $(this),
				id = parseInt(elem.attr('data-id'));
			
			if (elem.hasClass('expanded')) {
				elem.removeClass('expanded');
			} else {
				elem.siblings().removeClass('expanded');
				elem.addClass('expanded');
			}
							
			if (!!elem.attr('data-loaded')) {
				return;
			}
			
			Budget.getBudgetLines(id, function (rows) {
				var table = makeCleanBudgetTable(rows);
				
				table.appendTo(elem);
				elem.attr('data-loaded', 1);
			});
		});
	})();
	
	
	/*
	 * Budget navigation */
 	var budgetList = $('#budgets'),
	
		refreshBudgetList = function (budgets) {
			var html, template = '<li data-budget-id="{id}" data-action="loadbudget" data-view="budget">{name}</li>';
					
			budgetList.empty();
			
			for (i = 0; i < budgets.length; i++) {
				html += templateStr( template, { id: budgets[i].id, name: budgets[i].name } );
			}
			
			$( html ).appendTo(budgetList);
			
			if (budgets.length < 1) {
				View.setActiveView('nobudgets');
				return;
			}
			
			Budget.loadBudget( localStorage.getItem('loadedBudget') || 1 , loadBudgetCallback );
			View.setActiveView('budget');
		}; 
	
	/*
	 * Context menu */
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
							if (loadNewBudgetId) {
								Budget.loadBudget( loadNewBudgetId, loadBudgetCallback );
							} else {
								View.setActiveView('nobudgets');
							}
						});
						break;
					case 'log':
						Budget.logBudget(budgetId, function () {
							Budget.getBudgets( refreshBudgetList );
							Budget.loadBudget( loadNewBudgetId, loadBudgetCallback );
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
		budgetList.delegate('li', 'contextmenu focusout keydown', function (e) {
			var elem = $(this),
				budgetId = elem.attr('data-budget-id'),
				contextMenu;

			switch (e.type) {
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
			$('#left').find('li.selected').removeClass('selected');
			budgetList.find('li[data-budget-id="' + data.budget_id + '"]').addClass('selected');
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
					break;					
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
	 * Add budget row */
	( function () {
		var addRowContainer = $('#addRowForms');
			budgetTables = $('#budgetTables').children('div');
		
		budgetTables.find('tbody').bind('LINE_ADDED_TO_BUDGET', function (e, data) {
			var tbody = $(this),
				template = '<tr><th contenteditable data-id="{id}"><input type="button" value="Remove" title="Remove" />{text}</th><td>{calcRes}</td></tr>',
				
				res = Budget.parseExpense(data.text).toString();
			
			var elem = $( templateStr(template, { id: data.newId, text: data.text, calcRes: res }) );
			tbody.append( elem );
			elem.children('th').attr('data-parent-id', elem.prev().children('th').attr('data-id') || 0);
		});
		
		addRowContainer.find('form').bind('submit', function (e) {
			e.preventDefault();
			
			var calcField = $(this).find('input[name="calculation"]'),
				value = calcField.val(),
				type = $(this).attr('data-row-type'),
				parId = $('tbody', budgetTables.filter('.' + type)).find('tr:last th').attr('data-id') || 0;
			
			if (value.trim().length < 1) {
				return false;
			}
							
			calcField.val('');
									
			Budget.addLine( type, value, parId );
		});
	})();
	
	/*
	 * Remove budget row */
	( function () {
		var budgetTables = $('#budgetTables');
		
		budgetTables.delegate('input[type="button"]', 'click', function () {
			var row = $(this).parents('tr:first'),
				id = parseInt(row.children('th').attr('data-id')),
				parId = parseInt(row.children('th').attr('data-parent-id')),
				nextElem = row.next().children('th'),
				
				positions;
			
			if (nextElem.length > 0) {
				positions = {
					id: parseInt(nextElem.attr('data-id')), setParent: parId
				}
			}
			
			Budget.removeLine(id, positions, null, function () {
				row.remove();
				
				nextElem.attr('data-parent-id', parId);
			});
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
	  * Table height */
	 ( function () {
	 	var scrollAreas = $('.scroll-area', allViews),
	 		doc = $(document),
	 		win = $(window),
	 	
	 		docHeight = doc.height(),
	 		
	 		scrollArea, offset, exclude
	 		
	 		resizeScrollArea = function () {
	 			scrollArea.height((win.height() - offset - exclude));	
	 		};
	 		
	 	$(document).bind('NEW_VIEW_SET', function (e, data) {
	 		scrollArea = data.view.find('div.scroll-area');
	 		if (scrollArea.length > 0) {
		 		offset = scrollArea.offset().top;
		 		exclude = parseFloat(scrollArea.nextAll().outerHeight()) || 0;
		 		
		 		resizeScrollArea();
		 	}
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
	 	var totalFixed = $('#totalFixed').find('.amount'),
	 		budgetTables = $('#budgetTables'),
	 		
	 		template = '<dl> \
	 						<dt>Income total</dt> \
	 							<dd>{in}</dd> \
	 						<dt>Outcome total</dt> \
	 							<dd>{out}</dd> \
	 						<dt>Difference</dt> \
	 							<dd class="{class}">{diff}</dd> \
	 					</dl>';
	 					
	 	totalFixed.bind('BUDGET_LOADED LINE_ADDED LINE_UPDATED LINE_REMOVED', function () {
	 		console.log('asdf');
	 		var values = getTotals( $('div.income tbody', budgetTables).find('td'), $('div.outcome tbody', budgetTables).find('td') ),
	 			html = templateStr(template, {
	 				'out': values.outcome,
	 				'in': values.income,
	 				'diff': values.diff,
	 				'class': values.diff > 0 ? 'positive' : 'negative'
	 			});

	 		totalFixed.html( html );
	 	});
	 })();
	 
	 /*
	  * Edit budget lines */
	 ( function () {
	 	var budgetTables = $('#budgetTables'),
	 		prevValue;

	 	budgetTables.delegate('span', 'keydown focusin focusout', function (e) {
	 		var elem = $(this),
	 			value = elem.text();
	 			 		
	 		switch (e.type) {
	 			case 'focusin':
	 				prevValue = value;
	 				break;
	 			case 'focusout':
	 				if (value.trim().length > 0) {
	 					Budget.updateLine( value, elem.parent().attr('data-id') );
	 					
	 					elem.parent().next().text( Budget.parseExpense(value) );	 					
	 				} else {
	 					elem.text ( prevValue );
	 				}
	 				prevValue = '';

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

	 	$('#budgetTables').find('table').bind('BUDGET_LOADED', function () {
	 		var movedFromNextElem, movedFromPrevElem, movedElem;
	 		
	 		$(this).find('tbody').sortable({
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
	 * No budgets view */
	( function () {
		var view = $('#nobudgetView');
		
		view.find('form').bind('submit', function (e) {
			e.preventDefault();
			
			var nameInput = $('input[name="budget-name"]', this),
				nameValue = nameInput.val();
				
			if (nameValue.trim().length < 1) {
				return false;
			}
			
			nameInput.val('');				 			 			
	 		Budget.newBudget( nameValue );
		});
		
		view.find('a.import_budget').bind('click', function (e) {
			e.preventDefault();
			
			importBudgetFunc();
		});
	})();
	
	/*
	 * Print */
	( function () {
		var button = $('#print'),
			printView = $('#printView'),
			titleElem = $('h1.title', printView),
			descElem = $('p.description', printView),
			tableElem = $('div.table', printView);
		
		button.bind('click', function () {
			//View.setActiveView('print');
			
			Budget.getBudgetLines(35, function (rows) {
				var table = makeCleanBudgetTable(rows);
				
				Budget.getTitle( function (title) {
					titleElem.text( title );
				});
				Budget.getDescription( function (desc) {
					descElem.text( desc );
				});
				
				tableElem.html( table );
			});
			
			
			window.print();
		});
	})();
	
	/*
	 * Export budget */
	( function () {
		var button = $('#export_budget');
		
		button.bind('click', function () {
			$.get('ajax/export_budget.html', {}, function (res) {
				$.fancybox({
					content: res,
					width: 500,
					height: 500,
					padding: 0,
					autoDimensions: false,
					overlayShow: false,
					onComplete: function () {
						Budget.exportToJSON(null, function (json) {
							$('#fancybox-outer').find('textarea').val( json )
						});
					}
				});
			}, 'html');
		});
		
		$('#fancybox-outer').delegate('textarea', 'focus', function (e) {
			e.preventDefault();
			// $(this).select(); TODO: make it work
		});
	})();
	
	/*
	 * Import budget */
	( function () {
		var button = $('#import_budget');
		
		button.bind('click', importBudgetFunc);
		
		$('#fancybox-outer').delegate('#import_budget_form', 'submit', function (e) {
			e.preventDefault();
			
			var json = $('textarea[name="json"]', this).val();
			
			Budget.importFromJSON(json, function (budgetId) {
				Budget.getBudgets( refreshBudgetList );
				Budget.loadBudget( budgetId );
				
				budgetList.children().removeClass('selected').filter('li[data-budget-id="' + budgetId + '"]').addClass('selected');
			});
		});
	})();

	
	/*
	 * General fancybox */
	( function () {
		$('#fancybox-outer').delegate('input.cancel', 'click', function () {
			$.fancybox.close();
		});
	})();
});