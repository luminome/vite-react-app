import express from "express";
import { promises as fs } from 'fs';
import * as util from "../js/util.js";
import config from "./config.js";

console.log('config:', config);

const api_router = express.Router();
const words_sources = ['src/assets/words-four.txt','src/assets/words-three.txt'];//,'src/assets/words-two.txt']; //'src/assets/words-three.txt'];//
const state_file_path = 'src/assets/state.json';
const delta_file_path = 'src/assets/delta.json';

const appObjects = {
    state: {data:[]},
    delta: {data:[]}
}

const file_path_for = (obj_str) => `src/assets/${obj_str}.json`;

const setFile = async (obj_str) => {
    const sim_object = {data:[], aux:null, start: new Date()};
    const blob = JSON.stringify(sim_object, null, '\t');
    return fs.writeFile(file_path_for(obj_str), blob)
        .then((any) => {return `the ${obj_str} ${file_path_for(obj_str)} file was created.`})
        .catch((error) => { console.log(error) });
}


const updateObject = async (obj_str, data) => {
    const t = util.formatMs(new Date() - start_time);
    const appObject = {data:data, aux:null, update_time:new Date()};
    const blob = JSON.stringify(appObject, null, '\t');
    let ref = null;

    if(config.basis === 'file'){
        ref = await fs.writeFile(file_path_for(obj_str), blob)
        .then((any) => {return 'file:ok'})
        .catch((error) => { console.log(error) });
    }else{
        appObjects[obj_str] = {...appObject};
    }

    const size = Number(new TextEncoder().encode(blob).length);
    const message = `the ${obj_str} ${config.basis} (${util.formatBytes(size)}) was saved at ${t}. ${ref}.`;
    return message;
}




// if(basis === 'file'){
//     // const t = util.formatMs(new Date() - start_time);
//     const state_object = {state:stateData, save_time:new Date()};

//     // stateData.save_time = new Date();
//     const blob = JSON.stringify(state_object, null, '\t');
//     const ref = fs.writeFile(state_file_path, blob)
//     .then((any) => {
//         const size = Number(new TextEncoder().encode(blob).length);
//         const message = `the state file (${util.formatBytes(size)}) was saved at ${t}`;
//         return {message: message};
//     })
//     .catch((error) => { console.log(error) });
//     return ref;
// }else{
//     state_object.save_time = new Date();
//     state_object.state = [...stateData];
//     return {message: 'from memory'};
//     // stateData.save_time = new Date();

// }




['state','delta'].forEach(async (p) => {
    try {
        const stats = await fs.access(file_path_for(p), fs.F_OK);
    } catch (error) {
        console.log(`\x1b[35mSERVER -> ${await setFile(p)}\x1b[0m`);
    }
})


const basis = config.basis;

// const state_object = {state:[]};

// const delta_object = {delta:[]};

const start_time = new Date();

console.log('cwd', process.cwd(), `initial basis:${config.basis}`);



async function loadWords() {
    const buf = words_sources.map(w => { 
        const ref = fs.readFile(w)
        .then((result) => {
            return result.toString().split('\n');
        })
        .catch((error) => { console.log(error) });
        return ref;
    })
    return await Promise.all(buf);
}

const words_stacked = await loadWords();
const words = words_stacked.flat();
// words are in memory now.




