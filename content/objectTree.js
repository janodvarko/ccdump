/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/domTree",
    "analyzer",
    "lib/trace",
    "objectLink",
    "objectMenu",
    "objectGraphGenerator"
],
function(Domplate, DomTree, Analyzer, FBTrace, ObjectLink, ObjectMenu, ObjectGraphGenerator) {

// ********************************************************************************************* //

function ObjectTree(input)
{
    this.input = input
}

ObjectTree.prototype = Domplate.domplate(DomTree.prototype,
{
    createMember: function(type, name, value, level)
    {
        // The name is already displayed as the value on the right side of the tree
        if (name == "name")
            return null;

        // Any internal members are also ignored.
        if (name.indexOf("_") == 0)
            return null;

        var member = DomTree.prototype.createMember(type, name, value, level);
        member.hasChildren = this.hasProperties(value);

        // Apply custom tags to certain objects.
        if (member.value instanceof Analyzer.CCObject)
            member.tag = ObjectMenu.tag;
        else if (name == "address")
            member.tag = ObjectLink.tag;
        else if (member.value instanceof ObjectGraphGenerator.Object)
            member.tag = ObjectMenu.tag;

        return member;
    },

    hasProperties: function(ob)
    {
        if (typeof(ob) == "string")
            return false;

        try {
            for (var name in ob)
            {
                if (name == "name")
                    continue;

                // Any internal members are also ignored.
                if (name.indexOf("_") == 0)
                    continue;

                return true;
            }
        } catch (exc) {}
        return false;
    },

    getValue: function(member)
    {
        if (member.value instanceof Analyzer.CCObject)
        {
            return member.value.name + " [ref: " + member.value.refcount + "]" +
                " marked: " + member.value.gcmarked;
        }
        else if (member.value && member.value.name)
        {
            return member.value.name;
        }

        return member.value;
    },
});

// ********************************************************************************************* //

return ObjectTree;

// ********************************************************************************************* //
});
