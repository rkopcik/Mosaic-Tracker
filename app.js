let rows=[]
let currentRow=0


function saveProgress(){

localStorage.setItem("mosaic_rows",JSON.stringify(rows))
localStorage.setItem("mosaic_currentRow",currentRow)

}


function loadProgress(){

const savedRows=localStorage.getItem("mosaic_rows")
const savedRow=localStorage.getItem("mosaic_currentRow")

if(savedRows){

rows=JSON.parse(savedRows)
currentRow=parseInt(savedRow)||0
render()

}

}


function parsePattern(text){

rows=[]
let current=[]

const lines=text.split("\n")

lines.forEach(line=>{

line=line.trim()

if(line==="") return

if(/^row\s*\d+/i.test(line) || /^\d+\s/.test(line)){

if(current.length>0){
rows.push(current)
current=[]
}

line=line.replace(/^row\s*\d+[:.]?\s*/i,"")
line=line.replace(/^\d+[:.]?\s*/,"")

}

line.split(",").forEach(part=>{

const stitch=part.trim()

if(stitch!==""){
current.push({
text:stitch,
done:false
})
}

})

})

if(current.length>0){
rows.push(current)
}

}


function toggle(rowIndex,stepIndex){

if(rowIndex>currentRow) return

if(rowIndex===currentRow){

const next=rows[rowIndex].findIndex(s=>!s.done)
if(stepIndex>next) return

}

rows[rowIndex][stepIndex].done=!rows[rowIndex][stepIndex].done

if(rowIndex===currentRow){

const finished=rows[rowIndex].every(s=>s.done)

if(finished && currentRow<rows.length-1){
currentRow++
}

}

saveProgress()
render()

}


function resetRow(rowIndex){

rows[rowIndex].forEach(s=>s.done=false)
currentRow=rowIndex

saveProgress()
render()

}


function resetPreviousRow(){

if(currentRow>0){

rows[currentRow].forEach(s=>s.done=false)
rows[currentRow-1].forEach(s=>s.done=false)

currentRow--

saveProgress()
render()

}

}


function buildRow(rowIndex,small=false){

if(rowIndex<0 || rowIndex>=rows.length) return null

const container=document.createElement("div")
container.className=small ? "row-small" : "row"

const steps=document.createElement("div")
steps.className="steps"

rows[rowIndex].forEach((seg,i)=>{

const step=document.createElement("div")

step.className="step"

if(seg.done) step.classList.add("done")

if(!small && !seg.done && i===rows[rowIndex].findIndex(s=>!s.done)){
step.classList.add("current")
}

step.innerText=seg.text
step.onclick=()=>toggle(rowIndex,i)

steps.appendChild(step)

})

container.appendChild(steps)

return container

}


function countStitches(row){

let total=0

row.forEach(step=>{

let raw=step.text.toLowerCase()
let numMatch=raw.match(/\d+/)

total+=numMatch ? parseInt(numMatch[0]) : 1

})

return total

}


function render(){

const tracker=document.getElementById("tracker")
tracker.innerHTML=""

if(rows.length===0) return

const projectName=localStorage.getItem("mosaic_projectName") || "Project"

document.getElementById("dashProject").innerText="Project: "+projectName
const projectName=localStorage.getItem("mosaic_projectName") || "Project"

document.getElementById("dashProject").innerText="Project: "+projectName
const color1=localStorage.getItem("mosaic_color1") || "Color A"
const color2=localStorage.getItem("mosaic_color2") || "Color B"

const workingColor=(currentRow % 2 === 0) ? color1 : color2

document.getElementById("dashColor").innerText=
"Working Color: "+workingColor
document.getElementById("dashGoalTime").innerText=
"Goal Time: --"  
document.getElementById("dashProjectTime").innerText=
"Project Time: --"
document.getElementById("dashGoal").innerText=
"Daily Goal: 0 / 0 (0%)"  
const prev = buildRow(currentRow-1,true)
if(prev) tracker.appendChild(prev)

const title = document.createElement("h3")

const actualRow = currentRow + 1
const totalRows = rows.length

const rowPercent = rows.length > 0
  ? Math.round((currentRow / rows.length) * 100)
  : 0

document.getElementById("dashRow").innerText =
"Row: " + actualRow + " of " + totalRows + " (" + rowPercent + "%)"

title.innerText = "Row " + actualRow
title.id = "currentRowTitle"

tracker.appendChild(title)

const current=buildRow(currentRow,false)

const totalStitches=countStitches(rows[currentRow])
let completedStitches=0

rows[currentRow].forEach(step=>{
if(step.done) completedStitches+=countStitches([step])
})

const percent=Math.round((completedStitches/totalStitches)*100)

document.getElementById("dashStitches").innerText=
"Stitches: "+completedStitches+" / "+totalStitches+" ("+percent+"%)"

tracker.appendChild(current)

const next=buildRow(currentRow+1,true)
if(next) tracker.appendChild(next)

setTimeout(()=>{

const active=document.querySelector(".step.current")

if(active){
active.scrollIntoView({
behavior:"smooth",
block:"center"
})
}

},50)

}


function setZoom(level){

document.body.style.zoom=level

}


document.addEventListener("DOMContentLoaded",()=>{

loadProgress()

const savedPattern=localStorage.getItem("mosaic_patternText")

if(savedPattern && rows.length===0){

parsePattern(savedPattern)

saveProgress()

render()

}

})
