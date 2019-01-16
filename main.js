/* globals error */

const possibleNotes = ["a", "b", "c", "d", "e", "f", "g", null]
const possibleLengths = [8, 4, 2, 1]

const lengthDescriptions = {
    8: "eighth note", 4: "quarter note", 2: "half note", 1: "whole note"
}

const notes = []

const status = document.getElementById("status")
status.innerText = "Braille Music Maker"

let position = 0

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
    notes.push(note)
}

addNote(Note("c", 4))
