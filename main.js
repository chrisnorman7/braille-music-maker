/* globals error */

const possibleNotes = ["a", "b", "c", "d", "e", "f", "g", null]
const possibleLengths = [8, 4, 2, 1]

// TTS stuff.
const tts = window.speechSynthesis
const voiceVoice = document.getElementById("voice-voice")
const voiceEnable = document.getElementById("voice-enable")
const voiceRate = document.getElementById("voice-rate")

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

function speak(text) {
    if (voiceEnable.checked) {
        window.speechSynthesis.cancel()
        let msg = new SpeechSynthesisUtterance(text)
        msg.rate = parseInt(voiceRate.value)
        let voice_index = parseInt(voiceVoice.value)
        if (voice_index != -1) {
            msg.voice = tts.getVoices()[voice_index]
        }
        tts.speak(msg)
    }
}

document.onkeydown = (e) => {
    let key = e.key
    if (key == "control") {
        window.speechSynthesis.cancel()
    } else {
        speak(key)
    }
}


function clearElement(e) {
    // Below code based on the first answer at:
    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (e.firstChild) {
        e.removeChild(e.firstChild)
    }
}

clearElement(voiceVoice)
let o = document.createElement("option")
o.value = -1
o.selected = true
o.innerText = "Default"
voiceVoice.appendChild(o)
for (let i in tts.getVoices()) {
    let voice = tts.getVoices()[i]
    let o = document.createElement("option")
    o.value = i
    o.innerText = `${voice.name} (${voice.lang})`
    voiceVoice.appendChild(o)
}
