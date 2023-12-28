const domain = window.location.origin;
const path = window.location.pathname;
const keys = [domain];
chrome.storage.sync.get(keys, (sync) => {
  for (let script of sync[domain]) {
    if (path.startsWith(script.match)) {
      if (script.type == "style") {
        let styleNode = document.createElement('style');
        styleNode.textContent = `\n${script.script}\n`;
        document.head.appendChild(styleNode);
      }
    }
  }
});
