jQuery( function ($) {
	var Core = _budgetter,
		db,
		
		body = $('body'),
		
		coreFeatures = ['websqldatabase', 'localstorage'],
	
		startApplication = function () {
			body.load('pages/application.html', function () {
				Core.loadAllModules();
				localStorage.setItem('app_installed', 1);
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
			var numErrors = 0,
				supports = {
			
				};
			
			for (i = 0; i < features.length; i++) {
				supports[features[i]] = true;
				
				if (!Modernizr[features[i]]) {
					numErrors++;				
					
					supports[features[i]] = false;
				}
			}
			
			if (numErrors > 0) {
				$('body').data('missing_features', supports).load('pages/unsupported.html')
				
				return false;
			}
			
			db = Core.getDB();
			
			return true;
		};
		
	if (Modernizr.localstorage && !!localStorage.getItem('app_installed')) {
		startApplication();
	} else {
		if ( testFeatures(coreFeatures) ) {
			install();
		}
	};
});