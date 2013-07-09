jstfuel = (function()
{
	var watch = {},
		timeout = {},
		templateSources = {};

	var defaultTemplateAccessor = function(varname)
	{
		if (typeof varname == 'undefined')
		{
			varname = 'JST';
		}
		else if (typeof varname != 'string')
		{
			throw new Exception("Invalid argument for default template accessor");
		}

		return eval(varname);
	}

	function _getAccessor(nspace)
	{
		if (undefined == typeof templateSources[ nspace ].accessor)
		{
			return defaultTemplateAccessor;
		}
		else
		{
			if ('string' == typeof templateSources[ nspace ].accessor)
			{
				return function()
				{
					return defaultTemplateAccessor( templateSources[ nspace ].accessor );
				};
			}
			else
			{
				return templateSources[ nspace ].accessor
			}
		}
	}

	function _getSrc(nspace)
	{
		return templateSources[ nspace ].src;
	}

	function _watchForTemplateChanges(nspace)
	{
		if (undefined == typeof nspace)
		{
			for (nspace in templateSources)
			{
				_watchForTemplateChanges( nspace );
			}

			return true;
		}

		if (watch[ nspace ])
		{
			timeout[ nspace ] = setTimeout(function()
			{
				_checkForTemplateChanges( nspace );
			}, 5000);
		}
	}

	function _checkForTemplateChanges(nspace)
	{
		var xhr = $.ajax({
			type: "HEAD",
			ifModified: true,
			url: _getSrc( nspace ),
		})
		.done(function(response, status, jqxhr)
		{
			//if this finishes successfully, according to the 'ifModified' documentation
			//this method will only be called if the file has been modified.
			//which means, we can load it.
			_loadTemplates(nspace);

		})
		.fail(function()
		{
			_watchForTemplateChanges(nspace);
		});

		return xhr;
	}

	function _loadTemplates(nspace)
	{
		return $.ajax({
			url: _getSrc( nspace ),
			dataType: 'script',
			cache: false,
			type: 'GET'
		})
		.always(function()
		{
			_watchForTemplateChanges(nspace);
		});
	}

	function render(nspace, template, data)
	{
		if (undefined == templateSources[ nspace ])
		{
			throw new Error("JST Templates for " + nspace + " have not been loaded");
		}

		var accessor = _getAccessor( nspace );

		if (undefined == accessor())
		{
			throw new Error("JST Templates unavailable for namespace " + nspace);
		}

		if (undefined == accessor()[ template ])
		{
			throw new Error("JST template " + template + " undefined");
		}

		return accessor()[ template ](data);
	}

	function watch(nspace)
	{
		if (undefined == typeof nspace)
		{
			for (nspace in templateSources)
			{
				watch(nspace);
				// watch[ nspace ] = true;
			}

			return true;
		}

		watch[ nspace ] = true;
		_watchForTemplateChanges( nspace );
	}

	function unwatch(nspace)
	{
		if (undefined == nspace)
		{
			for (nspace in templateSources)
			{
				unwatch(nspace);
			}

			return true;
		}

		watch[ nspace ] = false;
		clearTimeout(timeout[ nspace ]);
	}

	function init(sources)
	{
		if (typeof sources.compiled_src != 'undefined')
		{
			sources = { tpl: sources };
		}

		for (nspace in sources)
		{
			templateSources[ nspace ] = {
				src: sources[ nspace ].compiled_src,
				accessor: sources[ nspace ].accessor || defaultTemplateAccessor
			};

			jstfuel[ nspace ] = function(template)
			{
				return function(data)
				{
					render(nspace, template, data);
				};
			};
		}
	}

	return {
		init: init,

		watch: watch,
		unwatch: unwatch,

		render: render,
	};

})();
