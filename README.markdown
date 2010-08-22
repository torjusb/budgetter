Budgetter
=========

Budgetter is a application that allows the user to create simple budgets fast. Budgetter is perfect for when you don't need something as complex as Excel and a bit more than just a calculator.

Budgetter is inspired by the desktop application [Soulver](http://www.acqualia.com/soulver/). 

##Features

  * Inline editing of text
  * Drag and drop sorting
  * Export / Import as JSON
  * Print

## Calculation patterns

<table>
	<thead>
		<tr>
			<th>Pattern</th>
			<th>Example</th>
			<th>Result</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>&lt;number&gt;</td>
			<td>Cake 100 USD</td>
			<td>100</td>
		</tr>
		<tr>
			<td>&lt;number&gt; a &lt;number&gt;</td>
			<td>Bus tickets, 3 USD a 5</td>
			<td>15</td>
		</tr>
		<tr>
			<td>&lt;number&gt; &lt;%&gt; discount</td>
			<td>100 USD, 30% discount</td>
			<td>70</td>
		</tr>
		<tr>
			<td>&lt;%> of &lt;number&gt;</td>
			<td>25% of 130</td>
			<td>32.5</td>
		</tr>
		<tr>
			<td>m(&lt;math eqution&gt;)</td>
			<td>m(990/30*45+3)</td>
			<td>1488</td>
		</tr>
	</tbody>
</table>

### Adding custom calculation patterns

Adding new calculation patterns is easy. All calculations should be added to the "user_calculations.js"-file found inside the "js"-folder.

#### Syntax

`Budget.addCalculation(priority, regexp, function (string, regex))`

##### Arguments

<dl>
	<dt><code>priority</code><dt>
		<dd>Sets the priority of the calculation. The higher the priority, the earlier it's checked</dd>
	<dt><code>regexp</code></dt>
		<dd>The regexp the text is matched against</dd>
	<dt><code>function</code></dt>
		<dd>Function executed when the regexp is matched against the text. The return value of this function is used as the result</dd>
</dl>

##### Example
<pre><code>
Budget.addCalculation(55, /(\d+)%[\D|\s]*(\d+)/, function (string, regex) {
	var matches = string.match(regex),
		perc = matches[1], of = matches[2];
		
	return (perc * of) / 100 || 0;
});
</code></pre>

## Import / Export budget

Exporting and importing budgets allows the user to easily move budgets from computer to computer, and share the budget with other users.

Below is an example budget that can be imported into Budgetter.

<pre><code>
{
	"name": "Trip to Spain",
	"description": "Lorem ipsum dolor sit",
	"status": "active",
	"lines": [
		{
			"text": "Savings account 400 USD",
			"type": "income"
		},
		{
			"text": "Car rental 200 USD",
			"type": "outcome"
		},
		{
			"text": "Food and Drinks, 250 USD",
			"type": "outcome"
		},
		{
			"text": "Flight tickets 300 USD, 10% discount",
			"type": "outcome"
		},
		{
			"text": "Pay checks 900 USD a 2 persons",
			"type": "income"
		},
		{
			"text": "Shopping 500 USD",
			"type": "outcome"
		}
	]
}
</code></pre>

## FAQ

<dl>
	<dt>Which browsers are supported?<dt>
		<dd>Only Chrome, Safari, and Opera supports WebSQLDatabases and localStorage at the moment, so the application will only work in these browsers. Opera is still lacking a lot of CSS3 functionality, so some stuff might not work as well in Opera.
		Unsupported browsers falls back to a page telling the user which browsers are supported.</dd>
		
	<dt>How do I delete and log a budget?</dt>
		<dd>Right click on the budget in the budget list to bring up the context menu, and select "Delete" or "Log budget"</dd>
</dl>

## Future

Here is a list of things I would like to implement in future versions of Budgetter.

  * iPhone / iPad version
  * Mail budget to friend. Would require some kind of back-end.
  * Synchronize across platforms, maybe via tools like Dropbox. Would also require some kind of back-end.
  * "Multi user edit" via websockets would be cool.
  * Better keyboard navigation
  * Use a manifest use put files offline
  * Support for Firefox 4, with IndexedDB whenever that comes. Will probably require quite a bit of rewriting.
  * Better icons
  * Currency converter
  * Replace the `eval` in the `m()` calculation with a safer solution. Currently protected by a regex

## Credits

  * [Soulver](http://www.acqualia.com/soulver/) for giving me the idea
  * jQuery & jQuery UI team, for making JavaScript awesome
  * The people behind [less.js](http://github.com/cloudhead/less.js/tree/) for making CSS even more awesome
  * Creator of [Fancybox](http://fancybox.net/) for making a great and simple-to-use Lightbox
  * [Oxygen](http://www.oxygen-icons.org/) for the [spreadsheet icon](http://www.iconfinder.com/icondetails/8909/32/spreadsheet_icon?r=1)
  * [Tutorial 9](http://www.tutorial9.net) for the [Mono Icons set](http://www.tutorial9.net/resources/108-mono-icons-huge-set-of-minimal-icons/)
  * [Led 24](http://led24.de) for the [Led Icon Set](http://led24.de/iconset/)