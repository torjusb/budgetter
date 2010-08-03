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
		return {
			newBudget: function (budget_name) {
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
						Budget.loadBudget(res.insertId);
					});
				});
			},
			addLine: function (text) {
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO lines (budget_id, text, line_number, type) VALUES (?, ?, 1, "normal")', [localStorage.getItem('loadedBudget'), text]);
				});
			},
			updateLine: function (text, budget_id) {
				db.transaction( function (tx) {
					tx.executeSql('UPDATE lines SET text = ? WHERE budget_id = ?', [text, budget_it]);
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
				
				$('#budget').find('tbody').empty();
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (tx, result) {
						var html = '';
		
						for (i = 0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							html = html + '<tr><th contenteditable data-is-new="0" data-id="' + row.id + '">' + row.text + '</th><td>asdf</td></tr>';
						};
						html += '<tr><th contenteditable data-is-new="1"></th><td></td></tr>';
						
						$('#budget').find('tbody').append( html );
					});
				});
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
		
		var budgetList = $('#budgets');
		Budget.getBudgets( function (budgets) {
			var html, template = '<li data-budget-id="{id}">{name}</li>';

			for (i = 0; i < budgets.length; i++) {
				html += templateStr( template, { id: budgets[i].id, name: budgets[i].name } );
			}
			
			$( html ).appendTo(budgetList);
		});
		
		budgetList.delegate('li', 'click', function (e) {
			Budget.loadBudget( $(this).attr('data-budget-id') );
		});
	});

	
	Budget.loadBudget( localStorage.getItem('loadedBudget') || 1 );
	
	Core.addModule('budget', Budget); 
})(window);