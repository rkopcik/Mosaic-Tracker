let rows = []
let currentRow = 0
let rowsToday = parseInt(localStorage.getItem("mosaic_rowsToday")) || 0
let goalDate = localStorage.getItem("mosaic_goalDate") || ""
let projectTime = parseInt(localStorage.getItem("mosaic_projectTime")) || 0
let goalTime = parseInt(localStorage.getItem("mosaic_goalTime")) || 0

let timerRunning = false
let timerInterval = null


function saveProgress(){

localStorage.setItem("mosaic_rows", JSON.stringify(rows))
localStorage.setItem("mosaic_currentRow", currentRow)
localStorage.setItem("mosaic_rowsToday", rowsToday)

}


function loadProgress(){

const savedRows = localStorage.getItem("mosaic_rows")
const savedRow = localStorage.getItem("mosaic_currentRow")

if(savedRows){

rows = JSON.parse(savedRows)
currentRow = parseInt(savedRow)||0

rowsToday = parseInt(localStorage.getItem("mosaic_rowsToday")) || 0
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
rows.push({
  type: "normal",
  stitches: current})
}

  
currentRow = 0
rowsToday = 0
localStorage.setItem("mosaic_currentRow",0)
localStorage.setItem("mosaic_rowsToday",0)
  
// save fresh pattern
saveProgress()

// rebuild tracker
render()

}


function toggle(rowIndex,stepIndex){

startTimer()
  
if(rowIndex > currentRow) return

if(rowIndex === currentRow){

const next = rows[rowIndex].findIndex(s => !s.done)
if(stepIndex > next) return

}

rows[rowIndex][stepIndex].done = !rows[rowIndex][stepIndex].done

if(rowIndex === currentRow){

const finished = rows[rowIndex].every(s => s.done)

// Only trigger when the row JUST became finished
if(finished && rows[rowIndex].counted !== true){

rows[rowIndex].counted = true

rowsToday++
localStorage.setItem("mosaic_rowsToday", rowsToday)

if(currentRow < rows.length - 1){
currentRow++
}

}

}

saveProgress()
render()

}


function resetRow(rowIndex){

rows[rowIndex].forEach(s => s.done = false)

rows[rowIndex].counted = false

currentRow = rowIndex

saveProgress()
render()

}


function resetPreviousRow(){

if(currentRow > 0){

rows[currentRow].forEach(s => s.done = false)
rows[currentRow-1].forEach(s => s.done = false)

rows[currentRow].counted = false
rows[currentRow-1].counted = false

currentRow--

saveProgress()
render()

}

}


function buildRow(rowIndex,small=false){

if(rowIndex < 0 || rowIndex >= rows.length) return null

const container = document.createElement("div")
container.className = small ? "row-small" : "row"

const start = localStorage.getItem("mosaic_startColor") || "light"

const isLightRow = (rowIndex % 2 === 0)

const tint =
(start === "light")
  ? (isLightRow ? "#ffffff" : "#dcecff")
  : (isLightRow ? "#dcecff" : "#ffffff")

container.style.backgroundColor = tint
container.style.padding = "10px"
container.style.borderRadius = "6px"
  
const steps = document.createElement("div")
steps.className = "steps"

const row = rows[rowIndex].stitches || rows[rowIndex]

row.forEach((seg,i)=>{

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


const dailyGoal = parseInt(localStorage.getItem("mosaic_dailyGoal")) || 0

let goalPercent = 0
if(dailyGoal > 0){
let rowPercent = 0

if(rows.length > 0){
rowPercent = Math.round(((currentRow + 1) / rows.length) * 100)
}
goalPercent = Math.min(Math.round((rowsToday / dailyGoal) * 100),100)
}

document.getElementById("dashGoal").innerText =
"Daily Goal: " + rowsToday + " / " + dailyGoal + " (" + goalPercent + "%)"

updateTimers()


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

if(currentRow > 0){

const prevTitle = document.createElement("div")

const rowStart = parseInt(localStorage.getItem("mosaic_rowStart")) || 1
const prevRowNumber = rowStart + currentRow - 1

prevTitle.innerText = "Row " + prevRowNumber
prevTitle.style.fontWeight = "bold"
prevTitle.style.opacity = ".5"

tracker.appendChild(prevTitle)

const prev = buildRow(currentRow-1,true)
tracker.appendChild(prev)

}


/* CURRENT ROW TITLE */

const title = document.createElement("h3")

const rowStart = parseInt(localStorage.getItem("mosaic_rowStart")) || 1

const actualRow = rowStart + currentRow
const totalRows = rows.length + rowStart - 1

const rowsCompleted = (rowStart - 1) + currentRow

let rowPercent = 0

const patternTotal = (rowStart - 1) + rows.length

if(patternTotal > 0){
rowPercent = Math.round((rowsCompleted / patternTotal) * 100)
}

document.getElementById("dashRow").innerText =
"Row: " + rowsCompleted + " of " + totalRows + " (" + rowPercent + "%)"

title.innerText = "Row " + actualRow
title.id = "currentRowTitle"
title.style.marginTop = "16px"

tracker.appendChild(title)


/* CURRENT ROW */

const current = buildRow(currentRow,false)

const totalStitches = countStitches(rows[currentRow].stitches)
let completedStitches = 0

const row = rows[currentRow].stitches || rows[currentRow]

row.forEach(step=>{

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

if(currentRow < rows.length - 1){

const nextTitle = document.createElement("div")

const rowStart = parseInt(localStorage.getItem("mosaic_rowStart")) || 1
const nextRowNumber = rowStart + currentRow + 1

nextTitle.innerText = "Row " + nextRowNumber
nextTitle.style.fontWeight = "bold"
nextTitle.style.opacity = ".5"
title.style.marginTop = "16px"
  
tracker.appendChild(nextTitle)

const next = buildRow(currentRow+1,true)
tracker.appendChild(next)

}


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

function startTimer(){

if(timerRunning) return

timerRunning = true

timerInterval = setInterval(()=>{

projectTime++
goalTime++

localStorage.setItem("mosaic_projectTime", projectTime)
localStorage.setItem("mosaic_goalTime", goalTime)

updateTimers()

},1000)

}

function formatTime(seconds){

const h = Math.floor(seconds/3600)
const m = Math.floor((seconds%3600)/60)
const s = seconds%60

return h+":"+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")

}

function updateTimers(){

document.getElementById("dashGoalTime").innerText =
"Goal Time: " + formatTime(goalTime)

document.getElementById("dashProjectTime").innerText =
"Project Time: " + formatTime(projectTime)

}

function setZoom(level){

document.body.style.zoom = level

}


document.addEventListener("DOMContentLoaded",()=>{

const today = new Date().toISOString().split("T")[0]

if(goalDate !== today){
rowsToday = 0
goalTime = 0
localStorage.setItem("mosaic_rowsToday",0)
localStorage.setItem("mosaic_goalTime",0)
localStorage.setItem("mosaic_goalDate",today)
}

loadProgress()

updateTimers()

const newPattern = localStorage.getItem("mosaic_newPattern")
const savedPattern = localStorage.getItem("mosaic_patternText")

if(newPattern === "true" && savedPattern){

rows = []
currentRow = 0

parsePattern(savedPattern)
saveProgress()

localStorage.removeItem("mosaic_newPattern")

}

render()

})
