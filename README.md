CCDump
======

CCDump is a Firefox extension which display object graph created by cycle collector.
After installation, open:

    about:ccdump

* Download from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/cycle-collector-analyzer/)
* Home page [http://www.softwareishard.com/blog/ccdump](http://www.softwareishard.com/blog/ccdump/)

More Info
---------

* [Bug 726346](https://bugzilla.mozilla.org/show_bug.cgi?id=726346) - Implement a version of nsICycleCollectorListener for devtools

Mochitests
----------

You can use ccdump to dump the object graph into a JSON file within Mozilla's
mochitests. This is useful for debugging memory leaks in tests. Once you have
the JSON you can import it into the addon UI for graph inspection.

Example usage:

    function call_ccdump()
    {
      let scope = {};
      let ccdump_path = "file:///home/mihai/src/ccdump";
      Services.scriptloader.loadSubScript(ccdump_path + "/simple-wrapper.js", scope);
      let ccdump = new scope.ccdump_wrapper({
        global: scope,
        ccdump_path: ccdump_path,
      });
      ccdump.save("/home/mihai/ccdump-dbg-memleaks-" + Date.now(),
        function _onCcdumpSave() {
          ccdump.clear();
          ccdump = scope = null;
          executeSoon(finish);
        });
    }

Instead of calling `finish()` in your test, invoke `call_ccdump()`.

