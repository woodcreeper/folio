import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FolioFilm} from './FolioFilm';

registerRoot(() => <Composition id="Folio" component={FolioFilm} durationInFrames={1200} fps={30} width={1920} height={1080}/>);
