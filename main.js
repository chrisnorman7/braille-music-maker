/* globals hotkeys, MIDI */

let midiFail = false
let midiOn = false

window.onload = () => {
    MIDI.loadPlugin(
        {
            soundfontUrl: "midi.js/examples/soundfont/",
            onsuccess: () => midiOn = true,
            onerror: () => {
                midiFail = true
                alert("Failed to initialise MIDI. You will not be able to play back musical notes.")
            }
        }
    )
}

hotkeys.filter = () => true

const possibleNotes = ["a", "b", "c", "d", "e", "f", "g", null]
const midiNotes = {"c": 60, "d": 62, "e": 64, "f": 65, "g": 67, "a": 69, "b": 71}

const possibleLengths = [8, 4, 2, 1]

const lengthDescriptions = {
    8: "eighth note", 4: "quarter note", 2: "half note", 1: "whole note"
}

const status = document.getElementById("status")
status.innerText = "Braille Music Maker"

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
}

let part = Part()
updatePart()

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
}

function addNote(note) {
    part.notes.push(note)
    updateLength()
}

addNote(new Note("c", 4))
updatePosition()

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
            let midiNote = midiNotes[note.note]
            MIDI.noteOn(0, midiNote, 127, 0)
            MIDI.noteOff(0, midiNote, 1)
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

hotkeys("left, right", (e, handler) => {
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
})

hotkeys("home, end", (event, handler) => {
    if (handler.key == "home") {
        position = 0
        speak("Beginning of piece.")
    } else {
        position = part.notes.length
        speak("End of piece.")
    }
})

hotkeys("up, down", (e, handler) => {
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
})

hotkeys("p", () => {
    let name = prompt("Enter the name for your new part:", "Untitled Part")
    if (name) {
        part = Part()
        part.name = name
        updatePart()
    }
})

hotkeys("shift+p", () => {
    let name = prompt(`Enter a new name for the ${part.name} part`, part.name)
    if (name) {
        part.name = name
        updatePart()
    }
})

hotkeys("r, a, b, c, d, e, f, g", (e, handler) => {
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
})

hotkeys("1, 2, 4, 8, 0", (e, handler) => {
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
    }
})

hotkeys("space", () => {
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
})
