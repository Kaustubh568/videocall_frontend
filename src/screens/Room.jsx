import React, { useEffect , useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import peer from '../service/peer';
import { useSocket } from '../context/SocketProvider';

const Roompage = () => {

    const socket = useSocket();
    const[ remoteSocketId , setremoteSocketId ] = useState(null);
    const[ stream , setStream] = useState();
    const[ remoteStream , setremoteStream] = useState();
    


    const HandleUserjoin = useCallback(({email , id }) =>{
        console.log(`Email ${email} joined the room`)
        setremoteSocketId(id) 
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true,video: true});
         
        const offer = await peer.getOffer();
        socket.emit("user:call" , {to: remoteSocketId, offer});
        setStream(stream);

    }, [remoteSocketId , socket]);

    const handleincommingcall = useCallback(async ({from, offer })=>{
        setremoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({audio: true,video: true});
        setStream(stream);
        console.log(`Incomming Call`, from, offer)
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', {to: from, ans })
    } , [socket]);

    const sendStreams = useCallback(() =>{
        for (const track of stream.getTracks()){
            peer.peer.addTrack(track , stream)
        }
    },[stream]);

    const handleCallAccepted = useCallback( async ({from, ans})=>{
        peer.setLocalDescription(ans);
        console.log('Call Accepted !');
        sendStreams();
    },[sendStreams]);

    const handleNegoneeded = useCallback(async () =>{
            const offer = await peer.getOffer();
            socket.emit('peer:nego:needed', { offer, to: remoteSocketId});
    },[remoteSocketId , socket ]);

    useEffect(() =>{
        peer.peer.addEventListener('negotiationneeded', handleNegoneeded);
        return () =>{
            peer.peer.removeEventListener('negotiationneeded', handleNegoneeded);
        }
    },[handleNegoneeded])

    useEffect(()=>{
        peer.peer.addEventListener('track', async ev => {
            const remoteStream = ev.streams;
            console.log('Got tracks')
            setremoteStream(remoteStream[0]);
        });
    })

    const handlenegoneedIncomming = useCallback(async ({from,offer}) => {
        const ans = await peer.getAnswer(offer);
        socket.emit('peer:nego:done' , {to: from , ans })
    } , [socket]); 

    const handlenegoneedfinal = useCallback(async ({ ans }) =>{
        await peer.setLocalDescription(ans);
    }, [])

    useEffect(() =>{
        socket.on("user:joined", HandleUserjoin);
        socket.on("incomming:call", handleincommingcall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on('peer:nego:needed', handlenegoneedIncomming);
        socket.on('peer:nego:final', handlenegoneedfinal);


        return() =>{
            socket.off("user:joined" , HandleUserjoin);
            socket.off("incomming:call" , handleincommingcall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off('peer:nego:needed', handlenegoneedIncomming);
            socket.off('peer:nego:final', handlenegoneedfinal);
            
        }
    }, [socket , HandleUserjoin , handleincommingcall , handleCallAccepted , handlenegoneedIncomming , handlenegoneedfinal])
    return(
        <div>
            <h1>Room section</h1>
            <h4>{remoteSocketId ? "Connected": "No one in room"}</h4>
            {
                stream && <button onClick={sendStreams}>Send Stream</button>
            }
           {
            remoteSocketId && <button onClick={handleCallUser}>CALL</button>
           }
           {
            stream && <ReactPlayer playing muted height="300px" width="500px" url={stream}/>
           }
           {
            remoteStream &&<> <h1>Remote Stream</h1> <ReactPlayer playing muted height="300px" width="500px" url={stream}/> </>
           }
        </div>
    )
};

export default Roompage;