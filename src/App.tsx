import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import './App.css';
import { GaussianBlurBackgroundProcessor, Pipeline } from '@twilio/video-processors';

const constraints: MediaStreamConstraints = {
  video: {
    width: 640,
    height: 480,
    frameRate: 24,
  },
};

const blur = new GaussianBlurBackgroundProcessor({
  assetsPath: 'https://local.evisit.com/resources/twilio/video-processors/1.0.0',
  pipeline: Pipeline.WebGL2,
  debounce: false,
});

function App() {
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [modelIsLoaded, setModelIsLoaded] = useState<boolean>(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const doBlur = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    blur.processFrame(video, canvas);
    videoRef.current?.requestVideoFrameCallback(() => doBlur(video, canvas));
  }

  const setBlurAmount = (event: ChangeEvent<HTMLInputElement>) => {
    blur.blurFilterRadius = Number(event.target.value);
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
        <input type="range" min="5" max="20" onInput={setBlurAmount} />
      </div>
      <video ref={videoRef} autoPlay></video>
      <canvas ref={canvasRef} width="640" height="480"></canvas>
    </div>
  );
}

export default App;
