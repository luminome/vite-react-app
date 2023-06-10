import React, {useState, useImperativeHandle} from "react";
import * as util from './AppUtil'


const DeltaRecordComponent = (props) =>{
  
    const [isShown, setIsShown] = useState(false);
    const [isRevealed, setIsRevealed] = useState({key:null, state:false});
    const time_stamp = props.object.delta_timer !== undefined ? util.date_timestamp(props.object.delta_timer) : util.date_timestamp(props.object.timer);
  
    let selected = props.select();

    //const s = {start:selected.delta, end:null, direction:null, deltaNode:props.object};
  
    const contactAppNode = (evt, key) => {
        // evt.preventDefault();
        selected = props.select([props.index, time_stamp]);
        // setIsRevealed({key:key, state:!isRevealed.state});
    }
  
    const produceDetail = () => {
      const jrb = JSON.stringify(props.object, null, '\t');
      return (
        <div className="delta-item-detail-fine">{jrb}</div>
      )
    }
  
    // (props.index !== selected.delta[0]) && (isRevealed.state = false) //({state:false});

    return (
        <>
        <div 
        onMouseEnter={() => setIsShown(true)}
        onMouseLeave={() => setIsShown(false)}
        className="delta-item">
    
        <div 
        onClick={(e) => contactAppNode(e, props.object.key)} 
        className={(isRevealed.state && "has-click delta-item-reveal") || 'has-click'} 
        style={{
            color: (isShown || isRevealed.state) && 'white', 
            opacity: (!props.object.stash && time_stamp <= selected.to[1] ? 1.0 : 0.5),
            borderTop: (time_stamp === selected.to[1]) && '1px white solid'
        }}
        >
        
        {util.date_day_time(props.object.delta_timer)}
        {props.object.stash && 'stashed'}
        <div className="delta-item-detail">{props.object.method} {props.object.content}</div>
        {isRevealed.state && produceDetail()}
        
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
        <div className="mini-text has-click" onClick={setPosition}>CURRENT
            {selected.to[0]} / {props.source.length} D:{selected.direction} {selected.items}
        </div>

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