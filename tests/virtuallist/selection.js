(function() {
    var container,
        asyncDataSource,
        VirtualList = kendo.ui.VirtualList,
        CONTAINER_HEIGHT = 200,

        FOCUSED = "k-state-focused",
        SELECTED = "k-state-selected";

    function scroll(element, height) {
        element.scrollTop(height);
        element.trigger("scroll");
    }

    function generateData(parameters) {
        var items = [];
        for (var i = parameters.skip, len = parameters.skip + parameters.take; i < len; i++) {
            items.push({
                id: i,
                value: i,
                text: "Item " + i
            });
        }
        
        return items;
    }

    function valueMapper(o) {
        setTimeout(function() {
            o.success(o.value);
        }, 0);
    }

    module("VirtualList Selection: ", {
        setup: function() {
            container = $("<div id='container' style='height: " + CONTAINER_HEIGHT + "px;'></div>").appendTo(QUnit.fixture);

            asyncDataSource = new kendo.data.DataSource({
                transport: {
                    read: function(options) {
                        setTimeout(function() {
                            options.success({ data: generateData(options.data), total: 300 });
                        }, 0);
                    }
                },
                serverPaging: true,
                pageSize: 40,
                schema: {
                    data: "data",
                    total: "total"
                }
            });
        },

        teardown: function() {
            if (container.data("kendoVirtualList")) {
                container.data("kendoVirtualList").destroy();
            }

            QUnit.fixture.empty();
        }
    });

    //rendering

    asyncTest("selecting listItem visually selects it", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);

            ok(element.hasClass(SELECTED));
        }, 100);
    });

    asyncTest("selecting listItem visually selects it (multiple selection)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            var elements = [];
            elements.push(virtualList.items().eq(1));
            elements.push(virtualList.items().eq(2));
            elements.push(virtualList.items().eq(7));

            for (var i = 0; i < elements.length; i++) {
                virtualList.select(elements[i]);
                ok(elements[i].hasClass(SELECTED));
            }
        }, 100);
    });

    asyncTest("selecting already selected listItem does not deselect it", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);
            ok(element.hasClass(SELECTED));

            virtualList.select(element);
            ok(element.hasClass(SELECTED));
        }, 100);
    });

    asyncTest("selecting already selected listItems visually deselects it (multiple selection)", 4, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            var elements = [];
            elements.push(virtualList.items().eq(1));
            elements.push(virtualList.items().eq(2));
            elements.push(virtualList.items().eq(7));

            for (var i = 0; i < elements.length; i++) {
                virtualList.select(elements[i]);
                ok(elements[i].hasClass(SELECTED));
            }

            virtualList.select(elements[2]);
            ok(!elements[2].hasClass(SELECTED));
        }, 100);
    });

    asyncTest("selecting listItem selects it as a value of the list", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);

            equal(virtualList.value()[0], 0);
        }, 100);
    });

    asyncTest("selecting listItem selects it as a value of the list (multiple selection)", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            var elements = [];
            elements.push(virtualList.items().eq(1));
            elements.push(virtualList.items().eq(2));
            elements.push(virtualList.items().eq(7));

            for (var i = 0; i < elements.length; i++) {
                virtualList.select(elements[i]);
            }

            equal(kendo.stringify(virtualList.value()), kendo.stringify([1, 2, 7]));
        }, 100);
    });

    asyncTest("selecting already selected listItem does not deselect it as a value of the list", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);
            equal(virtualList.value()[0], 0);

            virtualList.select(element);
            equal(virtualList.value()[0], 0);
        }, 100);
    });

    asyncTest("selecting already selected listItem deselects it as a value of the list (multiple selection)", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            var elements = [];
            elements.push(virtualList.items().eq(1));
            elements.push(virtualList.items().eq(2));
            elements.push(virtualList.items().eq(7));

            for (var i = 0; i < elements.length; i++) {
                virtualList.select(elements[i]);
            }

            virtualList.select(elements[1]);

            equal(kendo.stringify(virtualList.value()), kendo.stringify([1, 7]));
        }, 100);
    });

    asyncTest("setting the initial value selects the item", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: 6,
            valueMapper: valueMapper,
            selectable: true
        });

        setTimeout(function() {
            start();

            ok(virtualList.items().eq(6).hasClass(SELECTED), "Item 6 is selected");
        }, 100);
    });

    asyncTest("setting the initial value selects the item (multiple selection)", 3, function() {
        var values = [1, 10, 6];
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: values,
            valueMapper: valueMapper,
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            for (var i = 0; i < values.length; i++) {
                ok(virtualList.items().eq(values[i]).hasClass(SELECTED), "Item " + i + " is selected");
            }
        }, 100);
    });

    asyncTest("setting the value with the value method updates the selection", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            valueMapper: valueMapper
        });

        setTimeout(function() {
            start();

            virtualList.value(9);

            ok(virtualList.items().eq(9).hasClass(SELECTED), "Item 9 is selected");
        }, 100);
    });

    asyncTest("setting the value with the value method updates the selection (multiple selection)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple",
            valueMapper: valueMapper
        });

        setTimeout(function() {
            start();

            virtualList.value([1, 5, 6]);

            ok(virtualList.items().eq(1).hasClass(SELECTED), "Item 1 is selected");
            ok(virtualList.items().eq(5).hasClass(SELECTED), "Item 5 is selected");
            ok(virtualList.items().eq(6).hasClass(SELECTED), "Item 6 is selected");
        }, 100);
    });

    asyncTest("value method works if called before the dataSource is fetched and list is created", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            valueMapper: valueMapper
        });

        virtualList.value(3);

        setTimeout(function() {
            start();
            ok(virtualList.items().eq(3).hasClass(SELECTED), "Item 3 is selected");
        }, 100);
    });

    asyncTest("value method works if called before the dataSource is fetched and list is created (multiple values)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple",
            valueMapper: valueMapper
        });

        virtualList.value([1, 5, 9]);

        setTimeout(function() {
            start();
            ok(virtualList.items().eq(1).hasClass(SELECTED), "Item 1 is selected");
            ok(virtualList.items().eq(5).hasClass(SELECTED), "Item 5 is selected");
            ok(virtualList.items().eq(9).hasClass(SELECTED), "Item 9 is selected");
        }, 100);
    });

    asyncTest("selecting item triggers the change event", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            change: function() {
                ok(true, "change is triggered");
            }
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);
        }, 100);
    });

    asyncTest("selecting already selected item does not trigger the change event", 0, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: 0,
            selectable: true,
            change: function() {
                ok(false, "change is triggered");
            }
        });

        setTimeout(function() {
            start();
            virtualList.select(0);
        }, 100);
    });

    asyncTest("selecting listItem selects it and saves the corresponding dataItem", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().first();
            virtualList.select(element);

            equal(virtualList.selectedDataItems().length, 1, "One item is selected");
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[0], "First item is selected");
        }, 100);
    });

    asyncTest("selecting listItem selects it and saves the corresponding dataItem (multiple items)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();

            var elements = [];
            elements.push(virtualList.items().eq(0));
            elements.push(virtualList.items().eq(1));
            elements.push(virtualList.items().eq(2));

            for (var i = 0; i < elements.length; i++) {
                virtualList.select(elements[i]);
                equal(virtualList.selectedDataItems()[i], asyncDataSource.data()[i]);
            }
        }, 100);
    });

    asyncTest("saves the dataItems that correspond to the initially set values", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: [0, 1],
            valueMapper: valueMapper,
            selectable: true
        });

        setTimeout(function() {
            start();

            equal(virtualList.selectedDataItems().length, 2);
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[0]);
            equal(virtualList.selectedDataItems()[1], asyncDataSource.data()[1]);
        }, 100);
    });

    asyncTest("selecting already selected listItem removes it from stored dataItems", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple",
            value: [0, 7]
        });

        setTimeout(function() {
            start();

            var element = virtualList.items().eq(0);
            virtualList.select(element);

            equal(virtualList.selectedDataItems().length, 1, "First item is removed");
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[7], "Second item is saved");
        }, 100);
    });

    asyncTest("changing the value through the value method updates dataItems collection", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            valueMapper: valueMapper
        });

        setTimeout(function() {
            start();

            virtualList.value([0,1]);

            equal(virtualList.selectedDataItems().length, 2);
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[0]);
            equal(virtualList.selectedDataItems()[1], asyncDataSource.data()[1]);
        }, 100);
    });

    asyncTest("changing the value through the value method updates dataItems collection", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            valueMapper: valueMapper
        });

        setTimeout(function() {
            start();

            virtualList.value([0,1]);

            equal(virtualList.selectedDataItems().length, 2);
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[0]);
            equal(virtualList.selectedDataItems()[1], asyncDataSource.data()[1]);
        }, 100);
    });

    asyncTest("changing the value through the value method updates dataItems collection (initially set values)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: [7],
            valueMapper: valueMapper,
            selectable: true
        });

        setTimeout(function() {
            start();

            virtualList.value([0,1]);

            equal(virtualList.selectedDataItems().length, 2);
            equal(virtualList.selectedDataItems()[0], asyncDataSource.data()[0]);
            equal(virtualList.selectedDataItems()[1], asyncDataSource.data()[1]);
        }, 100);
    });

    asyncTest("not available dataItems set as values are prefetched", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple",
            valueMapper: function(o) {
                o.success([7, 256]);
            }
        });

        asyncDataSource.one("change", function() {
            virtualList.value([7, 256]).then(function() {
                start();
                equal(virtualList.selectedDataItems().length, 2);
                ok(virtualList.selectedDataItems()[0].value === 7);
                ok(virtualList.selectedDataItems()[1].value === 256);
            });
        });
    });

    asyncTest("not available dataItems are given as null in dataItems collection (initially set items)", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            value: [7, 256],
            valueMapper: valueMapper,
            selectable: "multiple"
        });

        virtualList.bind("listBound", function() {
            start();

            equal(virtualList.selectedDataItems().length, 2);
            ok(virtualList.selectedDataItems()[0].value === 7);
            ok(virtualList.selectedDataItems()[1].value === 256);
        });
    });

    asyncTest("selection is persisted accross ranges", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            itemHeight: 40,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        var element;

        setTimeout(function() {
            element = virtualList.items().first();
            virtualList.select(element);
            ok(element.hasClass(SELECTED));
            scroll(container, 4 * CONTAINER_HEIGHT);
            setTimeout(function() {
                start();
                scroll(container, 0);

                ok(element.hasClass(SELECTED), "First item is not selected");
            }, 300);
        }, 100);
    });

    asyncTest("previously selected item is de-selected (single selection)", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            var element2 = virtualList.items().eq(2);
            virtualList.select(element1);
            virtualList.select(element2);

            equal(virtualList.items().filter("." + SELECTED).length, 1);
        }, 100);
    });

    asyncTest("previously selected value is removed (single selection)", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            var element2 = virtualList.items().eq(2);
            virtualList.select(element1);
            virtualList.select(element2);

            equal(virtualList.value().length, 1);
            equal(virtualList.value()[0], 2);
        }, 100);
    });

    asyncTest("previously selected dataItem is removed (single selection)", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            var element2 = virtualList.items().eq(2);
            virtualList.select(element1);
            virtualList.select(element2);

            equal(virtualList.selectedDataItems().length, 1);
            equal(virtualList.selectedDataItems()[0].value, 2);
        }, 100);
    });

    /* select method */

    asyncTest("select method focuses the element", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element = virtualList.items().eq(1);
            virtualList.select(element);

            ok(element.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("select method selects the element", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element = virtualList.items().eq(1);
            virtualList.select(element);

            ok(element.hasClass(SELECTED));
            equal(virtualList.value()[0], 1);
            equal(virtualList.selectedDataItems()[0].value, 1);
        }, 100);
    });

    asyncTest("select method changes the focused element", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            virtualList.select(element1);

            var element2 = virtualList.items().eq(2);
            virtualList.select(element2);

            ok(!element1.hasClass(FOCUSED));
            ok(element2.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("select method changes the value", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            virtualList.select(element1);

            var element2 = virtualList.items().eq(2);
            virtualList.select(element2);

            equal(virtualList.value().length, 1);
            equal(virtualList.value()[0], 2);
        }, 100);
    });

    asyncTest("select method accepts predicate function", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            virtualList.select(function(dataItem) {
                return dataItem.value === 2;
            });

            var element = virtualList.items().eq(2);
            ok(element.hasClass(FOCUSED));
            ok(element.hasClass(SELECTED));
            equal(virtualList.value()[0], 2);
        }, 100);
    });

    /* Temporary remove this tests, optionLabel will not be supported in Q1 2015
    asyncTest("select method focuses the optionLabel", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            optionLabel: {
                value: "",
                text: "Option Label"
            }
        });

        setTimeout(function() {
            start();
            virtualList.select(-1);

            var optionLabel = virtualList.optionLabel;

            ok(optionLabel.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("select method selects the optionLabel", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true,
            optionLabel: {
                value: "",
                text: "Option Label"
            }
        });

        setTimeout(function() {
            start();
            virtualList.select(-1);

            var optionLabel = virtualList.optionLabel;

            ok(optionLabel.hasClass(FOCUSED));
            ok(optionLabel.hasClass(SELECTED));
            equal()
        }, 100);
    });
    */

    asyncTest("select method returns currently selected index", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            virtualList.select(3);
            equal(virtualList.select(), 3);
        }, 100);
    });

    asyncTest("select method deletes selected value when -1 is passed", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            virtualList.select(-1);
            equal(virtualList.value().length, 0);
        }, 100);
    });

    asyncTest("select method sets selected values when multiple elements are selected", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();
            virtualList.select(1);
            virtualList.select(0);

            equal(virtualList.value().length, 2);
            equal(virtualList.value()[0], 1);
            equal(virtualList.value()[1], 0);
        }, 100);
    });

    asyncTest("select method removes values on deselect", function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: "multiple"
        });

        setTimeout(function() {
            start();
            virtualList.select(0);
            virtualList.select(1);

            virtualList.select(0);
            virtualList.select(1);

            equal(virtualList.value().length, 0);
        }, 100);
    });

    /* select method */

    asyncTest("focus method adds focused class to the element", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element = virtualList.items().eq(1);
            virtualList.focus(element);

            ok(element.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("focus method changes the focused element", 2, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            virtualList.focus(element1);

            var element2 = virtualList.items().eq(2);
            virtualList.focus(element2);

            ok(!element1.hasClass(FOCUSED));
            ok(element2.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("focus method does not change the selection", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            virtualList.select(element1);

            var element2 = virtualList.items().eq(2);
            virtualList.focus(element2);

            ok(!element1.hasClass(FOCUSED));
            ok(element1.hasClass(SELECTED));
            ok(element2.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("focus method accepts predicate function", 1, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            virtualList.focus(function(dataItem) {
                return dataItem.value === 1;
            });

            var element = virtualList.items().eq(1);
            ok(element.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("next method focuses the next item", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(1);
            virtualList.select(element1);

            var element2 = virtualList.items().eq(2);
            virtualList.next();

            ok(!element1.hasClass(FOCUSED));
            ok(element1.hasClass(SELECTED));
            ok(element2.hasClass(FOCUSED));
        }, 100);
    });

    asyncTest("prev method focuses the prev item", 3, function() {
        var virtualList = new VirtualList(container, {
            dataSource: asyncDataSource,
            template: "#=text#",
            dataValueField: "value",
            selectable: true
        });

        setTimeout(function() {
            start();
            var element1 = virtualList.items().eq(2);
            virtualList.select(element1);

            var element2 = virtualList.items().eq(1);
            virtualList.prev();

            ok(!element1.hasClass(FOCUSED));
            ok(element1.hasClass(SELECTED));
            ok(element2.hasClass(FOCUSED));
        }, 100);
    });

})();
