/* globals hotkeys, MIDI, Cookies */

const midiNoteLength = 0.2
const midiTimerIds = []
let midiFail = false
let midiOn = false

window.onload = () => {
    MIDI.loadPlugin(
        {
            soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
            onsuccess: () => midiOn = true,
            onerror: () => {
                midiFail = true
                alert("Failed to initialise MIDI. You will not be able to play back musical notes.")
            }
        }
    )
    hotkeys.filter = () => document.activeElement !== braille
    let data = Cookies.get("piece")
    if (data) {
        parts.length = 0
        data = JSON.parse(data)
        for (let partDump of data) {
            part = Part()
            part.name = partDump.name
            for (let noteDump of partDump.notes) {
                addNote(new Note(noteDump.note, noteDump.length, noteDump.dotted))
            }
        }
    } else {
        part = Part()
        updatePart()
        addNote(new Note("c", 4))
        updatePosition()
    }
}

let part = null
const possibleNotes = ["a", "b", "c", "d", "e", "f", "g", null]
const possibleLengths = [8, 4, 2, 1]

const lengthDescriptions = {
    8: "eighth note", 4: "quarter note", 2: "half note", 1: "whole note"
}

const midiNotes = {"c": 60, "d": 62, "e": 64, "f": 65, "g": 67, "a": 69, "b": 71}

const brailleNotes = {
    null: {8: "x", 4: "v", 2: "u", 1: "m"},
    "c": {8: "d", 4: "?", 2: "n", 1: "y"},
    "d": {8: "e", 4: ":", 2: "o", 1: "z"},
    "e": {8: "f", 4: "$", 2: "p", 1: "&"},
    "f": {8: "g", 4: "]", 2: "q", 1: "="},
    "g": {8: "h", 4: "|", 2: "r", 1: "("},
    "a": {8: "i", 4: "[", 2: "s", 1: "!"},
    "b": {8: "j", 4: "w", 2: "t", 1: ")"},
}

const braille = document.getElementById("braille")
const status = document.getElementById("status")
status.innerText = "Braille Music Maker"

document.getElementById("copy").onclick = () => {
    braille.select()
    if (document.execCommand("copy")) {
        speak("Braille copied.")
    } else {
        speak("Failed to copy braille.")
    }
}

let position = 0

function Part() {
    let p = {name: "Untitled part", notes: []}
    parts.push(p)
    return p
}

const parts = []

function updatePart() {
    // Show the current part.
    document.getElementById("part").innerText = part.name
    position = 0
    updatePosition()
    updateLength()
    speak(part.name)
    updateBraille()
}

class Note {

    constructor(note, length, dotted) {
        if (!possibleNotes.includes(note)) {
            throw Error(`Invalid note: ${note}.`)
        } else if (!possibleLengths.includes(length)) {
            throw Error(`Invalid length: ${length}.`)
        } else {
            this.note = note
            this.length = length
            this.dotted = !!dotted
        }
    }

    toString() {
        let friendlyNote = null
        if (this.note === null) {
            friendlyNote = "rest"
        } else {
            friendlyNote = this.note
        }
        let dotted = ""
        if (this.dotted) {
            dotted = "dotted "
        }
        return `${friendlyNote} ${dotted}${lengthDescriptions[this.length]}`
    }

    toBraille() {
        return `${brailleNotes[this.note][this.length]}${this.dotted ? "'" : ""}`
    }

    getLength() {
        let length = this.length
        if (length == 1) {
            length = 16
        } else if (length == 2) {
            length = 8
        } else if (length == 4) {
            length = 4
        } else {
            length = 2
        }
        if (this.dotted) {
            length += (length / 2)
        }
        return length
    }

    getMidiNote() {
        return midiNotes[this.note]
    }
}

function addNote(note) {
    part.notes.push(note)
    updateLength()
    updateBraille()
}

function speak(text) {
    document.getElementById("output").innerText = text
}

function convertLength(length) {
    let bars = parseInt(length / 16)
    let remainder = length % 16
    let beats = parseInt(remainder / 4)
    remainder %= 4
    return {bars: bars, beats: beats, sixteenths: remainder}
}

function updatePosition() {
    // Position has been set. Now speak the note at the new position.
    let note = part.notes[position]
    if (note) {
        speak(note.toString())
        if (midiOn) {
            let midiNote = note.getMidiNote()
            MIDI.noteOn(0, midiNote, 127, 0)
            MIDI.noteOff(0, midiNote, midiNoteLength * note.getLength())
        }
    } else {
        speak("Blank.")
    }
    let beats = 0
    for (let i = 0; i < position; i++) {
        let note = part.notes[i]
        beats += note.getLength()
    }
    if (beats) {
        beats += 1
    }
    let length = convertLength(beats)
    document.getElementById("position").innerText = `Bar ${length.bars}, beat ${length.beats}, position ${length.sixteenths}.`
}

