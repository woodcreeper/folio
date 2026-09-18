"""Original 120 BPM keys/bass/percussion groove. Deterministic; no samples."""
from array import array
from pathlib import Path
import math
import random
import wave

rate, seconds, bpm = 48000, 42, 120
beat = 60 / bpm
channels = [array('f', [0]) * (rate * seconds) for _ in range(2)]
rng = random.Random(42)

def tone(start, midi, duration=.65, gain=.08, pan=.5, kind='keys'):
    freq = 440 * 2 ** ((midi - 69) / 12)
    offset = round(start * rate)
    count = min(round(duration * rate), rate * seconds - offset)
    left, right = math.sqrt(1-pan), math.sqrt(pan)
    decay = .26 if kind == 'keys' else .18 if kind == 'bass' else .48
    for j in range(count):
        t = j / rate
        phase = math.tau * freq * t
        env = min(1,t/.006) * min(1,(duration-t)/.07) * math.exp(-t/decay)
        if kind == 'bass':
            value = math.sin(phase) + .23 * math.sin(phase*2) + .08 * math.sin(phase*3)
        elif kind == 'bell':
            value = math.sin(phase + 1.1*math.sin(phase*2)*math.exp(-t*9)) + .08*math.sin(phase*3)
        else:
            value = math.sin(phase) + .28*math.sin(phase*2.001) + .14*math.sin(phase*3.002) + .04*math.sin(phase*5)
        value *= env * gain
        channels[0][offset+j] += value*left
        channels[1][offset+j] += value*right

def drum(start, kind, gain=.07, pan=.5):
    duration={'kick':.3,'clap':.13,'hat':.065,'tick':.1}[kind]
    offset=round(start*rate)
    last=0
    phase=0
    for j in range(min(round(duration*rate),rate*seconds-offset)):
        t=j/rate
        noise=rng.uniform(-1,1)
        high=noise-last; last=noise
        if kind=='kick':
            phase += math.tau*(49+100*math.exp(-t*55))/rate
            value=math.sin(phase)*math.exp(-t*17)+high*.1*math.exp(-t*200)
        elif kind=='clap':
            env=sum(math.exp(-(t-d)*65) if t>=d else 0 for d in [0,.01,.022])
            value=high*.23*env+math.sin(math.tau*190*t)*.15*math.exp(-t*40)
        elif kind=='tick':
            value=math.sin(math.tau*1350*t)*math.exp(-t*65)*.5
        else:
            value=high*.3*math.exp(-t*75)
        env=min(1,t/.001)*min(1,(duration-t)/.008)
        channels[0][offset+j]+=value*env*gain*math.sqrt(1-pan)
        channels[1][offset+j]+=value*env*gain*math.sqrt(pan)

chords=[(48,[60,64,67,71]),(45,[60,64,67,69]),(41,[60,64,65,69]),(43,[59,62,67,69])]
melodies=[[76,79,81,79],[76,72,76,79],[77,76,72,69],[74,79,76,74]]
for bar in range(20):
    start=bar*4*beat
    root,chord=chords[bar%4]
    # Syncopated, open keyboard voicings.
    for pulse,vel in [(0,.047),(1.5,.039),(2.75,.042)]:
        for n,midi in enumerate(chord):
            tone(start+pulse*beat+n*.012,midi,gain=vel,pan=.25+n*.15)
    for pulse,midi in [(0,root-12),(1.5,root),(2,root-12),(3.5,root-5)]:
        tone(start+pulse*beat,midi,duration=.38,gain=.13,kind='bass')
    for pulse in [0,2]: drum(start+pulse*beat,'kick',.23)
    for pulse in [1,3]: drum(start+pulse*beat,'clap',.085)
    for pulse in range(8):
        swing=.016 if pulse%2 else 0
        drum(start+pulse*beat/2+swing,'hat',.04 if pulse%2 else .026,pan=.65)
    if bar>=2:
        for pulse,midi in zip([.5,1.25,2.5,3.25],melodies[bar%4]):
            tone(start+pulse*beat,midi,duration=.85,gain=.047 if bar%2 else .036,pan=.58,kind='bell')
    if bar in [3,7,11,15,17]:
        drum(start+3.75*beat,'tick',.048,.25)
# One final major-nine chord, giving the end card a clean musical landing.
for n,midi in enumerate([48,60,64,67,74]):
    tone(40+n*.015,midi,duration=2,gain=.075,pan=.28+n*.1,kind='bell')
drum(40,'kick',.18)
# Short, sparse room reflections; bass/kick remain centered.
for channel in channels:
    for delay,gain in [(round(.1875*rate),.095),(round(.375*rate),.045)]:
        for i in range(delay,len(channel)):
            channel[i]+=channel[i-delay]*gain
peak=max(max(abs(x) for x in channel) for channel in channels)
normalization=.75/peak
output=array('h')
for i in range(rate*seconds):
    t=i/rate
    fade=min(1,t/.09,max(0,(seconds-t)/.7))
    for channel in channels:
        output.append(round(channel[i]*normalization*fade*32767))
target=Path(__file__).resolve().parents[1]/'public/ambient.wav'
with wave.open(str(target),'wb') as wav:
    wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(rate)
    wav.writeframes(output.tobytes())
print(f'Created original {seconds}s stereo score at {bpm} BPM: {target}')
