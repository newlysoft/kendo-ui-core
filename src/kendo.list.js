(function(f, define){
    define([ "./kendo.data", "./kendo.popup" ], f);
})(function(){

var __meta__ = {
    id: "list",
    name: "List",
    category: "framework",
    depends: [ "data", "popup" ],
    hidden: true
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        keys = kendo.keys,
        support = kendo.support,
        htmlEncode = kendo.htmlEncode,
        activeElement = kendo._activeElement,
        ObservableArray = kendo.data.ObservableArray,
        ID = "id",
        LI = "li",
        CHANGE = "change",
        CHARACTER = "character",
        FOCUSED = "k-state-focused",
        HOVER = "k-state-hover",
        LOADING = "k-loading",
        OPEN = "open",
        CLOSE = "close",
        SELECT = "select",
        SELECTED = "selected",
        PROGRESS = "progress",
        REQUESTEND = "requestEnd",
        WIDTH = "width",
        extend = $.extend,
        proxy = $.proxy,
        browser = support.browser,
        isIE8 = browser.msie && browser.version < 9,
        quotRegExp = /"/g,
        alternativeNames = {
            "ComboBox": "DropDownList",
            "DropDownList": "ComboBox"
        };

    var List = kendo.ui.DataBoundWidget.extend({
        init: function(element, options) {
            var that = this,
                ns = that.ns,
                id;

            Widget.fn.init.call(that, element, options);
            element = that.element;
            options = that.options;

            that._isSelect = element.is(SELECT);

            if (that._isSelect && that.element[0].length) {
                if (!options.dataSource) {
                    options.dataTextField = options.dataTextField || "text";
                    options.dataValueField = options.dataValueField || "value";
                }
            }

            that.ul = $('<ul unselectable="on" class="k-list k-reset"/>')
                        .attr({
                            tabIndex: -1,
                            "aria-hidden": true
                        });

            that.list = $("<div class='k-list-container'/>")
                        .append(that.ul)
                        .on("mousedown" + ns, proxy(that._listMousedown, that));

            id = element.attr(ID);

            if (id) {
                that.list.attr(ID, id + "-list");
                that.ul.attr(ID, id + "_listbox");
            }

            that._header();
            that._accessors();
            that._initValue();
        },

        options: {
            valuePrimitive: false,
            headerTemplate: ""
        },

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (options && options.enable !== undefined) {
                options.enabled = options.enable;
            }
        },

        focus: function() {
            this._focused.focus();
        },

        readonly: function(readonly) {
            this._editable({
                readonly: readonly === undefined ? true : readonly,
                disable: false
            });
        },

        enable: function(enable) {
            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined ? true : enable)
            });
        },

        _listMousedown: function(e) {
            if (!this.filterInput || this.filterInput[0] !== e.target) {
                e.preventDefault();
            }
        },

        //TODO: should return promises
        _filterSource: function(filter, force) {
            var that = this;
            var options = that.options;
            var dataSource = that.dataSource;
            var expression = extend({}, dataSource.filter() || {});

            var removed = removeFiltersForField(expression, options.dataTextField);

            if ((filter || removed) && that.trigger("filtering", { filter: filter })) {
                return;
            }

            if (filter) {
                expression = expression.filters || [];
                expression.push(filter);
            }

            if (!force) {
                dataSource.filter(expression);
            } else {
                dataSource.read(expression);
            }
        },

        _header: function() {
            var that = this;
            var template = that.options.headerTemplate;
            var header;

            if ($.isFunction(template)) {
                template = template({});
            }

            if (template) {
                that.list.prepend(template);

                header = that.ul.prev();

                that.header = header[0] ? header : null;
                if (that.header) {
                    that.angular("compile", function(){
                        return { elements: that.header };
                    });
                }
            }
        },

        _initValue: function() {
            var that = this,
                value = that.options.value;

            if (value !== null) {
                that.element.val(value);
            } else {
                value = that._accessor();
                that.options.value = value;
            }

            that._old = value;
        },

        _ignoreCase: function() {
            var that = this,
                model = that.dataSource.reader.model,
                field;

            if (model && model.fields) {
                field = model.fields[that.options.dataTextField];

                if (field && field.type && field.type !== "string") {
                    that.options.ignoreCase = false;
                }
            }
        },

        current: function(candidate) {
            return this.listView.focus(candidate);
        },

        items: function() {
            return this.ul[0].children;
        },

        destroy: function() {
            var that = this;
            var ns = that.ns;

            Widget.fn.destroy.call(that);

            that._unbindDataSource();

            that.listView.destroy();
            that.list.off(ns);

            if (that._touchScroller) {
                that._touchScroller.destroy();
            }

            that.popup.destroy();

            if (that._form) {
                that._form.off("reset", that._resetHandler);
            }
        },

        dataItem: function(index) {
            var that = this;

            if (index === undefined) {
                index = that.selectedIndex;
            } else if (typeof index !== "number") {
                index = $(that.items()).index(index);
            }

            return that.listView.data()[index];
        },

        _accessors: function() {
            var that = this;
            var element = that.element;
            var options = that.options;
            var getter = kendo.getter;
            var textField = element.attr(kendo.attr("text-field"));
            var valueField = element.attr(kendo.attr("value-field"));

            if (!options.dataTextField && textField) {
                options.dataTextField = textField;
            }

            if (!options.dataValueField && valueField) {
                options.dataValueField = valueField;
            }

            that._text = getter(options.dataTextField);
            that._value = getter(options.dataValueField);
        },

        _aria: function(id) {
            var that = this,
                options = that.options,
                element = that._focused.add(that.filterInput);

            if (options.suggest !== undefined) {
                element.attr("aria-autocomplete", options.suggest ? "both" : "list");
            }

            id = id ? id + " " + that.ul[0].id : that.ul[0].id;

            element.attr("aria-owns", id);

            that.ul.attr("aria-live", !options.filter || options.filter === "none" ? "off" : "polite");
        },

        //TODO: this should go into list "change|select" event
        _blur: function() {
            var that = this;

            that._change();
            that.close();
        },

        _change: function() {
            var that = this,
                index = that.selectedIndex,
                optionValue = that.options.value,
                value = that.value(),
                trigger;

            if (that._isSelect && !that._bound && optionValue) {
                value = optionValue;
            }

            if (value !== that._old) {
                trigger = true;
            } else if (index !== undefined && index !== that._oldIndex) {
                trigger = true;
            }

            if (trigger) {
                that._old = value;
                that._oldIndex = index;

                // trigger the DOM change event so any subscriber gets notified
                that.element.trigger(CHANGE);

                that.trigger(CHANGE);
            }
        },

        _data: function() {
            return this.dataSource.view();
        },

        _enable: function() {
            var that = this,
                options = that.options,
                disabled = that.element.is("[disabled]");

            if (options.enable !== undefined) {
                options.enabled = options.enable;
            }

            if (!options.enabled || disabled) {
                that.enable(false);
            } else {
                that.readonly(that.element.is("[readonly]"));
            }
        },

        _dataValue: function(dataItem) {
            var value = this._value(dataItem);

            if (value === undefined) {
                value = this._text(dataItem);
            }

            return value;
        },

        //TODO: call this after ListView binding
        _height: function(length) {
            if (length) {
                var that = this,
                    list = that.list,
                    height = that.options.height,
                    visible = that.popup.visible(),
                    offsetTop,
                    popups;

                popups = list.add(list.parent(".k-animation-container")).show();

                height = that.ul[0].scrollHeight > height ? height : "auto";

                popups.height(height);

                if (height !== "auto") {
                    offsetTop = that.ul[0].offsetTop;

                    if (offsetTop) {
                        height = list.height() - offsetTop;
                    }
                }

                that.ul.height(height);

                if (!visible) {
                    popups.hide();
                }
            }
        },

        _adjustListWidth: function() {
            var list = this.list,
                width = list[0].style.width,
                wrapper = this.wrapper,
                computedStyle, computedWidth;

            if (!list.data(WIDTH) && width) {
                return;
            }

            computedStyle = window.getComputedStyle ? window.getComputedStyle(wrapper[0], null) : 0;
            computedWidth = computedStyle ? parseFloat(computedStyle.width) : wrapper.outerWidth();

            if (computedStyle && browser.msie) { // getComputedStyle returns different box in IE.
                computedWidth += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
            }

            if (list.css("box-sizing") !== "border-box") {
                width = computedWidth - (list.outerWidth() - list.width());
            } else {
                width = computedWidth;
            }

            list.css({
                fontFamily: wrapper.css("font-family"),
                width: width
            })
            .data(WIDTH, width);

            return true;
        },

        _openHandler: function(e) {
            this._adjustListWidth();

            if (this.trigger(OPEN)) {
                e.preventDefault();
            } else {
                this._focused.attr("aria-expanded", true);
                this.ul.attr("aria-hidden", false);
            }
        },

        _closeHandler: function(e) {
            if (this.trigger(CLOSE)) {
                e.preventDefault();
            } else {
                this._focused.attr("aria-expanded", false);
                this.ul.attr("aria-hidden", true);
            }
        },

        //use length of the items in ListView
        _firstOpen: function() {
            this._height(this.listView.data().length);
        },

        _popup: function() {
            var that = this;

            that.popup = new ui.Popup(that.list, extend({}, that.options.popup, {
                anchor: that.wrapper,
                open: proxy(that._openHandler, that),
                close: proxy(that._closeHandler, that),
                animation: that.options.animation,
                isRtl: support.isRtl(that.wrapper)
            }));

            that.popup.one(OPEN, proxy(that._firstOpen, that));
            that._touchScroller = kendo.touchScroller(that.popup.element);
        },

        //TODO: This should be done on every update of VirtualList
        _makeUnselectable: function() {
            if (isIE8) {
                this.list.find("*").not(".k-textbox").attr("unselectable", "on");
            }
        },

        _toggleHover: function(e) {
            $(e.currentTarget).toggleClass(HOVER, e.type === "mouseenter");
        },

        _toggle: function(open, preventFocus) {
            var that = this;
            var touchEnabled = support.touch && support.MSPointers && support.pointers;

            open = open !== undefined? open : !that.popup.visible();

            if (!preventFocus && !touchEnabled && that._focused[0] !== activeElement()) {
                that._focused.focus();
            }

            that[open ? OPEN : CLOSE]();
        },

        _triggerCascade: function(userTriggered) {
            var that = this,
                value = that.value();

            if ((!that._bound && value) || that._old !== value) {
                that.trigger("cascade", { userTriggered: userTriggered });
            }
        },

        _unbindDataSource: function() {
            var that = this;

            that.dataSource.unbind(PROGRESS, that._progressHandler)
                           .unbind(REQUESTEND, that._requestEndHandler)
                           .unbind("error", that._errorHandler);
        }
    });

    extend(List, {
        inArray: function(node, parentNode) {
            var idx, length, siblings = parentNode.children;

            if (!node || node.parentNode !== parentNode) {
                return -1;
            }

            for (idx = 0, length = siblings.length; idx < length; idx++) {
                if (node === siblings[idx]) {
                    return idx;
                }
            }

            return -1;
        }
    });

    kendo.ui.List = List;

    //Could we remove the SELECT list from here!!!
    ui.Select = List.extend({
        init: function(element, options) {
            List.fn.init.call(this, element, options);
            this._initial = this.element.val();
        },

        setDataSource: function(dataSource) {
            this.options.dataSource = dataSource;

            this._dataSource();
            this._bound = false;

            this.listView.setDataSource(this.dataSource);

            if (this.options.autoBind) {
                this.dataSource.fetch();
            }
        },

        close: function() {
            this.popup.close();
        },

        select: function(li) {
            var that = this;

            if (li === undefined) {
                return that.selectedIndex;
            } else {
                this._select(li);

                that._triggerCascade();
                that._old = that._accessor();
                that._oldIndex = that.selectedIndex;
            }
        },

        search: function(word) {
            word = typeof word === "string" ? word : this.text();
            var that = this;
            var length = word.length;
            var options = that.options;
            var ignoreCase = options.ignoreCase;
            var filter = options.filter;
            var field = options.dataTextField;

            clearTimeout(that._typing);

            if (!length || length >= options.minLength) {
                that._state = "filter";
                if (filter === "none") {
                    that._filter(word);
                } else {
                    that._open = true;
                    that._filterSource({
                        value: ignoreCase ? word.toLowerCase() : word,
                        field: field,
                        operator: filter,
                        ignoreCase: ignoreCase
                    });
                }
            }
        },

        _accessor: function(value, idx) {
            return this[this._isSelect ? "_accessorSelect" : "_accessorInput"](value, idx);
        },

        _accessorInput: function(value) {
            var element = this.element[0];

            if (value === undefined) {
                return element.value;
            } else {
                element.value = value;
            }
        },

        _accessorSelect: function(value, idx) {
            var element = this.element[0];
            var selectedIndex = element.selectedIndex;
            var option;

            if (value === undefined) {
                option = element.options[selectedIndex];

                if (option) {
                    value = option.value;
                }
                return value || "";
            } else {
                if (selectedIndex > -1) {
                    element.options[selectedIndex].removeAttribute(SELECTED);
                }

                if (idx === undefined) {
                    idx = -1;
                }

                if (idx == -1 && value !== "") {
                    idx = this._custom(value);
                }

                element.selectedIndex = idx;
                option = element.options[idx];
                if (option) {
                   option.setAttribute(SELECTED, SELECTED);
                }
            }
        },

        _custom: function(value) {
            var that = this;
            var element = that.element;
            var custom = that._customOption;
            var idx = element[0].children.length - 1;

            if (!custom) {
                custom = $("<option/>");
                that._customOption = custom;

                element.append(custom);
                idx += 1;
            }

            custom.text(value);
            custom[0].selected = true;

            return idx;
        },

        _hideBusy: function () {
            var that = this;
            clearTimeout(that._busy);
            that._arrow.removeClass(LOADING);
            that._focused.attr("aria-busy", false);
            that._busy = null;
        },

        _showBusy: function () {
            var that = this;

            that._request = true;

            if (that._busy) {
                return;
            }

            that._busy = setTimeout(function () {
                if (that._arrow) { //destroyed after request start
                    that._focused.attr("aria-busy", true);
                    that._arrow.addClass(LOADING);
                }
            }, 100);
        },

        _requestEnd: function() {
            this._request = false;
        },

        _dataSource: function() {
            var that = this,
                element = that.element,
                options = that.options,
                dataSource = options.dataSource || {},
                idx;

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;

            if (that._isSelect) {
                idx = element[0].selectedIndex;
                if (idx > -1) {
                    options.index = idx;
                }

                dataSource.select = element;
                dataSource.fields = [{ field: options.dataTextField },
                                     { field: options.dataValueField }];
            }

            if (that.dataSource) {
                that._unbindDataSource();
            } else {
                that._progressHandler = proxy(that._showBusy, that);
                that._requestEndHandler = proxy(that._requestEnd, that);
                that._errorHandler = proxy(that._hideBusy, that);
            }

            that.dataSource = kendo.data.DataSource.create(dataSource)
                                   .bind(PROGRESS, that._progressHandler)
                                   .bind(REQUESTEND, that._requestEndHandler)
                                   .bind("error", that._errorHandler);
        },

        _move: function(e) {
            var that = this;
            var key = e.keyCode;
            var ul = that.ul[0];
            var down = key === keys.DOWN;
            var firstChild;
            var pressed;
            var current;

            if (key === keys.UP || down) {
                if (e.altKey) {
                    that.toggle(down);
                } else {
                    if (!this.listView.isBound()) {
                        //TODO: move this outside and accept callback. Thus value method can use it too.
                        if (!this._fetch) {
                            this.dataSource.one(CHANGE, function() {
                                that._move(e);
                                that._fetch = false;
                            });

                            that._fetch = true;
                            that._filterSource();
                        }

                        e.preventDefault();

                        return true; //pressed
                    }

                    current = that.listView.focus();

                    if (!this._fetch) {
                        if (down) {
                            that.listView.next();

                            if (!that.listView.focus()) {
                                that.listView.last();
                            }
                        } else {
                            that.listView.prev();

                            if (!that.listView.focus()) {
                                that.listView.first();
                            }
                        }
                    }

                    if (that.trigger(SELECT, { item: that.listView.focus() })) {
                        that.listView.focus(current); //revert focus
                        return;
                    }

                    that.listView.select(that.listView.focus());

                    if (!this.popup.visible()) {
                        this._blur();
                    }
                }

                e.preventDefault();
                pressed = true;
            } else if (key === keys.ENTER || key === keys.TAB) {
                if (that.popup.visible()) {
                    e.preventDefault();
                }

                var dataItem = this.listView.selectedDataItems();
                dataItem = dataItem[dataItem.length - 1];

                current = this.listView.focus();

                if (!that.popup.visible() && (!dataItem || this.text() !== that._text(dataItem))) {
                    current = null;
                }

                var activeFilter = that.filterInput && that.filterInput[0] === activeElement();

                if (current) {
                    if (that.trigger(SELECT, { item: current })) {
                        return;
                    }

                    this._select(current);
                } else {
                    this._accessor(this.input.val());
                }

                //TODO: refactor
                if (this._focusElement) {
                    this._focusElement(that.wrapper);
                }

                if (activeFilter && key === keys.TAB) {
                    that.wrapper.focusout();
                } else {
                    that._blur();
                }

                that.close();
                pressed = true;
            } else if (key === keys.ESC) {
                if (that.popup.visible()) {
                    e.preventDefault();
                }
                that.close();
                pressed = true;
            }

            return pressed;
        },

        _fetchData: function() {
            var that = this;
            var hasItems = !!that.dataSource.view().length;

            //if request is started avoid datasource.fetch
            if (that.element[0].disabled || that._request || that.options.cascadeFrom) {
                return;
            }

            if (!that._bound && !that._fetch && !hasItems) {
                that._fetch = true;
                that.dataSource.fetch().done(function() {
                    that._fetch = false;
                });
            }
        },

        _options: function(data, optionLabel) {
            var that = this,
                element = that.element,
                length = data.length,
                options = "",
                option,
                dataItem,
                dataText,
                dataValue,
                idx = 0;

            if (optionLabel) {
                idx = 1;
                options = optionLabel;
            }

            for (; idx < length; idx++) {
                option = "<option";
                dataItem = data[idx];
                dataText = that._text(dataItem);
                dataValue = that._value(dataItem);

                if (dataValue !== undefined) {
                    dataValue += "";

                    if (dataValue.indexOf('"') !== -1) {
                        dataValue = dataValue.replace(quotRegExp, "&quot;");
                    }

                    option += ' value="' + dataValue + '"';
                }

                option += ">";

                if (dataText !== undefined) {
                    option += htmlEncode(dataText);
                }

                option += "</option>";
                options += option;
            }

            element.html(options);
        },

        _reset: function() {
            var that = this,
                element = that.element,
                formId = element.attr("form"),
                form = formId ? $("#" + formId) : element.closest("form");

            if (form[0]) {
                that._resetHandler = function() {
                    setTimeout(function() {
                        that.value(that._initial);
                    });
                };

                that._form = form.on("reset", that._resetHandler);
            }
        },

        //TODO: Refactor
        _cascade: function() {
            var that = this,
                options = that.options,
                cascade = options.cascadeFrom,
                parent, parentElement,
                select, valueField,
                change;

            if (cascade) {
                //that.listView.value(options.value || that._accessor());

                parentElement = $("#" + cascade);
                parent = parentElement.data("kendo" + options.name);

                if (!parent) {
                    parent = parentElement.data("kendo" + alternativeNames[options.name]);
                }

                if (!parent) {
                    return;
                }

                options.autoBind = false;
                valueField = options.cascadeFromField || parent.options.dataValueField;

                change = function() {
                    that.dataSource.unbind(CHANGE, change);

                    var value = that.listView.value()[0];
                    if (that._userTriggered) {
                        that._clearSelection(parent, true);
                    } else if (value) {
                        that.value(value);
                        if (!that.dataSource.view()[0] || that.selectedIndex === -1) {
                            that._clearSelection(parent, true);
                        }
                    } else if (that.listView.data().length) {
                        that.select(options.index);
                    }

                    that.enable();
                    that._triggerCascade(that._userTriggered);
                    that._userTriggered = false;
                };
                select = function() {
                    var dataItem = parent.dataItem(),
                        filterValue = dataItem ? parent._value(dataItem) : null,
                        expressions, filters;

                    if (filterValue || filterValue === 0) {
                        expressions = that.dataSource.filter() || {};
                        removeFiltersForField(expressions, valueField);
                        filters = expressions.filters || [];

                        filters.push({
                            field: valueField,
                            operator: "eq",
                            value: filterValue
                        });

                        var handler = function() {
                            that.unbind("dataBound", handler);
                            change.apply(that, arguments);
                        };

                        that.first("dataBound", handler);

                        that.dataSource.filter(filters);

                    } else {
                        that.enable(false);
                        that._clearSelection(parent);
                        that._triggerCascade(that._userTriggered);
                        that._userTriggered = false;
                    }
                };

                parent.first("cascade", function(e) {
                    that._userTriggered = e.userTriggered;
                    select();
                });

                //refresh was called
                if (parent._bound) {
                    select();
                } else if (!parent.value()) {
                    that.enable(false);
                }
            }
        }
    });

    var STATIC_LIST_NS = ".StaticList";

    var StaticList = kendo.ui.DataBoundWidget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, options);

            this.element.attr("role", "listbox")
                        .css({ overflow: support.kineticScrollNeeded ? "": "auto" })
                        .on("click" + STATIC_LIST_NS, "li", proxy(this._click, this))
                        .on("mouseenter" + STATIC_LIST_NS, "li", function() { $(this).addClass(HOVER); })
                        .on("mouseleave" + STATIC_LIST_NS, "li", function() { $(this).removeClass(HOVER); });

            this.setDataSource(this.options.dataSource);

            this._bound = false;

            this._optionID = kendo.guid();

            this._selectedIndices = [];

            this._dataContext = [];
            this._dataItems = [];
            this._values = [];

            this._getter();
            this._templates();

            var value = this.options.value;
            if (value) {
                this._values = $.isArray(value) ? value.slice(0) : [value];
            }
        },

        options: {
            name: "StaticList",
            dataValueField: null,
            optionLabel: null,
            selectable: true,
            template: null,
            groupTemplate: null,
            fixedGroupTemplate: null
        },

        events: [
           "click",
           "change",
           "activate",
           "deactivate",
           "dataBinding",
           "dataBound"
        ],

        setDataSource: function(source) {
            var that = this;
            var dataSource = source || {};

            dataSource = $.isArray(dataSource) ? { data: dataSource } : dataSource;
            dataSource = kendo.data.DataSource.create(dataSource);

            if (that.dataSource) {
                that.dataSource.unbind(CHANGE, that._refreshHandler);
            } else {
                that._refreshHandler = proxy(that.refresh, that);
            }

            that.dataSource = dataSource.bind(CHANGE, that._refreshHandler);
        },

        //Test this
        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (options.dataSource) {
                this.setDataSource(options.dataSource);
            }

            this._getter(); //TODO: test this
            this._templates();
        },

        destroy: function() {
            this.element.off(STATIC_LIST_NS);

            if (this._refreshHandler) {
                this.dataSource.unbind(CHANGE, this._refreshHandler);
            }

            Widget.fn.destroy.call(this);
        },

        scroll: function (item) {
            if (!item) {
                return;
            }

            if (item[0]) {
                item = item[0];
            }

            var ul = this.element[0],
                itemOffsetTop = item.offsetTop,
                itemOffsetHeight = item.offsetHeight,
                ulScrollTop = ul.scrollTop,
                ulOffsetHeight = ul.clientHeight,
                bottomDistance = itemOffsetTop + itemOffsetHeight,
                touchScroller = this._touchScroller,
                yDimension, offsetHeight;

            if (touchScroller) {
                yDimension = touchScroller.dimensions.y;

                if (yDimension.enabled && itemOffsetTop > yDimension.size) {
                    itemOffsetTop = itemOffsetTop - yDimension.size + itemOffsetHeight + 4;

                    touchScroller.scrollTo(0, -itemOffsetTop);
                }
            } else {
                offsetHeight = this.header ? this.header.outerHeight() : 0;
                offsetHeight += this.filterInput ? this.filterInput.outerHeight() : 0;

                ul.scrollTop = ulScrollTop > itemOffsetTop ?
                               (itemOffsetTop - offsetHeight) : bottomDistance > (ulScrollTop + ulOffsetHeight) ?
                               (bottomDistance - ulOffsetHeight - offsetHeight) : ulScrollTop;
            }
        },

        selectedDataItems: function(dataItems) {
            var getter = this._valueGetter;

            if (dataItems === undefined) {
                return this._dataItems.slice();
            }

            this._dataItems = dataItems;

            this._values = $.map(dataItems, function(dataItem) {
                return getter(dataItem);
            });
        },

        next: function() {
            var current = this.focus();

            if (!current) {
                current = $(this.element[0].children[0]);
            } else {
                current = current.next();
            }

            this.focus(current);
        },

        prev: function() {
            var current = this.focus();

            if (!current) {
                current = $(this.element[0].children[this.element[0].children.length - 1]);
            } else {
                current = current.prev();
            }

            this.focus(current);
        },

        first: function() {
            this.focus(this.element[0].children[0]);
        },

        last: function() {
            this.focus(this.element[0].children[this.element[0].children.length - 1]);
        },

        _click: function(e) {
            if (!e.isDefaultPrevented()) {
                this.trigger("click", { item: $(e.currentTarget) });
            }
        },

        _get: function(candidate) {
            var isArray = $.isArray(candidate);
            var data = this._dataContext;
            var found = false;
            var result = [];
            var i, idx;

            if (isArray && $.isPlainObject(candidate[0])) {
                return candidate;
            }

            if (typeof candidate === "function") {
                for (idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx].item)) {
                        candidate = idx;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    candidate = -1;
                }
            }

            if (typeof candidate === "number") {
                candidate = [candidate];
                isArray = true;
            }

            if (isArray) {
                for (i = 0; i < candidate.length; i++) {
                    idx = candidate[i];

                    if (idx > -1) {
                        result.push({
                            index: idx,
                            element: $(this.element[0].children[idx])
                        });
                    }
                }
            } else {
                candidate = $(candidate);
                idx = inArray(candidate[0], this.element[0]);

                if (idx > -1) {
                    result.push({
                        index : idx,
                        element: candidate
                    });
                }
            }

            return result;
        },

        focus: function(candidate) {
            var that = this;
            var id = that._optionID;
            var length;

            if (candidate === undefined) {
                return that._current;
            }

            candidate = that._get(candidate);

            if (that._current) {
                that._current
                    .removeClass(FOCUSED)
                    .removeAttr("aria-selected")
                    .removeAttr(ID);

                that.trigger("deactivate");
            }

            length = candidate.length;

            if (length) {
                candidate = candidate[length - 1].element;
                candidate.addClass(FOCUSED);
                that.scroll(candidate);

                candidate.attr("id", id);
            }

            that._current = candidate && candidate[0] ? candidate : null;

            that.trigger("activate");
        },

        select: function(candidate) {
            var data = this._dataContext;
            var added = [];
            var removed;
            var dataItem;
            var entry;
            var index;
            var idx;

            if (candidate === undefined) {
                return this._selectedIndices.slice();
            }

            candidate = this._get(candidate);

            removed = this._deselect(candidate);

            if (candidate.length) {
                if (this.options.selectable !== "multiple") {
                    candidate = [candidate[candidate.length - 1]];
                }

                this.focus(candidate);

                for (idx = 0; idx < candidate.length; idx++) {
                    entry = candidate[idx];
                    index = entry.index;
                    dataItem = data[index];

                    if (index === -1 || !dataItem) {
                        continue;
                    }

                    entry.element.addClass("k-state-selected").attr("aria-selected", true);

                    this._selectedIndices.push(index);

                    dataItem = dataItem.item;
                    this._dataItems.push(dataItem);
                    this._values.push(this._valueGetter(dataItem));

                    added.push({
                        index: index,
                        dataItem: dataItem
                    });
                }
            }

            //TODO: Test this
            if (added.length || removed.length) {
                this.trigger("change", {
                    added: added,
                    removed: removed
                });
            }
        },

        value: function(value) {
            if (value === undefined) {
                return this._values.slice(0);
            }

            this._deferredValue = $.Deferred();

            //TODO: test for null value
            if (value === "" || value === null) {
                value = [];
            }

            value = $.isArray(value) || value instanceof ObservableArray ? value.slice(0) : [value];

            this._values = value.slice(0);
            this._dataItems = [];

            //TODO: Test this
            if (this.isBound()) {
                this._render();
            }

            return this._deferredValue.promise();
        },

        data: function() {
            var that = this;
            var data = that.dataSource.view();
            var first = that.options.optionLabel;
            var length = data.length;
            var idx = 0;

            if (first && length) {
                first = new ObservableArray([first]);

                for (; idx < length; idx++) {
                    first.push(data[idx]);
                }
                data = first;
            }

            return data;
        },

        _getter: function() {
            this._valueGetter = kendo.getter(this.options.dataValueField);
        },

        _find: function(dataItem, values) {
            var getter = this._valueGetter;
            var value = getter(dataItem);
            var index = -1;

            for (var idx = 0; idx < values.length; idx++) {
                if (value == values[idx]) {
                    values.splice(idx, 1);
                    index = idx;
                    break;
                }
            }

            return index;
        },

        _isNew: function(dataItem) {
            var getter = this._valueGetter;
            var isNew = true;
            var idx = 0;

            var value = getter(dataItem);

            for (; idx < this._dataItems.length; idx++) {
                dataItem = this._dataItems[idx];

                if (dataItem && getter(this._dataItems[idx]) === value) {
                    isNew = false;
                    break;
                }
            }

            return isNew;
        },

        _deselect: function(candidate) {
            var element = this.element[0];
            var dataItems = this._dataItems;
            var selectedIndices = this._selectedIndices;
            var selectable = this.options.selectable;
            var values = this._values;
            var removed = [];
            var selectedItem;
            var itemElement;
            var removedIndices = 0;
            var i, j;

            // single selection
            if (selectable === true) {
                for (var idx = 0; idx < selectedIndices.length; idx++) {
                    $(this.element[0].children[selectedIndices[idx]]).removeClass("k-state-selected");
                    removed.push({
                        index: idx,
                        position: idx, //TODO: Test this
                        dataItem: this._dataItems[idx]
                    });
                }

                this._values = [];
                this._dataItems = [];
                this._selectedIndices = [];
            } else if (selectable === "multiple") {
                for (i = 0; i < candidate.length; i++) {
                    itemElement = candidate[i].element;

                    if (!itemElement.hasClass("k-state-selected")) {
                        continue;
                    }

                    for (j = 0; j < selectedIndices.length; j++) {
                        selectedItem = element.children[selectedIndices[j]];

                        if (selectedItem === itemElement[0]) {
                            $(selectedItem).removeClass("k-state-selected");

                            removed.push({
                                index: selectedIndices.splice(j, 1),
                                position: j + removedIndices, //TODO: test this
                                dataItem: dataItems.splice(j, 1)[0]
                            });

                            candidate.splice(i, 1);
                            values.splice(j, 1);

                            i -= 1;
                            j -= 1;
                            removedIndices += 1;
                            break;
                        }
                    }
                }
            }

            return removed;
        },

        _template: function() {
            var that = this;
            var options = that.options;
            var template = options.template;

            if (!template) {
                template = kendo.template('<li tabindex="-1" role="option" unselectable="on" class="k-item">${' + kendo.expr(options.dataTextField, "data") + "}</li>", { useWithBlock: false });
            } else {
                template = kendo.template(template);
                template = function(data) {
                    return '<li tabindex="-1" role="option" unselectable="on" class="k-item">' + template(data) + "</li>";
                };
            }

            return template;
        },

        _templates: function() {
            var template;
            var templates = {
                template: this.options.template,
                groupTemplate: this.options.groupTemplate,
                fixedGroupTemplate: this.options.fixedGroupTemplate
            };

            for (var key in templates) {
                template = templates[key];
                if (template && typeof template !== "function") {
                    templates[key] = kendo.template(template);
                }
            }

            this.templates = templates;
        },

        _normalizeDataItems: function() {
            var dataItems = this._dataItems;
            var indices = this._selectedIndices;

            var newDataItems = [];
            var newIndices = [];

            for (var idx = 0; idx < dataItems.length; idx++) {
                if (dataItems[idx] !== undefined) {
                    newDataItems.push(dataItems[idx]);
                    newIndices.push(indices[idx]);
                }
            }

            this._dataItems = newDataItems;
            this._selectedIndices = newIndices;
        },

        _renderItem: function(context, values) {
            var item = '<li tabindex="-1" role="option" unselectable="on" class="k-item';
            var index = this._find(context.item, values);
            var dataItem = context.item;
            var found = index !== -1;

            if (found) {
                item += ' k-state-selected';

                if (this._isNew(dataItem)) {
                    if (this._dataItems[index] === undefined) {
                        this._dataItems[index] = dataItem;
                    } else {
                        this._dataItems.push(dataItem);
                    }
                }

                if (this._selectedIndices[index] === undefined) {
                    this._selectedIndices[index] = context.index;
                } else {
                    this._selectedIndices.push(context.index);
                }
            }

            item += '"' + (found ? ' aria-selected="true"' : "") + ' data-index="' + context.index + '">';

            item += this.templates.template(dataItem);

            if (context.newGroup) {
                item += '<div class="k-group">' + this.templates.groupTemplate(context.group) + '</div>';
            }

            return item + "</li>";
        },

        _render: function() {
            var html = "";

            var i = 0;
            var idx = 0;
            var context;
            var dataContext = [];
            var view = this.data();
            var values = this.value();

            this._selectedIndices = [];

            var group, newGroup, j;

            if (!!this.dataSource.group().length) {
                for (i = 0; i < view.length; i++) {
                    group = view[i];
                    newGroup = true;

                    for (j = 0; j < group.items.length; j++) {
                        context = { item: group.items[j], group: group.value, newGroup: newGroup, index: idx };
                        dataContext[idx] = context;
                        idx += 1;

                        html += this._renderItem(context, values);
                        newGroup = false;
                    }
                }
            } else {
                for (i = 0; i < view.length; i++) {
                    context = { item: view[i], index: i };

                    dataContext[i] = context;

                    html += this._renderItem(context, values);
                }
            }

            this._normalizeDataItems();

            this._dataContext = dataContext;

            this.element[0].innerHTML = html;

            this.focus(this._selectedIndices);

            if (this._deferredValue) {
                this._deferredValue.resolve();
            }
        },

        refresh: function() {
            this.trigger("dataBinding");

            this._render();

            this._bound = true;

            this.trigger("dataBound");
        },

        //TODO: test
        isBound: function() {
            return this._bound;
        }
    });

    ui.plugin(StaticList);

    function inArray(node, parentNode) {
        var idx, length, siblings = parentNode.children;

        if (!node || node.parentNode !== parentNode) {
            return -1;
        }

        for (idx = 0, length = siblings.length; idx < length; idx++) {
            if (node === siblings[idx]) {
                return idx;
            }
        }

        return -1;
    }

    function removeFiltersForField(expression, field) {
        var filters;
        var found = false;

        if (expression.filters) {
            filters = $.grep(expression.filters, function(filter) {
                found = removeFiltersForField(filter, field);
                if (filter.filters) {
                    return filter.filters.length;
                } else {
                    return filter.field != field;
                }
            });

            if (!found && expression.filters.length !== filters.length) {
                found = true;
            }

            expression.filters = filters;
        }

        return found;
    }
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
