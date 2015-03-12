(function() {
    var StaticList = kendo.ui.StaticList,
    element;

    module("kendo.ui.StaticList API", {
        setup: function() {
            kendo.ns = "kendo-";
            element = $("<ul></ul>").appendTo(QUnit.fixture);
        },
        teardown: function() {
            element.data("kendoStaticList").destroy();

            kendo.support.touch = false;
            kendo.support.mobileOS = false;
            kendo.ns = "";
        }
    });

    function getData(count) {


    }

    test("setDataSource method overrides current data source", function() {
        var list = new StaticList(element, {
            dataSource: ["item"],
            template: "#:data#"
        });

        list.setDataSource(["1", "2"]);

        list.dataSource.read();

        equal(list.dataSource.view().length, 2);
    });

    test("setOptions re-create templates", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item"],
            template: "new #:data#"
        });

        list.dataSource.read();

        equal(element.children(":first").html(), "new item");
    });

    test("widget focuses last selected item during rendering", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple",
            value: ["item1", "item3"]
        });

        list.dataSource.read();

        var current = list.focus();

        equal(current[0], list.element[0].children[1]);
    });

    test("dataItems method returns list of the selected items", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.select(0);
        list.select(2);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 2);
        equal(dataItems[0], list.dataSource.view()[0].items[0]);
        equal(dataItems[1], list.dataSource.view()[1].items[0]);
    });

    test("dataItems method sets selected values", function() {
        var data = [
            { name: "item1", type: "a" },
            { name: "item2", type: "b" },
            { name: "item3", type: "a" }
        ];

        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: data,
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.selectedDataItems([data[0], data[2]]);

        var values = list.value();

        equal(values.length, 2);
        equal(values[0], "item1");
        equal(values[1], "item3");
    });

    test("focus method focuses li element", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.focus(children.eq(1));

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("focus method focuses by index", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.focus(1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("focus method clears focus if index is -1", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.focus(1);
        list.focus(-1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select an item by element", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(children.eq(1));


        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select an item by predicate", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        list.select(function(data) {
            return data === "item2";
        });

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method deselects items if predicate does not find item", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        list.select(function(data) {
            return data === "test";
        });

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select an item by index", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);


        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("selects a single item if selectable is single", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            selectable: true,
            template: "#:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select([1, 2]);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item k-state-focused k-state-selected");
    });

    test("select items by indices", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "#:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select([1, 2]);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-selected");
        equal(children.eq(2).attr("class"), "k-item k-state-focused k-state-selected");
    });

    test("select method handles unexisting indices", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "#:data#",
            value: ["item1", "item3"]
        });

        list.dataSource.read();

        var children = element.children();

        list.select([3]);

        ok(true);
    });

    test("deselect items by indices", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "#:data#",
            value: ["item1", "item3"]
        });

        list.dataSource.read();

        var children = element.children();

        list.select([0, 2]);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item k-state-focused");
    });

    test("select method deselects previous item", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);
        list.select(0);

        equal(children.eq(0).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method deselects selected items is index is -1", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);
        list.select(-1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method selects multiple items", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);
        list.select(0);

        equal(children.eq(0).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(1).attr("class"), "k-item k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method deselects item in 'multiple' mode", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);
        list.select(1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method does nothing in 'multiple' mode if index is -1", function() {
        var list = new StaticList(element, {
            template: "#:data#"
        });

        list.setOptions({
            dataSource: ["item1", "item2", "item3"],
            selectable: "multiple",
            template: "new #:data#"
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);
        list.select(-1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method works with grouped data source", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "a" },
                    { name: "item3", type: "b" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        var children = element.children();

        list.select(1);

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused k-state-selected");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("select method sets selected data items", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.select(1);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 1);
        equal(dataItems[0], list.dataSource.view()[0].items[1]);
    });

    test("select method sets selected data items when multiple elements are selected", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.select(1);
        list.select(0);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 2);
        equal(dataItems[0], list.dataSource.view()[0].items[1]);
        equal(dataItems[1], list.dataSource.view()[0].items[0]);
    });

    test("select method removes dataItems on deselect", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.select(0);
        list.select(1);

        list.select(0);
        list.select(1);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 0);
    });

    test("select method removes dataItems in single mode selection", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.select(0);
        list.select(1);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 1);
        equal(dataItems[0], list.dataSource.view()[0].items[1]);
    });

    test("select method sets selected values", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.select(1);

        var values = list.value();

        equal(values.length, 1);
        equal(values[0], list.dataSource.view()[0].items[1].name);
    });

    test("select method deletes selected value on item unselect", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ]
            },
            template: '#:data.name#',
            value: ["item2"]
        });

        list.dataSource.read();

        list.select(-1);

        var values = list.value();

        equal(values.length, 0);
    });

    test("select method sets selected values when multiple elements are selected", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.select(1);
        list.select(0);

        var values = list.value();

        equal(values.length, 2);
        equal(values[0], list.dataSource.view()[0].items[1].name);
        equal(values[1], list.dataSource.view()[0].items[0].name);
    });

    test("select method removes values on deselect", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.select(0);
        list.select(1);

        list.select(0);
        list.select(1);

        var values = list.value();

        equal(values.length, 0);
    });

    test("select method removes values in single mode selection", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.select(0);
        list.select(1);

        var value = list.value();

        equal(value.length, 1);
        equal(value[0], list.dataSource.view()[0].items[1].name);
    });

    test("select method returns selected indices", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.select(1);

        var indices = list.select();

        equal(indices.length, 1);
        equal(indices[0], 1);
    });

    test("value method selects an item", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#'
        });

        list.dataSource.read();

        list.value("item1");

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 1);
        equal(dataItems[0], list.dataSource.view()[0].items[0]);
    });

    test("value method selects multiple items", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.dataSource.read();

        list.value(["item2", "item3"]);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 2);
        equal(dataItems[0], list.dataSource.view()[1].items[0]);
        equal(dataItems[1], list.dataSource.view()[0].items[1]);
    });

    test("value method sets selected indeces", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple"
        });

        list.value(["item2", "item3"]);

        list.dataSource.read();

        var indices = list.select();

        equal(indices.length, 2);
        equal(indices[0], 2); //Item2
        equal(indices[1], 1); //Item3 (this is before item 2 in grouped list)
    });

    test("value method deselects an item", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            value: "item1"
        });

        list.dataSource.read();

        list.value([]);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 0);
    });

    test("value method removes multiple values", function() {
        var list = new StaticList(element, {
            dataValueField: "name",
            dataSource: {
                data: [
                    { name: "item1", type: "a" },
                    { name: "item2", type: "b" },
                    { name: "item3", type: "a" }
                ],
                group: "type"
            },
            template: '#:data.name#',
            groupTemplate: '#:data#',
            selectable: "multiple",
            value: ["item1", "item2", "item3"]
        });

        list.dataSource.read();

        list.value(["item3"]);

        var dataItems = list.selectedDataItems();

        equal(dataItems.length, 1);
        equal(dataItems[0].name, "item3");
    });

    test("next method focuses first item if no items are focused", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.next();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item k-state-focused");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("next method focuses next item", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.focus(0);
        list.next();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("prev method focuses last item if no items are focused", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.prev();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item k-state-focused");
    });

    test("prev method focuses prev item", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.focus(2);
        list.prev();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item k-state-focused");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("first method focuses first item", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.first();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item k-state-focused");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item");
    });

    test("last method focuses last item", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        list.dataSource.read();
        list.last();

        var children = element.children();

        equal(children.eq(0).attr("class"), "k-item");
        equal(children.eq(1).attr("class"), "k-item");
        equal(children.eq(2).attr("class"), "k-item k-state-focused");
    });

    test("scrollToIndex passes the correct item to scroll method", function() {
        var list = new StaticList(element, {
            dataSource: ["item1", "item2", "item3"],
            template: "#:data#"
        });

        stub(list, {
            scroll: list.scroll
        });

        list.dataSource.read();

        list.scrollToIndex(2);

        var children = element[0].children;

        equal(list.calls("scroll"), 1);
        equal(list.args("scroll")[0], children[2]);
    });
})();
