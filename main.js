/* globals error, hotkeys */

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
        throw error(`Invalid note: ${note}.`)
    } else if (!possibleLengths.includes(length)) {
        throw error(`Invalid length: ${length}.`)
    } else {
        return {
            note: note, length: length,
            toString: function() {
                let friendlyNote = null
                if (this.note === null) {
                    friendlyNote = "rest"
                } else {
                    friendlyNote = this.note
                }
                return `${lengthDescriptions[this.length]} ${friendlyNote}`
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
}

hotkeys("left, right", (e, handler) => {
    if (handler.key == "left") {
        if (position) {
            --position
            updatePosition()
        } else {
            part.name = prompt(`Enter a new name for the ${part.name} part`, part.name)
            updatePart()
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
