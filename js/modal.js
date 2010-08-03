(function (window) {
	var Core = _budgetter;
	
	var Modal = (function () {	
		var wrapper = $('<aside id="modalWrapper" />').appendTo('body'),
			header = $('<header />').appendTo(wrapper)
			title = $('<h1 />').appendTo(header),
			content = $('<div class="content" />').appendTo(wrapper);

		return {
			setTitle: function (text) {
				return title.text( text );
			},
			setContent: function (elem) {
				return content.html( elem.show() );
			},
			center: function () {
				var clientWidth = $(window).width(),
					modalWidth = wrapper.outerWidth();

				wrapper.css('left', (clientWidth / 2) - (modalWidth / 2) );
			},
			show: function () {
				wrapper.fadeIn();
				Modal.center();
			}
		};
	})();
	
	Core.addModule('modal', Modal);
})(window);