async function saveDeltaRecord(deltaData=null) {
    let currentRecord = null;

    if(config.basis === 'file'){
        const ref = fs.readFile(delta_file_path)
        .then((result) => {
            return JSON.parse(result);
        })
        .catch((error) => { console.log(error) });
        currentRecord = await ref;
    }else{
        currentRecord = {...delta_object};
    }


    if(deltaData){
        let result_message = ''
        const t = util.formatMs(new Date() - start_time);
        // console.log(deltaData);

        // if(deltaData.method === 'deleted'){
        //     deltaData.deleted.forEach(d => {
        //         currentRecord.delta.filter(df => df.key === d.key && df.key !== deltaData.key).map(dm => dm.resolves = false);
        //     });
        //     // deltaData.resolves = true;
        // }


        if(deltaData.hasOwnProperty('action')){
            
            // assumes this is worker function
            const [variable, value, action] = [deltaData.variable, deltaData.value, deltaData.action];
            result_message = `action ${action}`;

            if(action === 'modify'){
                currentRecord.delta.map((d)=>{
                    if(deltaData.ids.includes(d.id)){
                        if(Array.isArray(variable)){
                            variable.map(g => {
                                Array.isArray(g.value) && d[g.key] ? d[g.key].push(g.value[0]) : d[g.key] = g.value || (d[g.key] = g.value); 
                            });
                        }
                    }
                });
            }
            if(action === 'wipe'){
                state_object.state = [];
                delta_object.delta = [];
            }

            // const message = `Has action flags:(${deltaData.action}) (${deltaData.ids.length}) items saved at ${t}`;
            // return {message: message};
        }else{
            
            // assume normal delta addition 'cept for deletion
            deltaData.delta_timer = new Date();
            // console.log(deltaData);
            if(deltaData.hasOwnProperty('push-deleted')){
                result_message = `delta 'push-deleted' ${deltaData['push-deleted'].length} items.`;
                deltaData['push-deleted'] = deltaData['push-deleted'].reverse();
                deltaData['push-deleted'].forEach(del => {
                    currentRecord.delta.push(del);
                });
            }else{
                result_message = `delta 'added-single'`;
                currentRecord.delta.push(deltaData);
            }
            
            // console.log(currentRecord);
        }
            
        if(config.basis === 'file'){
            const blob = JSON.stringify(currentRecord, null, '\t');
            const size = Number(new TextEncoder().encode(blob).length);
            const message = `the delta file (${currentRecord.delta.length}) items (${util.formatBytes(size)}) was saved at ${t}`;

            const saveRef = fs.writeFile(delta_file_path, blob)
            .then((any) => {
                return {message: message};
            })
            .catch((error) => { console.log(error) });

            return saveRef;
        }else{
            return {message: result_message}; ///currentRecord;
        }

    }else{
        // console.log(currentRecord);
        return currentRecord.data;
    }

}   

async function loadApplicationState() {
    if(config.basis === 'file'){
        const ref = fs.readFile(state_file_path)
        .then((result) => {
            const state_object = JSON.parse(result);
            return state_object.state;
        })
        .catch((error) => { console.log(error) });
        return ref;
    }else{
        return state_object.state;
    }
}

async function loadDeltaRecord() {
    if(config.basis === 'file'){
        const ref = fs.readFile(delta_file_path)
        .then((result) => {
            return JSON.parse(result);
        })
        .catch((error) => { console.log(error) });
        currentRecord = await ref;
    }else{
        currentRecord = {...delta_object};
    }
}



async function saveApplicationState(stateData) {
    const t = util.formatMs(new Date() - start_time);

    if(basis === 'file'){
        // const t = util.formatMs(new Date() - start_time);
        const state_object = {state:stateData, save_time:new Date()};

        // stateData.save_time = new Date();
        const blob = JSON.stringify(state_object, null, '\t');
        const ref = fs.writeFile(state_file_path, blob)
        .then((any) => {
            const size = Number(new TextEncoder().encode(blob).length);
            const message = `the state file (${util.formatBytes(size)}) was saved at ${t}`;
            return {message: message};
        })
        .catch((error) => { console.log(error) });
        return ref;
    }else{
        state_object.save_time = new Date();
        state_object.state = [...stateData];
        return {message: 'from memory'};
        // stateData.save_time = new Date();

    }
}







async function getAppObject(obj_str) {
    if(config.basis === 'file'){
        const ref = await fs.readFile(file_path_for(obj_str))
        .then((result) => {
            appObjects[obj_str] = JSON.parse(result);
            return appObjects[obj_str].data;
        })
        .catch((error) => { console.log(error) });
        return ref;
    }else{
        return appObjects[obj_str].data;
    }
}




const diagonal = {
    config: () => config,
    state: () => getAppObject('state'),
    delta: () => getAppObject('delta'),
    default_word: () => {
        const n = Math.floor(Math.random()*words.length);
        const w = words.splice(n,1);
        return {'word':w};
    }
}



