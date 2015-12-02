This is a sticky post.

There are a few things to verify:
<ul>
	<li>The sticky post should be distinctly recognizable in some way in comparison to normal posts. You can style the <code>.sticky</code> class if you are using the <a title="WordPress Codex post_class() Function" href="http://codex.wordpress.org/Function_Reference/post_class" target="_blank">post_class()</a> function to generate your post classes, which is a best practice.</li>
	<li>They should show at the very top of the blog index page, even though they could be several posts back chronologically.</li>
	<li>They should still show up again in their chronologically correct postion in time, but without the sticky indicator.</li>
	<li>If you have a plugin or widget that lists popular posts or comments, make sure that this sticky post is not always at the top of those lists unless it really is popular.</li>
</ul>