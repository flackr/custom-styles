"use strict";

let data = {
  local: null,
  sync: null,
};

Promise.all([
  new Promise((resolve) => {
    chrome.storage.local.get(null, (local) => {
      data.local = local;
      data.local.config = data.local.config || {};
      resolve(true);
    })
  }),
  new Promise((resolve) => {
    chrome.storage.sync.get(null, (sync) => {
      data.sync = sync;
      data.sync.config = data.sync.config || {};
      resolve(true);
    });
  })]).then(update);

function update() {
  const template = document.querySelector('#item');
  const listNode = document.querySelector('#list-view');
  for (let i = 0; i < listNode.children.length; ++i) {
    const child = listNode.children[i];
    if (child.classList.contains('item')) {
      child.remove();
      --i;
    }
  }
  // Loop through items in settings and create items for them.
  for (let url in data.sync) {
    let list = data.sync[url];
    if (!Array.isArray(list))
      continue;
    for (let script of list) {
      let node = template.content.cloneNode(true);
      node.querySelector('.url').textContent = `${url}${script.match}`;
      node.querySelector('.name').textContent = `${script.name}`;
      node.querySelector('.edit').addEventListener('click', (evt) => {
        evt.preventDefault();
        initEditor(url, script);
      });
      node.querySelector('.delete').addEventListener('click', (evt) => {
        evt.preventDefault();
        list.splice(list.indexOf(script), 1);
        if (list.empty) {
          delete data.sync[url];
          chrome.storage.sync.remove(url);
        } else {
          chrome.storage.sync.set({url: list});
        }
        node.remove();
      });
      listNode.appendChild(node);
    }
  }
}

function init() {
  document.querySelector('#editor .cancel').addEventListener('click', (evt) => {
    evt.preventDefault();
    document.body.classList.remove('edit');
  });
  document.querySelector('.new').addEventListener('click', (evt) => {
    evt.preventDefault();
    initEditor();
  });
  let code = document.querySelector('[name=script]');
  code.addEventListener('keydown', (evt) => {
    if (evt.code == 'Tab') {
      const shift = evt.shiftKey;
      let i = code.selectionStart;
      while (i > 0 && code.value[i-1] != '\n')
        --i;
      let startPos = code.selectionStart;
      let endPos = code.selectionEnd;
      let newline = true;
      while (i <= endPos) {
        if (newline) {
          if (shift) {
            let del = 0;
            while (del < 2 && i + del <= endPos && code.value[i + del] == ' ')
              ++del;
            code.value = code.value.substring(0, i) + code.value.substring(i + del);
            endPos -= del;
            if (i <= startPos)
              startPos -= del;
          } else {
            code.value = code.value.substring(0, i) + '  ' + code.value.substring(i);
            if (i <= startPos)
              startPos += 2;
            endPos += 2;
          }
          newline = false;
        } else if (code.value[i] == '\n') {
          newline = true;
        }
        ++i;
      }
      code.selectionStart = startPos;
      code.selectionEnd = endPos;
      evt.preventDefault();
    }
  });
}
init();

function initEditor(url, script) {
  document.body.classList.add('edit');
  const editor = document.querySelector('#editor');
  editor.onsubmit = function(evt) {
    evt.preventDefault();
    if (url) {
      script.type = 'style';
      script.name = editor.elements.name.value;
      script.match = editor.elements.path.value;
      script.script = editor.elements.script.value;
    } else {
      // New entry, add to existing list or append:
      url = editor.elements.domain.value;
      script = {
        type: 'style',
        name: editor.elements.name.value,
        match: editor.elements.path.value,
        script: editor.elements.script.value,
      };
      data.sync[url] = data.sync[url] || [];
      data.sync[url].push(script);
    }
    let obj = {};
    obj[url] = data.sync[url];
    chrome.storage.sync.set(obj);
    // For now, just rebuild the list.
    update();
    document.body.classList.remove('edit');
  }
  if (url) {
    editor.elements.domain.setAttribute('readonly', true);
    editor.elements.domain.value = url;
    editor.elements.name.value = script.name;
    editor.elements.path.value = script.match;
    editor.elements.script.value = script.script;
  } else {
    editor.elements.domain.removeAttribute('readonly');
    editor.reset();
  }
}
