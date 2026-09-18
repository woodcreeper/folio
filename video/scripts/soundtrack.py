"""Original warm keyboard groove: soft attacks, open triads, restrained drums.

Standard-library-only synthesis; deterministic and free of external samples.
120 BPM keeps the video timing, while the arrangement moves at half-time.
"""
from array import array
from pathlib import Path
import math
import random
import wave

RATE, SECONDS, BPM = 48000, 42, 120
LENGTH = RATE * SECONDS
BEAT = 60 / BPM
rng = random.Random(42)
keys = [array('f', [0]) * LENGTH for _ in range(2)]
rhythm = [array('f', [0]) * LENGTH for _ in range(2)]


def add_note(start, midi, duration, gain, pan=.5, bass=False):
    """Mellow, softly struck keys; no bright FM or detuned harmonics."""
    frequency = 440 * 2 ** ((midi - 69) / 12)
    offset = round(start * RATE)
    total = min(round(duration * RATE), LENGTH - offset)
    attack = .035 if bass else .028
    decay = .48 if bass else 1.05
    release = .14 if bass else .42
    left, right = math.sqrt(1 - pan), math.sqrt(pan)
    track = rhythm if bass else keys
    for j in range(total):
        t = j / RATE
        # Cosine onset/release prevent the hard clicks of short linear gates.
        onset = .5 - .5 * math.cos(math.pi * min(1, t / attack))
        tail = .5 - .5 * math.cos(math.pi * min(1, (duration - t) / release))
        envelope = onset * tail * math.exp(-t / decay)
        phase = math.tau * frequency * t
        if bass:
            value = math.sin(phase) + .1 * math.sin(phase * 2)
        else:
            value = math.sin(phase) + .15 * math.sin(phase * 2) * math.exp(-t * 2) + .035 * math.sin(phase * 3) * math.exp(-t * 3)
        value *= gain * envelope
        track[0][offset + j] += value * left
        track[1][offset + j] += value * right


def soft_drum(start, brush=False, gain=.025):
    """Soft low thump or low-passed brush: no clap, rimshot, or bright hats."""
    duration = .24 if brush else .32
    offset = round(start * RATE)
    total = min(round(duration * RATE), LENGTH - offset)
    low = 0.
    phase = 0.
    coefficient = 1 - math.exp(-math.tau * 1250 / RATE)
    for j in range(total):
        t = j / RATE
        onset = .5 - .5 * math.cos(math.pi * min(1, t / .018))
        release = min(1, (duration - t) / .06)
        if brush:
            low += coefficient * (rng.uniform(-1, 1) - low)
            value = low * math.exp(-t / .055)
        else:
            phase += math.tau * (54 + 13 * math.exp(-t * 18)) / RATE
            value = math.sin(phase) * math.exp(-t / .085)
        value *= gain * onset * release
        rhythm[0][offset + j] += value * .7071
        rhythm[1][offset + j] += value * .7071


# Long phrases and consonant voicings. Every chord lasts two bars (four seconds).
# Keep root notes, inner voices, and melody on the same harmony at each change.
harmonies = [
    (48, [55, 60, 64, 67], [72, 76, 74]),  # C
    (45, [57, 60, 64, 69], [72, 76, 72]),  # Am
    (41, [53, 60, 65, 69], [72, 69, 72]),  # F
    (43, [55, 59, 62, 67], [71, 74, 71]),  # G
]
for phrase in range(9):
    start = phrase * 4
    root, chord, melody = harmonies[phrase % 4]
    # A gentle broken chord, then a quiet answer. Space between gestures.
    for beat_index, index in enumerate([0, 2, 1, 3]):
        add_note(start + .05 + beat_index * BEAT, chord[index], 2.1,
                 .048 if beat_index == 0 else .037, .42 + index * .05)
    for index, midi in enumerate(chord[1:]):
        add_note(start + 2.52 + index * .032, midi, 1.32, .026, .44 + index * .06)
    # Rounded bass keeps a steady pulse without the previous sub-bass jumps.
    for pulse, velocity in [(0, .063), (2, .05), (4, .06), (6, .045)]:
        add_note(start + pulse * BEAT, root, .9, velocity, bass=True)
    # Enter percussion gradually; keep the backbeat soft and in half-time.
    if phrase >= 1:
        level = min(1, (phrase + 1) / 4)
        for pulse in [0, 4]:
            soft_drum(start + pulse * BEAT, gain=.06 * level)
        for pulse in [2, 6]:
            soft_drum(start + pulse * BEAT, brush=True, gain=.028 * level)
    # A sparse lower-register answer, only in alternating phrases.
    if phrase in [2, 4, 6]:
        for time, midi in zip([.8, 1.8, 2.8], melody):
            add_note(start + time, midi, 1.15, .015, .53)

# At the end card, gently resolve F -> G -> C with no percussive punctuation.
for start, root, chord in [(36, 41, [53, 60, 65, 69]),
                           (38, 43, [55, 59, 62, 67]),
                           (40, 48, [55, 60, 64, 67])]:
    add_note(start, root, 1.8, .047, bass=True)
    for index, midi in enumerate(chord):
        add_note(start + .035 * index, midi, min(2.4, SECONDS - start - .035 * index),
                 .027, .4 + index * .065)

# Subtle non-recursive early reflections on keys only; no rhythmic echo clutter.
reflections = [(0.053, .12), (.097, .085), (.149, .065), (.211, .045)]
mix = [array('f', [0]) * LENGTH for _ in range(2)]
for channel in range(2):
    source = keys[channel]
    for i in range(LENGTH):
        mix[channel][i] = source[i] + rhythm[channel][i]
    for delay, gain in reflections:
        offset = round((delay + channel * .006) * RATE)
        for i in range(offset, LENGTH):
            mix[channel][i] += source[i - offset] * gain

# Smooth the mix and master gently. Preserve transients, without a peak boost.
coefficient = 1 - math.exp(-math.tau * 3600 / RATE)
for channel in mix:
    low = 0.
    for i in range(LENGTH):
        low += coefficient * (channel[i] - low)
        t = i / RATE
        fade_in = .5 - .5 * math.cos(math.pi * min(1, t / .7))
        fade_out = .5 - .5 * math.cos(math.pi * min(1, (SECONDS - t) / 1.7))
        channel[i] = low * fade_in * fade_out
peak = max(max(abs(v) for v in channel) for channel in mix)
rms = math.sqrt(sum(sum(v * v for v in channel) for channel in mix) / (2 * LENGTH))
# Target -24 dBFS RMS and no peak above -7 dBFS before the film's 0.9 gain.
gain = min(10 ** (-24 / 20) / rms, 10 ** (-7 / 20) / peak)
output = array('h')
for i in range(LENGTH):
    for channel in mix:
        output.append(round(channel[i] * gain * 32767))
target = Path(__file__).resolve().parents[1] / 'public/ambient.wav'
with wave.open(str(target), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes(output.tobytes())
print(f'Created {SECONDS}s original warm score at {BPM} BPM: {target}')
print(f'RMS {20 * math.log10(rms * gain):.1f} dBFS; peak {20 * math.log10(peak * gain):.1f} dBFS')
