(function(window, $, picnic) {

    picnic.activeLayers = {};

    var layer = function()
    {
        picnic.controller.call(this);

        this.elements = ['content', 'closeButton', 'preloader', 'preloaderText'];
        this.attributes = ['disableBackdropClose', 'backdropCssModifier', 'ajaxUrl', 'ajaxTriggers'];
    };

    $.extend(layer.prototype, picnic.controller.prototype,
    {
        type: null,
        isLoading: false,
        isActive: false,
        backdropCssModifier: '',
        onTriggerClickCallback: null,

        init: function ()
        {
            this.initTransitionEndEvent();
            this.bindTriggers();
        },

        initTransitionEndEvent: function ()
        {
            this.transitionEndEvent = getTransitionEndEvent(this.root);
        },

        getTriggersSelector: function ()
        {
            return '*[data-' + this.type + '=' + this.root.prop('id') + ']';
        },

        bindTriggers: function ()
        {
            this.onTriggerClickCallback = this.onTriggerClick.bind(this);
            $('body').on('click', this.getTriggersSelector(), this.onTriggerClickCallback);
        },

        unbindTriggers: function ()
        {
            if(this.onTriggerClickCallback)
            {
                $('body').off('click', this.getTriggersSelector(), this.onTriggerClickCallback);
            }
        },

        bindEvents: function()
        {
            this.on('click', this.elements.closeButton, this.forceClose);
            this.on('picnic.backdrop.closed', this.close);
            this.on('picnic.' + this.type + '.opened', this.onOpened);
            this.on('picnic.' + this.type + '.closed', this.onClosed);

            if(this.transitionEndEvent)
            {
                this.on(this.transitionEndEvent, this.root, this.onTransitionEnd);
            }
        },

        onTriggerClick: function (event)
        {
            var target = $(event.target);
            var url = this.attributes.ajaxTriggers ? target.attr('href') : null;
            this.open(url);
            return false;
        },

        onLoaded: function(data)
        {
            if(data.html)
            {
                this.updateContent(data.html);
                picnic.event.trigger('picnic.' + this.type + '.loaded', this.root);
            }
        },

        updateContent: function (html)
        {
            this.elements.content.html(html);
            this.refresh();
        },

        showLoading: function(withText)
        {
            this.isLoading = true;
            this.root.addClass('is-loading');
            this.elements.content.empty();

            if(this.elements.preloaderText.length)
            {
                this.elements.preloaderText.toggle(withText);
            }
            if(this.elements.preloader.length)
            {
                this.elements.preloader.show();
            }
        },

        hideLoading: function()
        {
            this.isLoading = false;
            this.root.removeClass('is-loading');

            if(this.elements.preloader.length)
            {
                this.elements.preloader.hide();
            }
        },

        load: function(url)
        {
            if(this.isLoading) return;
            this.showLoading(true);

            $.ajax( {
                url: url,
                type: 'GET',
                success: this.onLoaded.bind(this),
                complete: this.hideLoading.bind(this)
            });
        },

        open: function(url)
        {
            if(this.isActive) return;
            this.isActive = true;

            picnic.scrollbar.disable();

            var backdropCssModifier = this.attributes.backdropCssModifier ? this.attributes.backdropCssModifier : this.backdropCssModifier;
            picnic.backdrop.open({cssModifier: backdropCssModifier, disableClose: this.attributes.disableBackdropClose});

            this.root.addClass('is-active');

            if(url = url ? url : this.attributes.ajaxUrl)
            {
                this.load(url);
            }

            picnic.activeLayers[this.type] = picnic.activeLayers[this.type].add(this.root);
            picnic.event.trigger('picnic.' + this.type + '.open', this.root);
            if(!this.transitionEndEvent)
            {
                picnic.event.trigger('picnic.' + this.type + '.opened', this.root);
            }
        },

        forceClose: function ()
        {
            picnic.backdrop.enableClose();
            this.close();
        },

        close: function()
        {
            if(!this.isActive) return;
            this.isActive = false;

            this.root.removeClass('is-active');

            picnic.activeLayers[this.type] = picnic.activeLayers[this.type].not(this.root);
            picnic.event.trigger('picnic.' + this.type + '.close', this.root);
            if(!this.transitionEndEvent)
            {
                picnic.event.trigger('picnic.' + this.type + '.closed', this.root);
            }

            if(!picnic.activeLayers[this.type].length)
            {
                picnic.scrollbar.enable();
                picnic.backdrop.close();
            }
        },

        onOpened: function ()
        {},

        onClosed: function()
        {},

        onTransitionEnd: function(event)
        {
            if(event.target !== event.currentTarget) return;

            var eventName = this.isActive ? 'picnic.' + this.type + '.opened' : 'picnic.' + this.type + '.closed';
            picnic.event.trigger(eventName, this.root);
        },

        destroy: function ()
        {
            this.unbindTriggers();
            picnic.controller.prototype.destroy.call(this);
        }
    });

    picnic.layer = layer;
    window.picnic = picnic;

    if(typeof exports === 'object')
    {
		module.exports = picnic.layer;
	}
	else if(typeof define === 'function' && define.amd)
	{
		define(function() { return picnic.layer; });
	}

}(window, jQuery, window.picnic || {}));