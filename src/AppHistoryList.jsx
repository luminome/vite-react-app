import './AppHistoryList.css';
import React, {useState, useImperativeHandle} from "react";
import * as util from './AppUtil'
import { ReactSVG } from "react-svg";

const DeltaRecordComponent = (props) =>{
    const [isShown, setIsShown] = useState(false);
    const [isRevealed, setIsRevealed] = useState({key:null, state:false});
    const time_stamp = util.date_timestamp(props.object.delta_timer);

    let selected = props.select();

    const contactAppNode = (evt, key) => {
        evt.preventDefault();

        if(!props.object.stash){
            selected = props.select([props.index, time_stamp]);
            const p = props.plex_source.get(key);
            if(p){
                console.log(p);
                p.instance.revealInList(!isRevealed.state);
            }else{
                console.log('No plex at DeltaRecordComponent',props.index,key,p);
            }
            // setIsRevealed({key:key, state:!isRevealed.state});

        }
        
    }

    const unStash = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const unstashed = [];
        for(let t = selected.to[0]-1; t >= props.index; t--){
            unstashed.push(props.source[t].id);
            delete props.source[t].stash;
        }

        // console.log('unstashed', unstashed);
        // delete props.source[props.index].stash;
        props.select([props.index, time_stamp], unstashed);
    }
  
    const produceDetail = () => {
      const jrb = JSON.stringify(props.object, null, '\t');
      return (
        <div className="delta-item-detail-fine">{jrb}</div>
      )
    }

    const showFineDetail = (evt, key) => {
        evt.preventDefault();
        evt.stopPropagation();
        console.log('key', key);
        setIsRevealed({key:key, state:!isRevealed.state});
    }
  
    const states = [
        isShown,
        isRevealed.state,
        time_stamp === selected.to[1],
        time_stamp >= selected.to[1],
        props.object.stash
    ]
    const stateClasses = ['shown','reveal','current','previous','stash'];
    const classNames = []; /// by default
    states.map((st,n) => {if(st) classNames.push('delta-'+stateClasses[n])});



    return (
        <>

        {states[2] &&
            <div className="mini-text delta-marker"> CURRENT
                {selected.to[0]} / {props.source.length} D:{selected.direction} {selected.items}
            </div>
        }
        <div 
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
        className={"delta-item has-click "+classNames.join(' ')}
        onClick={(e) => contactAppNode(e, props.object.key)}>

        <div className="delta-item-date">

            {util.date_day_time(props.object.delta_timer)}{props.object.stash && ' — stashed'}
            <span className={"has-click "} onClick={(e) => showFineDetail(e, props.object.key)}>({!isRevealed.state ? "details":"hide details"})</span>
        </div>

        <div className={'delta-el'} >
            <div className='delta-left'>
                {(states[3] && props.object.stash) && <ReactSVG src="./plush.svg" onClick={(e) => unStash(e)}/>}
            </div>
            <div className='delta-right'>
                <div className="delta-item-detail">
                    {props.object.method === 'deleted' ? `deleted (${props.object.deleted.length})` : props.object.method}&nbsp;
                    {props.object.label}
                    </div>
                {(isRevealed.state) && produceDetail()} 
                {/* // && states[2] */}
            </div>
            
        </div>


        </div>
        </>
    );
};
  

const AppHistoryList = React.forwardRef((props, ref) => {
    
    const [rerender, setRerender] = useState(false);

    useImperativeHandle(ref, () => ({
        collapseAll: () => {
            setRerender(!rerender);
        }
    }));

    // const updateList = (status_message) => {
    //     setRerender(!rerender);
    // }

    let selected = props.select();

    const setPosition = () => {
        const deltaNode = props.source[props.source.length-1];
        const s = [props.source.length, deltaNode.delta_timer];
        
        // const selected = props.selected();
        // const s = {start:selected.delta, end:null, direction:null, deltaNode:deltaNode};
        // selected.delta = [props.source.length, null];
        // s.end = selected.delta;

        // if(s.start[0] !== s.end[0]) s.direction = s.start[0] > s.end[0] ? 'REDO' : 'UNDO';

        // const start = props.selected();  
        // const deltaNode = props.source[props.source.length-1];
        // const end = {delta:[props.source.length, util.date_timestamp(deltaNode.delta_timer)]};
        // console.log('setPosition start', start, end);

        // // const deltaNode = props.source[props.source.length-1];
        // // const selected = props.selected(props.source.length,util.date_timestamp(deltaNode.delta_timer));

        
        // // const end = {delta:[props.source.length,util.date_timestamp(deltaNode.delta_timer)]};
        // const s = {start:start.delta, end:end.delta, direction:'UNDO', deltaNode:deltaNode};
        selected = props.select(s);
        // props.reRender();
        // props.selected(end.delta[0],end.delta[1]);
    }

    
    return (
        <>


        {props.source.map((d, index) => {
            const time_stamp = d.delta_timer ? util.date_timestamp(d.delta_timer) : util.date_timestamp(d.timer);
            // leaving d packed did not work.
            return(
                <DeltaRecordComponent 
                // selected={props.selected} 
                select={props.select} 
                // updateList={updateList} 
                key={`delta-${index}`} 
                index={index} 
                timer={time_stamp} 
                plex_source={props.plex_source}
                source={props.source}
                object={{...d}}/>
            )

        })}

        <div className="mini-text has-click" onClick={setPosition}>START
            {selected.to[0]} / {props.source.length} D:{selected.direction} {selected.items}
        </div>
        </>
    )

});

export default AppHistoryList;