custom-styles.zip: src/manifest.json src/styler.js src/options.css src/options.html src/options.js src/icons/16.png src/icons/32.png src/icons/48.png src/icons/128.png
	rm -f $@
	zip $@ $^
