import express from "express";
import { promises as fs } from 'fs';
import * as util from "../js/util.js";

const api_router = express.Router();
const words_sources = ['src/assets/words.txt','src/assets/words-two.txt']; //'src/assets/words-three.txt'];//
const state_file_path = 'src/assets/state.json';
const delta_file_path = 'src/assets/delta.json';


const basis = 'memory'; // memory or file

const state_object = {state:[]};
const delta_object = {delta:[]};

const start_time = new Date();

console.log('cwd', process.cwd(), `basis:${basis}`);



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

    if(basis === 'file'){
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
        const t = util.formatMs(new Date() - start_time);

        if(deltaData.hasOwnProperty('action')){
            // assumes this is worker function
            const [variable, value, action] = [deltaData.variable, deltaData.value, deltaData.action];

            currentRecord.delta.map((d)=>{

                if(deltaData.ids.includes(d.id)){
                    if(Array.isArray(variable)){
                        variable.map(g => {
                            Array.isArray(g.value) && d[g.key] ? d[g.key].push(g.value[0]) : d[g.key] = g.value || (d[g.key] = g.value); 
                        });
                    }


                    // if(action === 'unset'){
                    //     delete d[variable];
                    // }else{
                    //     d[variable] = value;
                    // }
                }
            });
            // const message = `Has action flags:(${deltaData.action}) (${deltaData.ids.length}) items saved at ${t}`;
            // return {message: message};
        }else{
            // assume normal delta addition
            deltaData.delta_timer = new Date();
            currentRecord.delta.push(deltaData);
        }
            
        if(basis === 'file'){
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
            return {message: deltaData}; ///currentRecord;
        }

    }else{
        return currentRecord;
    }

}   

async function loadApplicationState() {
    if(basis === 'file'){
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
    }else{
        try {
            const n = () => Math.floor(Math.random()*words.length);
            const data = {data:{'word':words[n()]}, meta:t};
            return res.json(data);
        } catch (err) {
            res.json(err.message);
            console.error(`generic Error`, err.message);
            next(err);
        }
    }

    res.json({ message: "Hello from Express api_router deep!" });

});

api_router.post('/', async (req, res, next) => {
    try {
        //if an array is in post req, assume it's the state-record.
        const postObjectMethod = Array.isArray(req.body);
        // console.log('body', req.body);

        if(postObjectMethod){
            const data = await saveApplicationState(req.body);
            console.log(`\x1b[35mPOST -> ${data.message}\x1b[0m`);
            return res.json(data);
        }else{
            const data = await saveDeltaRecord(req.body);
            console.log(`\x1b[35mPOST -> ${data.message}\x1b[0m`);
            return res.json(data);
        }

    } catch (err) {
        res.json(err.message);
        console.error(`POST Error`, err.message);
        next(err);
    }
});

export default api_router;