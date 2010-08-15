jQuery( function ($) {
	var Core = _budgetter,
		db,
		
		body = $('body'),
		
		coreFeatures = ['websqldatabase', 'localstorage'],
	
		startApplication = function () {
			body.load('pages/application.html', function () {
				Core.loadAllModules();
			});
		},
		
		install = function () {
			$.get('sql/install.sql', {}, function (data) {
				var sql = data.split("\n");
				
				db.transaction ( function (tx) {
					var count = 0;
					for (i = 0; i < sql.length; i++) {
						tx.executeSql(sql[i], [], function () {
							count++;
							if (count === sql.length) { // All statements executed
								startApplication();
							}
						});
					}
				});
			});
		},
		
		testFeatures = function (features) {
			var errors = 0, html = '<ul>';
			
			for (i = 0; i < features.length; i++) {
				if (!Modernizr[features[i]]) {
					errors++;
					html += '<li>' + features[i] + ' not supported</li>';
				}
				
			}
			html += '</ul>';
			
			if (errors > 0) {
				body.append(html);
				
				return false;
			}
			
			db = Core.getDB();
			
			return true;
		};
		
	if ( testFeatures(coreFeatures) ) {
		install();
	};
});