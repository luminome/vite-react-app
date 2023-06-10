import * as util from './AppUtil'

const ACTIONS = {
    findDeltaPreviousContent: (node, deltas) => {
        return deltas.filter((d) => 
            (node.key === d.key) &&
            (d.method === 'changed-content' || d.method === 'added') &&
            (util.date_timestamp(d.delta_timer) < util.date_timestamp(node.delta_timer)))[0];
    },
    'changed-content': (node, dir, deltas, data_map) => {
        console.log('changed-contents ->', node.key, dir);
        const nNode = data_map.get(node.key);
        if(dir === 'UNDO'){
            const pNode = ACTIONS.findDeltaPreviousContent(node, deltas);
            nNode.content = pNode.content;
        }else{
            nNode.content = node.content;
        }
    },
    'added': (node, dir, deltas, data_map) => {
        const toParent = data_map.get(node.toParent);
        if(dir === 'UNDO'){
            const a_i = toParent.children.findIndex(c => c.key === node.key);
            toParent.children.splice(a_i, 1);
        }else{
            const copyNode = {...node};
            copyNode.children = [];
            toParent.children.splice(node.toIndex, 0, copyNode);                
            data_map.set(node.key, copyNode);
        }
    },
    'deleted': (node, dir, deltas, data_map) => {
        for (let d of node.deleted) {
            const parent = data_map.get(d.fromParent);
            if(dir === 'UNDO'){
                const del_node = { ...d };
                del_node.delta_node_id = node.id;
                del_node.children = [];
                parent.children.splice(d.index, 0, del_node);
                data_map.set(d.key, del_node);
            }else{
                const d_i = parent.children.findIndex(c => c.key === d.key);
                parent.children.splice(d_i, 1);
            }
            data_map.set(parent.key, parent);
        }
    },
    'moved': (node, dir, deltas, data_map) => {
        const parent = data_map.get(dir === 'UNDO' ? node.toParent : node.fromParent);
        const into_parent = data_map.get(dir === 'UNDO' ? node.fromParent : node.toParent);

        const prev_index = parent.children.findIndex(c => c.key === node.key);
        const m_node = parent.children.splice(prev_index, 1)[0];

        into_parent.children.splice(dir === 'UNDO' ? node.fromIndex : node.toIndex, 0, m_node);
        data_map.set(parent.key, parent);
        data_map.set(into_parent.key, into_parent);

        if(dir === 'UNDO'){
            node.delta_node_id = node.id;
        }else{
            m_node.delta_node_id = node.id;
        }    
        
        data_map.set(node.key, m_node);
    }
}




const AppHistory = (selection, deltas, data_map, plex, complete) => {
    // remove plex atall.
    

    if(selection.direction){
        const [a,b] = [Math.min(selection.from[0],selection.to[0]),Math.max(selection.from[0],selection.to[0])];
        const timeframe = deltas.slice(a,b);
        selection.direction === 'REDO' && timeframe.reverse();

        if(selection.direction){
            for(let node of timeframe){
                ACTIONS[node.method]({...node}, selection.direction, deltas, data_map);
            }
        }
        complete();
    }else{
        return 'AppHistory standing still.';
    }
    return 'AppHistory completed. '+selection.direction;
}   


export {AppHistory, ACTIONS};






