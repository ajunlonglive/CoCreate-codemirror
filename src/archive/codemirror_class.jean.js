"use strict";

import CodeMirror from 'codemirror'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodeMirrorBinding } from './js/y-codemirror_binding'  
import { UserCursor } from '../y-client/src/utils/cursor/userCursor_class'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
//Floding CODE
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/addon/fold/xml-fold.js'
import 'codemirror/addon/fold/indent-fold.js'
import 'codemirror/addon/fold/markdown-fold.js'
import 'codemirror/addon/fold/comment-fold.js'
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/scroll/simplescrollbars.js'
import 'codemirror/addon/edit/closetag.js'


window.addEventListener('load', () => {
  const ydoc = new Y.Doc() 
  /**
  * Create all  Codemirrors with class .codemirror
  * @private
  *
  * @development jeanmendozar@gmail.com
  * @param {None}
  */
 
  class CoCreateYjsCodemirror {
    
    constructor() {
      this.elements = [];
      this.codemirrors = [];
      this.bindings = [];
      this.organization_Id = config.organization_Id || 'randomOrganizationID'
    }
    
    _createCodeMirror(editorContainer){
        
        const editor = CodeMirror(editorContainer, {
          mode:  'htmlmixed',
          styleActiveLine: true,
          scrollbarStyle: 'overlay',
          autoCloseTags: true,
          lineNumbers: true,
          lineWrapping: true,
          extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
          foldGutter: true,
          gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        });
        
        editor.setOption('element',editorContainer);
          
        this.codemirrors.push(editor);
      return editor;
    }
    
    _createBinding(type_element, editor, provider){
        let binding = new CodeMirrorBinding(type_element, editor, provider.awareness)
        this.bindings.push(binding);
        return binding; 
    }
    
    _init(){
      var _this = this;
      this.elements = /** @type {any} */ (document.querySelectorAll('.codemirror'))
      this.elements.forEach(function(element,index){
        
        try{  
          
          let id_type = _this.generateTypeName(element);

          let url_socket = `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//server.cocreate.app/y-websocket`; 
          let provider = new WebsocketProvider(url_socket, id_type, ydoc)
          let type_element = ydoc.getText(id_type)

          /**
          * Creando la instancia Codemirror
          */
          let editor = _this._createCodeMirror(element);

          let binding = _this._createBinding(type_element, editor, provider);

          
          var charWidth = editor.defaultCharWidth(), basePadding = 4;
          
          editor.on("renderLine", function(cm, line, elt) {
            var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
            elt.style.textIndent = "-" + off + "px";
            elt.style.paddingLeft = (basePadding + off) + "px";
          });
          editor.refresh();
          
          
          editor.on('change',function(codemirror,yjs_event){
            var value = codemirror.getValue();
            var element = codemirror.getOption('element');
            var id = element.getAttribute('id') || '';
            if (!id) return;
            var targets = document.querySelectorAll('[data-get_value="' + id + '"]');
            
            var is_fold = element.dataset['is_fold'] || false;
            if(!is_fold){
              var fold_lines = element.dataset['fold'] || '';
              fold_lines = fold_lines.split(',').filter(value=>parseInt(value) -1 >= 0).map(value => value - 1);
              fold_lines.forEach((line) => {
                  editor.foldCode(CodeMirror.Pos(line, 0));
                  element.dataset['is_fold']=true;
              });
            }
          
            targets.forEach((target) => {
              if(target.nodeName == 'IFRAME'){
                //tmp_target = target;
                  let document_iframe = target.contentDocument;
                  /*
                  document_iframe.open();
                  document_iframe.write(value);
                	document_iframe.close();
                	*/
                	target.srcdoc = value;
                  
              }else{
                if (typeof(target.innerHTML) != "undefined") {
                	target.innerHTML = value;
                }else if (typeof(target.value) != "undefined") {
                	target.value = value;
                } else if (typeof(target.textContent) != "undefined") {
                	target.textContent = value;
                }
              }
            });
          })
          
          _this.adapterDB(id_type, binding.awareness.doc);
          
          new UserCursor(provider);
          
        }catch(error) {
          
          console.error(error);    
          return false
          
        }
        
      });//end forEach
    }
    
    generateTypeName(element) {
      try {
        
        var collection = element.getAttribute('data-collection') || '_';
        var document_id = element.getAttribute('data-document_id') || '_';
        var name = element.getAttribute('name') || '_';
        
      }catch(error) {
        
        console.error(error);    
        return false
        
      }
      
      const info = {org:config.organization_Id , collection, document_id, name}
      return btoa(JSON.stringify(info)); 
    }
  
    adapterDB(type_id, doc) {
      const info = this.parseTypeName(type_id);
      doc.getText(type_id).observe((event) => {
        //console.log(event)
        
        if (!event.transaction.origin) {
          const content = event.target.toString();
          CoCreate.crud.updateDocument({
            collection: info.collection,
            document_id: info.document_id,
            data: {[info.name]: content},
            metadata: 'codemirror-update'
          })
        } 
      })
    }
    
    parseTypeName(name) {
      const data = JSON.parse(atob(name));
      return data;
    }
    
  }//end Class CoCreateYjsCodemirror
  
  const obj_cocreatecodemirror = new CoCreateYjsCodemirror();
  /**
  * Initialization all OBJS with class .codemirror
  */
  obj_cocreatecodemirror._init()

  // @ts-ignore
  window.codemirror = { obj_cocreatecodemirror }
  
});//end window LOAD
