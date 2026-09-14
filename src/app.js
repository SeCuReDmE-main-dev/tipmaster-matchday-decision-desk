import { createDesk, matches, predict } from './domain.js';
import { createToolDefinitions, registerWebMCP } from './tools.js';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const desk=createDesk(render);
const tools=createToolDefinitions(desk);
window.__MATCHDAY_TOOLS__=tools;

function card(match){const p=predict(match);return `<article class="match-card" data-id="${esc(match.id)}"><div class="match-meta"><span>${esc(match.stage)}</span><span>${esc(match.kickoff)}</span></div><div class="teams"><div class="team"><span>${esc(match.home)}</span><span>${esc(match.homeCode)}</span></div><div class="team"><span>${esc(match.away)}</span><span>${esc(match.awayCode)}</span></div></div><div class="prediction"><div class="probability-row"><span>Model lean</span><span>${p.confidence}% confidence</span></div><strong>${esc(p.favorite)}</strong><div class="meter"><span style="width:${p.confidence}%"></span></div><div class="probability-row"><span>${p.homeWin}% · ${p.draw}% · ${p.awayWin}%</span><span>1 · X · 2</span></div></div><div class="card-actions"><button data-action="analyze">Analyse</button><button data-action="shortlist">${desk.state.shortlist.includes(match.id)?'Entfernen':'＋ Watchlist'}</button></div></article>`}
function analysis(match){const p=predict(match),e=desk.explain({match_id:match.id}),u=desk.upset({match_id:match.id});return `<p class="eyebrow">${esc(match.homeCode)} — ${esc(match.awayCode)} · MATCH EXPLAINER</p><h2>${esc(match.home)} <span class="muted">vs.</span> ${esc(match.away)}</h2><p>${esc(match.note)}</p><div class="analysis-kpis"><div class="kpi"><strong>${p.homeWin}%</strong><span>${esc(match.home)} win</span></div><div class="kpi"><strong>${p.draw}%</strong><span>Draw</span></div><div class="kpi"><strong>${p.awayWin}%</strong><span>${esc(match.away)} win</span></div></div><h3>Warum dieses Signal?</h3><ul class="factor-list">${e.why.map(x=>`<li>${esc(x)}</li>`).join('')}<li>Upset risk: ${esc(u.upsetRisk)} (${u.volatility}/100 volatility)</li></ul><p class="muted">Counterfactor: ${esc(e.counterfactor)}. Illustrative model only.</p>`}
function render(){
  const ordered=desk.list({risk_profile:desk.state.riskProfile});
  $('#match-grid').innerHTML=ordered.map(card).join('');
  const selected=desk.state.shortlist.map(id=>matches.find(m=>m.id===id));
  $('#shortlist-count').textContent=`${selected.length} / 3`;
  $('#shortlist').className=selected.length?'':'shortlist-empty';
  $('#shortlist').innerHTML=selected.length?selected.map(m=>`<div class="shortlist-item"><span><b>${esc(m.homeCode)} — ${esc(m.awayCode)}</b><br><small>${esc(predict(m).favorite)} · ${predict(m).confidence}%</small></span><button data-remove="${esc(m.id)}" aria-label="${esc(m.home)} gegen ${esc(m.away)} entfernen">×</button></div>`).join(''):'Noch leer. Füge bis zu drei Spiele hinzu.';
}

for(const team of [...new Set(matches.flatMap(m=>[m.home,m.away]))].sort()){const option=document.createElement('option');option.value=team;option.textContent=team;$('#favorite-team').append(option)}
$('#match-grid').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const match=matches.find(m=>m.id===button.closest('.match-card').dataset.id);if(button.dataset.action==='analyze'){$('#analysis-panel').innerHTML=analysis(match);$('#analysis-panel').scrollIntoView({behavior:'smooth',block:'center'})}else desk.toggleShortlist(match.id)});
$('#shortlist').addEventListener('click',event=>{if(event.target.dataset.remove)desk.toggleShortlist(event.target.dataset.remove)});
$('#save-preferences').addEventListener('click',()=>{desk.setPreferences({risk_profile:$('#risk-profile').value,favorite_team:$('#favorite-team').value});$('#preference-note').textContent='Ansicht aktualisiert — nur für diese Sitzung.'});
$('#explain-model').addEventListener('click',()=>$('#model-dialog').showModal());
$('.dialog-close').addEventListener('click',()=>$('#model-dialog').close());
$('#tool-list').innerHTML=tools.map((tool,index)=>`<li>${String(index+1).padStart(2,'0')} · ${esc(tool.name)}<span>${tool.annotations.readOnlyHint?'READ':'LOCAL ACTION'}</span></li>`).join('');
render();
registerWebMCP(tools).then(result=>{$('#agent-status').textContent=result.available?`WebMCP ready · ${result.registered} tools`:'UI ready · WebMCP progressive enhancement'}).catch(()=>{$('#agent-status').textContent='UI ready · WebMCP registration unavailable'});
