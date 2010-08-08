(function () {
	var Core = _budgetter,
		db 	 = Core.getDB();
		
		
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
			
	/*
	 * API */
	var Budget = function () {
		var loadedBudget = localStorage.getItem('loadedBudget'),
		
			calculations = [];
		
		return {
			newBudget: function (budget_name) {		
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
						Budget.loadBudget(res.insertId);
						
						jQuery.event.trigger('CREATED_NEW_BUDGET');
					});
				});
			},
			addLine: function (text, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO lines (budget_id, text, line_number, type) VALUES (?, ?, 1, "normal")', [budget_id, text]);
					
					jQuery.event.trigger('LINE_ADDED');
				});
			},
			updateLine: function (text, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE lines SET text = ? WHERE budget_id = ?', [text, budget_id]);
				});
			},
			getBudgets: function (callback) {
				db.transaction( function (tx) {		
					tx.executeSql('SELECT * FROM budgets', [], function (tx, res) {
						var budgets = {};
						
						for (i = 0; i < res.rows.length; i++) {
							budgets[i] = res.rows.item(i);
						}
						budgets.length = res.rows.length;
											
						return callback(budgets);
					});
				});
			},
			loadBudget: function (budget_id) {
				localStorage.setItem('loadedBudget', budget_id);
				loadedBudget = budget_id;
				
				var budgetTable = $('#budget').find('tbody').empty();
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (tx, result) {
						var html = '';
						
						for (i = 0; i < result.rows.length; i++) {
							var row = result.rows.item(i),
								expense = Budget.parseExpense( row.text );
								
							html = html + '<tr><th contenteditable data-id="' + row.id + '">' + row.text + '</th><td>' + expense + '</td></tr>';
						};
						
						budgetTable.append( html );
						
						jQuery.event.trigger('BUDGET_LOADED', {budget_id: budget_id});
					});
				});
			},
			setDescription: function (description, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET description = ? WHERE id = ?', [description, budget_id]);
				});
			},
			getDescription: function (callback, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT description FROM budgets WHERE id = ?', [budget_id], function (tx, res) {
						callback(res.rows.item(0).description);
					});
				}, Core.dbErrorHandler);
			},
			setTitle: function (title, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET name = ? WHERE id = ?', [title, budget_id]);
				});
			},
			getTitle: function (callback, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT name FROM budgets WHERE id = ?', [budget_id], function (tx, res) {
						callback(res.rows.item(0).name);
					});
				}, Core.dbErrorHandler);
			},
			addCalculation: function (priority, regex, fn) {
				var obj = {
					priority: priority,
					match: regex,
					calculate: fn
				};
				
				calculations.push(obj);
				calculations.sort( function (a, b) {
					return a.priority < b.priority;
				});
			},
			parseExpense: function (text) {
				for (y = 0; y < calculations.length; y++) {
					var cal = calculations[y];
					if (cal.match.test(text)) {
						return cal.calculate(text, cal.match);
					}
				}

				return 0;
			},
			getTotal: function () {
				var total = 0,
					numberCol = $('#budget tbody').find('td');

				numberCol.each( function () {
					total += parseFloat( $(this).text() );
				});
				
				return total;
			}
		};
	}();
		
	/*
	 * UI Handlers */
	jQuery( function ($) {
		$('#main').delegate('th', 'focusin focusout', function (e) {
			var elem = $(this),
				isNew = !!parseInt( elem.attr('data-is-new') );
						
			switch (e.type) {
				case 'focusout':
					Budget.addLine( elem.text() );
				case 'focusin':
					if (isNew) {
						$('<tr><th contenteditable data-is-new="1"></th><td></td></tr>').insertAfter( elem.parent() );
						elem.attr('data-is-new', 0);
					}
			}			
		});
		

	});
	
	
	Core.addModule('budget', Budget); 
})(window);