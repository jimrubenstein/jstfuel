jstfuel = (function()
{
	var _watching = {},
	_mode = 'production',
	timeout = {},
	templateSources = {},
	vars = {
		MODE_DEV: 'dev',
		MODE_PROD: 'production'
	};

	function WatcherQueue()
	{
		this.queue = [];
		this.timeout = null;
		this.timeoutInterval = 15000;

		this.running = false;
	}

	WatcherQueue.prototype.watchInterval = function(interval)
	{
		if (undefined == interval) return this.timeoutInterval / 1000; //return in seconds

		this.timeoutInterval = interval * 1000; //stored in ms
		this.stop();
		this.start();

		return this;
	}

	WatcherQueue.prototype.watch = function(nspace)
	{
		if (this.queue.indexOf(nspace) == -1)
		{
			this.queue.push(nspace);

			if (!this.running) this.start();
		}

		return this;
	}

	WatcherQueue.prototype.unwatch = function(nspace)
	{
		if (this.queue.indexOf(nspace) > -1)
		{
			this.queue.splice(this.queue.indexOf(nspace), 1);
		}

		if (this.queue.length == 0) this.stop();

		return this;
	}

	WatcherQueue.prototype.start = function()
	{
		this.running = true;
		this._processQueue();
	}

	WatcherQueue.prototype.stop = function()
	{
		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = null;
		this.running = false;

		return this;
	}

	WatcherQueue.prototype._processQueue = function()
	{
		var completed = 0,
			self = this;

		var process = function(onDone)
		{
			if (self.queue.length == 0)
			{
				return onDone.call(self);
			}
			else if (completed == self.queue.length)
			{
				return onDone.call(self);
			}
			else if (false == self.running)
			{
				return onDone.call(self);
			}

			var current = self.queue[ completed ];

			log('Loading templates for ' + current);
			templateSources[ current ].loadTemplate(null, true, function()
			{
				log('Templates loaded (' + current + ')');
				completed++;
				return process(onDone);
			});
		}

		process(this._waitToProcess);
	}

	WatcherQueue.prototype._waitToProcess = function()
	{
		if (this.running)
		{
			var self = this;
			this.timeout = setTimeout(function()
			{
				self._processQueue.call(self);
			}, this.timeoutInterval);
		}

		return this;
	}


	function TemplateSource(opts)
	{
		this.compiled_src = opts.compiled_src || null;
		this.getter = opts.accessor || opts.getter || this.get;
		this.src_root = opts.src_root || null;
		this.compiler = opts.compiler || this.compiler;

		this._tplCache = {};
		this._tplLoaded = false;
		this._watching = false;

		return this;
	}

	TemplateSource.prototype.watch = function(status)
	{
		if (undefined === status) return status;
		this._watching = status;

		return this;
	}

	TemplateSource.prototype.renderer = function(template)
	{
		var self = this;

		this.loadTemplate(template, true);

		return function(data)
		{
			return self.render(template, data);
		}
	}

	TemplateSource.prototype.render = function(template, data)
	{
		return this.getTemplate(template)(data);
	}

	TemplateSource.prototype.getter = 'JST';
	TemplateSource.prototype.get = function(tpl_name)
	{
		if ('string' == typeof this.getter)
		{
			var tpls = resolveVarName(this.getter);

			if (undefined !== tpl_name) return tpls? tpls[ tpl_name ] : undefined;
			return tpls;
		}
		else if ('function' == typeof this.getter)
		{
			return this.getter(tpl_name);
		}
		else if ('object' == typeof this.getter)
		{
			if (undefined !== tpl_name) return this.getter[ tpl_name ];

			return this.getter;
		}

		throw "jstfuel doesn't know how to process your template getter.";
	}

	TemplateSource.prototype.getTemplate = function(template)
	{
		/* How do we load templates in Production vs Dev?
		- In dev we load from the uncompiled source if it's available, otherwise we load from the standard loader
		- In prod we load only from the compiled source
		*/
		if (undefined == this._tplCache[ template ])
		{
			if (undefined == this.get(template))
			{
				this.loadTemplate(template, false);

				return this.getTemplate( template );
			}
			else
			{
				this._tplCache[ template ] = this.get(template);
			}
		}

		return this._tplCache[ template ];
	}

	TemplateSource.prototype.loadTemplate = function(template, async, cb)
	{
		if (vars.MODE_DEV == mode() && this.src_root)
		{
			var async = (undefined === async? false : async);

			if (undefined === template || null === template)
			{
				var completed = 0,
					self = this;

				function load()
				{
					if (Object.keys( self._tplCache ).length == 0)
					{
						return cb.call();
					}
					else if (Object.keys( self._tplCache ).length == completed)
					{
						return cb.call();
					}

					var current_key = Object.keys( self._tplCache )[ completed ];

					self.loadRawTemplate(current_key, async, function()
					{
						completed++;
						load();
					});
				}

				load();
			}
			else
			{
				this.loadRawTemplate(template, async, cb);
			}
		}
		else
		{
			this.loadCompiledTemplates((undefined === async? true : async), cb);
		}
	}

	TemplateSource.prototype.loadCompiledTemplates = function(async, cb)
	{
		var self = this;
		return $.ajax({
			url: this.compiled_src,
			dataType: 'script',
			cache: false,
			type: 'GET',
			async: (undefined === async? true : async),
			success: function()
			{
				self.cacheTemplate(self.get());
				if (undefined !== cb) cb();
			}
		});
	}

	TemplateSource.prototype.loadRawTemplate = function(template, async, cb)
	{
		var self = this;

		return $.ajax({
			url: this.src_root + ("/" + template).replace(/^\/\//, '/'),
			dataType: 'text',
			cache: false,
			type: "GET",
			async: (undefined === async? false : async),
			success: function(data)
			{
				self.compileTemplate(template, data);

				if (undefined !== cb) cb();
			},
			error: function(xhr, status, error)
			{
				throw error;
			}
		});
	}

	TemplateSource.prototype.cacheTemplate = function() // tpl_object (key=>val) map of template fns, or tpl_name, tpl fn
	{
		var tpl_object = {};
		if (arguments.length == 2)
		{
			tpl_object[ arguments[0] ] = arguments[1];
		}
		else
		{
			tpl_object = arguments[0];
		}

		for (tpl_name in tpl_object)
		{
			var tpl_fn = tpl_object[ tpl_name ];
			this._tplCache[ tpl_name ] = tpl_fn;
		}

		return this;
	}

	TemplateSource.prototype.compileTemplate = function(tpl_name, tpl)
	{
		this.cacheTemplate(tpl_name, this.compiler(tpl));

		return this;
	}

	TemplateSource.prototype.compiler = function(tpl_data)
	{
		return _.template( tpl_data );
	}

	function resolveVarName(varname)
	{
		var tpls = null,
			root = window;

		if (varname.indexOf('.') > -1)
		{
			var nameparts = varname.split('.'),
				part = null;

			for (var i = 0, l = nameparts.length; i < l; i++)
			{
				part = nameparts[i];

				if (undefined !== root[ part ])
				{
					root = root[part];
				}
				else
				{
					return null;
				}
			}

			tpls = root;
		}
		else if (undefined !== root[ varname ])
		{

			tpls = root[ varname ];
		}
		else
		{
			return null;
		}

		return tpls;
	}

	function mode(mode)
	{
		if (undefined === mode)
		{
			return _mode;
		}
		else
		{
			_mode = mode;
			return jstfuelAPI;
		}
	}

	function watch(nspace)
	{
		if (undefined === nspace)
		{
			for (nspace in templateSources)
			{
				watch(nspace);
			}

			return true;
		}

		if (undefined !== templateSources[ nspace ])
		{
			templateSources[ nspace ].watch(true);
			Watcher.watch( nspace );

			return true;
		}

		return false;
	}

	function unwatch(nspace)
	{
		if (undefined === nspace)
		{
			for (nspace in templateSources)
			{
				unwatch(nspace);
			}

			return true;
		}

		if (undefined !== templateSources[ nspace ])
		{
			templateSources[ nspace ].watch(false);
			Watcher.unwatch( nspace );

			return true;
		}

		return false;
	}

	function watchInterval(interval)
	{
		Watcher.watchInterval(interval);
	}

	function log()
	{
		if (console && console.log)
		{
			console.log.apply(console, arguments);
		}
	}

	function init(sources)
	{
		if (undefined !== sources.compiled_src)
		{
			sources = { tpl: sources };
		}

		for (nspace in sources)
		{
			templateSources[ nspace ] = new TemplateSource({
				//where to load copmiled templates from
				compiled_src: sources[ nspace ].compiled_src,

				//how to access the compiled templates
				getter: sources[ nspace ].accessor || sources[ nspace ].getter || null,

				//the base URL for loading uncompiled templates
				src_root: sources[ nspace ].src_root || null,

				//what engine to use to compile a template
				compiler: sources[ nspace ].compiler || null,
			});

			jstfuel[ nspace ] = function()
			{
				return templateSources[ nspace ].renderer.apply(templateSources[nspace], arguments);
			}
		}

		return jstfuelAPI;
	}

	var Watcher = new WatcherQueue();
	var jstfuelAPI = {
		init: init,
		mode: mode,

		watch: watch,
		unwatch: unwatch,
		watchInterval: watchInterval
	};

	return jstfuelAPI;

})();
