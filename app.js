let rows = []
let currentRow = 0


function saveProgress(){

localStorage.setItem("mosaic_rows", JSON.stringify(rows))
localStorage.setItem("mosaic_currentRow", currentRow)

}


function loadProgress(){

const savedRows = localStorage.getItem("mosaic_rows")
const savedRow = localStorage.getItem("mosaic_currentRow")

if(savedRows){

rows = JSON.parse(savedRows)
currentRow = parseInt(savedRow) || 0
render()

}

}


function parsePattern(text){

// reset pattern completely
rows = []
currentRow = 0

// clear saved progress
localStorage.setItem("mosaic_patternText", text)
localStorage.removeItem("mosaic_rows")
localStorage.removeItem("mosaic_currentRow")

let current = []

const lines = text.split("\n")

lines.forEach(line => {

line = line.trim()

if(line === "") return

// detect new row label
if(/^row\s*\d+/i.test(line) || /^\d+\s/.test(line)){

if(current.length > 0){
rows.push(current)
current = []
}

// remove row label
line = line.replace(/^row\s*\d+[:.]?\s*/i,"")
line = line.replace(/^\d+[:.]?\s*/,"")

}

// split stitches
line.split(",").forEach(part => {

const stitch = part.trim()

if(stitch !== ""){
current.push({
text: stitch,
done: false
})
}

})

})

// push final row
if(current.length > 0){
rows.push(current)
}

// save fresh pattern
saveProgress()

// rebuild tracker
render()

}


function toggle(rowIndex,stepIndex){

if(rowIndex > currentRow) return

if(rowIndex === currentRow){

const next = rows[rowIndex].findIndex(s => !s.done)
if(stepIndex > next) return

}

rows[rowIndex][stepIndex].done = !rows[rowIndex][stepIndex].done

if(rowIndex === currentRow){

const finished = rows[rowIndex].every(s => s.done)

if(finished && currentRow < rows.length-1){
currentRow++
}

}

saveProgress()
render()

}


function resetRow(rowIndex){

rows[rowIndex].forEach(s => s.done = false)
currentRow = rowIndex

saveProgress()
render()

}


function resetPreviousRow(){

if(currentRow > 0){

rows[currentRow].forEach(s => s.done = false)
rows[currentRow-1].forEach(s => s.done = false)

currentRow--

saveProgress()
render()

}

}


function buildRow(rowIndex,small=false){

if(rowIndex < 0 || rowIndex >= rows.length) return null

const container = document.createElement("div")
container.className = small ? "row-small" : "row"

const steps = document.createElement("div")
steps.className = "steps"

rows[rowIndex].forEach((seg,i)=>{

const step = document.createElement("div")
step.className = "step"

if(seg.done) step.classList.add("done")

if(!small && !seg.done && i === rows[rowIndex].findIndex(s => !s.done)){
step.classList.add("current")
}

step.innerText = seg.text
step.onclick = () => toggle(rowIndex,i)

steps.appendChild(step)

})

container.appendChild(steps)

return container

}


function countStitches(row){

let total = 0
let groupTotal = 0
let inGroup = false
let multiplier = 1

row.forEach(step=>{

let raw = step.text.toLowerCase()

let numMatch = raw.match(/\d+/)
let stitches = numMatch ? parseInt(numMatch[0]) : 1

if(raw.includes("(")){
inGroup = true
groupTotal = 0
}

if(inGroup){
groupTotal += stitches
}else{
total += stitches
}

if(raw.includes(")")){
let multMatch = raw.match(/x(\d+)/)

multiplier = multMatch ? parseInt(multMatch[1]) : 1

total += groupTotal * multiplier

groupTotal = 0
multiplier = 1
inGroup = false
}

})

return total

}


function render(){

const tracker = document.getElementById("tracker")
tracker.innerHTML = ""

/* DASHBOARD VALUES */

const projectName = localStorage.getItem("mosaic_projectName") || "Crochet Project"

document.getElementById("dashProject").innerText =
"Project: " + projectName


const color1 = localStorage.getItem("mosaic_color1") || "Color A"
const color2 = localStorage.getItem("mosaic_color2") || "Color B"

const workingColor = (currentRow % 2 === 0) ? color1 : color2

document.getElementById("dashColor").innerText =
"Working Color: " + workingColor


document.getElementById("dashGoal").innerText =
"Daily Goal: --"

document.getElementById("dashGoalTime").innerText =
"Goal Time: --"

document.getElementById("dashProjectTime").innerText =
"Project Time: --"


/* STOP IF NO ROWS YET */

if(rows.length === 0){

document.getElementById("dashColor").innerText="Working Color: --"
document.getElementById("dashGoal").innerText="Daily Goal: --"
document.getElementById("dashRow").innerText="Row: --"
document.getElementById("dashStitches").innerText="Stitches: --"
document.getElementById("dashGoalTime").innerText="Goal Time: --"
document.getElementById("dashProjectTime").innerText="Project Time: --"

return
}


/* PREVIOUS ROW */

const prev = buildRow(currentRow-1,true)
if(prev) tracker.appendChild(prev)


/* CURRENT ROW TITLE */

const title = document.createElement("h3")

const rowStart = parseInt(localStorage.getItem("mosaic_rowStart")) || 1

const actualRow = rowStart + currentRow
const totalRows = rows.length + rowStart - 1

const rowPercent = rows.length > 0
? Math.round((currentRow / rows.length) * 100)
: 0

document.getElementById("dashRow").innerText =
"Row: " + actualRow + " of " + totalRows + " (" + rowPercent + "%)"

title.innerText = "Row " + actualRow
title.id = "currentRowTitle"

tracker.appendChild(title)


/* CURRENT ROW */

const current = buildRow(currentRow,false)

const totalStitches = countStitches(rows[currentRow])
let completedStitches = 0

rows[currentRow].forEach(step => {

if(step.done){
completedStitches += countStitches([step])
}

})


const percent = totalStitches > 0
? Math.round((completedStitches / totalStitches) * 100)
: 0


document.getElementById("dashStitches").innerText =
"Stitches: " + completedStitches + " / " + totalStitches + " (" + percent + "%)"

tracker.appendChild(current)


/* NEXT ROW PREVIEW */

const next = buildRow(currentRow+1,true)
if(next) tracker.appendChild(next)


/* CENTER ACTIVE STITCH */

setTimeout(()=>{

const active = document.querySelector(".step.current")

if(active){
active.scrollIntoView({
behavior:"smooth",
block:"center"
})
}

},50)

}


function setZoom(level){

document.body.style.zoom = level

}


document.addEventListener("DOMContentLoaded",()=>{

loadProgress()

if(rows.length===0){

const savedPattern=localStorage.getItem("mosaic_patternText")

if(savedPattern){
parsePattern(savedPattern)
}

}
