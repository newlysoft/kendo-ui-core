(function(f, define){
    define([ "./kendo.data" ], f);
})(function(){

var __meta__ = {
    id: "virtuallist",
    name: "VirtualList",
    category: "framework",
    depends: [ "data" ],
    hidden: true
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DataBoundWidget = ui.DataBoundWidget,
        proxy = $.proxy,

        WRAPPER = "k-virtual-wrap",
        VIRTUALLIST = "k-virtual-list",
        CONTENT = "k-virtual-content",
        LIST = "k-list",
        HEADER = "k-virtual-header",
        VIRTUALITEM = "k-virtual-item",
        ITEM = "k-item",
        OPTIONLABEL = "k-virtual-option-label",
        HEIGHTCONTAINER = "k-height-container",
        GROUPITEM = "k-group",

        SELECTED = "k-state-selected",
        FOCUSED = "k-state-focused",
        CHANGE = "change",
        CLICK = "click",
        LISTBOUND = "listBound",
        ITEMCHANGE = "itemChange",

        ACTIVATE = "activate",
        DEACTIVATE = "deactivate",

        VIRTUAL_LIST_NS = ".VirtualList";

    function toArray(value) {
        return value instanceof Array ? value : [value];
    }

    function isPrimitive(dataItem) {
        return typeof dataItem === "string" || typeof dataItem === "number" || typeof dataItem === "boolean";
    }

    function getItemCount(screenHeight, listScreens, itemHeight) {
        return Math.ceil(screenHeight * listScreens / itemHeight);
    }

    function appendChild(parent, className, tagName) {
        var element = document.createElement(tagName || "div");
        if (className) {
            element.className = className;
        }
        parent.appendChild(element);

        return element;
    }

    function getDefaultItemHeight() {
        var mockList = $('<div class="k-popup"><ul class="k-list"><li class="k-item"><li></ul></div>'),
            lineHeight;
        mockList.css({
            position: "absolute",
            left: "-200000px",
            visibility: "hidden"
        });
        mockList.appendTo(document.body);
        lineHeight = parseFloat(kendo.getComputedStyles(mockList.find(".k-item")[0], ["line-height"])["line-height"]);
        mockList.remove();

        return lineHeight;
    }

    function bufferSizes(screenHeight, listScreens, opposite) { //in pixels
        return {
            down: screenHeight * opposite,
            up: screenHeight * (listScreens - 1 - opposite)
        };
    }

    function listValidator(options, screenHeight) {
        var downThreshold = (options.listScreens - 1 - options.threshold) * screenHeight;
        var upThreshold = options.threshold * screenHeight;

        return function(list, scrollTop, lastScrollTop) {
            if (scrollTop > lastScrollTop) {
                return scrollTop - list.top < downThreshold;
            } else {
                return list.top === 0 || scrollTop - list.top > upThreshold;
            }
        };
    }

    function scrollCallback(element, callback) {
        return function(force) {
            return callback(element.scrollTop, force);
        };
    }

    function syncList(reorder) {
        return function(list, force) {
            reorder(list.items, list.index, force);
            return list;
        };
    }

    function position(element, y) {
        if (kendo.support.browser.msie && kendo.support.browser.version < 10) {
            element.style.top = y + "px";
        } else {
            element.style.webkitTransform = 'translateY(' + y + "px)";
            element.style.transform = 'translateY(' + y + "px)";
        }
    }

    function map2(callback, templates) {
        return function(arr1, arr2) {
            for (var i = 0, len = arr1.length; i < len; i++) {
                callback(arr1[i], arr2[i], templates);
                if (arr2[i].item) {
                    this.trigger(ITEMCHANGE, { item: $(arr1[i]), data: arr2[i].item, ns: kendo.ui });
                    if (arr2[i].index === this._selectedIndex) {
                        this.select(this._selectedIndex);
                    }
                }
            }
        };
    }

    function reshift(items, diff) {
        var range;

        if (diff > 0) { // down
            range = items.splice(0, diff);
            items.push.apply(items, range);
        } else { // up
            range = items.splice(diff, -diff);
            items.unshift.apply(items, range);
        }

        return range;
    }

    function render(element, data, templates) {
        var itemTemplate = templates.template;

        element = $(element);

        if (!data.item) {
            itemTemplate = templates.placeholderTemplate;
        }

        this.angular("cleanup", function() {
            return { elements: [ element ]};
        });

        element
            .attr("data-uid", data.item ? data.item.uid : "")
            .attr("data-offset-index", data.index)
            .find("." + ITEM)
            .html(itemTemplate(data.item || {}));

        element.toggleClass(FOCUSED, data.current);
        element.toggleClass(SELECTED, data.selected);

        if (data.newGroup) {
            $("<div class=" + GROUPITEM + "></div>")
                .appendTo(element.find("." + ITEM))
                .html(templates.groupTemplate({ group: data.group }));
        }

        if (data.top !== undefined) {
            position(element[0], data.top);
        }

        this.angular("compile", function() {
            return { elements: [ element ], data: [ { dataItem: data.item, group: data.group, newGroup: data.newGroup } ]};
        });
    }

    var VirtualList = DataBoundWidget.extend({
        init: function(element, options) {
            var that = this;
            that._listCreated = false;
            that._fetching = false;

            Widget.fn.init.call(that, element, options);

            element = that.element;
            element.addClass(VIRTUALLIST);

            if (!that.options.itemHeight) {
                that.options.itemHeight = getDefaultItemHeight();
            }

            options = that.options;

            that.wrapper = element.wrap("<div class='" + WRAPPER + "' role='listbox'></div>").parent();
            that.header = that.element.before("<div class='" + HEADER + "'></div>").prev();
            that.content = element.append("<ul class='" + CONTENT + " " + LIST + "'></ul>").find("." + CONTENT);

            that._values = toArray(that.options.value);
            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._optionID = kendo.guid();

            that.setDataSource(options.dataSource);

            element.on("scroll" + VIRTUAL_LIST_NS, function() {
                that._renderItems();
            });

            that._selectable();
        },

        options: {
            name: "VirtualList",
            autoBind: true,
            height: null,
            listScreens: 4,
            threshold: 0.5,
            itemHeight: null,
            oppositeBuffer: 1,
            type: "flat",
            selectable: false,
            value: [],
            dataValueField: null,
            template: "#:data#",
            placeholderTemplate: "loading...",
            groupTemplate: "#:group#",
            fixedGroupTemplate: "fixed header template",
            optionLabel: null,
            valueMapper: null
        },

        events: [
            CHANGE,
            CLICK,
            LISTBOUND,
            ITEMCHANGE,
            ACTIVATE,
            DEACTIVATE
        ],

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (this._selectProxy && this.options.selectable === false) {
                this.wrapper.off(CLICK, "." + VIRTUALITEM + ", ." + OPTIONLABEL, this._selectProxy);
            } else if (!this._selectProxy && this.options.selectable) {
                this._selectable();
            }

            this.refresh();
        },

        items: function() {
            return $(this._items);
        },

        destroy: function() {
            this.wrapper.off(VIRTUAL_LIST_NS);
            this.element.off(VIRTUAL_LIST_NS);
            this.dataSource.unbind(CHANGE, this._refreshHandler);
            Widget.fn.destroy.call(this);
        },

        setDataSource: function(source) {
            var that = this,
                dataSource = source || {};

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;

            that.dataSource = kendo.data.DataSource.create(dataSource);
            that._refreshHandler = $.proxy(that.refresh, that);

            that.dataSource.bind(CHANGE, that._refreshHandler);

            if (that.dataSource.view().length !== 0) {
                that.refresh();
            } else if (that.options.autoBind) {
                that.dataSource.fetch();
            }
        },

        refresh: function() {
            var that = this;

            if (that._mute) { return; }

            if (!that._fetching && that.dataSource.data().length) {
                that._createList();
                if (that._values.length) {
                    that._prefetchByValue(that._values).then(function() {
                        that._listCreated = true;
                        that.trigger(LISTBOUND);
                        if (that._valueDeferred) {
                            that._valueDeferred.resolve();
                        }
                    });
                } else {
                    that._listCreated = true;
                    that.trigger(LISTBOUND);
                }
            } else {
                if (that._renderItems) {
                    that._renderItems(true);
                }
                that.trigger(LISTBOUND);
            }

            that._fetching = false;
        },

        value: function(candidate) {
            var that = this,
                dataSource = that.dataSource,
                value = candidate,
                deferred = $.Deferred();

            if (value === undefined) {
                return that._values;
            }

            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._values = value = toArray(value);

            if (that.isBound()) {
                that._prefetchByValue(value).then(function() {
                    deferred.resolve();
                });
            }

            this._valueDeferred = deferred;
            return deferred.promise();
        },

        _prefetchByValue: function(value) {
            var that = this,
                dataView = that._dataView,
                valueField = that.options.dataValueField,
                counter = 0, item, match = false,
                deferred = $.Deferred();
                
            that._promisesList = [];

            //try to find the items in the loaded data
            for (var i = 0; i < value.length; i++) {
                for (var idx = 0; idx < dataView.length; idx++) {
                    item = dataView[idx].item;
                    match = isPrimitive(item) ? value[i] === item : value[i] === item[valueField];

                    if (item && match) {
                        that._selectedDataItems.push(item);
                        that._selectedIndexes.push(idx);
                        counter++;
                    }
                }
            }

            if (counter === value.length) {
                that._renderItems(true);
                deferred.resolve();
                return deferred.promise();
            } 

            //prefetch the items
            that._selectedDataItems = [];
            that._selectedIndexes = [];
            if (typeof that.options.valueMapper === "function") {
                that.options.valueMapper({
                    value: (this.options.selectable === "multiple") ? value : value[0],
                    success: function(indexes) {
                        that._valueMapperSuccessHandler(toArray(indexes));
                        $.when.apply($, that._promisesList).then(function() {
                            that._renderItems(true);
                            deferred.resolve();
                        });
                    }
                });
            } else {
                throw new Error("valueMapper is not provided");
            }

            return deferred.promise();
        },

        _prefetchByIndex: function(indexes) {
            var that = this,
                dataView = that._dataView,
                valueField = that.options.dataValueField,
                counter = 0, item, match = false,
                deferred = $.Deferred();

            //try to find the items in the loaded data
            for (var i = 0; i < indexes.length; i++) {
                for (var idx = 0; idx < dataView.length; idx++) {
                    if (indexes[i] === dataView[idx].index && dataView[idx].item) {
                        that._selectedDataItems.push(item);
                        that._selectedIndexes.push(idx);
                        counter++;
                    }
                }
            }

            if (counter === indexes.length) {
                that._renderItems(true);
                deferred.resolve();
                return deferred.promise();
            }

            //prefetch the items
            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._valueMapperSuccessHandler(toArray(indexes));
            $.when.apply($, this._promisesList).then(function() {
                that._renderItems(true);
                deferred.resolve();
            });

            return deferred.promise();
        },

        _valueMapperSuccessHandler: function(indexes) {
            var that = this,
                dataSource = this.dataSource,
                take = that.itemCount;

            $.each(indexes, function(_, index) {
                var skip = (Math.ceil(index / take) - 1) * take;

                var deferred = $.Deferred();
                that._promisesList.push(deferred);

                dataSource._multiplePrefetch(skip, take, function() {
                    that.mute(function() {
                        var oldSkip = dataSource.skip();
                        dataSource.range(skip, take); //switch the range to get the dataItem
                        that._selectedDataItems.push(that._findDataItem([index - skip]));
                        that._selectedIndexes.push(index);
                        dataSource.range(oldSkip, take); //switch back the range
                        dataSource.enableRequestsInProgress();
                    });
                    deferred.resolve();
                });
            });
        },

        _findDataItem: function(index) {
            var view = this.dataSource.view(),
                group;

            //find in grouped view
            if (this.options.type === "group") {
                for (var i = 0; i < view.length; i++) {
                    group = view[i].items;
                    if (group.length < index) {
                        index = index - group.length;
                    } else {
                        return group[index];
                    }
                }
            }

            //find in flat view
            return view[index];
        },

        selectedDataItems: function() {
            return this._selectedDataItems;
        },

        scrollTo: function(y) {
            this.element.scrollTop(y); //works only if the element is visible
        },

        scrollToIndex: function(index) {
            this.scrollTo(index * this.options.itemHeight);
        },

        focus: function(candidate) {
            var element,
                index,
                data,
                dataSource = this.dataSource,
                current,
                id = this._optionID;

            if (candidate === undefined) {
                return this.content.find("." + FOCUSED);
            }

            if (typeof candidate === "function") {
                data = this.data();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        candidate = idx;
                        break;
                    }
                }
            }

            if (candidate instanceof Array) {
                candidate = candidate[candidate.length - 1];
            }

            if (isNaN(candidate)) {
                element = $(candidate);
                index = parseInt($(element).attr("data-offset-index"), 10);
            } else {
                index = candidate;
                element = this._getElementByIndex(index);
            }

            if (index === -1) { //this will be in conflict with the optionLabel
                this.content.find("." + FOCUSED).removeClass(FOCUSED);
                this._focusedIndex = undefined;
                return;
            }

            if (element.length) { /*focus rendered item*/
                if (element.hasClass(FOCUSED)) {
                    return;
                } else {
                    if (this._focusedIndex !== undefined) {
                        current = this._getElementByIndex(this._focusedIndex);
                        current
                            .removeClass(FOCUSED)
                            .removeAttr("id");

                        this.trigger(DEACTIVATE);
                    }

                    this._focusedIndex = index;

                    element
                        .addClass(FOCUSED)
                        .attr("id", id);

                    var position = this._getElementLocation(index);

                    if (position === "top") {
                        this.scrollTo(index * this.options.itemHeight);
                    } else if (position === "bottom") {
                        this.scrollTo(this.element.scrollTop() + this.options.itemHeight);
                    }

                    this.trigger(ACTIVATE);
                }
            } else { /*focus non rendered item*/
                this._focusedIndex = index;
                this.items().add(this.optionLabel).removeClass(FOCUSED);
                this.scrollToIndex(index);
            }
        },

        first: function() {
            this.scrollTo(0);
            this.focus(0);
        },

        last: function() {
            var lastIndex = this.dataSource.total();
            this.scrollTo(this.heightContainer.offsetHeight);
            this.focus(lastIndex);
        },

        prev: function() {
            var index = this._focusedIndex;

            if (!isNaN(index) && index > 0) {
                this.focus(index - 1);
                return index - 1;
            }
        },

        next: function() {
            var index = this._focusedIndex,
                lastIndex = this.dataSource.total() - 1; /* data offset index starts from 0*/

            if (!isNaN(index) && index < lastIndex) {
                this.focus(index + 1);
                return index + 1;
            }
        },

        select: function(candidate) {
            var added = [],
                removed = [];

            if (candidate === undefined) {
                return this._selectedIndexes.slice();
            }

            candidate = this._getIndecies(candidate);
            removed = this._deselect(candidate);

            if (candidate.length) {
                if (this.options.selectable !== "multiple") {
                    candidate = [candidate[candidate.length - 1]];
                }

                this.focus(candidate);
                added = this._select(candidate);
            }

            if (added.length || removed.length) {
                this.trigger(CHANGE, {
                    added: added,
                    removed: removed
                });
            }
        },

        data: function() {
            var data = this.dataSource.view(),
                first = this.optionInstance,
                length = data.length,
                idx = 0;

            if (first && length) {
                first = new kendo.data.ObservableArray([first]);

                for (; idx < length; idx++) {
                    first.push(data[idx]);
                }
                data = first;
            }

            return data;
        },

        isBound: function() {
            return this._listCreated;
        },

        mute: function(callback) {
            this._mute = true;
            proxy(callback(), this);
            this._mute = false;
        },

        _getElementByIndex: function(index) {
            var element;

            if (index === -1) {
                element = this.optionLabel;
            } else {
                element = this.items().filter(function(idx, element) {
                    return index === parseInt($(element).attr("data-offset-index"), 10);
                });
            }

            return element;
        },

        _clean: function() {
            this.result = undefined;
            this._lastScrollTop = undefined;
            if (this.optionLabel) {
                this.optionLabel.parent().remove();
                this.optionLabel = undefined;
            }
            this.content.empty();
        },

        _screenHeight: function() {
            var height = this.options.height,
                element = this.element;

            if (height) {
                element.height(height);
            } else {
                height = element.height();
            }

            this.screenHeight = height;
        },

        _getElementLocation: function(index) {
            var scrollTop = this.element.scrollTop(),
                screenHeight = this.screenHeight,
                itemHeight = this.options.itemHeight,
                yPosition = index * itemHeight,
                position;

            if (yPosition === (scrollTop - itemHeight)) {
                position = "top";
            } else if (yPosition === scrollTop + screenHeight) {
                position = "bottom";
            } else if ((yPosition >= scrollTop) && (yPosition <= scrollTop + (screenHeight - itemHeight))) {
                position = "inScreen";
            } else {
                position = "outScreen";
            }

            return position;
        },

        _templates: function() {
            var templates = {
                template: this.options.template,
                placeholderTemplate: this.options.placeholderTemplate,
                groupTemplate: this.options.groupTemplate,
                fixedGroupTemplate: this.options.fixedGroupTemplate
            };

            for (var key in templates) {
                if (typeof templates[key] !== "function") {
                    templates[key] = kendo.template(templates[key]);
                }
            }

            this.templates = templates;
        },

        _generateItems: function(element, count) {
            var items = [],
                item;

            while(count-- > 0) {
                item = document.createElement("li");
                item.tabIndex = -1;
                item.className = VIRTUALITEM;
                item.setAttribute("role", "option");
                item.innerHTML = "<div class='" + ITEM + "'></div>";
                element.appendChild(item);

                items.push(item);
            }

            return items;
        },

        _createList: function() {
            var that = this,
                element = that.element.get(0),
                options = that.options,
                dataSource = that.dataSource,
                total = dataSource.total();

            if (that._listCreated) {
                that._clean();
            }

            that._screenHeight();
            that.itemCount = getItemCount(that.screenHeight, options.listScreens, options.itemHeight);

            if (that.itemCount > dataSource.total()) {
                that.itemCount = dataSource.total();
            }

            that._templates();
            that._optionLabel();
            that._items = that._generateItems(that.content[0], that.itemCount);

            that._setHeight(options.itemHeight * dataSource.total());
            that.options.type = !!dataSource.group().length ? "group" : "flat";

            that.getter = that._getter(function() {
                that._renderItems(true);
            });

            that._onScroll = function(scrollTop, force) {
                var getList = that._listItems(that.getter);
                return that._fixedHeader(scrollTop, getList(scrollTop, force));
            };

            that._renderItems = that._whenChanged(
                scrollCallback(element, that._onScroll),
                syncList(that._reorderList(that._items, $.proxy(render, that)))
            );

            that._renderItems();
        },

        _setHeight: function(height) {
            var currentHeight,
                heightContainer = this.heightContainer;

            if (!heightContainer) {
                heightContainer = this.heightContainer = appendChild(this.element[0], HEIGHTCONTAINER);
            } else {
                currentHeight = heightContainer.offsetHeight;
            }

            if (height !== currentHeight) {
                heightContainer.innerHTML = "";

                while (height > 0) {
                    var padHeight = Math.min(height, 250000); //IE workaround, should not create elements with height larger than 250000px
                    appendChild(heightContainer).style.height = padHeight + "px";
                    height -= padHeight;
                }
            }
        },

        _getter: function(dataAvailableCallback) {
            var lastRequestedRange = null,
                dataSource = this.dataSource,
                lastRangeStart = dataSource.skip(),
                type = this.options.type,
                pageSize = this.itemCount,
                flatGroups = {};

            return function(index, rangeStart) {
                if (!dataSource.inRange(rangeStart, pageSize)) {
                    if (lastRequestedRange !== rangeStart) {
                        lastRequestedRange = rangeStart;
                        lastRangeStart = rangeStart;
                        this._fetching = true;
                        dataSource.range(rangeStart, pageSize);
                    }

                    return null;
                } else {
                    if (lastRangeStart !== rangeStart) {
                        this._mute = true;
                        this._fetching = true;
                        dataSource.range(rangeStart, pageSize);
                        lastRangeStart = rangeStart;
                        this._mute = false;
                    }

                    var result;
                    if (type === "group") { //grouped list
                        if (!flatGroups[rangeStart]) {
                            var flatGroup = flatGroups[rangeStart] = [];
                            var groups = dataSource.view();
                            for (var i = 0, len = groups.length; i < len; i++) {
                                var group = groups[i];
                                for (var j = 0, groupLength = group.items.length; j < groupLength; j++) {
                                    flatGroup.push({ item: group.items[j], group: group.value });
                                }
                            }
                        }

                        result = flatGroups[rangeStart][index - rangeStart];
                    } else { //flat list
                        result = dataSource.view()[index - rangeStart];
                    }

                    return result;
                }
            };
        },

        _fixedHeader: function(scrollTop, list) {
            var group = this.currentVisibleGroup,
                itemHeight = this.options.itemHeight,
                firstVisibleDataItemIndex = Math.floor((scrollTop - list.top) / itemHeight),
                firstVisibleDataItem = list.items[firstVisibleDataItemIndex];

            if (firstVisibleDataItem.item) {
                var firstVisibleGroup = firstVisibleDataItem.group;

                if (firstVisibleGroup !== group) {
                    this.header[0].innerHTML = "";
                    appendChild(this.header[0], GROUPITEM).innerHTML = firstVisibleGroup;
                    this.currentVisibleGroup = firstVisibleGroup;
                }
            }

            return list;
        },

        _itemMapper: function(item, index) {
            var listType = this.options.type,
                itemHeight = this.options.itemHeight,
                valueField = this.options.dataValueField,
                value = this._values,
                currentIndex = this._focusedIndex,
                selected = false,
                current = false,
                newGroup = false,
                group = null,
                nullIndex = -1,
                match = false;

            if (value.length && item) {
                for (var i = 0; i < value.length; i++) {
                    match = isPrimitive(item) ? value[i] === item : value[i] === item[valueField];
                    if (match) {
                        selected = true;
                        break;
                    }
                }
            }

            if (currentIndex === index) {
                current = true;
            }

            if (listType === "group") {
                if (item) {
                    newGroup = index === 0 || (this._currentGroup && this._currentGroup !== item.group);
                    this._currentGroup = item.group;
                }

                group = item ? item.group : null;
                item = item ? item.item : null;
            }

            return {
                item: item ? item : null,
                group: group,
                newGroup: newGroup,
                selected: selected,
                current: current,
                index: index,
                top: index * itemHeight
            };
        },

        _range: function(index) {
            var itemCount = this.itemCount,
                items = [],
                item;

            this._view = {};
            this._currentGroup = null;

            for (var i = index, length = index + itemCount; i < length; i++) {
                item = this._itemMapper(this.getter(i, index), i);
                items.push(item);
                this._view[item.index] = item;
            }

            this._dataView = items;
            return items;
        },

        _getDataItemsCollection: function(scrollTop, lastScrollTop) {
            var items = this._range(this._listIndex(scrollTop, lastScrollTop));
            return {
                index: items[0].index,
                top: items[0].top,
                items: items
            };
        },

        _listItems: function(getter) {
            var screenHeight = this.screenHeight,
                itemCount = this.itemCount,
                options = this.options;

            var theValidator = listValidator(options, screenHeight);

            return $.proxy(function(value, force) {
                var result = this.result,
                    lastScrollTop = this._lastScrollTop;

                if (force || !result || !theValidator(result, value, lastScrollTop)) {
                    result = this._getDataItemsCollection(value, lastScrollTop);
                }

                this._lastScrollTop = value;
                this.result = result;

                return result;
            }, this);
        },

        _whenChanged: function(getter, callback) {
            var current;

            return function(force) {
                var theNew = getter(force);

                if (theNew !== current) {
                    current = theNew;
                    callback(theNew, force);
                }
            };
        },

        _reorderList: function(list, reorder) {
            var that = this;
            var length = list.length;
            var currentOffset = -Infinity;
            reorder = $.proxy(map2(reorder, this.templates), this);

            return function(list2, offset, force) {
                var diff = offset - currentOffset;
                var range, range2;

                if (force || Math.abs(diff) >= length) { // full reorder
                    range = list;
                    range2 = list2;
                } else { // partial reorder
                    range = reshift(list, diff);
                    range2 = diff > 0 ? list2.slice(-diff) : list2.slice(0, -diff);
                }

                reorder(range, range2, that._listCreated);

                currentOffset = offset;
            };
        },

        _bufferSizes: function() {
            var options = this.options;

            return bufferSizes(this.screenHeight, options.listScreens, options.oppositeBuffer);
        },

        _indexConstraint: function(position) {
            var itemCount = this.itemCount,
                itemHeight = this.options.itemHeight,
                total = this.dataSource.total();

            return Math.min(total - itemCount, Math.max(0, Math.floor(position / itemHeight )));
        },

        _listIndex: function(scrollTop, lastScrollTop) {
            var buffers = this._bufferSizes(),
                position;

            position = scrollTop - ((scrollTop > lastScrollTop) ? buffers.down : buffers.up);

            return this._indexConstraint(position);
        },

        _selectable: function() {
            if (this.options.selectable) {
                this._selectProxy = $.proxy(this, "_clickHandler");
                this.wrapper.on(CLICK + VIRTUAL_LIST_NS, "." + VIRTUALITEM + ", ." + OPTIONLABEL, this._selectProxy);
            }
        },

        _getIndecies: function(candidate) {
            var result = [], data;

            if (typeof candidate === "function") {
                data = this.data();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        result.push(idx);
                        break;
                    }
                }
            }

            if (typeof candidate === "number") {
                result.push(candidate);
            }

            if (candidate instanceof jQuery) {
                candidate = parseInt(candidate.attr("data-offset-index"), 10);
                if (!isNaN(candidate)) {
                    result.push(candidate);
                }
            }

            if (candidate instanceof Array) {
                result = candidate;
            }

            return result;
        },

        _deselect: function(indexes) {
            var removed = [],
                index,
                selectedIndex,
                dataItem,
                selectedIndices = this._selectedIndexes,
                position = 0,
                selectable = this.options.selectable,
                removedindexesCounter = 0;

            if (selectable === true) {
                index = indexes[position];
                selectedIndex = selectedIndices[position];

                if (selectedIndex !== undefined && (index !== selectedIndex || index === -1)) {
                    this._getElementByIndex(selectedIndex).removeClass(SELECTED);

                    removed.push({
                        index: selectedIndex,
                        position: position,
                        dataItem: this._selectedDataItems[position]
                    });

                    this._values = [];
                    this._selectedDataItems = [];
                    this._selectedIndexes = [];
                    indexes = [];
                }
            } else if (selectable === "multiple") {
                for (var i = 0; i < indexes.length; i++) {
                    position = $.inArray(indexes[i], selectedIndices);
                    selectedIndex = selectedIndices[position];

                    if (selectedIndex !== undefined) {
                        this._getElementByIndex(selectedIndex).removeClass(SELECTED);
                        this._values.splice(position, 1);
                        this._selectedIndexes.splice(position, 1);
                        dataItem = this._selectedDataItems.splice(position, 1);

                        indexes.splice(i, 1);

                        removed.push({
                            index: selectedIndex,
                            position: position + removedindexesCounter,
                            dataItem: dataItem
                        });

                        removedindexesCounter++;
                        i--;
                    }
                }
            }

            return removed;
        },

        _select: function(indexes) {
            var singleSelection = this.options.selectable !== "multiple",
                valueField = this.options.dataValueField,
                index, dataItem, selectedValue, element,
                added = [];

            for (var i = 0; i < indexes.length; i++) {
                index = indexes[i];
                dataItem = this._view[index] ? this._view[index].item : null;

                if (isPrimitive(dataItem)) {
                    selectedValue = dataItem ? dataItem : null;
                } else {
                    selectedValue = dataItem ? dataItem[valueField] : null;
                }

                if (!selectedValue && selectedValue !== 0) {
                    if (index === -1 && this.optionInstance) { //option label is selected
                        selectedValue = this.optionInstance.value;
                    } else {
                        return false; //return false if there is no item to select
                    }
                }

                element = this._getElementByIndex(index);

                if (!element.hasClass(SELECTED)) {
                    if (singleSelection) {
                        this.items().add(this.optionLabel).removeClass(SELECTED);
                        this._values = [selectedValue];
                        this._selectedDataItems = [dataItem];
                        this._selectedIndexes = [index];

                    } else {
                        this._values.push(selectedValue);
                        this._selectedDataItems.push(dataItem);
                        this._selectedIndexes.push(index);
                    }

                    element.addClass(SELECTED);

                    added.push({
                        index: index,
                        dataItem: dataItem
                    });
                }

                //this should not be here
                this._focusedIndex = index;
            }

            return added;
        },

        _clickHandler: function(e) {
            if (!e.isDefaultPrevented()) {
                this.trigger(CLICK, { item: $(e.currentTarget) });
            }
        },

        _optionLabel: function() {
            var optionInstance = this.options.optionLabel;

            if (optionInstance && typeof optionInstance === "object") {
                this.element
                    .before("<ul class='" + LIST + "'><li tabindex='-1' class='" + OPTIONLABEL + "' role='option'><div class='" + ITEM + "'></div></li></ul>");

                this.optionLabel = this.wrapper.find("." + OPTIONLABEL);
                render.call(this, this.optionLabel, { index: -1, top: null, selected: false, current: false, item: optionInstance }, this.templates);
                this.optionInstance = optionInstance;
            } else {
                this.optionInstance = null;
            }

        }

    });

    kendo.ui.VirtualList = VirtualList;
    kendo.ui.plugin(VirtualList);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });
