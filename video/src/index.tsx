import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FolioFilm} from './FolioFilm';
import timeline from './timeline.json';

registerRoot(() => <Composition id="Folio" component={FolioFilm} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080}/>);