function updateLength() {
    let length = 0
    for (let note of part.notes) {
        length += note.getLength()
    }
    length = convertLength(length)
    document.getElementById("length").innerText = `Bars: ${length.bars}, beats: ${length.beats}, 16ths: ${length.sixteenths}.`
}

function updateCooky() {
    Cookies.set("piece", JSON.stringify(parts), {days: 30})
}

function updateBraille() {
    let text = ""
    let bars = 0
    let position = 0
    for (let note of part.notes) {
        text += note.toBraille()
        position += note.getLength()
        if (!(position % 16)) {
            bars += 1
            if (bars == 4) {
                bars = 1
                text += "\n"
            } else {
                text += " "
            }
        }
    }
    braille.value = text.trim()
    updateCooky()
}

function hotkey(key, func, description) {
    let dt = document.createElement("dt")
    dt.innerText = key
    let dd = document.createElement("dd")
    dd.innerText = description
    for (let element of [dt, dd]) {
        document.getElementById("hotkeys").appendChild(element)
    }
    hotkeys(key, func)
}

hotkey("left, right", (e, handler) => {
    if (handler.key == "left") {
        if (position) {
            --position
            updatePosition()
        } else {
            speak("Beginning of piece.")
        }
    } else {
        if (position == part.notes.length) {
            speak("End of piece.")
        } else {
            ++position
            updatePosition()
        }
    }
}, "Move through the list of notes.")

hotkey("home, end", (event, handler) => {
    if (handler.key == "home") {
        position = 0
        speak("Beginning of piece.")
    } else {
        position = part.notes.length
        speak("End of piece.")
    }
}, "Move to the start or end of the list of notes.")

hotkey("up, down", (e, handler) => {
    let index = parts.indexOf(part)
    if (handler.key == "up") {
        if (index) {
            part = parts[index - 1]
            updatePart()
        } else {
            speak("No previous part.")
        }
    } else {
        if (index == (parts.length - 1)) {
            speak("No next part.")
        } else {
            part = parts[index + 1]
            updatePart()
        }
    }
}, "Move through parts.")

hotkey("p", () => {
    let name = prompt("Enter the name for your new part:", "Untitled Part")
    if (name) {
        part = Part()
        part.name = name
        updatePart()
    }
}, "Create a new part.")

hotkey("shift+p", () => {
    let name = prompt(`Enter a new name for the ${part.name} part`, part.name)
    if (name) {
        part.name = name
        updatePart()
    }
}, "Rename the current part.")

hotkey("r, a, b, c, d, e, f, g", (e, handler) => {
    let key = handler.key
    if (key == "r") {
        key = null
    }
    let note = part.notes[position]
    if (note) {
        note.note = key
    } else {
        addNote(new Note(key, 4))
    }
    updatePosition()
    updateBraille()
}, "Set the current note. Set a rest with the r key.")

hotkey("1, 2, 4, 8, 0", (e, handler) => {
    let note = part.notes[position]
    if (!note) {
        speak("No note at this position.")
    } else {
        let length = parseInt(handler.key)
        if (!length) {
            note.dotted = !note.dotted
        } else {
            note.length = length
        }
        updatePosition()
        updateLength()
        updateBraille()
    }
}, "Set the duration of the current note. To set whether or not the note should be dotted, press 0.")

hotkey("space", () => {
    if (midiFail) {
        speak("MIDI will not work on this system.")
        midiOn = false
    } else {
        midiOn = !midiOn
        if (!midiOn) {
            for (let i = 1; i < 300; i++) {
                MIDI.noteOff(0, i)
            }
        }
        speak(`Midi ${midiOn ? "on" : "off"}.`)
    }
}, "Enable or disable MIDI.")

function playPart(p, start) {
    if (start === undefined) {
        start = position
    }
    let delay = 0
    for (let i = start; i < p.notes.length; i++) {
        let note = p.notes[i]
        if (note.note) {
            midiTimerIds.push(setTimeout(() => {
                let midiNote = note.getMidiNote()
                MIDI.noteOn(0, midiNote, 127)
                MIDI.noteOff(0, midiNote, note.getLength() * midiNoteLength)
            }, delay))
        }
        delay += (note.getLength() * midiNoteLength * 1000)
    }
}

function stopMidi() {
    while (midiTimerIds.length) {
        clearInterval(midiTimerIds.pop())
    }
}

hotkey("shift+return, return", (e, handler) => {
    if (!midiOn) {
        return speak("MIDI is disabled on this system.")
    }
    stopMidi()
    if (handler.key == "shift+return") {
        return
    }
    playPart(part)
}, "With return, start playing the current part from your current position. Add shift to stop the currently-playing part.")

hotkey("control+return", () => {
    if (!midiOn) {
        return speak("MIDI is disabled on this system.")
    }
    stopMidi()
    speak("Playing parts.")
    for (let p of parts) {
        playPart(p)
    }
}, "Play all parts at the same time from the current position.")
