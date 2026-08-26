const presets=["Mortgage / Rent","Electric","Heating / Gas","Water / Sewer","Trash","Internet","Cell phone","Car payment","Car insurance","Gas / Fuel","Health insurance","Prescription / Medical","Groceries","Credit card","Personal loan","Student loan","Childcare","Pet care","Netflix","Hulu","Disney+","Amazon Prime","Spotify / Music","Gym membership","Cloud storage","Property tax","Vehicle tax / Registration","Home insurance","Life insurance","Storage unit"];
let state={balance:0,weeklyIncome:0,expenses:[]}, openWeek=null, mode=null, editingId=null, inlineEditingId=null;
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
function startOfWeek(d){const x=new Date(d);const diff=(x.getDay()+6)%7;x.setDate(x.getDate()-diff);x.setHours(0,0,0,0);return x}
function endOfWeek(d){const x=new Date(d);x.setDate(x.getDate()+6);return x}
function fmt(d){return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}
function occ(start,end){
  const out=[];
  for(const e of state.expenses){
    if(e.frequency==="weekly"){out.push({...e,date:new Date(start)});continue}
    let c=new Date(start.getFullYear(),start.getMonth(),1), final=new Date(end.getFullYear(),end.getMonth(),1);
    while(c<=final){const last=new Date(c.getFullYear(),c.getMonth()+1,0).getDate();const d=new Date(c.getFullYear(),c.getMonth(),Math.min(e.dueDay,last));if(d>=start&&d<=end)out.push({...e,date:d});c=new Date(c.getFullYear(),c.getMonth()+1,1)}
  }
  return out.sort((a,b)=>a.date-b.date)
}
async function save(){const r=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});if(!r.ok)throw new Error();state=await r.json()}
async function load(){const r=await fetch("/api/state");state=await r.json();render()}
function render(){
  const balanceInput=$("#balanceInput"), incomeInput=$("#incomeInput");
  if(document.activeElement!==balanceInput) balanceInput.value=Number(state.balance).toFixed(2);
  if(document.activeElement!==incomeInput) incomeInput.value=Number(state.weeklyIncome).toFixed(2);
  renderForecast();renderExpenses();renderPresets()
}
function renderForecast(){
  const box=$("#forecast");box.innerHTML="";let running=state.balance;const first=startOfWeek(new Date());
  for(let i=0;i<6;i++){
    const ws=new Date(first);ws.setDate(ws.getDate()+7*i);const we=endOfWeek(ws),items=occ(ws,we),bills=items.reduce((s,x)=>s+x.amount,0),start=running,end=start+state.weeklyIncome-bills;running=end;
    const el=document.createElement("div");el.className="week";
    el.innerHTML=`<div class="weeksum"><div class="weekdate"><strong>${i===0?"This week":i===1?"Next week":"Week "+(i+1)}</strong><div class="small">${fmt(ws)} – ${fmt(we)}</div></div><div><div class="small">Income</div><div class="amt">+${money(state.weeklyIncome)}</div></div><div><div class="small">Expenses</div><div class="amt">−${money(bills)}</div></div><div><div class="small">Expected balance</div><div class="amt ${end<0?"bad":"good"}">${money(end)}</div></div><button class="btn weekaction" data-week="${i}">${openWeek===i?"Hide details":"See this week"}</button></div>`;
    if(openWeek===i){
      const d=document.createElement("div");d.className="details";
      d.innerHTML=`<div class="line"><span class="label">Starting balance</span><strong>${money(start)}</strong></div><div class="line"><span>Weekly income</span><strong>+${money(state.weeklyIncome)}</strong></div>`+
      (items.length?items.map(x=>`<div class="line"><span>${esc(x.name)} <span class="small">${fmt(x.date)}</span></span><strong>−${money(x.amount)}</strong></div>`).join(""):`<div class="line"><span class="label">No expenses due this week</span><span>—</span></div>`)+
      `<div class="line total"><span>Expected balance</span><span class="${end<0?"bad":"good"}">${money(end)}</span></div>`;el.appendChild(d)
    }
    box.appendChild(el)
  }
  box.querySelectorAll("[data-week]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.week);openWeek=openWeek===i?null:i;renderForecast()})
}
function renderExpenses(){
  const box=$("#expenses");box.innerHTML="";
  [...state.expenses].sort((a,b)=>a.dueDay-b.dueDay).forEach(e=>{
    const row=document.createElement("div");row.className="expense"+(inlineEditingId===e.id?" editing":"");
    row.innerHTML=`<div><strong>${esc(e.name)}</strong><div class="small meta">${e.frequency==="weekly"?"Every week":"Due on the "+e.dueDay}</div></div><strong>${money(e.amount)}</strong><span class="label">${e.frequency}</span><div class="actions"><button class="btn primary" data-edit="${e.id}">${inlineEditingId===e.id?"Close":"Edit"}</button><button class="btn danger" data-remove="${e.id}">Remove</button></div>`;
    if(inlineEditingId===e.id){
      const edit=document.createElement("div");edit.className="inline-edit";
      edit.innerHTML=`<div class="formgrid"><div class="field"><label>Expense name</label><input data-inline-name value="${esc(e.name)}" maxlength="80"></div><div class="field"><label>Amount</label><input data-inline-amount type="number" min="0" step=".01" value="${e.amount}"></div><div class="field"><label>How often</label><select data-inline-frequency><option value="monthly" ${e.frequency==="monthly"?"selected":""}>Monthly</option><option value="weekly" ${e.frequency==="weekly"?"selected":""}>Weekly</option></select></div><div class="field" data-due-wrap><label>Due day of month</label><input data-inline-day type="number" min="1" max="31" value="${e.dueDay}"></div></div><div class="formactions"><button class="btn primary" type="button" data-save-expense="${e.id}">Save changes</button><button class="btn" type="button" data-cancel-expense>Cancel</button></div><div class="status" data-inline-status></div>`;
      row.appendChild(edit)
    }
    box.appendChild(row)
  });
  box.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const id=Number(b.dataset.edit);inlineEditingId=inlineEditingId===id?null:id;renderExpenses()});
  box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=async()=>{state.expenses=state.expenses.filter(x=>x.id!==Number(b.dataset.remove));if(inlineEditingId===Number(b.dataset.remove))inlineEditingId=null;await save();render()});
  box.querySelectorAll("[data-cancel-expense]").forEach(b=>b.onclick=()=>{inlineEditingId=null;renderExpenses()});
  box.querySelectorAll("[data-save-expense]").forEach(b=>b.onclick=async()=>{
    const row=b.closest(".expense"), id=Number(b.dataset.saveExpense), name=row.querySelector("[data-inline-name]").value.trim(), amount=Number(row.querySelector("[data-inline-amount]").value), frequency=row.querySelector("[data-inline-frequency]").value==="weekly"?"weekly":"monthly", day=Number(row.querySelector("[data-inline-day]").value), status=row.querySelector("[data-inline-status]");
    if(!name||!Number.isFinite(amount)||amount<0||!Number.isInteger(day)||day<1||day>31){status.textContent="Enter a valid name, amount, and due day.";return}
    const e=state.expenses.find(x=>x.id===id);Object.assign(e,{name,amount,frequency,dueDay:day});
    try{await save();inlineEditingId=null;render()}catch{status.textContent="Could not save changes."}
  })
}
function renderPresets(){
  const grid=$("#presetGrid");grid.innerHTML="";const existing=new Set(state.expenses.map(e=>e.name));
  for(const name of presets){const b=document.createElement("button");b.className="preset";b.type="button";b.textContent=name+(existing.has(name)?" ✓":"");b.disabled=existing.has(name);if(!b.disabled)b.onclick=()=>openExpense(null,name);grid.appendChild(b)}
}
function showForm(title,help,html,newMode){mode=newMode;$("#formTitle").textContent=title;$("#formHelp").textContent=help;$("#formFields").innerHTML=html;$("#status").textContent="";$("#presetsPanel").classList.remove("open");$("#formPanel").classList.add("open");$("#formPanel").scrollIntoView({behavior:"smooth",block:"nearest"})}
function expenseFields(e={name:"",amount:"",dueDay:1,frequency:"monthly"}){return `<div class="field"><label>Expense name</label><input name="name" maxlength="80" value="${esc(e.name)}"></div><div class="field"><label>Amount</label><input name="amount" type="number" min="0" step=".01" value="${e.amount}"></div><div class="field"><label>How often</label><select name="frequency"><option value="monthly" ${e.frequency==="monthly"?"selected":""}>Monthly</option><option value="weekly" ${e.frequency==="weekly"?"selected":""}>Weekly</option></select></div><div class="field"><label>Due day of month</label><input name="dueDay" type="number" min="1" max="31" value="${e.dueDay}"></div>`}
function openExpense(id=null,presetName=""){editingId=id;const e=id?state.expenses.find(x=>x.id===id):{name:presetName,amount:"",dueDay:1,frequency:"monthly"};showForm(id?"Edit "+e.name:(presetName?"Add "+presetName:"Custom expense"),"Change anything you need, then save.",expenseFields(e),"expense")}
async function saveQuick(kind){
  const input=kind==="balance"?$("#balanceInput"):$("#incomeInput"), note=kind==="balance"?$("#balanceNote"):$("#incomeNote"), value=Number(input.value);
  note.textContent="";
  if(!Number.isFinite(value)||value<0){note.textContent="Enter a valid amount.";input.focus();return}
  if(kind==="balance")state.balance=value;else state.weeklyIncome=value;
  try{await save();note.textContent="Saved.";render()}catch{note.textContent="Could not save."}
}
$("#saveBalance").onclick=()=>saveQuick("balance");
$("#saveIncome").onclick=()=>saveQuick("income");
$("#balanceInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveQuick("balance")}});
$("#incomeInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveQuick("income")}});
$("#showPresets").onclick=()=>{$("#formPanel").classList.remove("open");$("#presetsPanel").classList.add("open");$("#presetsPanel").scrollIntoView({behavior:"smooth"})};
$("#closePresets").onclick=()=>$("#presetsPanel").classList.remove("open");
$("#customExpense").onclick=()=>openExpense();
$("#cancelForm").onclick=()=>$("#formPanel").classList.remove("open");
$("#form").onsubmit=async ev=>{
  ev.preventDefault();const fd=new FormData(ev.currentTarget);$("#status").textContent="";
  try{
    if(mode==="balance"){const v=Number(fd.get("balance"));if(!Number.isFinite(v)||v<0)throw new Error("Enter a valid balance.");state.balance=v}
    else if(mode==="income"){const v=Number(fd.get("income"));if(!Number.isFinite(v)||v<0)throw new Error("Enter a valid income.");state.weeklyIncome=v}
    else{
      const name=String(fd.get("name")||"").trim(),amount=Number(fd.get("amount")),dueDay=Number(fd.get("dueDay")),frequency=fd.get("frequency")==="weekly"?"weekly":"monthly";
      if(!name||!Number.isFinite(amount)||amount<0||!Number.isInteger(dueDay)||dueDay<1||dueDay>31)throw new Error("Enter a valid name, amount, and due day.");
      if(editingId!==null){const e=state.expenses.find(x=>x.id===editingId);Object.assign(e,{name,amount,dueDay,frequency})}else state.expenses.push({id:Date.now(),name,amount,dueDay,frequency})
    }
    await save();$("#formPanel").classList.remove("open");render()
  }catch(err){$("#status").textContent=err.message||"Could not save changes."}
};
load();
