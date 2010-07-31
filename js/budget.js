(function () {
	var Core = _budgetter;
	budget = {
		newBudget: function () {
		
		},
		addLine: function () {
		
		},
		loadBudget: function (budget_id) {
			Core.executeSql('SELECT * FROM lines JOIN budgets ON lines.budget_id = budgets.id WHERE budget_id = ?', [budget_id], function (result) {

			});
		}
	};
	
	budget.loadBudget(1);
	
	Core.addModule('budget', budget); 
})(window);