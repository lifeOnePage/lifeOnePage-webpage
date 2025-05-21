import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * @param {string[]} videoSources
 * @returns {[textures: THREE.VideoTexture[], videos: HTMLVideoElement[]]}
 */
function useVideoTexture(videoSources) {
  const [textures, setTextures] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const loadedTextures = [];
    const loadedVideos = [];

    videoSources.forEach((src, i) => {
      const video = document.createElement("video");
      video.src = src;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true; // 시작할 땐 무조건 mute
      video.volume = 0;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.autoplay = true;

      video.play().catch((e) => {
        console.warn(`📽️ [${i}] 비디오 자동 재생 실패:`, e);
      });

      const tex = new THREE.VideoTexture(video);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.format = THREE.RGBAFormat;
      tex.generateMipmaps = false;
      tex.encoding = THREE.sRGBEncoding;

      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.offset.set(0, 0);
      tex.repeat.set(1, 1);
      tex.center.set(0.5, 0.5);

      loadedTextures.push(tex);
      loadedVideos.push(video);
    });

    setTextures(loadedTextures);
    setVideos(loadedVideos);
  }, [videoSources]);

  return [textures, videos];
}

export default useVideoTexture;
