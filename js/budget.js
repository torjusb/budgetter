(function () {
	var Core = _budgetter;
	
	/*
	 * API */
	var Budget = function () {
		var _loadedBudget;
		
		return {
			newBudget: function (budget_name) {
				Core.executeSql('INSERT INTO budgets (name) VALUES (?)', [budget_name], function (res) {
					Budget.loadBudget(res.insertId);
				});
			},
			addLine: function (text) {
				Core.executeSql('INSERT INTO lines (budget_id, text, line_number, type) VALUES (?, ?, 1, "normal")', [_loadedBudget, text]);
			},
			updateLine: function (text, budget_id) {
				Core.executeSql('UPDATE lines SET text = ? WHERE budget_id = ?', [text, budget_it]);	
			},
			loadBudget: function (budget_id) {
				_loadedBudget = budget_id;
				
				$('#budget').find('tbody').empty();
				
				Core.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (result) {
					var html = '';
	
					for (i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						html = html + '<tr><th contenteditable data-is-new="0" data-id="' + row.id + '">' + row.text + '</th><td>asdf</td></tr>';
					};
					html += '<tr><th contenteditable data-is-new="1"></th><td></td></tr>';
					
					$('#budget').find('tbody').append( html );
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
	});
	
	Budget.loadBudget(5);
	
	Core.addModule('budget', Budget); 
})(window);