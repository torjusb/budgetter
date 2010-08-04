(function (window, undefined) {
	var Sandbox = function (Core) {
		
		return {
			sendNotification: function (type, data) {
				
			},
			
			require: function (extensionId) {
				var extension = Core.getExtension(extensionId);
				return extension;
			}
		}
	};
	
	window.Sandbox = Sandbox;
})(window);