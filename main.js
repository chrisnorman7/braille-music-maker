/* globals hotkeys */

const possibleNotes = ["a", "b", "c", "d", "e", "f", "g", null]
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
    speak(part.name)
}

let part = Part()
updatePart()

function Note(note, length) {
    if (!possibleNotes.includes(note)) {
        throw Error(`Invalid note: ${note}.`)
    } else if (!possibleLengths.includes(length)) {
        throw Error(`Invalid length: ${length}.`)
    } else {
        return {
            note: note, length: length, dotted: false,
            toString: function() {
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
        }
    }
}

function addNote(note) {
    part.notes.push(note)
}

addNote(Note("c", 4))

function speak(text) {
    document.getElementById("output").innerText = text
}

function updatePosition() {
    // Position has been set. Now speak the note at the new position.
    let note = part.notes[position]
    if (note) {
        speak(note.toString())
    } else {
        speak("Blank.")
    }
    let beats = 0
    for (let i = 0; i < position; i++) {
        let note = part.notes[i]
        let length = note.length
        if (length == 1) {
            length = 16
        } else if (length == 2) {
            length = 8
        } else if (length == 4) {
            length = 4
        } else {
            length = 2
        }
        if (note.dotted) {
            length += (length / 2)
        }
        beats += length
    }
    document.getElementById("position").innerText = `Beat ${beats}.`
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

hotkeys("r,a,b,c,d,e,f,g", (e, handler) => {
    let key = handler.key
    if (key == "r") {
        key = null
    }
    let note = part.notes[position]
    if (note) {
        note.note = key
    } else {
        part.notes.push(Note(key, 4))
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
    }
})
