(function () {
	var Core = _budgetter;		
		
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
			
	/*
	 * API */
	var Budget = function () {
		var loadedBudget = localStorage.getItem('loadedBudget'),
			db = Core.getDB();
		
			calculations = [],
			
			_statuses = ['active', 'logged', 'deleted'];
			
			_sortBudgetLines = function (a, b) {
				if (a.parent_id === 0 || a.id === b.parent_id) {
					return -1;
				}

				return +1;
			};
		
		Budget =  {
			newBudget: function (budget_name) {		
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
						Budget.loadBudget(res.insertId);
						
						jQuery.event.trigger('CREATED_NEW_BUDGET');
					}, Core.dbErrorHandler);
				});
			},
			addLine: function (type, text, parent_id, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO lines (budget_id, text, type, parent_id) VALUES (:budget_id, :text, :type, :parent_id)', [budget_id, text, type, parent_id], function (tx, res) {
						tx.executeSql('SELECT max(id) AS new_id FROM lines', [], function (tx, res) {
							jQuery('#budgetTables').children('div.' + type).find('tbody').trigger('LINE_ADDED_TO_BUDGET', { newId: res.rows.item(0).new_id, text: text, type: type } );
							jQuery.event.trigger('LINE_ADDED');
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
			removeLine: function (line_id, positions, budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('DELETE FROM lines WHERE id = :line_id', [line_id], function (tx, res) {
						if (positions) {
							tx.executeSql('UPDATE lines SET parent_id = ? WHERE id = ? AND budget_id = :budget_id', [positions.setParent, positions.id, budget_id], null, Core.dbErrorHandler);	
						}
						
						callback && callback();
					}, Core.dbErrorHandler)
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
			loadBudget: function (budget_id, callback) {
				localStorage.setItem('loadedBudget', budget_id);
				loadedBudget = budget_id;
				
				var budgetTable = $('#budgetTables .outcome').find('tbody').empty(),
					parentId = 0;

				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (tx, result) {
						var html = '',
							lines = {
								outcome: [],
								income: []
							}
													
						for (i = 0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							
							lines[row.type].push(row);
						};
						
						lines.outcome.sort( _sortBudgetLines );
						lines.income.sort( _sortBudgetLines );
						
						
						callback && callback(lines);
						
						jQuery.event.trigger('BUDGET_LOADED', {budget_id: budget_id});
					}, Core.dbErrorHandler);
				});
			},
			getBudgetLines: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('SELECT * FROM lines WHERE budget_id = :budget_id', [budget_id], function (tx, res) {
						var lines = [];
						
						for (i = 0; i < res.rows.length; i++) {
							var row = res.rows.item(i);
							
							lines.push(row);
						}
						
						lines.sort( _sortBudgetLines );
						
						callback && callback( lines );
					});
				});
			},
			exportToJSON: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					var obj = {};

					tx.executeSql('SELECT * FROM budgets WHERE id = :budget_id', [budget_id], function (tx, res) {
						var row = res.rows.item(0);
						
						obj.name = row.name;
						obj.description = row.description || '';
						obj.status = row.status;
						
						tx.executeSql('SELECT * FROM lines WHERE budget_id = :budget_id', [budget_id], function (tx, res) {
							obj.lines = [];
							for (i = 0; i < res.rows.length; i++) {
								var row = res.rows.item(i),
									line = {
										text: row.text,
										type: row.type
									};
									
								obj.lines.push(line);
								
								var json = JSON.stringify(obj, null, '\t');
								
								callback && callback(json);
							}
						});
					}, Core.dbErrorHandler);
				});
			},
			importFromJSON: function (json, callback) {
				json = JSON.parse(json);
				// tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
				db.transaction( function (tx) {				
					tx.executeSql('INSERT INTO budgets (name, description, status) VALUES (:name, :description, :status)', [json.name, json.description, json.status], function (tx, res) {
						var newBudgetId = res.insertId, i = 0;
						
						( function () {
							var line = json.lines[i], parId = 0, caller = arguments.callee;
							
							if (i === json.lines.length) {
								callback && callback(newBudgetId);
								return;
							}
							tx.executeSql('INSERT INTO lines (text, type, parent_id, budget_id) VALUES (:text, :type, :parent_id, :budget_id)', [line.text, line.type, parId, newBudgetId], function (tx, res) {
								parId = res.insertId;
								i++;
								caller();
								return;
							}, function (tx, err) {
								console.log('err', err);
							});
						})();
					
					}, Core.dbErrorHandler);
				});
			},
			getBudgetsByStatus: function (status, callback) {
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
						if (res.rows.length > 0) {
							callback && callback(res.rows.item(0).description);
						}
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
						if (res.rows.length > 0) {
							callback && callback(res.rows.item(0).name);
						}
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
			}
		};
		
		return Budget;
	};

	
	Core.addModule('budget', Budget); 
})(window);