/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/domTree", //xxxHonza: hack, registered reps should be a separate module
    "lib/trace"
],

function(Domplate, Lib, DomTree, FBTrace) { with (Domplate) {

// ********************************************************************************************* //

function TableView()
{
}

TableView.prototype = domplate(
{
    className: "table",

    tag:
        DIV({"class": "dataTableSizer", "tabindex": "-1"},
            TABLE({"class": "dataTable", cellspacing: 0, cellpadding: 0, width: "100%",
                "role": "grid"},
                THEAD({"class": "dataTableThead", "role": "presentation"},
                    TR({"class": "headerRow focusRow dataTableRow subFocusRow", "role": "row",
                        onclick: "$onClickHeader"},
                        FOR("column", "$object.columns",
                            TH({"class": "headerCell a11yFocus", "role": "columnheader",
                                $alphaValue: "$column.alphaValue"},
                                DIV({"class": "headerCellBox"},
                                    "$column.label"
                                )
                            )
                        )
                    )
                ),
                TBODY({"class": "dataTableTbody", "role": "presentation"},
                    FOR("row", "$object.data|getRows",
                        TAG("$row|getRowTag", {row: "$row", columns: "$row|getColumns"})
                    )
                )
            )
        ),

    rowTag:
        TR({"class": "focusRow dataTableRow subFocusRow", "role": "row", _repObject: "$row"},
            FOR("column", "$columns",
                TD({"class": "a11yFocus dataTableCell", "role": "gridcell"},
                    TAG("$column|getValueTag", {object: "$column|getValue"})
                )
            )
        ),

    moreTag:
        TR({"class": "dataTableFooterRow"},
            TD({"class": "dataTableMore", colspan: "$object.columns.length"},
                SPAN({"class": "button", onclick: "$onMore"},
                    "Get Next $limit"
                ),
                SPAN({"class": "button", onclick: "$onGetAll",
                    title: "This can be really slow in case of huge number of entries"},
                    "Get Remaining ($remaining)"
                )
            )
        ),

    getRowTag: function()
    {
        return this.rowTag;
    },

    getValue: function(column)
    {
        return column.value;
    },

    getValueTag: function(colAndValue)
    {
        var object = colAndValue.value;
        var col = colAndValue.col;
        if (col.rep)
            return col.rep.tag;

        // Display embedded tree for object in table-cells
        var type = typeof(object);
        if (type == "object")
            return DomTree.Reps.Tree.tag;

        var rep = DomTree.Reps.getRep(object);
        return rep.shortTag || rep.tag;
    },

    getRows: function(data)
    {
        var props = this.getProps(data);
        if (!props.length)
            return [];

        if (props.length > this.limit)
            this.throttleQueue = props.splice(this.limit, props.length - this.limit);

        return props;
    },

    getColumns: function(row)
    {
        if (typeof(row) != "object")
            return [row];

        var cols = [];
        for (var i=0; i<this.columns.length; i++)
        {
            var col = this.columns[i];
            var prop = this.columns[i].property;

            if (typeof(prop) == "undefined")
            {
                value = row;
            }
            else if (typeof row[prop] == "undefined")
            {
                var props = (typeof(prop) == "string") ? prop.split(".") : [prop];

                var value = row;
                for (var p in props)
                    value = (value && value[props[p]]) || undefined;
            }
            else
            {
                value = row[prop];
            }

            cols.push({value: value, col: col});
        }
        return cols;
    },

    getProps: function(obj)
    {
        if (typeof(obj) != "object")
            return [obj];

        if (obj.length)
            return Lib.cloneArray(obj);

        var arr = [];
        for (var p in obj)
        {
            var value = obj[p];
            if (this.domFilter(value, p))
                arr.push(value);
        }
        return arr;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Sorting

    onClickHeader: function(event)
    {
        var table = Lib.getAncestorByClass(event.target, "dataTable");
        var header = Lib.getAncestorByClass(event.target, "headerCell");
        if (!header)
            return;

        var numerical = !Lib.hasClass(header, "alphaValue");

        var colIndex = 0;
        for (header = header.previousSibling; header; header = header.previousSibling)
            ++colIndex;

        this.sort(table, colIndex, numerical);
    },

    sort: function(table, colIndex, numerical)
    {
        var tbody = Lib.getChildByClass(table, "dataTableTbody");
        var thead = Lib.getChildByClass(table, "dataTableThead");

        var footer;
        var values = [];
        for (var row = tbody.childNodes[0]; row; row = row.nextSibling)
        {
            if (Lib.hasClass(row, "dataTableFooterRow"))
            {
                footer = row;
                continue;
            }

            var cell = row.childNodes[colIndex];
            var value = numerical ? parseFloat(cell.textContent) : cell.textContent;
            values.push({row: row, value: value});
        }

        values.sort(function(a, b) { return a.value < b.value ? -1 : 1; });

        var headerRow = thead.firstChild;
        var headerSorted = Lib.getChildByClass(headerRow, "headerSorted");
        Lib.removeClass(headerSorted, "headerSorted");
        if (headerSorted)
            headerSorted.removeAttribute('aria-sort');

        var header = headerRow.childNodes[colIndex];
        Lib.setClass(header, "headerSorted");

        if (!header.sorted || header.sorted == 1)
        {
            Lib.removeClass(header, "sortedDescending");
            Lib.setClass(header, "sortedAscending");
            header.setAttribute("aria-sort", "ascending");

            header.sorted = -1;

            for (var i = 0; i < values.length; ++i)
                tbody.appendChild(values[i].row);
        }
        else
        {
            Lib.removeClass(header, "sortedAscending");
            Lib.setClass(header, "sortedDescending");
            header.setAttribute("aria-sort", "descending")

            header.sorted = 1;

            for (var i = values.length-1; i >= 0; --i)
                tbody.appendChild(values[i].row);
        }

        tbody.appendChild(footer);
    },

    /**
     * Analyse data and return dynamically created list of columns.
     * @param {Object} data
     */
    getHeaderColumns: function(data)
    {
        // Get the first row in the object.
        var firstRow;
        for (var p in data)
        {
            firstRow = data[p];
            break;
        }

        if (typeof(firstRow) != "object")
            return [{label: "Properties"}];

        // Put together a column property, label and type (type for default sorting logic).
        var header = [];
        for (var p in firstRow)
        {
            var value = firstRow[p];
            if (!this.domFilter(value, p))
                continue;

            header.push({
                property: p,
                label: p,
                alphaValue: (typeof(value) != "number")
            });
        }

        return header;
    },

    /**
     * Filtering based on options set in the DOM panel.
     * @param {Object} value - a property value under inspection.
     * @param {String} name - name of the property.
     * @returns true if the value should be displayed, otherwise false.
     */
    domFilter: function(object, name)
    {
        return true;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Public

    render: function(parentNode, data, cols, limit)
    {
        // No arguments passed into console.table method, bail out for now,
        // but some error message could be displayed in the future.
        if (!data)
            return;

        // Get header info from passed argument (can be null).
        var columns = [];
        for (var i=0; cols && i<cols.length; i++)
        {
            var col = cols[i];
            var prop = (typeof(col.property) != "undefined") ? col.property : col;
            var label = (typeof(col.label) != "undefined") ? col.label : prop;
            var rep = (typeof(col.rep) != "undefined") ? col.rep : null;
            var alphaValue = (typeof(col.alphaValue) != "undefined") ? col.alphaValue : true;

            columns.push({
                property: prop,
                label: label,
                rep: rep,
                alphaValue: alphaValue
            });
        }

        // Generate header info from the data dynamically.
        if (!columns.length)
            columns = this.getHeaderColumns(data);

        try
        {
            // max number of rows rendered at once (no limit if 0)
            this.limit = limit || 0;

            Lib.eraseNode(parentNode);

            this.columns = columns;
            var object = {data: data, columns: columns};
            this.element = this.tag.append({object: object, columns: columns}, parentNode, this);
            this.element.repObject = this;

            // Set vertical height for scroll bar.
            var tBody = Lib.getElementByClass(this.element, "dataTableTbody");
            var maxHeight = 200; // xxxHonza: a pref?
            if (maxHeight > 0 && tBody.clientHeight > maxHeight)
                tBody.style.height = maxHeight + "px";

            // Append footer for dynamical fetch of rows (in case of huge number of rows)
            if (this.throttleQueue && this.throttleQueue.length)
            {
                this.moreTag.insertRows({object: object, columns: columns,
                    limit: this.limit, remaining: this.throttleQueue.length},
                    tBody, this);
            }
        }
        catch (err)
        {
            FBTrace.sysout("tableView.render; EXCEPTION " + err, err);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Dynamic fetching of rows

    onMore: function(event)
    {
        var rows = this.throttleQueue;
        if (!rows || !rows.length)
            return;

        // Get next chunk of rows.
        if (this.limit)
            this.throttleQueue = rows.splice(this.limit, rows.length - this.limit);
        else
            this.throttleQueue = null;

        // Append next chunk of rows into the table
        var tBody = Lib.getElementByClass(this.element, "dataTableTbody");
        for (var i=0; i<rows.length; i++)
        {
            var row = rows[i];
            var cols = this.element.repObject.getColumns(row);
            this.rowTag.insertRows({row: row, columns: cols}, tBody.lastChild.previousSibling, this);
        }

        // If there are no other rows in the throttle queue, remove the "more" button
        if (!this.throttleQueue || !this.throttleQueue.length)
            tBody.removeChild(tBody.lastChild);
    },

    onGetAll: function(event)
    {
        this.limit = 0;
        this.onMore(event);
    }
});

// ********************************************************************************************* //

return TableView;

// ********************************************************************************************* //
}});
