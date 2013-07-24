# jstfuel

jstfuel is a library that wraps your javascript template access in your application. jstfuel will handle loading compiled or uncompiled templates for you, when your application needs access to them.

You can use jstfuel with pre-compiled javascript templates, or it can compile your templates for you on the client when you put jstfuel into dev mode, to allow you to change your templates and re-render them quickly without refreshing your entire application and getting back to the previous state.

By default jstfuel compiles templates using the underscore template engine but you can configure your own template compiler.

## Getting Started

To get started using jstfuel you'll need to include the library into your application. Once jstfuel is included, you'll initialize your templates using the `init` method.

**example: initializing jstfuel**
```html
<script type="text/javascript" src="/js/jstfuel.js"></script>
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/path/to/compiled/templates.js'
});
</script>
```

This is the most simple initialization of jstfuel. In order to initialize like this your javascript templates will have to *(a) already be compiled* and *(b) available via the `JST` global variable*. If your environment satisfies those requirements, you'll be able to access your templates via the `jstfuel.tpl` method after initialization.

As an example, lets render a compiled template using jstfuel.

Lets assume our compiled `templates.js` file is located in `/js/templates.js`, and our `index.html` looks like this:
```html
<div id="test"></div>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//underscorejs.org/underscore-min.js"></script>
<script src="/js/jstfuel.js"></script>
```

We can render `test.jst` into our `div#test` like so:
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js'
});

var testTpl = jstfuel.tpl('test.jst');
$('#test').html(testTpl());
</script>
```

The returned function from `jstfuel.tpl` is the same function that underscore generates when it compiles your templates. You can read more about [underscore templates](http://underscorejs.org/#template) over at [underscorejs.org](http://underscorejs.org/).

**Note:** There is no script file for `/js/templates.js` to load our compiled templates. You may choose to include or exclude this script tag. If you exclude it, `jstfuel` will automatically load it when you first call `jstfuel.tpl` with your template name. This is an asynchronus request, so it will happen in the background. If your templates haven't loaded by the time they are executed (rendered), jstfuel will create a synchronus request for the template file, which will halt further execution until the templates become available.

## Diving deeper

Obviously just wrapping your template access isn't the most useful thing in the world. jstfuel becomes much more helpful in development mode by automatically compiling javascript templates and giving you the opportunity to automatically reload them without reloading your entire application.

### Auto-compile

To allow jstfuel to automatically compile your javascript templates, you have to tell it the base path for the folder that holds your templates using the `src_root` option in the initialization

**example:**

Assume we have a javscript template file structure as such:

```
[webroot]
- js/
-- templates/
---- test.jst
---- hello_world.jst
---- login.jst
```

we would define our `src_root` option like this:

```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates'
})
.mode('dev');
</script>
```

Now, when we call `jstfuel.tpl('test.jst')` jstfuel will automatically make a request to `/js/templates/test.jst` to download the content of our template, and compile it using underscore.

**Note:** A call to `jstfuel.mode` was executed after our `jstfuel.init` call. jstfuel only compiles raw templates when it is in `dev` mode.

### Auto-reload

jstfuel will periodically reload (and optionally, recompile) your javascript templates by calling `jstfuel.watch()`.  By default jstfuel polls for changes every 15 seconds, but you can change that by passing an integer to the `jstfuel.watchInterval` method. The integer should be the number of seconds you'd like to wait between polls for new templates.

The template reloads are done asynchronously, so as to not interfere with your application's execution. jstfuel creates console logs when it starts and finishes loading templates, so you know when it's done.

Template reloading will work outside of `dev` mode, but jstfuel will look for your compiled template source file instead of your individual templates.

*Tip:* You can use [`grunt`](http://gruntjs.com) with [`grunt-contrib-jst`](https://github.com/gruntjs/grunt-contrib-jst) and [`grunt-contrib-watch`](https://github.com/gruntjs/grunt-contrib-watch) to recomiled your javascript templates whenever you make a change to them. This will reduce the number of HTTP requests it takes to reload your templates, probably pretty useful for larger applications that use a lot of templates.

* * *

### Advanced configurations

#### Accessing Compiled Templates

If your compiled javascript templates are not accessible via the `JST` global variable, that's okay. You can configure the method that jstfuel uses to access your templates on initialization.

jstfuel supports 3 methods to accessing your compiled templates.

1. A global variable. You specify the name of this variable as a string. If you use nested objects, for example `JST['MyTemplates']`, you can pass the name of the variable as a dot-delimited string (eg. `'JST.MyTemplates'`).
2. An object. You can pass the actual object that stores your templates to jstfuel and jstfuel will read your compiled templates directly out of the object, using the name (or path + name) for your template as the key (or property name), and the compiled template as the value.
3. A function. You can pass a function that returns a reference to your template when called. 1 parameter will be sent to this function, it will be the name (or path + name) of the template requested. It will match whatever value is passed to `jstfuel.tpl(<template-path+name>)`. This parameter is optional, and if it isn't passed, you should return all of the templates available.

The option you use to specify the access method to your templates is named `getter`, is used like this:

**example 1, accessing templates via a custom global variable***
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates',
	getter: 'JST.MyTemplates'
})
</script>
```

