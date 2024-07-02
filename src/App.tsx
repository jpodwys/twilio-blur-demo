import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import './App.css';
import { GaussianBlurBackgroundProcessor, Pipeline } from '@twilio/video-processors';

const WIDTH = 640;
const HEIGHT = 480;

const constraints: MediaStreamConstraints = {
  video: {
    width: WIDTH,
    height: HEIGHT,
    frameRate: 24,
  },
};

const blur = new GaussianBlurBackgroundProcessor({
  assetsPath: 'https://local.evisit.com/resources/twilio/video-processors/1.0.0',
  pipeline: Pipeline.WebGL2,
  blurFilterRadius: 5,
  debounce: false,
});

function App() {
  const [blurRadius, setBlurRadius] = useState<number>(5);
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [modelIsLoaded, setModelIsLoaded] = useState<boolean>(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const doBlur = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    blur.processFrame(video, canvas);
    videoRef.current?.requestVideoFrameCallback(() => doBlur(video, canvas));
  };

  const setBlurAmount = (event: ChangeEvent<HTMLInputElement>) => {
    const radius = Number(event.target.value);
    setBlurRadius(radius)
    blur.blurFilterRadius = radius;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', () => {
        setVideoIsPlaying(true);
      });
    }
  }, [videoRef, setVideoIsPlaying]);

  useEffect(() => {
    blur.loadModel().then(() => {
      setModelIsLoaded(true);
    });
  }, [setModelIsLoaded]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia(constraints).then(setStream);
  }, [setStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (stream && video) {
      video.srcObject = stream;
    }
  }, [stream, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (modelIsLoaded && stream && video && canvas && videoIsPlaying) {
      doBlur(video, canvas);
    }
  }, [modelIsLoaded, stream, videoRef, canvasRef, videoIsPlaying]);

  return (
    <div className="App">
      <div>
        <input type="range" min="1" max="10" value={blurRadius} onInput={setBlurAmount} />
      </div>
      <video ref={videoRef} autoPlay></video>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT}></canvas>
    </div>
  );
}

export default App;
