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
		
			/**
			 * Creates a new budget
			 *
			 * @param {String} budget_name Name of the budget to be created
			 */
			newBudget: function (budget_name) {		
				db.transaction( function (tx) {
					tx.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (tx, res) {
						Budget.loadBudget(res.insertId);
						
						jQuery.event.trigger('CREATED_NEW_BUDGET');
					}, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Adds a new line to a budget
			 *
			 * @param {String} type Type of line to be added, 'outcome' or 'income'
			 * @param {String} text Text to be added to the line
			 * @param {Int} parent_id Id of the line above
			 * @param {Int} budget_id Id of the budget the line should be added to
			 */
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
			
			/**
			 * Update line with new text
			 * 
			 * @param {String} text New text of the line
			 * @param {Int} line_id Id of the line
			 * @param {Int} budget_id Id of the budget the line belongs to
			 */
			updateLine: function (text, line_id, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE lines SET text = ? WHERE id = ? AND budget_id = ?', [text, line_id, budget_id], function () {
						jQuery.event.trigger('LINE_UPDATED');
					}, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Removes a line from a budget
			 *
			 * @param {Int} line_id Id of line to be removed
			 * @param {Int} budget_id Id of budget the line belongs to
			 * @param {Function} callback Function called when the line is removed
			 */
			removeLine: function (line_id, positions, budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('DELETE FROM lines WHERE id = :line_id', [line_id], function (tx, res) {
						if (positions) {
							tx.executeSql('UPDATE lines SET parent_id = ? WHERE id = ? AND budget_id = :budget_id', [positions.setParent, positions.id, budget_id], null, Core.dbErrorHandler);	
						}
						
						callback && callback();
						
						jQuery.event.trigger('LINE_REMOVED');
					}, Core.dbErrorHandler)
				});
			},
			
			/**
			 * Updates multiple lines with new positions
			 *
			 * @param {Object} positions Object containing the new positions of the lines
			 * @param {Int} budget_id Id of the budget the lines belong to
			 */			
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
			
			/**
			 * Get a list of all the budgets
			 *
			 * @param {Function} callback Function called after the sql has been executed
			 * @return {Function} The callback function executed with an object containing the budgets as first argument
			 */
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
			
			/**
			 * Load a budget by id
			 *
			 * @param {Int} budget_id Id of budget to be loaded
			 * @param {Function} callback Function to be executed once the sql finishes
			 */
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
			
			/**
			 * Get all lines belonging to a budget
			 *
			 * @param {Int} budget_id Id of budget containing the lines
			 * @param {Function} callback Function to be executed once the sql finishes
			 */
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
			
			/**
			 * Exports a budget as JSON
			 *
			 * @param {Int} budget_id Id of budget
			 * @param {Function} callback Function to be executed once the sql finishes
			 */
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
							}
						
							var json = JSON.stringify(obj, null, '\t');
							
							callback && callback(json);
						});
					}, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Creates a budget from a JSON object
			 *
			 * @param {String} json JSON-string containging the budget and its lines
			 * @param {Function} callback Function to be executed once the budget has been added
			 */
			importFromJSON: function (json, callback) {
				json = JSON.parse(json);

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
							});
						})();
					
					}, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Get budgets by status
			 *
			 * @param {String} status Status of the budgets
			 * @param {Function} callback Function executed once the sql finishes
			 */
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
			
			/**
			 * Update a budget and set new status
			 *
			 * @param {String} status New status of budget
			 * @param {Int} budget_id Id of budget to update
			 * @param {Function} callback Function executed once the sql finishes
			 */
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
			
			/**
			 * Moves a budget to the trash
			 *
			 * @param {Int} budget_id Id of budget to be deleted
			 * @param {Function} callback Function executed once the sql finishes
			 */
			removeBudget: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET status = "deleted" WHERE id = ?', [budget_id], function (tx, res) {
						callback && callback(res);
					}, null, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Moves a budget to the logbook
			 *
			 * @param {Int} budget_id Id of the budget to be logged
			 * @param {Function} callback Function executed once the sql finishes
			 */
			logBudget: function (budget_id, callback) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET status = "logged" WHERE id = ?', [budget_id], function (tx, res) {
						callback && callback(res);
					}, null, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Updates a budget and sets a new description
			 *
			 * @param {String} description The new description of the budget
			 * @param {Int} budget_id Id of the budget to be updated
			 */
			setDescription: function (description, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET description = ? WHERE id = ?', [description, budget_id], null, Core.dbErrorHandler);
				});
			},
			
			/**
			 * Get the description of a budget
			 *
			 * @param {Function} callback Function executed once the sql finishes with the description as the first argument
			 * @param {Int} budget_id Id of the budget to retrieve description from
			 */
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
			
			/**
			 * Updates a budget and sets a new title
			 *
			 * @param {String} title The new title of the budget
			 * @param {Int} budget_id Id of the budget to be updated
			 */
			setTitle: function (title, budget_id) {
				budget_id = budget_id || loadedBudget;
				
				db.transaction( function (tx) {
					tx.executeSql('UPDATE budgets SET name = ? WHERE id = ?', [title, budget_id]);
				});
			},
			
			/**
			 * Get the title of a budget
			 *
			 * @param {Function} callback Function executed once the sql finishes with the title as the first argument
			 * @param {Int} budget_id Id of the budget to retrieve title from
			 */
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
			
			/**
			 * Adds a new calculation pattern
			 *
			 * @param {Int} priority Sets the priority of the calculation. The higher the priority, the earlier it's checked
			 * @param {RegExp} regex The regexp the text is matched against
			 * @param {Function} fn Function executed when the regexp is matched against the text. The return value of this function is used as the result
			 */
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
			
			/**
			 * Parse an outcome or income
			 *
			 * @param {String} text String to be parsed
			 * @return {Int} Number returned by the calculation the string matched against, else 0
			 */
			parseExpense: function (text) {
				for (y = 0; y < calculations.length; y++) {
					var cal = calculations[y];
					if (cal.match.test(text)) {
						
						return Math.round((cal.calculate(text, cal.match) || 0) * 100) / 100;
					}
				}

				return 0;
			}
		};
		
		return Budget;
	};

	
	Core.addModule('budget', Budget); 
})(window);