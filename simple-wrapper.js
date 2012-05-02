function ccdump_wrapper(options)
{
  this.options = options;
  this.requireConfig = {
    baseUrl: options.ccdump_path + "/content",
  };
}

ccdump_wrapper.prototype = {
  options: null,
  requireConfig: null,
  analyzer: null,
  graphSerializer: null,
  _loaded: false,
  _ran: false,

  load_ccdump: function load_ccdump(callback)
  {
    if (this._loaded) {
      callback && callback(this);
      return;
    }

    let loaderJs = this.options.ccdump_path + "/content/loader.js";
    let global = this.options.global;
    Services.scriptloader.loadSubScript(loaderJs, global, "utf8");

    global.require(this.requireConfig,
      ["app/analyzer", "app/graphSerializer"],
      function _onRequireCcdump(mAnalyzer, mGraphSerializer) {
        this.analyzer = new mAnalyzer();
        this.graphSerializer = mGraphSerializer;
        this._loaded = true;
        callback && callback(this);
      }.bind(this)
    );
  },

  run: function ccdump_run(callback)
  {
    let listener = {
      onProgress: function() { },
      onFinished: function() {
        this._ran = true;
        callback && callback(this);
      }.bind(this),
    };

    this.load_ccdump(function _run() {
      this.analyzer.run(listener);
    }.bind(this));
  },

  save: function ccdump_save(filePath, callback)
  {
    function doSave() {
      let file = Cc["@mozilla.org/file/local;1"].
                 createInstance(Ci.nsILocalFile);
      file.initWithPath(filePath);

      let fs = Cc["@mozilla.org/network/file-output-stream;1"].
               createInstance(Ci.nsIFileOutputStream);
      let modeFlags = 0x02 | 0x08 | 0x20;
      fs.init(file, modeFlags, 420 /* 0644 */, fs.DEFER_OPEN);

      let converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Ci.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      let input = converter.convertToInputStream(this.toJSON());

      NetUtil.asyncCopy(input, fs, function _onAsyncCopy(aStatus) {
        if (!Components.isSuccessCode(aStatus)) {
          Cu.reportError("failed to save ccdump file " + filePath);
        }

        callback && callback(aStatus);
      });
    }

    if (this._ran) {
      doSave.call(this);
    } else {
      this.run(doSave.bind(this));
    }
  },

  toJSON: function ccdump_toJSON()
  {
    return this.graphSerializer.toJSON(this.analyzer);
  },

  clear: function ccdump_clear()
  {
    this.analyzer.clear();
    this._ran = false;
  },
};
