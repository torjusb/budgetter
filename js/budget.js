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
		
			calculations = [],
			
			_statuses = ['active', 'logged', 'deleted'];
			
			_sortBudgetLines = function (a, b, c) {
				if (a.parent_id === 0 || a.id === b.parent_id) {
					return -1;
				}
			};
		
		return {
			newBudget: function (budget_name) {		
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
						Budget.loadBudget(res.insertId);
						
						jQuery.event.trigger('CREATED_NEW_BUDGET');
					}, Core.dbErrorHandler);
				});
			},
			addLine: function (text, parent_id, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO lines (budget_id, text, type, parent_id) VALUES (?, ?, "normal", ?)', [budget_id, text, parent_id], function (tx, res) {
						tx.executeSql('SELECT max(id) AS new_id FROM lines', [], function (tx, res) {
							jQuery.event.trigger('LINE_ADDED', { newId: res.rows.item(0).new_id, text: text } );
						}, Core.dbErrorHandler);
					}, Core.dbErrorHandler);
				});
			},
			updateLine: function (text, line_id, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE lines SET text = ? WHERE id = ? AND budget_id = ?', [text, line_id, budget_id], null, Core.dbErrorHandler);
				});
			},
			updateLinePositions: function (positions, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					for (i = 0; i < positions.length; i++) {
						var pos = positions[i],
							sql = 'UPDATE lines SET parent_id = ? WHERE id = ? AND budget_id = ?';
						
						tx.executeSql(sql, [pos.setParent, pos.id, budget_id], null, Core.dbErrorHandler);
					};
				});
			},
			getBudgets: function (callback) {
				db.transaction( function (tx) {		
					tx.executeSql('SELECT * FROM budgets WHERE status = "active"', [], function (tx, res) {
						var budgets = {};
						
						for (i = 0; i < res.rows.length; i++) {
							budgets[i] = res.rows.item(i);
						}
						budgets.length = res.rows.length;
											
						return callback(budgets);
					}, Core.dbErrorHandler);
				});
			},
			// TODO: Rewrite to use callback insted?
			loadBudget: function (budget_id) {
				localStorage.setItem('loadedBudget', budget_id);
				loadedBudget = budget_id;
				
				var budgetTable = $('#budget').find('tbody').empty(),
					parentId = 0;

				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (tx, result) {
						var html = '', lines = [];
						
						for (i = 0; i < result.rows.length; i++) {
							lines.push(result.rows.item(i));
						};
						
						lines.sort( _sortBudgetLines );
						
						for (i = 0; i < lines.length; i++) {
							var row = lines[i],
								expense = Budget.parseExpense( row.text );
								
							html = html + '<tr><th contenteditable data-id="' + row.id + '" data-parent-id="' + parentId + '">' + row.text + '</th><td>' + expense + '</td></tr>';
							
							parentId = row.id;
						};
						
						budgetTable.empty().append( html );
						
						jQuery.event.trigger('BUDGET_LOADED', {budget_id: budget_id});
					}, Core.dbErrorHandler);
				});
			},
			getBudgetsByStatus: function (status, callback) {
				console.log(status.indexOf(_statuses));
				if (_statuses.indexOf(status) === -1) {
					throw new Error("Can't get budgets with status: " + status);
				}
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM budgets WHERE status = :status', [status], function (tx, res) {
						callback && callback(res);
					}, Core.dbErrorHandler);
				});
			},
			setBudgetStatus: function (status, budget_id, callback) {	
				if (_statuses.indexOf(status) === -1) {
					throw new Error("Can't set budget status to " + status);
				}
				
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET status = :status WHERE id = :budget_id', [status, budget_id], function (tx, res) {
						callback && callback();
					});
				});
			},
			removeBudget: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET status = "deleted" WHERE id = ?', [budget_id], function (tx, res) {
						callback && callback(res);
					}, null, Core.dbErrorHandler);
				});
			},
			logBudget: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET status = "logged" WHERE id = ?', [budget_id], function (tx, res) {
						callback && callback(res);
					}, null, Core.dbErrorHandler);
				});
			},
			setDescription: function (description, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET description = ? WHERE id = ?', [description, budget_id], null, Core.dbErrorHandler);
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

	
	Core.addModule('budget', Budget); 
})(window);