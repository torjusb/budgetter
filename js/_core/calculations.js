$(document).bind('ALL_MODULES_LOADED', function () {
	var Budget = _budgetter.getModule('budget');
	
	// Number
	Budget.addCalculation(0, /-?(?:0|[1-9]\d{0,2}(?:,?\d{3})*)(?:\.\d+)?/, function (string, regex) {
		return parseFloat(string.match(regex));
	});
	
	// x a y
	Budget.addCalculation(50, /(\d+).*\sa\s(\d+)/, function (string, regex) {
	 	var matches = string.match(regex);
	 	
	 	return parseFloat(matches[1] * matches[2]);
	});
	
	// m(2+2)
	Budget.addCalculation(50, /m\(([\d+|\s+|+|\-|*|/|\^|\(|)]+)\)/, function (string, regex) {
	 	var equation = string.match(regex)[1];
	
	 	return eval('(' + equation + ')');
	});
	
	// 30% of 300
	Budget.addCalculation(55, /(\d+)%[\D|\s]*(\d+)/, function (string, regex) {
		var matches = string.match(regex),
			perc = matches[1], of = matches[2];
			
		return (perc * of) / 100 || 0;
	});
	
	// 300, 40% discount
	Budget.addCalculation(55, /(\d+)[\D|\s]*(\d+)%\s+discount/, function (string, regex) {
		var matches = string.match(regex),
			perc = matches[2], of = matches[1];
			
			discount = (perc * of) / 100;
			
		return of - discount || 0;
	});
});