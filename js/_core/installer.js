jQuery( function ($) {
	var Core = _budgetter,
		db,
		
		body = $('body'),
		
		coreFeatures = ['websqldatabase', 'localstorage'],
		
		// Called after the application has been installed
		startApplication = function () {
			body.load('pages/application.html', function () {
				Core.loadAllModules();
				localStorage.setItem('app_installed', 1);
			});
		},
		
		// Installs the application, by executing all the required sql
		// found in the 'sql/install.sql' file
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
		
		// Checks to see if the browser supports all the required
		// core features
		testFeatures = function (features) {
			var numErrors = 0,
				supports = {};
			
			for (i = 0; i < features.length; i++) {
				supports[features[i]] = true;
				
				if (!Modernizr[features[i]]) {
					numErrors++;				
					
					supports[features[i]] = false;
				}
			}
			
			if (numErrors > 0) {
				body.data('missing_features', supports).load('pages/unsupported.html')
				
				return false;
			}
			
			db = Core.getDB();
			
			return true;
		};
	
	// Application is already installed, start it	
	if (Modernizr.localstorage && !!localStorage.getItem('app_installed')) {
		startApplication();
	} else {
		// Application is not installed, check if the browser can install it
		if ( testFeatures(coreFeatures) ) {
			install();
		}
	};
});