**example 2, accessing templates by passing an object containing all compiled templates**
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates',
	getter: JST.MyTemplates
})
/***

** Note: **
There is a caveat here, the object you pass to jstfuel must already exist. You can handle this by either a) initializing it to an empty object before calling `init` or by including your compiled templates explicitly using a `<script>` tag before you call `init`.

***/
</script>
```

**example 3, accessing templates by passing a closure**
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates',
	getter: function(template)
	{
		//return null if our templates haven't been loaded yet.
		if (!JST || !JST.MyTemplates) return null;

		//return all templates if no specific one was requested
		if (undefined === template) return JST.MyTemplates;

		//return null if the template isn't available
		if (undefined === JST.MyTemplates[ template ]) return null;

		//return the template
		return JST.MyTemplates[ template ];
	}
});
</script>
```

#### Customizing your template compiler

You can change the javascript template compiler that jstfuel uses to build your templates in `dev` mode. To do this, you set the `compiler` option to the javascript template compiler on init. This can be a closure, or a direct reference to the compiler. The compiler will be passed a single parameter, the string value of the contents of the template file. It is expected that the returned value from the compiler will be a function that will render the contents of the template.

**example 1, referencing the compiler directly**
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates',
	compiler: _.template
});
</script>
```

**example 2, referencing the compiler with a closure**
```html
<script type="text/javascript">
jstfuel.init({
	compiled_src: '/js/templates.js',
	src_root: '/js/templates',
	compiler: function(tpl_data)
	{
		return _.template( tpl_data );
	}
});
</script>
```

#### Specifying multiple compiled template sources

You can use jstfuel to manage multiple compiled javascript files. jstfuel refers to this concept as namespaces and you can define as many as you need, so long as their names are unique and don't interefere with any of the jstfuel api methods.

To initialize multiple namespaces, you will modify config you pass to `init`. For each namespace, you'll need to tell jstfuel where the `compiled_src` lives, the `src_root`, and the `getter`. The config file will look like this:

```html
<script type="text/javascript">
jstfuel.init({
	ns1: { // <-- unique name for this namespace
		compiled_src: '/path/to/compiled/templates.js',
		getter: 'MyNamespace.JST.Vars'
	},

	ns2: { // <-- unique name for this namespace
		compiled_src: '/path/to/more/templates.js',
		getter: 'NS2.JST'
	},

	anotherNS: { //<-- unique name for this namespace
		compiled_src: '/my-other/path.js',
		getter: function(tpl)
		{
			return MyModule.getTemplates(tpl);
		}
	}
});
</script>
```

This will expose each namespace as it's own method on `jstfuel` and you will use it exactly in the same was as `tpl` in all the examples above. You *can* name any of your namespaces `tpl` if you wish, `tpl` is simply the name that is automatically given to your default compiled template namespace when you only pass the configuration for a single namespace.

* * *

## API Reference

**jstfuel.init**
> *config* (object, required)
> The configuration a single, or multiple, javascript template namespaces. If only a single configuration is specified, the `tpl` method is assigned as the access method to that namespace.
>
> > *compiled_src* (string, required)
> > path to the javascript file containing your compiled javasript templates
> >
> > *src_root* (string, optional)
> > base directory that your raw javascript template files are located
> >
> > *getter* (mixed, optional)
> > *allowed values:* string, object, function
> >
> > method of access to your compiled javascript templates.
> >
> > > *string:* expects a global variable name, if nested inside objects must be dot-delimited (`'JST.My.Templates'`)
> > >
> > > *object:* expects a <tpl_name>:<compiled_tpl> object map of available templates
> > >
> > > *function:* takes 1 argument (template_name, a string, optional). should return requested template (as a callable function to render), or all templates as a <tpl_name>:<compiled_tpl> object map if no template is requested.
> >
> > *compiler* (function, optional)
> > javascript template compiler function. takes 1 argument (template_content, string, required). returns a callable function to render the template content.

**jstfuel.mode**
> *mode* (string, optional)
> Get or set the mode on jstfuel.
> Allowed values:
> - 'dev'
> - 'prod'
>
> When no mode string is passed, returns the current jstfuel mode
>
> *Note:* in `dev` mode jstfuel automatically compiles templates from raw source using the configured `compiler` (or underscore if no compiler defined).

**jstfuel.watch**
> *nspace* (string, optional)
> Start watching/updating template namespaces.
> *nspace* should match the namespace name given to the javascript source on init. (`tpl` if default namespace option used).
> If no *nspace* string is present, jstfuel will start watching all namespaces

**jstfuel.unwatch**
> *nspace* (string, optional)
> Stop watching template namespace specified.
> If no *nspace* specified, stop watching all namespaces

**jstfuel.watchInterval**
> *interval* (int, required)
> Change the interval that jstfuel waits between loading new templates


* * *

## Author

jstfuel is created and maintained by [Jim Rubenstein](http://www.github.com/jimrubenstein). Jim is the CTO at [LoudDoor](http://www.louddoor.com). You can follow him on twitter [@jim_rubenstein](http://www.twitter.com/jrubsc).


## License

    The MIT License (MIT)
    Copyright (C) 2013 by Jim Rubenstein

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.