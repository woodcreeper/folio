"""Original 120 BPM metal groove. No external packages, recordings, or samples.
Two independently picked power-chord guitars, bass and a restrained drum kit.
"""
from array import array
from pathlib import Path
import math
import random
import wave
RATE, SECONDS, BPM = 48000, 30, 120
N = RATE * SECONDS
mix = [array('f', [0]) * N for _ in range(2)]
rng = random.Random(806)

def guitar(start, midi, duration, gain=.19, muted=True, pan=.12):
    """Plucked-string delay lines into soft saturation and a cabinet low-pass."""
    offset = round(start * RATE)
    count = min(round(duration * RATE), N - offset)
    strings = []
    for pitch in (midi, midi + 7, midi + 12):
        freq = 440 * 2 ** ((pitch - 69 + rng.uniform(-.035, .035)) / 12)
        length = round(RATE / freq)
        line = [rng.uniform(-1, 1) for _ in range(length)]
        for _ in range(3):
            line = [(line[k] + line[(k + 1) % length]) * .5 for k in range(length)]
        strings.append((line, length))
    low, dc = 0., 0.
    left, right = math.sqrt(1-pan), math.sqrt(pan)
    cutoff = 1 - math.exp(-math.tau * 3100 / RATE)
    for i in range(count):
        t = i / RATE
        value = 0.
        for line, length in strings:
            k = i % length
            current = line[k]
            line[k] = .9985 * (.52 * current + .48 * line[(k+1) % length])
            value += current
        envelope = min(1, t/.006) * min(1, (duration-t)/.045)
        envelope *= math.exp(-t / (.105 if muted else 1.7))
        value = math.tanh(value * 12) * envelope
        low += cutoff * (value - low)
        dc += .009 * (low - dc)
        value = (low - dc) * gain
        mix[0][offset+i] += value * left
        mix[1][offset+i] += value * right

def bass(start, midi, duration, gain=.16):
    offset = round(start*RATE)
    freq = 440*2**((midi-69)/12)
    for i in range(min(round(duration*RATE), N-offset)):
        t = i/RATE
        env = min(1,t/.009)*min(1,(duration-t)/.05)*math.exp(-t/.6)
        phase = math.tau*freq*t
        value = (math.sin(phase)+.18*math.sin(phase*2)+.07*math.sin(phase*3))*env*gain
        for channel in mix:
            channel[offset+i] += value*.7071

def drum(start, kind, gain):
    duration = {'kick':.26,'snare':.22,'hat':.07,'crash':.8}[kind]
    offset = round(start*RATE)
    low, phase = 0., 0.
    for i in range(min(round(duration*RATE),N-offset)):
        t=i/RATE
        noise=rng.uniform(-1,1)
        low += .25*(noise-low)
        if kind=='kick':
            phase += math.tau*(48+100*math.exp(-t*55))/RATE
            value=math.sin(phase)*math.exp(-t*19)+.06*noise*math.exp(-t*160)
        elif kind=='snare':
            value=(.7*low+.18*math.sin(math.tau*185*t))*math.exp(-t*24)
        else:
            value=(noise-low)*math.exp(-t*(70 if kind=='hat' else 7))*.23
        value *= gain*min(1,t/.002)*min(1,(duration-t)/.015)
        mix[0][offset+i] += value*.7071
        mix[1][offset+i] += value*.7071

# E pedal, short D/C answers, then a resolved E5 ending. No piercing lead solo.
for bar in range(14):
    start=bar*2
    answer=[38,36,43,38][(bar//2)%4]
    riff=[(0,40,True),(.25,40,True),(.5,40,True),
          (1,40,True),(1.25,answer,False),(1.75,40,True)]
    if bar in (0,7,13):
        riff=[(0,40 if bar!=13 else 38,False),(1,36 if bar==13 else 43,False)]
    for beat,pitch,palm in riff:
        duration=.21 if palm else (.46 if len(riff)>2 else .92)
        guitar(start+beat,pitch,duration,muted=palm,pan=.08)
        guitar(start+beat+.009,pitch,duration,gain=.17,muted=palm,pan=.92)
        bass(start+beat,pitch-12,duration)
    for beat in (0, .75, 1, 1.75): drum(start+beat,'kick',.32)
    for beat in (.5,1.5): drum(start+beat,'snare',.42)
    for beat in range(8): drum(start+beat*.25,'hat',.09 if beat%2 else .12)
    if bar in (0,4,8,12): drum(start,'crash',.09)
guitar(28,40,2,gain=.2,muted=False,pan=.08)
guitar(28.01,40,1.99,gain=.18,muted=False,pan=.92)
bass(28,28,2,.16)
drum(28,'kick',.32)
drum(28,'crash',.12)
for channel in mix:
    for i in range(N):
        t=i/RATE
        fade_in=min(1,t/.045)
        fade_out=.5-.5*math.cos(math.pi*min(1,(SECONDS-t)/1.2))
        channel[i] = math.tanh(channel[i]*1.2)*fade_in*fade_out
peak=max(max(abs(v) for v in channel) for channel in mix)
rms=math.sqrt(sum(sum(v*v for v in channel) for channel in mix)/(2*N))
gain=min(10**(-19/20)/rms,10**(-3/20)/peak)
output=array('h')
for i in range(N):
    for channel in mix: output.append(round(channel[i]*gain*32767))
target=Path(__file__).resolve().parents[1]/'public/metal.wav'
with wave.open(str(target),'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes(output.tobytes())
print(f'Created {SECONDS}s original metal score at {BPM} BPM: {target}')
print(f'RMS {20*math.log10(rms*gain):.1f} dBFS; peak {20*math.log10(peak*gain):.1f} dBFS')
