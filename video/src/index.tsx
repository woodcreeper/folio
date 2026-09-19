import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {SlayDownFilm} from './SlayDownFilm';
import timeline from './timeline.json';

registerRoot(() => <Composition id="SlayDown" component={SlayDownFilm} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080}/>);
