"""Original, deterministic soft-keyboard score. No samples or licensed music."""
from array import array
from pathlib import Path
import math
import wave

rate, seconds = 48000, 40
channels = [array('f', [0]) * (rate * seconds) for _ in range(2)]

def note(start, midi, duration=3.8, gain=.05, pan=.5):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    offset = int(start * rate)
    total = min(int(duration * rate), rate * seconds - offset)
    left, right = math.sqrt(1 - pan), math.sqrt(pan)
    for j in range(total):
        t = j / rate
        attack = min(1, t / .012)
        release = min(1, (duration - t) / .45)
        envelope = attack * release * math.exp(-t / 1.35)
        phase = math.tau * frequency * t
        value = (math.sin(phase) + .24 * math.sin(phase * 2.002) * math.exp(-t * 2) + .08 * math.sin(phase * 3.001)) * envelope * gain
        channels[0][offset + j] += value * left
        channels[1][offset + j] += value * right

# Open voicings, a slow pulse, and a final suspended-to-major resolution.
chords = [[48,55,62,64], [45,52,59,60], [41,48,55,57], [43,50,57,59], [48,55,62,64], [45,52,59,64], [41,48,55,60], [43,50,55,59], [48,55,60,64], [48,55,62,67]]
for bar, chord in enumerate(chords):
    for beat, index in enumerate([0,2,1,3]):
        note(bar * 4 + beat * .78, chord[index] + (12 if index > 0 else 0), gain=.052 if index else .065, pan=.35 + index * .1)
    if bar in [1,3,5,7]:
        note(bar * 4 + 3.2, chord[2] + 24, duration=2.3, gain=.018, pan=.6)

# Sparse stereo echoes act as room ambience.
for channel in channels:
    for delay, feedback in [(int(.217 * rate), .15), (int(.413 * rate), .10)]:
        for i in range(delay, len(channel)):
            channel[i] += channel[i - delay] * feedback

output = array('h')
for i in range(rate * seconds):
    t = i / rate
    fade = min(1, t / .6, max(0, (seconds - t) / 1.8))
    for channel in channels:
        output.append(round(math.tanh(channel[i] * 2.0) * fade * 32767))

target = Path(__file__).resolve().parents[1] / 'public/ambient.wav'
with wave.open(str(target), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(rate)
    wav.writeframes(output.tobytes())
print(f'Created original {seconds}s stereo score: {target}')
