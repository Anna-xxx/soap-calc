# Собирает index.html: head.html + v3.css (с <title> и <style>) + v3.body.html + v3full.js (__DB__ ← db.min.json, с <script>)
import pathlib
src = pathlib.Path(__file__).parent
rd = lambda n: (src / n).read_text(encoding='utf-8')
js = rd('v3full.js').replace('__DB__', rd('db.min.json').strip(), 1)
out = rd('head.html') + rd('v3.css').rstrip('\n') + '\n</head>\n<body>\n' + rd('v3.body.html').rstrip('\n') + '\n\n<script>\n' + js.rstrip('\n') + '\n\n</body>\n</html>\n'
(src.parent / 'index.html').write_text(out, encoding='utf-8')
