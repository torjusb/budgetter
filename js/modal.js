(function (window) {
	var Core = _budgetter;
	
	var Modal = function () {
		var _wrapper 	= $('<aside id="modalWrapper" />'),
			_header 	= $('<header class="header" />').appendTo(_wrapper),
			_title 		= $('<h1 />').appendTo(_header),
			_content 	= $('<div class="content" />').appendTo(_wrapper),
			_cancel		= $('<button class="button cancel">Cancel</button>').appendTo(_wrapper),
			_confirm	= $('<button class="button confirm">Confirm</button>').appendTo(_wrapper);
			
		_wrapper.appendTo('body').hide();
		
		var center = function () {
			var windowWidth = $(document).width(),
				modalWidth = _wrapper.outerWidth();
				
			_wrapper.css('left', (windowWidth / 2) - (modalWidth / 2));
		};
		
		return {
			open: function (options) {
				this.setTitle( options.title );
				this.setContent( options.content );
				
				center();
				
				_wrapper.fadeIn();
			},	
			inform: function (content) {
			
			},
			warn: function (content) {
			
			},
			error: function (content) {
			
			},
			
			setTitle: function (title) {
				_title.text( title );
				
				return this;
			},
			setContent: function (content) {
				_content.html( content );
				
				return this;
			}
		};
	}();
	
	/* 
	 * Test */
	
	Modal.open( {
		content:$('<div><p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div></p>'), title: 'test' } );
	
	Core.addModule('modal', Modal);
})(window);