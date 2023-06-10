import express from "express";
import { promises as fs } from 'fs';
import * as util from "../js/util.js";

const api_router = express.Router();
const words_sources = ['src/assets/words.txt','src/assets/words-two.txt'];
const state_file_path = 'src/assets/state.json';
const delta_file_path = 'src/assets/delta.json';

const start_time = new Date();

console.log('cwd', process.cwd());

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
    const ref = fs.readFile(delta_file_path)
    .then((result) => {
        return JSON.parse(result);
    })
    .catch((error) => { console.log(error) });
    const currentRecord = await ref;



    if(deltaData){
        const t = util.formatMs(new Date() - start_time);

        if(deltaData.hasOwnProperty('action')){
            currentRecord.delta.map((d)=>{
                if(deltaData.ids.includes(d.id)) d[deltaData.action] = true;
            });
            // const message = `Has action flags:(${deltaData.action}) (${deltaData.ids.length}) items saved at ${t}`;
            // return {message: message};
        }else{
            // assume normal delta addition
            deltaData.delta_timer = new Date();
            currentRecord.delta.push(deltaData);
        }
            
        
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
        return currentRecord;
    }

}   

async function loadApplicationState() {
    const ref = fs.readFile(state_file_path)
    .then((result) => {
        return JSON.parse(result);
    })
    .catch((error) => { console.log(error) });
    return ref;
}

async function saveApplicationState(stateData) {
    const t = util.formatMs(new Date() - start_time);
    stateData.save_time = new Date();
    const blob = JSON.stringify(stateData, null, '\t');
    const ref = fs.writeFile(state_file_path, blob)
    .then((any) => {
        const size = Number(new TextEncoder().encode(blob).length);
        const message = `the state file (${util.formatBytes(size)}) was saved at ${t}`;
        return {message: message};
    })
    .catch((error) => { console.log(error) });
    return ref;
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