api_router.get('/', async (req, res, next) => {
    const t = util.formatMs(new Date() - start_time);
    const q = Object.keys(req.query)[0] || 'default_word';
    const k = diagonal[q];
    try {
        const result = await k();
        const blob = JSON.stringify(result, null, '\t');
        const size = Number(new TextEncoder().encode(blob).length);
        const message = `${q} (${util.formatBytes(size)})`;

        const d = {
            q:q,
            data:result,
            time:t,
            message:message
        };
        return res.json(d);
    } catch (err) {
        res.json(err.message);
        console.error(`Error`, err.message);
        next(err);
    }

    //k && console.log(k(),q);
});





/*
api_router.get('/', async (req, res, next) => {
    const t = util.formatMs(new Date() - start_time);
    


    

    if(req.query.hasOwnProperty('state')){
        try {
            const data = await loadApplicationState();
            data.timer = t;
            return res.json(data);
        } catch (err) {
            res.json(err.message);
            console.error(`state Error`, err.message);
            next(err);
        }
    }else if(req.query.hasOwnProperty('delta')){
        try {
            const data = await saveDeltaRecord();
            data.timer = t;
            return res.json(data);
        } catch (err) {
            res.json(err.message);
            console.error(`delta Error`, err.message);
            next(err);
        }

    }else if(req.query.hasOwnProperty('config')){
        try {
            return res.json(config);
        } catch (err) {
            res.json(err.message);
            console.error(`generic Error`, err.message);
            next(err);
        }

    }else{
        try {
            const n = () => Math.floor(Math.random()*words.length);
            const w = words.splice(n(),1);
            const data = {data:{'word':w}, meta:t};
            return res.json(data);
            
        } catch (err) {
            res.json(err.message);
            console.error(`generic Error`, err.message);
            next(err);
        }
    }

    res.json({ message: "Hello from Express api_router deep!" });

});
*/



//set state
//set delta
//set config
//effect wipe

const post_diagonal = {
    state: (data) => {
        const message = updateObject('state', data);
        return {message:message};
    },
    delta: async (data) => {
        const current_data = await getAppObject('delta');

        if(data.hasOwnProperty('action')){
            const [variable, value, action] = [data.variable, data.value, data.action];

            if(action === 'push-deleted'){
                data['push-deleted'] = data['push-deleted'].reverse();
                data['push-deleted'].forEach(del => {
                    current_data.push(del);
                });
            }else if(action === 'modify'){
                current_data.map((d)=>{
                    if(data.ids.includes(d.id)){
                        if(Array.isArray(variable)){
                            variable.map(g => {
                                Array.isArray(g.value) && d[g.key] ? d[g.key].push(g.value[0]) : d[g.key] = g.value || (d[g.key] = g.value); 
                            });
                        }
                    }
                });
            }

        }else{
            current_data.push(data);
        }

        const message = await updateObject('delta', current_data);
        return {message:message};
    },
    config: (data) => {
        Object.assign(config, data);
        console.log(config);
        return 'config'
    },
    system: (data) => {
        if(data.action === 'wipe'){
            ['state','delta'].forEach(async (p) => {
                if(config.basis === 'file'){
                    console.log(`\x1b[35mSERVER -> ${await setFile(p)}\x1b[0m`);
                }else{
                    appObjects[p] = {data:[], aux:null, start: new Date()};
                }
            })
        }
        return `'system' ${data.action}`;
    }
}


api_router.post('/', async (req, res, next) => {    



    try{
        const q = req.body.method;
        const data = req.body.data;
        const k = post_diagonal[q];
        const result = await k(data);
        
        console.log(`\x1b[35mPOST -> ${q} ${result}\x1b[0m`);
        return res.json(result);

        // console.log(result);

        // try {
        //     //if an array is in post req, assume it's the state-record.
        //     const postObjectMethod = Array.isArray(req.body);
        //     // console.log('body', req.body);

        //     if(postObjectMethod){
        //         const data = await saveApplicationState(req.body);
        //         console.log(`\x1b[35mPOST -> ${data.message}\x1b[0m`);
        //         return res.json(data);
        //     }else{
        //         const data = await saveDeltaRecord(req.body);
        //         console.log(`\x1b[35mPOST -> ${data.message}\x1b[0m`);
        //         return res.json(data);
        //     }

    } catch (err) {
        res.json(err.message);
        console.error(`POST Error`, err.message);
        next(err);
    }
});

export default api_router;