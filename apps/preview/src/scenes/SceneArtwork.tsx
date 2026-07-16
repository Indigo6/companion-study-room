import { useEffect, useState } from 'react';
import { getSceneMedia, type SceneId } from './sceneMedia';

export function SceneArtwork({ scene, reduceMotion }: { scene: SceneId; reduceMotion: boolean }) {
  const media = getSceneMedia(scene);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [scene]);

  return <div className={`scene-art media-art art-${scene}`}>
    {reduceMotion || failed
      ? <img className="scene-media" src={media.posterUrl} alt={media.artworkLabel}/>
      : <video className="scene-media" src={media.videoUrl} poster={media.posterUrl} aria-label={media.artworkLabel} autoPlay muted loop playsInline preload="metadata" onError={() => setFailed(true)}/>} 
    <span className="scene-grade" aria-hidden="true"/>
  </div>;
}
