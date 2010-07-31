(function () {
	var Core = _budgetter;
	
	/*
	 * API */
	budget = {
		newBudget: function () {
		
		},
		addLine: function (text) {
			Core.executeSql('INSERT INTO lines (budget_id, text, line_number, type) VALUES (1, ?, 1, "normal")', [text]);
		},
		updateLine: function (text, budget_id) {
			Core.executeSql('UPDATE lines SET text = ? WHERE budget_id = ?', [text, budget_it]);	
		},
		loadBudget: function (budget_id) {
			Core.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (result) {
				var html = '';

				for (i = 0; i < result.rows.length; i++) {
					var row = result.rows.item(i);
					
					html = html + '<tr><th contenteditable data-is-new="0" data-id="' + row.id + '>' + row.text + '"></th><td>asdf</td></tr>';
				};
				html += '<tr><th contenteditable data-is-new="1"></th><td></td></tr>';
				
				$('#budget').find('tbody').append( html );
			});
		}
	};
	
	/*
	 * UI Handlers */
	jQuery( function ($) {
		$('#main').delegate('th', 'focusin focusout', function (e) {
			var elem = $(this),
				isNew = !!parseInt( elem.attr('data-is-new') );
						
			switch (e.type) {
				case 'focusout':
					budget.addLine( elem.text() );
				case 'focusin':
					if (isNew) {
						$('<tr><th contenteditable data-is-new="1"></th><td></td></tr>').insertAfter( elem.parent() );
						elem.attr('data-is-new', 0);
					}
			}			
		});
	});
	
	budget.loadBudget(1);
	
	Core.addModule('budget', budget); 
})(window);