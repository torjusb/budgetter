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
		
		var _modalContent;
				
				
		var _center = function () {
			var windowWidth = $(document).width(),
				modalWidth = _modal.outerWidth();
				
			_modal.css('left', (windowWidth / 2) - (modalWidth / 2));
		};
		
		var _createButtons;
		(function () {
			var template = '<button class="modalButton {class}">{name}</button>',
				buttonSet = $('<div class="button-set" />');
			
			_createButtons = function (buttons) {
				buttonSet.empty();
				
				$.each(buttons, function (name, meta) {
					var button = $('<button />', {
						text: name,
						disabled: meta.disabled,
						click: meta.callback,
						'class': 'modal-button ' + meta.class
					});
					
					button.appendTo(buttonSet);					
				});
				

				return buttonSet;
			};
		})();
		
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
				_modalContent = content;
				
				if (options.buttons) {
					var buttons = _createButtons(options.buttons);
					buttons.appendTo(_modal);
				}
				
				_center();
				this.show();
				
				return this;
			},
			close: function () {
				_modal.fadeOut(300, function () {
					_modalContent.trigger('MODAL_WINDOW_CLOSED').appendTo('#settingsWrap');
					_modalContent = null;
					_content.empty();
				});
				
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
	
/*
	Modal.open({
		content: 'asdf',
		buttons: {
			'Cancel': {
				'class': 'cancel',
				callback: function (e) {
					Modal.close();
				}
			},
			'Confirm': {
				'class': 'confirm',
				callback: function (e) {
					console.log('confirm');
				}
			}
		}
	});
*/
	
	Core.addModule('modal', Modal);
})(window);