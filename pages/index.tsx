import * as React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { ARCanvas, DefaultXRControllers, VRCanvas } from '@react-three/xr';
import useStore from '../helpers/store';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import {
  Environment,
  Html,
  useProgress,
  Loader,
  Stats,
} from '@react-three/drei';
// import CustomLoader from './components/CustomLoader'
import { Canvas } from '@react-three/fiber';
import SkyBox from '../webgl/SkyBox';
import { Physics } from '@react-three/cannon';
import Room from '../webgl/Room';
import PlayerDesktop from '../webgl/PlayerDesktop';
import AvatarPlayer from '../webgl/AvatarPlayerGLB';
import OtherPlayer from "../webgl/OtherPlayer";
import OtherDesktop from "../webgl/OtherDesktop"
import PlayerIntroduce from './components/PlayerIntroduce';
import Collisions from '../webgl/Collisions';
import { DirectionalLight } from 'three';
import Ball from '../webgl/Ball';
import PositionPointer from '../webgl/PositionPointer';
import Cube from '../webgl/cube';
import Navigation from '../webgl/Navigation';
import { io } from 'socket.io-client'

export function DropDown(props: any) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event: any) => {
    const { myValue } = event.currentTarget.dataset;
    console.log(myValue);
    if (myValue === undefined) {
      location.reload();
      return;
    }
    const scene = myValue;
    localStorage.setItem('model', scene);
    location.reload();
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        style={{
          position: 'absolute',
          top: '0',
          zIndex: '12122',
          color: 'black',
          border: '1px solid black',
          margin: '10px',
          right: '0',
        }}
      >
        Dashboard
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleClose} data-my-value={'office'}>
          Office
        </MenuItem>
        <MenuItem onClick={handleClose} data-my-value={'city'}>
          City
        </MenuItem>
        <MenuItem onClick={handleClose} data-my-value={'cabin'}>
          Plane Chamber
        </MenuItem>
        <MenuItem onClick={handleClose} data-my-value={'airport'}>
          Airport
        </MenuItem>
      </Menu>
    </div>
  );
}

const Loading = (props: any) => {
  const [show, setShow] = useState('block');

  useEffect(() => {
    setTimeout(() => setShow('none'), 3000);
  }, []);

  return (
    <div className="loader" style={{ display: show }}>
      <div className="loader_spinner">
        <div className="loader_ring1" />
        <div className="loader_ring2" />
        <div className="loader_ring3" />
      </div>
      <div className="loader_text">{/* {Math.floor(props.progress)}% */}</div>
    </div>
  );
};

const Home = () => {
  const uiStep: number = useStore((s) => s.uiStep);
  const camera = {
    fov: 150,
    near: 0.1,
    far: 1000,
    position: [0, 0, 0],
  };
  const [socketClient, setSocketClient] = useState(null)
  const [clients, setClients] = useState({})

  const [firstFlag, setFirstFlag] = useState(true);
  const [otherFlag, setOtherFlag] = useState(true);
  useEffect(() => {
      // On mount initialize the socket connection
      setSocketClient(io())

      // Dispose gracefuly
      return () => {
        console.log("socketClient", socketClient)
          if (socketClient) socketClient.disconnect()
      }
  }, [])

  useEffect(() => {
      if (socketClient) {
          console.log("socketClient", socketClient)
          socketClient.on('move', (clients) => {
              console.log("clients", clients);
              setClients(clients)
          })
          socketClient.on('mouseDown', (clients) => {
            {Object.keys(clients)
              .filter((clientKey) => clientKey !== socketClient.id)
              .map((client)=>{
                const {mouseDown, distance} = clients[client]
                if ( mouseDown !== undefined) {
                  useStore.setState({
                    otherPointer: mouseDown,
                    otherDistance: distance
                  })
                }
                
              })}
          })
          
      }
  }, [socketClient])
  return (
    socketClient&&(
      <main
        className="w-screen h-screen"
        style={{
          backgroundColor: '#5ea8f1',
        }}
      >

        <div id="canvas-container" className="w-screen h-screen">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ fov: 75, position: [0, 40, 0] }}
          >
            <Stats />
            {/* sunset, dawn, night, warehouse, forest, apartment, studio, city, park, lobby */}
            <Environment near={1} far={100} resolution={2048} preset="night" />
            <directionalLight
              // ref={setLight}
              color={0xeeeeee}
              // layers={1}
              position={[10, 30, 15]}
              intensity={1}
              shadow-bias={-0.0005}
              shadow-mapSize={[4096, 4096]}
              shadow-camera-left={-150}
              shadow-camera-right={150}
              shadow-camera-top={150}
              shadow-camera-bottom={-150}
              castShadow
            />
            <Physics gravity={[0, -500, 0]}>
              <Collisions />
              <Room visible={true} position={[0, 0, 0]} socket={socketClient}/>

              <PositionPointer/>
              {/* <PlayerDesktop  position={[1,1,1]} socket={socketClient}/>
              
              <AvatarPlayer scale={[1, 1, 1]} visible={true}/> */}
              {Object.keys(clients)
              .filter((clientKey) => clientKey === socketClient.id)
              .map((client)=>{
                const { position } = clients[client];
                console.log("player", position)
                if (firstFlag){
                  useStore.setState({
                    playerPosition: position,
                    pointer: position
                  })
                  setFirstFlag(false)
                  // return(
                  //   <PlayerDesktop position={position}/>
                  // )
                }
                
                // else{
                //   return(
                //     <PlayerDesktop/>
                //   )
                // }
                return(
                  <PlayerDesktop/>
                )
              })}
              <Ball />
              {Object.keys(clients)
              .filter((clientKey) => clientKey === socketClient.id)
              .map((client)=>{
                return(
                  <AvatarPlayer scale={[1, 1, 1]} visible={true} socket={socketClient} />
                  // <OtherPlayer scale={[1, 1, 1]} visible={true} />
                )
              })}
              {Object.keys(clients)
              .filter((clientKey) => clientKey !== socketClient.id)
              .map((client)=>{
                const { position } = clients[client];
                if (otherFlag){
                  useStore.setState({
                    otherPosition: position,
                    otherPointer: position
                  })
                  setOtherFlag(false);
                  // return(
                  //   <OtherDesktop position={position}/>
                  // )
                }
                // else{
                //   return(
                //     <OtherDesktop/>
                //   )
                // }
                return(
                      <OtherDesktop/>
                    )
              })}
              {Object.keys(clients)
              .filter((clientKey) => clientKey !== socketClient.id)
              .map((client)=>{
                return(
                  <OtherPlayer scale={[1, 1, 1]} visible={true} />
                )
              })}
            </Physics>
            <SkyBox visible={true} />
          </Canvas>
        </div>

        <div
          className="dom-elements absolute top-0 left-0 w-screen h-screen overflow-hidden z-10 pointer-events-none"
          style={{ display: uiStep < 4 ? 'block' : 'none' }}
        >
          <PlayerIntroduce />
        </div>
        <Loading />
        <DropDown />
      </main>
    )
    
  );
};

export default Home;
