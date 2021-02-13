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
    
    _initYSocket(element, editor, isInit) {
      let collection = element.getAttribute('data-collection')
      let name = element.getAttribute('name')
      let document_id = element.getAttribute('data-document_id')
      const realtime = element.getAttribute('data-realtime') != "false";
      
      if (collection && name && document_id) {
        const id = CoCreateYSocket.generateID(config.organization_Id, collection, document_id, name);
        g_cocreateY.createDoc(id);
        
        let provider = g_cocreateY.getProvider(id)
        let doc_type = g_cocreateY.getType(id)
        
        if (realtime) {
          let binding = this._createBinding(doc_type, editor, provider)
          this.adapterDB(id, binding.awareness.doc);
          new UserCursor(provider);
        } else {
          
          if (isInit) {
            const old_string = doc_type.toString()
            
            console.log(old_string)
            
            editor.setValue(old_string);
          }
          g_cocreateY.registerObserver(id, element);
        }
      }
    }
    
    _init(){
      var _this = this;
      this.elements = /** @type {any} */ (document.querySelectorAll('.codemirror'))
      registerModuleSelector('div.codemirror')
      this.elements.forEach(function(element,index){
        
        try{  
          
          /**
          * Creando la instancia Codemirror
          */
          let editor = _this._createCodeMirror(element);
          
          _this._initYSocket(element, editor, true)
          _this.initEvent(element, editor)
          
        }catch(error) {
          
          console.error(error);    
          return false
          
        }
        
      });//end forEach
    }
    
    initEvent(element, editor) {
      var charWidth = editor.defaultCharWidth(), basePadding = 4;
      var _this = this;
      editor.on("renderLine", function(cm, line, elt) {
        var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
        elt.style.textIndent = "-" + off + "px";
        elt.style.paddingLeft = (basePadding + off) + "px";
      });
      
      editor.refresh();
      
      editor.on('change',function(codemirror, yjs_event){
        var value = codemirror.getValue();
        var element = codemirror.getOption('element');
        var id = element.getAttribute('id') || '';
        
        _this.requestDocumentID(element)
        
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
      
      element.addEventListener('set-document_id', function(event){
        console.log('created document_id');
        _this._initYSocket(element, editor);
        _this.saveDataIntoDB(element, editor.getValue());
      })
      
      element.addEventListener('clicked-submitBtn', function() {
        console.log('clicked save button')
		    _this.saveDataIntoDB(element, editor.getValue());
      })
    }
    
    requestDocumentID(element) {
      const document_id = element.getAttribute('data-document_id');
      const realtime = element.getAttribute('data-realtime') != "false";
      if (!document_id && realtime) {
        CoCreate.document_id.request(element)
        element.setAttribute('data-document_id', 'pending');
      }
    }
    
    saveDataIntoDB(element, value) {
      const collection = element.getAttribute('data-collection')
      const document_id = element.getAttribute('data-document_id')
      const name = element.getAttribute('name')

      CoCreate.crdt.replaceText({
        collection, document_id, name, value,
        update_crud: true
      })
    }

    adapterDB(type_id, doc) {
      const info = this.parseTypeName(type_id);
      doc.getText(type_id).observe((event) => {
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