/*
const HIST = {
    util:{
        findDeltaPreviousContent: (node, deltas) => {
            // get the previous node in the the delta history.
            const grp = deltas.filter((d) => {
                if (d.method === 'changed-content' || d.method === 'added') {
                    return (util.date_timestamp(d.delta_timer) < util.date_timestamp(node.delta_timer));
                }
                return false;
            });//.reverse();
            return grp[0];
        }
    },
    UNDO: (node, plexNode, deltas, data_map, plex_map) => {
        const expr = node.method;
        const key = node.key;
        switch (expr) {
            case 'changed-content':
                const prev_content = HIST.util.findDeltaPreviousContent(node, plexNode.deltas);
                if (!prev_content) console.warn('ERROR prev_content', prev_content);
                const n_node = data_map.get(key);
                if (n_node) {
                    n_node.content = prev_content.content === prev_content.label ? prev_content.label : prev_content.content;
                    n_node.delta_node_id = prev_content.id;
                    data_map.set(key, n_node);
                    plexNode.instance.setState({updated:true, content:n_node.content});
                }
                break;

            case 'added':
                const parent_inst = plex_map.get(node.toParent).instance;
                const toParent = data_map.get(node.toParent);
                const a_i = toParent.children.findIndex(c => c.key === node.key);
                toParent.children.splice(a_i, 1);
                data_map.set(toParent.key, toParent);
                parent_inst && parent_inst.setState({updated:true});
                break;

            case 'deleted':
                // in undoing a deletion, remeber that there may be orphaned
                // console.log('deltaObj', deltaObj);
                const handle = node.deleted[0];
                const handle_parent_inst = plex_map.get(handle.fromParent).instance;

                for (let d of node.deleted) {
                    
                    const n_node = { ...d };
                    const parent = data_map.get(d.fromParent);
                    n_node.delta_node_id = node.id;
                    n_node.children = [];
                    parent.children.splice(d.index, 0, n_node);
                    data_map.set(parent.key, parent);
                    data_map.set(d.key, n_node);

                    if (!plexNode) {
                        const grp = deltas.filter(el_n => el_n.key === d.key);
                        plex_map.set(d.key, { deltas: grp, instance: null });
                    }
                }

                handle_parent_inst.setState({updated:true});
                break;

            case 'moved':
                const parent = data_map.get(node.toParent);
                const moved_parent_inst = plex_map.get(node.toParent).instance;
                const into_parent = data_map.get(node.fromParent);
                const moved_into_parent_inst = plex_map.get(node.fromParent).instance;

                const m_i = parent.children.findIndex(c => c.key === key);
                const m_node = parent.children.splice(m_i, 1)[0];
                into_parent.children.splice(node.fromIndex, 0, m_node);

                data_map.set(parent.key, parent);
                data_map.set(into_parent.key, into_parent);

                node.delta_node_id = node.id;
                data_map.set(key, m_node);

                moved_parent_inst.setState({updated:true});
                moved_into_parent_inst.setState({updated:true});

                break;
            default:
                console.log(`Sorry, we are out of ${expr}.`);
        }
    },
    REDO: (node, plexNode, deltas, data_map, plex_map) => {
        const expr = node.method;
        const key = node.key;
        switch (expr) {
            case 'changed-content':
                const n_node = data_map.get(key);
                if (n_node) {
                    n_node.content = node.content;
                    n_node.delta_node_id = node.id;
                    data_map.set(key, n_node);
                    plexNode.instance.setState({updated:true, content:n_node.content});
                }
                break;

            case 'added':
                const parent_inst = plex_map.get(node.toParent).instance;
                const toParent = data_map.get(node.toParent);
                node.children = [];
                toParent.children.splice(node.toIndex, 0, node);
                data_map.set(key, node);
                parent_inst.setState({updated:true});
                break;

            case 'deleted':
                const handle = node.deleted[0];
                const handle_parent_inst = plex_map.get(handle.fromParent).instance;
                for (let d of node.deleted) {
                    const parent = data_map.get(d.fromParent);
                    const d_i = parent.children.findIndex(c => c.key === d.key);
                    parent.children.splice(d_i, 1);
                    data_map.set(parent.key, parent);
                    delete data_map.get(d.key);
                    delete plex_map.get(d.key);
                }
                handle_parent_inst.setState({updated:true});
                break;

            case 'moved':
                const parent = data_map.get(node.toParent);
                const moved_parent_inst = plex_map.get(node.toParent).instance;
                const into_parent = data_map.get(node.fromParent);
                const moved_into_parent_inst = plex_map.get(node.fromParent).instance;

                const m_i = parent.children.findIndex(c => c.key === key);
                const m_node = parent.children.splice(m_i, 1)[0];
                into_parent.children.splice(node.toIndex, 0, m_node);
                data_map.set(parent.key, parent);
                data_map.set(into_parent.key, into_parent);
                
                m_node.delta_node_id = node.id;
                data_map.set(key, m_node);

                moved_parent_inst.setState({updated:true});
                moved_into_parent_inst.setState({updated:true});
                break;

            default:
                console.log(`Sorry, we are out of ${expr}.`);
        }
    }
}



*/

// const findDeltaPreviousContent = (deltas) => {
//     // get the previous node in the the delta history.
//     const grp = deltas.filter((d) => {
//         if (d.method === 'changed-content' || d.method === 'added') {
//             const timer = d.delta_timer !== undefined ? d.delta_timer : d.timer;
//             return (date_timestamp(timer) < selected.delta[1]);
//         }
//         return false;
//     }).reverse();
//     return grp[0];
// };

