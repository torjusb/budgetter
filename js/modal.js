(function (window) {
	var Core = _budgetter;
	
	var templateStr = function (str, data) {
		return str.replace(/\{([a-zA-Z1-9]+)\}/g, function (match, tag) {
			return data[tag] || '';
		});
	};
	
	var Modal = function () {
		var _modal 	= $('<aside id="modalWrapper" />'),
			//_header 	= $('<header class="header" />').appendTo(_modal),
			//_titleElem	= $('<h1 />').appendTo(_header),
			_content	= $('<div class="content" />').appendTo(_modal);
			
		_modal.appendTo('body').hide();
				
		var textElems = {
			title: '',
			caption: '',
			description: ''
		};
				
		var _center = function () {
			var windowWidth = $(document).width(),
				modalWidth = _modal.outerWidth();
				
			_modal.css('left', (windowWidth / 2) - (modalWidth / 2));
		};
		
		var _createButtons;
		(function () {
			var template = '<button>{name}</button>', html = '';
			
			_createButtons = function (buttons) {		
				$.each(buttons, function (name, callback) {
					html += templateStr(template, { name: name });
					this.callback = callback;
				});

				return ;
			};
		})();
				
/*
		_modal.delegate('button', 'click', function (e) {
			var button = $(this),
				action = button.attr('data-button-action');

			instance.confirmCallback && instance.confirmCallback(action);
			
			Modal.close();
		});
*/
		
		return {
			open: function (options) {
				var content;
				if (options instanceof jQuery) {
					content = options;
				} else {
					if (options.content instanceof jQuery === false) {
						content = $( options.content );
					} else {
						content = options.content;
					}
				}				
				this.setContent( content.show() );
				
				_createButtons(options.buttons);
				
				_center();
				this.show();
				
				return this;
			},
			close: function () {
				instance.confirmCallback = null;
				
				return this;
			},
			inform: function (content) {
				
			},
			warn: function (content) {
			
			},
			error: function (content) {
				
			},
			confirm: function (msg, callback) {
				var content = $( templateStr(confirmTmp, { description: msg }) );
				this.open( content );
				
				instance.confirmCallback = callback;
				return this;
			},
			
			setTitle: function (title) {
				_titleElem.text( title );
				
				return this;
			},
			setContent: function (content) {
				_content.html( content );
				
				return this;
			},
			setCaption: function (caption) {
				textElems.caption = caption;
				
				return this;
			},
			setDesciption: function (description) {
				textElems.description = description;
				
				return this;
			},
			
			show: function () {
				_modal.fadeIn();
			},
			hide: function () {
			
			}
		};
	}();
	
	/* 
	 * Test */
	
	Modal.open({
		content: 'asdf',
		buttons: {
			'do it': function () {
				console.log(' do ti');
			},
			'do it not': function () {
				
			}
		}
	});
	
	Core.addModule('modal', Modal);
})(window);