(function (window, undefined) {		
	var Core = function () {
		var moduleData = {}, extensions = {};
		
		var createInstance = function (moduleId) {
			var instance = moduleData[moduleId].instance = moduleData[moduleId].class( new Sandbox(Core) );
			
			return instance;
		};
		
		return {
			registerModule: function (moduleId, class) {
				moduleData[moduleId] = {
					'class': class,
					instance: null
				};
			},
			
			startModule: function (moduleId) {
				var instance = createInstance(moduleId);
				instance.init();				
			},
			stopModule: function (moduleId) {
				var module = moduleData[moduleId];
				if (module.instance) {
					module.instance.destroy && module.instance.destroy();
					module.instance = null;
				}
			},
			
			startAllModules: function () {
				for (moduleId in moduleData) {
					if (moduleData.hasOwnProperty(moduleId)) {
						this.startModule(moduleId);
					}
				};
			},
			stopALlModules: function () {
				for (moduleId in moduleData) {
					if (moduleData.hasOwnProperty(moduleId)) {
						this.stopModule(moduleId);
					}
				}
			},
			
			addExtension: function (extensionId, class) {
				extensions[extensionId] = new class;
			},
			getExtension: function (extensionId) {
				return extensions[extensionId];
			}
		};
	}();
		
	document.addEventListener("DOMContentLoaded", function () {
		Core.startAllModules()
	}, false);
	
	window.Core = Core;
})(window);