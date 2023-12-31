import './App-canonical.css';
import logo from './assets/logo.svg';
import { eztext } from "./js/eztext";
import React, { Component, useRef, useState, useEffect, useCallback } from "react";
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactSVG } from "react-svg";

import * as history from './AppHistory';
import * as util from './AppUtil';

const AppHistoryList = React.lazy(() => import('./AppHistoryList'));


const getWordFromApi = async () => {
    const res = fetch('/api')
    .then((response) => response.json())
    .then(json => {return json});
    return res; 
};

const saveApplicationState = async (data, method) => {
  const res = fetch('/api', {
    method: 'POST',
    headers: {
      'mode':'cors',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({method:method, data:data})
  })
  .then((response) => response.json())
  .then(json => {return json});
  return res;
};

const getApplicationState = async () => {
  const res = fetch('/api?state')
  .then((response) => response.json())
  .then(json => {return json});
  return res;
};

const getDeltas = async () => {
  const res = fetch('/api?delta')
  .then((response) => response.json())
  .then(json => {return json});
  return res;
};

const getConfig = async () => {
  const res = fetch('/api?config')
  .then((response) => response.json())
  .then(json => {return json});
  return res;
};



const apiPost = async (data, method) => {
  const res = fetch('/api', {
    method: 'POST',
    headers: {
      'mode':'cors',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({method:method, data:data})
  })
  .then((response) => response.json())
  .then(json => {return json});
  return res;
};


const apiGet = async (method) => {
  const res = fetch(`/api?${method}`)
  .then((response) => response.json())
  .then(json => {return json});
  return res;
}


let indices = 0;
let current_message = null;
let placeholder = null;
let logger = null;
let appDryInitialized = false;

const log_stack = [];
function log(){
  const args = Array.from(arguments);
  const t = new Date();
  const ts = util.date_time(t) + '\t';
  log_stack.unshift(ts+args.join(', '));
  logger && logger.set_text(log_stack.join('\n'));
};


const DraggableFunctionComponent = (props) =>{
  const selfRef = useRef(null);
  const parentRef = useRef(null);
  const dropRef = useRef(null);
  const [startDrag, setStartDrag] = useState(false);
  const [isInit, setIsInit] = useState(false);
  const [node, nodeParent, nodeRef] = [props.node, props.nodeParent, props.nodeRef];

  const [{ isDragging }, drag] = useDrag(() => ({
      item: {node, nodeParent, nodeRef},
      type:'draggable-item',
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      end: (item, monitor) => cancelHandler(item)
    })
  );

  const [{ isOver }, drop] = useDrop(() => ({
      accept:'draggable-item',
      collect: monitor => ({
        getItem: monitor.getItem(),
        isOver: !!monitor.isOver({ shallow: true })
      }),
      drop: (item, monitor) => monitor.isOver({ shallow: true }) ? dropHandler(monitor.getItem()) : undefined, 
      hover: (item, monitor) => {
        
        if(monitor.isOver({ shallow: true })){
          [...document.querySelectorAll('.placeholder-lite')].forEach(m => m.classList.remove('placeholder-lite'));

          item.referenceType = null;
          item.toIndex = 0; //default
          const offset = monitor.getClientOffset(); // pos rel to screen.
          const selfRect = selfRef.current.getBoundingClientRect();
          const page_y = document.documentElement.scrollTop;
          let sta = null;

          if(offset.y < selfRect.top+10) sta = 'above';
          if(offset.y > selfRect.bottom-10) sta = 'below';
          if(offset.y >= selfRect.top+10 && offset.y <= selfRect.bottom-10) sta = 'in';

          if(placeholder && parentRef.current){
            placeholder.style.opacity = 0.0;

            if(sta === 'above' || sta === 'below'){
              item.referenceType = 'sibling';
              placeholder.style.top = (sta === 'above' ? (selfRect.top+page_y)-2 : (selfRect.bottom+page_y)-2 )+'px';
              Object.assign(placeholder.style, {'left':selfRect.left+'px','width':selfRect.width+'px', 'opacity': 1.0});
              item.toIndex = (node.index) + (sta === 'above' ? 0 : 1);
            }

            if(sta === 'in'){
              item.referenceType = 'child';
            }

            // same parent and index higher than current.
            const same_list = item.nodeParent.key+'-node' === parentRef.current.id && item.toIndex > item.node.index;
            if(same_list) item.toIndex -= 1;
            
            const refDestinationNode = sta === 'in' ? selfRef.current : parentRef.current;
            if (refDestinationNode.id !== 'root-node') refDestinationNode.firstChild.classList.add('placeholder-lite');

          }
        }
      }
    })
  );

  if(placeholder) placeholder.style.opacity = +isOver;

  !isOver && [...document.querySelectorAll('.placeholder-lite')].forEach(m => m.classList.remove('placeholder-lite'));

  if(isDragging && !startDrag){
    selfRef.current.style.opacity = 0.5;
    setStartDrag(true);
  }

  const cancelHandler = (item) => {
    item.nodeRef.current.style.opacity = 1.0;
    item.nodeRef.current.firstChild.classList.remove('placeholder-lite');
    placeholder.style.opacity = 0.0;
    setStartDrag(false);
  }

  const dropHandler = (item) => {
    item.nodeRef.current.style.opacity = 1.0;
    const destinationObject = item.referenceType === 'sibling' ? props.nodeParent : props.node;

    props.confirm(item, destinationObject);

    // if(item.node.label !== node.label){
    //   const pref = item.nodeParent.children.splice(item.node.index, 1)[0];
    //   destinationObject.children.splice(item.toIndex, 0, pref);
    //   props.confirm(item, destinationObject);
    // }

    setStartDrag(false);
  }

  const init = useCallback(() => {
    drag(props.nodeRef.current);
    drop(props.nodeRef.current);
    dropRef.current = props.nodeDropRef.current;
    selfRef.current = props.nodeRef.current;
    parentRef.current = props.nodeParentRef ? props.nodeParentRef.current : null;
    setStartDrag(false);
  }, [drag, drop, setStartDrag, props])

  useEffect(() => {
    if(!isInit) {
      setIsInit(true);
      init();
    }
  },[init, isInit]);

  return(<></>)
};

class RecursiveClassComponent extends Component {

  constructor(props) {
    super(props);
    
    //using setState on references breaks
    this.state = {
      data: props.data,
      obj: props.obj,
      content: props.obj.content,
      parent: props.parent,
      level: props.level,
      nested: props.config.nested,/// true, ///props.config !== undefined, // ? props.config.nested:  props.config.nested,
      nestedDeltas: false,
      reveal: false,
      updated: false
    };

    // this.state.nested = true;
    if(this.state.obj.content === 'root') this.state.nested = true;

    this.plex = false;
    this.dndRef = {};
    this.objRef = props.obj;
    this.plexRef = null;
    this.nodeRef = {};
    this.parentRef = props.parentRef;
    this.nodeDropRef = {};
    this.inputActive = false;
    // this._Mounted = 0;
    // console.log({...props}, props.config.nested);
  }

  setObjRef = () => {Object.assign(this.objRef, {...this.state.obj})};
  // refreshObjRef = () => {Object.assign(this.state.obj, data_map.get(this.state.obj.key))};
  // setPlexRef = (key, instance) => {this.plexRef = plex.set(key, {deltas:[], instance:instance}); return this.plexRef;};
  // getPlexRef = () => {this.plexRef = plex.get(this.props.obj.key); return this.plexRef;};

  getThisPlex = () => {
    this.plex = this.props.appFunctions.assets.plex.get(this.state.obj.key);
    const get_deltas = () => this.props.appFunctions.assets.deltas.filter((d) => (this.state.obj.key === d.key)).sort((a, b) => {a.delta_timer > b.delta_timer} );;

    if(this.plex === undefined){
      this.props.appFunctions.assets.plex.set(this.state.obj.key, {deltas:get_deltas(), instance:this});
      this.plex = this.props.appFunctions.assets.plex.get(this.state.obj.key);
    }

    if(!this.plex.instance) this.plex.instance = this;
    // if(this.plex.deltas.length === 0) this.plex.deltas = get_deltas();
    this.plex.deltas = get_deltas();
    // return this.plex;
  };





  componentDidMount(){
    this.getThisPlex();
    


    // // console.log('componentDidMount', this.state.obj);
    // const plex = this.getThisPlex();
    // console.log('PLEX:', plex);

    // if(!plex){
    //   console.log('error: no plex', this.state.obj);
    //   const theseDeltas = this.props.appFunctions.assets.deltas.delta.filter((d) => (this.state.obj.key === d.key));
    //   this.props.appFunctions.assets.plex.set(this.state.obj.key,{delta:theseDeltas, instance:this});
    //   this.plexRef = this.props.appFunctions.assets.plex.get(this.state.obj.key);
    // }else{
    //   plex.instance = this;
    // }
    // (this.content !== this.state.obj.content) && this.setState({content: this.state.obj.content});
    // console.log('componentDidMount', this.state.obj.label, this.state.obj.content, this.objRef);
  }

  componentDidUpdate(prevProps, updatedProps) {
    console.log(this.props.config);
    // this.getThisPlex();
    // console.log(prevProps, updatedProps, this);
    // this.setObjRef();
    // console.log('componentDidUpdate', this.state.obj);
    
  }

  // updateContent = (new_content) => {
  //   this.objRef.content = new_content;
  //   this.setState({obj: {...this.state.obj, 'content':new_content}, content:new_content});//, () => {this.setObjRef()});
  // }

  revealInList = (state) => {
    this.setState({nested:state});
    this.setState({reveal:state});
    const parentKey = this.state.parent.key;
    if(parentKey !== this.state.obj.key && parentKey !== 'root'){
      // console.log(parentKey, this.state.obj.key);
      const rke = this.props.appFunctions.assets.plex.get(this.state.parent.key);
      // console.log(rke.instance);
      rke.instance && rke.instance.revealInList(state);
    }
  }

  updateIndicesCount = () =>{
    indices++;
    this.props.appFunctions.setMessage('hello-'+(indices)+'srv:'+current_message);
  }

  toggleNestedDeltas = (evt) => {
    evt.stopPropagation();
    this.setState({nestedDeltas:!this.state.nestedDeltas});
  }

  toggleNested = (evt) =>{
    evt.stopPropagation();
    if(evt.target.nodeName === 'INPUT') return;
    //ostensibly, the data object should not be held in state.
    !this.objRef.hasOwnProperty('clicks') ? this.objRef.clicks = 0 : this.objRef.clicks ++;

    this.state.obj.children.length > 0 && this.setState({nested:!this.state.nested});
    this.setState({updated:true});

    log(`Clicked ${this.state.obj.label} (${this.state.obj.clicks})`);
  };

  addNode = async (evt) => {
    evt.stopPropagation();
    if(evt.target.nodeName === 'INPUT') return;

    const label = await getWordFromApi().then((o) => {
      current_message = o.meta;
      return o.data.word;
    });

    const r = {key:util.keyGen(), label:label, content:label, children:[]};
    this.state.obj.children.push(r);

    const rad = {...r};
    rad.toIndex = this.state.obj.children.length-1;
    rad.toParent = this.state.obj.key;

    this.props.appFunctions.saveDelta(rad, 'added').then((any) => this.props.appFunctions.saveAppState());
    this.setState({nested:true, update:true});
  };

  deleteThis = () => {
    // original concept here is a terrible idea...there should be more marks for deletion:
    // tracking individual deletions would be better. ? MAYBE NOT..order issues..
    // don't track individual deletions but mark all deltas of deleted nodes.

    const m_i = this.state.parent.children.findIndex(c => c.key === this.state.obj.key);
    this.state.parent.children.splice(m_i, 1);

    const atomic = (parent, node, batch) => {
      const dc = {...node, 'fromParent':parent.key};
      dc.children && delete dc.children;
      batch.push(dc);
      indices--;
      if(node.children.length) node.children.forEach(n => atomic(node, n, batch));
      return batch;
    }

    // parent // gross but streamlined to avoid a redraw of whole app.
    this.props.appFunctions.assets.plex.get(this.state.parent.key).instance.setState({updated:true});

    const batch = {'push-deleted': atomic(this.state.parent, this.state.obj, [])};
    //const batch = {'key': this.state.obj.key, 'label': this.state.obj.label, 'deleted': atomic(this.state.parent, this.state.obj, [])};
    this.props.appFunctions.saveDelta(batch, 'deleted').then((any) => this.props.appFunctions.saveAppState());
    delete this;
  }

  changeValue = (e) => {
    this.setState({obj: {...this.state.obj, 'content': e.target.value}});
    this.inputActive = true;
  }

  modifyValue = (e, special=null) => {
    if (e.key === "Enter" || (special && this.inputActive)) {
      this.inputActive = false;
      this.setObjRef(); //this is hella weird.: cloning the state.obj in setState breaks link to original data object.
      this.props.appFunctions.saveDelta(this.state.obj, 'changed-content').then((any) => this.props.appFunctions.saveAppState());
    }
  }

  confirmMove = (moved_item, destination) => {

    const moved_node = {...moved_item.node};
    moved_node.fromIndex = moved_item.node.index;
    moved_node.fromParent = moved_item.nodeParent.key;
    moved_node.toIndex = moved_item.toIndex;
    moved_node.toParent = destination.key;
    moved_node.index = moved_item.toIndex;

    const pref = moved_item.nodeParent.children.splice(moved_item.node.index, 1)[0];
    destination.children.splice(moved_item.toIndex, 0, pref);



    //console.
    log('from', moved_node.fromParent, 'to', moved_node.toParent);

    // gross but streamlined to avoid a redraw of whole app.
    const from_inst = this.props.appFunctions.assets.plex.get(moved_node.fromParent).instance;
    if(moved_node.fromParent === moved_node.toParent){
      from_inst.setState({updated:true});
    }else{
      const to_inst = this.props.appFunctions.assets.plex.get(moved_node.toParent).instance;
      from_inst.setState({updated:true});
      to_inst.setState({updated:true});
    }
    
    this.props.appFunctions.saveDelta(moved_node,'moved').then((any) => this.props.appFunctions.saveAppState());
  }

  attachNodeRef = (node, ref) => {
    // console.log(this);
    // ref = {};
    ref.current = (node);
  }

  render() {
    // console.log('render', this.state.obj.key);
    // console.log('render', this.props.appFunctions.assets.data_map.get(this.state.obj.key));

    // const someProperty = {...this.state.obj}
    // someProperty.clicks = this.state.obj.clicks + 1;
    // someProperty.index = this.props.indexAlt;
    // this.setState({someProperty});//, () => {this.updateIndicesCount();});

    // this.state.obj.index = this.props.indexAlt;
    // console.log('render', this.state.obj.label, this._Mounted);//, this.state.obj.index, '->', this.props.indexAlt);
    return (
      <>
      <div 
      id={`${this.state.obj.key}-node`} 
      ref={(n) => this.attachNodeRef(n, this.nodeRef)} 
      className="node" 
      data-index={this.state.obj.index} 
      onClick={this.toggleNested}>
        
        {(this.state.obj.content !== 'root') &&
        <div className="node-content">
          <div className={this.state.reveal ? "node-reveal left" : "left"} style={{ minWidth: `${(this.state.level)*16}px`}}>
            <span className="mini-text">{this.state.obj.children.length}</span>
          </div>
          <div className="center">
            <div className="field">
              <div className="baseline"></div>
              <input 
              id="title" 
              value={this.state.obj.content} 
              onKeyUp={this.modifyValue} 
              onBlur={(e) => this.modifyValue(e,'blur')} 
              onChange={this.changeValue}
              draggable={true} 
              onDragStart={(e) => e.preventDefault()}
              />
            </div>

            <div className="info-label">
              <span className="mini-text text-dark">{this.state.obj.index} of {this.state.parent.children.length}</span>
              <span className="mini-text">{this.state.obj.label}</span>
              <span className="mini-text text-darker">{this.state.obj.key}</span>
              <span className="mini-text has-click" onClick={this.toggleNestedDeltas}>deltas</span>
              <span className="mini-text">({this.objRef.clicks})</span>
            </div>
            <div>
              {
              // const s_all = assets.deltas.delta.filter(ps => ps.key === key).sort((a, b) => {a.delta_timer > b.delta_timer});
              (this.plex && this.plex.deltas) && this.plex.deltas.map((delta_node, n) => {
                // if(util.date_timestamp(delta_node.delta_timer) <= this.props.appFunctions.appDeltaSelect().to[1]){
                  return (
                    <div 
                    key={`${this.state.obj.key}-delta-${n}`} 
                    className="mini-text"
                    style={{ display: !this.state.nestedDeltas && "none" }}>
                    <span>{delta_node.delta_timer && util.date_day_time(delta_node.delta_timer)} {delta_node.method && delta_node.method}</span>&nbsp;
                    <span>{delta_node.content && delta_node.content}</span>
                    </div>
                  )
                // }
              })}
            </div>
          </div>
          <div className="right">
            <ReactSVG src="./check-box-1.svg" onClick={this.deleteThis}/>
            <ReactSVG src="./plush.svg" onClick={this.addNode}/>
          </div>
        </div>
        }

        <div 
        className="node-drop" 
        ref={(n) => this.attachNodeRef(n, this.nodeDropRef)} 
        id={`${this.state.obj.key}-node-drop`} 
        style={{ display: !this.state.nested && "none" }}
        >

        {(this.state.data) && this.state.data.map((node, n) => {
          // console.log("node-drop", n, node);
          node.index = n;
          node.parent = this.state.obj.key;
          return (
              <RecursiveClassComponent 
              level={this.state.level+1}
              key={node.key} 
              parent={this.state.obj} 
              obj={node} 
              data={node.children} 
              appFunctions={this.props.appFunctions}
              parentRef={this.nodeRef}
              indexAlt={n}
              config={this.props.config}
              />
          );
        })}
        </div>

        <DraggableFunctionComponent 
        node={this.state.obj}
        nodeParent={this.state.parent} 
        nodeRef={this.nodeRef} 
        nodeParentRef={this.parentRef} 
        nodeDropRef={this.nodeDropRef}
        confirm={this.confirmMove}
        />

      </div>



      </>
      
    )
  }
};



const App = (props) => {
  const [assets, setAssets] = useState(false);
  const [config, setConfig] = useState({nested:true});

  const [message, setMessage] = useState('no-message');
  const [rerender, setRerender] = useState(false);

  const column_one = useRef(null);
  const column_two = useRef(null);
  const appHistoryList = useRef();

  const appInitRef = useRef(false);
  const base_selected = {from:null, to:[0, util.date_timestamp(new Date())], 'direction':null, 'items':0};

  const [deltaPosition, setDeltaPosition] = useState(base_selected);

  const hasInactiveStatus = (key, method, id, par=null) => {    
    const s_all = assets.deltas.filter(ps => ps.key === key).sort((a, b) => {a.delta_timer > b.delta_timer});
    const added = s_all.find(c => c.method === 'added' && !c.stash) ? false : true;
    const deleted = s_all.find(c => c.method === 'deleted' && !c.stash) ? true : false;
    return deleted || added;// || deleted;
  }

  const deltaValidate = (node) => { //'key',
    const s_all = assets.deltas.filter(ps => ps.key === node.key).sort((a, b) => {a.delta_timer > b.delta_timer});
    const p = ['parent','fromParent','toParent'].map(st => {
      return node[st] && 
      node[st] !== 'root' && 
      hasInactiveStatus(node[st], node.method, node.id, 't')});


    const h = s_all.find(c => c.method === 'added' && !c.stash) ? false : true;
    const j = s_all.find(c => c.method === 'deleted' && !c.stash && c.delta_timer < node.delta_timer) ? true : false;
    const sp = node.method === 'added' && s_all.find(c => c.method === 'deleted' && !c.status);

    let valid_moved = false;

    if(node.method === 'moved'){ 
      const moved = s_all.filter(c => c.method === 'moved' && c.delta_timer < node.delta_timer && c.status && !c.stash);
      valid_moved = moved[0] && moved[0].toParent !== node.fromParent;
    }

    return p.includes(true) || h || j || valid_moved || sp;
    // return [p.includes(true), h, valid_moved, !j].includes(true) ;
  }

  const deltaSaveState = (delta_node) => {
    console.log(delta_node.label, delta_node.method, delta_node.status, 'changed');
    const deltas = {'action':'modify', 'ids':[delta_node.id], 'variable':[{key:'status', value:delta_node.status}]};
    apiPost(deltas, 'delta').then((save_dict) => console.log(save_dict.message));
  }

  const appDeltaSelect = (toPosition, did_unstash=null) => {
    if(did_unstash) log('appDeltaSelect did_unstash', did_unstash);

    if(did_unstash){
      const flagged_deltas = [assets.deltas[toPosition[0]].id];
      console.log(assets.deltas.delta, toPosition, flagged_deltas);
      const deltas = {'action':'modify', 'ids':flagged_deltas, 'variable':[{key:'stash', value:did_unstash === 'REDO' ? false : true}]};
      apiPost(deltas, 'delta')
        .then((save_dict) => console.log(save_dict.message));
        //then rewind and save.
    }
    // if(did_unstash){
    //   // const flagged_deltas = assets.deltas.delta.slice(0,now.to[0]).filter(fd => !fd.stash).map(fd => fd.id);
    //   // log(flagged_deltas);
    //   const deltas = {'action':'modify', 'ids':did_unstash, 'variable':[{key:'stash', value:false}]};

    //   // not waiting for async call here.
    //   saveApplicationState(deltas).then((save_dict) => log(save_dict.message));
    // }
    // const flagged_deltas = assets.deltas.delta.slice(0,now.to[0]).map(fd => fd.id);
    // log(flagged_deltas);

    // const deltas = {'action':'stash', 'ids':flagged_deltas};

    // const save_dict = await saveApplicationState(deltas);


    if(toPosition){
      const range = {'from':!did_unstash ? deltaPosition.to : toPosition, 'to':toPosition, 'direction':did_unstash};
      
      if(!did_unstash && range.from[0] !== range.to[0]){
        range.direction = range.from[0] > range.to[0] ? 'REDO' : 'UNDO';
        range.items = Math.abs(range.from[0]-range.to[0]);
      } 

      console.log(range.from[0], range.to[0], range);
      
      log(history.AppHistory(range, assets.deltas, assets.data_map, assets.plex, appReRender, deltaValidate));

      setDeltaPosition(range);

      return range;

    }else{
      return deltaPosition;
    }
  }

  const addNodeToRoot = (evt) =>{
    if(assets){
      assets.plex.get('root').instance.addNode(evt);
    }
    console.log('fire...');
  }

  const saveDelta = async (node, method='modify') => {

    if(method === 'deleted'){
      const delta_Push_delete_node = {...node};
      delta_Push_delete_node.action = 'push-deleted';
      delta_Push_delete_node['push-deleted'].forEach(pd => {
        pd.method = method;
        pd.children && delete pd.children;
        pd.delta_timer = new Date();
        pd.id = util.keyGen();
      });
      // console.log('delta_Push_delete_node', delta_Push_delete_node);
      const save_dict = await apiPost(delta_Push_delete_node, 'delta');
      log(save_dict.message);

    }else{
      assets.data_map.set(node.key, node);
      const delta_node = {...node};

      delta_node.method = method;
      delta_node.children && delete delta_node.children;
      delta_node.delta_timer = new Date();
      delta_node.id = util.keyGen();
      delta_node.status = true;

      const has_plex = assets.plex.get(delta_node.key);

      if(!has_plex){
        assets.plex.set(delta_node.key, {deltas:[delta_node], instance:null}); //for addition!
      }else{
        has_plex.deltas.push(delta_node);
      }
      


      const save_dict = await apiPost(delta_node, 'delta');
      
      assets.deltas.unshift(delta_node);
      assets.data_map.get(delta_node.key).delta_node_id = delta_node.id;

      log(save_dict.message);
    }

    appHistoryList.current && appHistoryList.current.collapseAll();
    return 'saved';
  }

  const saveAppState = async () => {
    const now = appDeltaSelect();

    // if(now.to[0]!==0){
    //   log('not at zero');
    //   const flagged_deltas = assets.deltas.delta.slice(0,now.to[0]).filter(fd => !fd.stash).map(fd => fd.id);
    //   log('saveAppState', flagged_deltas);
    //   const deltas = {'action':'modify', 'ids':flagged_deltas, 'variable':[{key:'stash', value:true},{key:'stash_on', value:[new Date()]}]};
    //   const save_dict = await saveApplicationState(deltas);
    //   log(save_dict.message);
    // } 
    

    // flagged_deltas.map(fd=>{
    //   log(fd.id);
    // })

    // log(Object.entries(appDeltaSelect()));
    // return;


    console.log('saving app state to api...', assets.data);
    // appHistoryList.current && appHistoryList.current.collapseAll();

    const save = await apiPost(assets.data, 'state');
    
    // const base_selected = {from:null, to:[0, util.date_timestamp(new Date())], 'direction':null, 'items':0};
    // setDeltaPosition(base_selected);

    deltaPosition.from = null;
    deltaPosition.to = [0, util.date_timestamp(new Date())];

    log(save.message);
    // appReRender();
  }

  const saveConfig = async (evt, obj) => {

    const update = await apiPost(obj, 'config');
    log(update.message);

    Object.assign(config, obj);
    setConfig({...config});
    console.log(config, obj);
  }

  const wipeAppState = async () =>{
    const save_dict = await apiPost({action:'wipe'}, 'system');
    log(save_dict.message);
    window.location.reload();
  }


  useEffect(() => {
    console.log('THIS IS THE data NOW', assets.data);
    console.log('THIS IS THE data_map NOW', assets.data_map);
  },[rerender, assets]);

  const appReRender = () => {
    setRerender(!rerender);
  }

  const appUpdateData = () => {
    appReRender();
    console.log('appUpdateData saving...');
  }

  useEffect(() => {
    // https://stackoverflow.com/questions/57847626/using-async-await-inside-a-react-functional-component
    // WHAT IF THERE IS NO FILE AND ONLY DELTA?
    // IT NEEDS TO REASSEMBLE THE "FILE" FROM THE DELTAS.

    log('useEffect appInitRef', appInitRef.current);
    // console.log(AppHistory().ACTIONS);

    const getTokenized = async () => {
      if(!appInitRef.current){
        appInitRef.current = true;

        const [g_config, g_delta, g_preload] = await Promise.all(['config','delta','state'].map(async g => apiGet(g)));

        // const g_config = await apiGet('config');
        // const g_delta = await apiGet('delta');
        // const g_preload = await apiGet('state');

        const collected_delta = g_delta.data;

        // const root_obj = {key:'root', content:'root', children:[]};
        const root_obj = {key:'root', content:'root', children:g_preload.data};
        const data_map = new Map();
        data_map.set('root', root_obj);

        log('init load', g_delta.message);
        log('init load', g_preload.message);
        log('init load', g_config.message);

        // for(let dl of collected_delta.delta){



        //   log(dl.method, dl.content, dl.stash);
          
        //   history.ACTIONS[dl.method]({...dl}, 'REDO', collected_delta.delta, data_map);
        
        
        // }





        const app_plex = new Map();
        
        
        collected_delta.reverse();



        const atomic = (node, data_map_n) => {
          if(data_map_n[node.key] === undefined) data_map_n.set(node.key, node);
          node.children && node.children.forEach(child => atomic(child, data_map_n));
        }
        
        atomic(root_obj, data_map);
    
        for (let [el_key] of data_map) {
          const grp = collected_delta.filter((el_n) => el_n.key === el_key).map(el_n => {return {...el_n}});
          app_plex.set(el_key, {deltas:grp, instance:null});
        }

        console.log('setting assets in place');

        //data here should be an aggregate...
        setConfig({...g_config.data});
        setAssets({data:data_map.get('root').children, deltas:collected_delta, data_map:data_map, root:root_obj, plex:app_plex});

        // setAssets({data:g_preload, deltas:collected_delta, data_map:data_map, root:root_obj, plex:app_plex});
        
      }else{
        console.log('assets are in place');
      }
    }

    !appInitRef.current && getTokenized();
    // setMessage('hello '+prefigured);
    // log('running use application '+appDryInitialized);
    // is_prepared = true;
    // setRerender(!rerender);

  }, [assets, appInitRef]);


  useEffect(() => {
    if(!appDryInitialized){
      appDryInitialized = true;
      const has_eztext = document.getElementById('ez-text');
      logger = eztext(has_eztext).init();
      placeholder = document.getElementById('dummy');
      log('initialized application ', appDryInitialized);
    }else{
      const context = document.getElementById('context');
      

      if(logger && placeholder){
        logger.dom_node.classList.remove('deferred');
        placeholder.classList.remove('deferred');
      }

      context.style.display = 'block';
      log('draw-state finalized', appDryInitialized);
    }
  });


  const attachNodeRef = (node, ref) => {
    ref.current = (node);
  }

  console.log('app render');//, base_selected, assets, appHistoryList);
  console.log(assets.config);
  const functions = {appUpdateData, appDeltaSelect, saveDelta, saveAppState, setMessage, assets};

  return (
    <>
    

    <div className="App">


      <header className="App-header">
        
        {assets && 

        <div className="App-content">
          
          <div ref={(n) => attachNodeRef(n, column_one)} className="App-content-column-one">
            <div className="App-Node-List">
              <div className="node">
                <DndProvider backend={HTML5Backend}> 
                  <RecursiveClassComponent 
                  level={0} 
                  data={assets.data} 
                  obj={assets.root} 
                  parent={assets.root} 
                  appFunctions={functions}
                  config={config}/>
                </DndProvider>
              </div>
            </div>
          </div>
          <div ref={(n) => attachNodeRef(n, column_two)} className="App-content-column-two">
            <div className="App-History-List">
              <AppHistoryList
              ref={appHistoryList}
              // selected={appDeltaSelected} 
              select={appDeltaSelect} 
              reRender={appReRender} 
              source={assets.deltas}
              plex_source={assets.plex}
              data_map={assets.data_map}
              deltaValidate = {deltaValidate}
              deltaSaveState = {deltaSaveState}
              />
            </div>
          </div>
            
        </div>
        }
        
      </header>

      <div className="mini-text text-darker">
        <img src={logo} className="App-logo" alt="logo" />
        {/* {message} */}
        <span className="has-click" onClick={(evt) => addNodeToRoot(evt)}>more</span>&nbsp;
        <span className="has-click" onClick={(evt) => saveAppState(evt)}>force-save</span>&nbsp;
        <span className="has-click" onClick={(evt) => wipeAppState(evt)}>force-wipe</span>&nbsp;
        <span className="has-click" onClick={(evt) => saveConfig(evt, {'nested':!config.nested})}>config-nested {config.nested !== undefined && config.nested.toString()}</span>&nbsp;
      </div>

    </div>
    

  </>
  );
};


export default App;


// LINE 583