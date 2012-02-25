/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/popupMenu"
],

function(Domplate, Lib, Trace, Menu) { with (Domplate) {

// ********************************************************************************************* //

/**
 * @domplate Represents a toolbar widget.
 */
var ToolbarTempl = domplate(
/** @lends ToolbarTempl */
{
    tag:
        DIV({"class": "toolbar", onclick: "$onClick"}),

    buttonTag:
        SPAN({"class": "$button|getClassName toolbarButton", title: "$button.tooltiptext",
            $text: "$button|hasLabel", onclick: "$button|getCommand"},
            "$button|getLabel"
        ),

    dropDownTag:
        SPAN({"class": "$button|getClassName toolbarButton dropDown", _repObject: "$button",
            $text: "$button|hasLabel", onclick: "$onCommand"},
            SPAN({"class": "labelBox", title: "$button.tooltiptext"},
                "$button|getLabel"
            ),
            SPAN({"class": "dropMarker", onclick: "$onDropDown"},
                SPAN({"class": "arrow"})
            )
        ),

    separatorTag:
        SPAN({"class": "toolbarSeparator", style: "color: gray;"}, "|"),

    hasLabel: function(button)
    {
        return button.label ? true : false;
    },

    getLabel: function(button)
    {
        return button.label ? button.label : "";
    },

    getClassName: function(button)
    {
        return button.className ? button.className : "";
    },

    getCommand: function(button)
    {
        return button.command ? button.command : function() {};
    },

    onClick: function(event)
    {
        var e = Lib.fixEvent(event);

        // Cancel button clicks so they are not propagated further.
        Lib.cancelEvent(e);
    },

    onCommand: function(event)
    {
        var e = Lib.fixEvent(event);
        Lib.cancelEvent(e);

        var target = e.target;
        var element = Lib.getAncestorByClass(target, "toolbarButton");
        if (element.getAttribute("disabled") == "true")
            return;

        var button = element.repObject;
        if (button.command)
        {
            button.command();
        }
        else if (button.getItems)
        {
            var menu = new Menu({id: "toolbarContextMenu", items: button.getItems()});
            menu.showPopup(element);
        }
    },

    onDropDown: function(event)
    {
        var e = Lib.fixEvent(event);

        var target = e.target;
        var element = Lib.getAncestorByClass(target, "toolbarButton");
        if (element.getAttribute("disabled") == "true")
            return;

        // If there is no associted command let's process the event in onCommmand,
        // which is trying to display a drop down menu.
        var button = element.repObject;
        if (!(button.getItems && button.command))
            return;

        Lib.cancelEvent(e);

        // Display drop down now, the onCommand would execute the command.
        var dropMarker = Lib.getAncestorByClass(target, "dropMarker");
        var menu = new Menu({id: "toolbarContextMenu", items: button.getItems()});
        menu.showPopup(dropMarker);
    },

    getButton: function(target)
    {
        var element = Lib.getAncestorByClass(target, "toolbarButton");
        return element.repObject;
    }
});

// ********************************************************************************************* //

/**
 * Toolbat widget.
 */
function Toolbar()
{
    this.buttons = [];
}

Toolbar.prototype =
/** @lends Toolbar */
{
    addButton: function(button)
    {
        if (!button.tooltiptext)
            tooltiptext = "";
        this.buttons.push(button);
    },

    removeButton: function(buttonId)
    {
        for (var i=0; i<this.buttons.length; i++)
        {
            if (this.buttons[i].id == buttonId)
            {
                this.buttons.splice(i, 1);
                break;
            }
        }
    },

    addButtons: function(buttons)
    {
        for (var i=0; i<buttons.length; i++)
            this.addButton(buttons[i]);
    },

    getButton: function(buttonId)
    {
        for (var i=0; i<this.buttons.length; i++)
        {
            if (this.buttons[i].id == buttonId)
                return this.buttons[i];
        }
    },

    render: function(parentNode)
    {
        // Don't render if there are no buttons. Note that buttons can be removed
        // as part of viewer customization.
        if (!this.buttons.length)
            return;

        // Use the same parent as before if just re-rendering.
        if (this.element)
            parentNode = this.element.parentNode;

        this.element = ToolbarTempl.tag.replace({}, parentNode);
        for (var i=0; i<this.buttons.length; i++)
        {
            var button = this.buttons[i];
            var defaultTag = button.getItems ? ToolbarTempl.dropDownTag : ToolbarTempl.buttonTag;
            var tag = button.tag ? button.tag : defaultTag;

            var element = tag.append({button: button}, this.element);
            button.element = element;

            // If its dropdown with associated command the arrow is working
            // as an independent drop marker. Otherwise, clicking anywhere in
            // the button show a drop down menu.
            if (button.getItems && button.command)
            {
                var dropMarker = Lib.getElementByClass(element, "dropMarker");
                Lib.setClass(dropMarker, "menuButton");
            }

            if (button.initialize)
                button.initialize(element);

            if (i<this.buttons.length-1 && !this.noSeparators)
                ToolbarTempl.separatorTag.append({}, this.element);
        }

        return this.element;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Button State

    disableButton: function(buttonId)
    {
        var button = this.getButton(buttonId);
        button.element.setAttribute("disabled", "true");
    },

    enableButton: function(buttonId)
    {
        var button = this.getButton(buttonId);
        button.element.removeAttribute("disabled");
    },

    showButton: function(buttonId)
    {
        var button = this.getButton(buttonId);
        Lib.collapse(button.element, false);
    },

    hideButton: function(buttonId)
    {
        var button = this.getButton(buttonId);
        Lib.collapse(button.element, true);
    }
};

// ********************************************************************************************* //

return Toolbar;

// ********************************************************************************************* //
}});