// const REDO = (deltaObj, plexObj) => {
//     const expr = deltaObj.method;
//     const key = deltaObj.key;
//     switch (expr) {
//         case 'changed-content':
//             if (plexObj !== undefined) {
//                 const node = data_map.get(key);
//                 if (node) {
//                     node.content = deltaObj.content;
//                     plexObj.instance.state.content = node.content;
//                     node.delta_node_id = deltaObj.id;
//                     data_map.set(key, node);
//                     console.log(node);
//                 }
//             }
//             break;
//         case 'added':
//             const toParent = data_map.get(deltaObj.toParent);
//             if (!toParent) {
//                 console.warn('ERROR no-parent', toParent);
//                 break;
//             }
//             // NOTE is the delta enough to add the node back in? // well...
//             deltaObj.children = [];
//             toParent.children.splice(deltaObj.toIndex, 0, deltaObj);
//             // node.delta_node_id = deltaObj.id;
//             data_map.set(key, deltaObj);
//             break;
//         case 'moved':
//             const parent = data_map.get(deltaObj.fromParent);
//             const into_parent = data_map.get(deltaObj.toParent);
//             const m_i = parent.children.findIndex(c => c.key === deltaObj.key);
//             const node = parent.children.splice(m_i, 1)[0];
//             into_parent.children.splice(deltaObj.toIndex, 0, node);
//             data_map.set(parent.key, parent);
//             data_map.set(into_parent.key, into_parent);
//             node.delta_node_id = deltaObj.id;
//             data_map.set(key, node);
//             break;
//         case 'deleted':
//             // in undoing a deletion, remeber that there may be orphaned
//             // console.log('deltaObj', deltaObj);
//             for (let d of deltaObj.deleted) {
//                 const parent = data_map.get(d.fromParent);
//                 const d_i = parent.children.findIndex(c => c.key === d.key);
//                 parent.children.splice(d_i, 1);
//                 data_map.set(parent.key, parent);
//                 delete data_map.get(d.key);
//                 delete plex.get(d.key);
//             }
//             break;
//         default:
//             console.log(`Sorry, we are out of ${expr}.`);
//     }
// };

// const UNDO = (deltaObj, plexObj) => {
//     const expr = deltaObj.method;
//     const key = deltaObj.key;

//     switch (expr) {
//         case 'changed-content':
//             // console.log(plexObj.deltas);
//             if (plexObj !== undefined) {
//                 const prev_content = findDeltaPreviousContent(plexObj.deltas);
//                 if (!prev_content) console.warn('ERROR prev_content', prev_content);

//                 const node = data_map.get(key);
//                 if (node) {
//                     node.content = prev_content.content === prev_content.label ? prev_content.label : prev_content.content;
//                     node.delta_node_id = prev_content.id;
//                     plexObj.instance.state.content = node.content;
//                     data_map.set(key, node);
//                     // console.log(node);
//                 }
//             }
//             break;
//         case 'added':
//             const toParent = data_map.get(deltaObj.toParent);
//             const a_i = toParent.children.findIndex(c => c.key === deltaObj.key);
//             toParent.children.splice(a_i, 1);
//             data_map.set(toParent.key, toParent);
//             break;

//         case 'moved':
//             const parent = data_map.get(deltaObj.toParent);
//             // console.log(deltaObj, deltaObj.toParent, parent);

//             const into_parent = data_map.get(deltaObj.fromParent);

//             const m_i = parent.children.findIndex(c => c.key === deltaObj.key);
//             const node = parent.children.splice(m_i, 1)[0];
//             into_parent.children.splice(deltaObj.fromIndex, 0, node);

//             data_map.set(parent.key, parent);
//             data_map.set(into_parent.key, into_parent);

//             node.delta_node_id = deltaObj.id;
//             data_map.set(key, node);
//             break;
//         case 'deleted':
//             // in undoing a deletion, remeber that there may be orphaned
//             // console.log('deltaObj', deltaObj);

//             for (let d of deltaObj.deleted) {
//                 const node = { ...d };
//                 const parent = data_map.get(d.fromParent);
//                 node.delta_node_id = deltaObj.id;
//                 node.children = [];
//                 parent.children.splice(d.index, 0, node);
//                 data_map.set(parent.key, parent);
//                 data_map.set(d.key, node);
//                 if (!plexObj) {
//                     const grp = collected_delta.delta.filter(el_n => el_n.key === d.key);//.reverse();
//                     plex.set(d.key, { deltas: grp, instance: null });
//                 }
//             }

//             break;
//         default:
//             console.log(`Sorry, we are out of ${expr}.`);
//     }

// };

