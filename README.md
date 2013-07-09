# jstfuel

jstfuel is a small javascript library that I wrote to allow me to utilize precompiled javascript templates via [`grunt-contrib-jst`](https://github.com/gruntjs/grunt-contrib-jst) and automatically reload them in my browser without having to reload my javascript application.

## general usage

jstfuel operates on a few assumptions:

1. You're already compiling your javascript templates in some way
2. Your javascript templates are compiled into functions, so you just call your template with your data array.

*I use [`underscore.js`](http://underscorejs.org), [`grunt`](http://gruntjs.com), and [`grunt-contrib-jst`](https://github.com/gruntjs/grunt-contrib-jst), and [`grunt-contrib-watch`](https://github.com/gruntjs/grunt-contrib-watch) to automatically monitor and compile my javascript templates which are ready to be loaded by the browser*

## get started

To get started ustig jstfuel, all you need to do is include the `jstfuel.js` file into your web application and initialize it with some basic settings.

```html
<script type="text/javascript" src="/js/jstfuel.js"></script>
```

Once you do include it into your application, you initialize your templates like so:

```html
<script type="text/javascript">
jstfuel.init({
	compile_src: '/path/to/compiled/templates.js'
});
</script>
```

Once you've done that, in all of your javascript modules, you'll utilize the `jstfuel` object to render your templates, similarly to how you'd utilize underscore templates and/or jst templates.

```html
<script type="text/javascript">
function renderThings()
{
	var myDataObject = {
		foo: 'bar',
		baz: 'buzz'
	},
	tpl = jstfuel.tpl('my/template/name.tpl');

	return tpl(myDataObject);
}
</script>
```

The above example assumes that your templates are compiled into the `JST` global variable namespace. Not all of us (including myself) do that, so jstfuel allows you to define the namespace that your templates are defined in, or provide a accessor method that returns your templates when called. Provide the `jstfuel.init` method a `accessor` property with the **string** value of the name of your namespace, or a closure that returns your template object.

```html
<script type="text/javascript">
jstfuel.init({
	compile_src: '/path/to/compiled/templates.js',
	accessor: 'MyNamespace.JST.Vars'
});
</script>
```

or


```html
<script type="text/javascript">
jstfuel.init({
	compile_src: '/path/to/compiled/templates.js',
	accessor: function()
	{
		return MyNamespace.JST.Vars;
	}
});
</script>
```

## automatically reloading templates

jstfuel allows you to automatically fetch and load your JST template file without refreshing your application/browser. This allows you to much more quickly iterate on your template code with a whole lot less frustration. In order to start reloading your templates, all you have to do is call `jstfuel.watch();`.

## advanced things

If you have multiple compiled JST files that your application uses, jstfuel can handle them all. All you have to do is define them in the `init` call. jstfuel will provide you with a different template method for each namespace (or file) you define in the init. In order to define each file, your config will look like this:

```html
<script type="text/javascript">
jstfuel.init({
	ns1: {
		compile_src: '/path/to/compiled/templates.js',
		accessor: 'MyNamespace.JST.Vars'
	},

	ns2: {
		compile_src: '/path/to/more/templates.js',
		accessor: 'NS2.JST'
	},

	anotherNS: {
		compile_src: '/my-other/path.js',
		accessor: function()
		{
			return MyStrangeModule.getTemplates();
		}
	}
});
</script>
```

Once you init jstfuel with multiple namespaces, jstfuel will expose a template method that corresponds to the key you specified for each template object in the init config.

```javascript
var ns1tpl = jstfuel.ns1('/my/template.tpl'),
ns2tpl = jstfuel.ns2('/some/weird/path/to/a/template.tpl'),
anotherNStpl = jstfuel.anotherNS('/template.tpl');
```

### Watching template files when multiple sources are configured

`jstfuel.watch` automatically montiors all configured template files when no arguments are passed. However, if you only want to watch a single template file, you can call `jstfuel.watch` with the name specified as the key for the template object you passed to the init method.

* * *

## Author

jstfuel is created and maintained by [Jim Rubenstein](http://www.github.com/jimrubenstein). Jim is the CTO at [LoudDoor](http://www.louddoor.com). You can follow him on twitter [@jim_rubenstein](http://www.twitter.com/jim_rubenstein).


## License

    The MIT License (MIT)
    Copyright (C) 2012-2013 by Jimmy Sawczuk

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