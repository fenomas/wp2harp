<h2>Title should not overflow the content area</h2>

A few things to check for:
<ul>
	<li>Non-breaking text in the title, content, and comments should have no adverse effects on layout or functionality.</li>
	<li>Check the browser window / tab title.</li>
	<li>If you are a plugin or widget developer, check that this text does not break anything.</li>
</ul>

The following CSS properties will help you support non-breaking text.

<pre>-ms-word-wrap: break-word;
word-wrap: break-word;</pre>
&nbsp;