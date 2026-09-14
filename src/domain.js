import { matches } from './data.js';

const weights={power:.35,form:.25,attack:.18,defense:.14};
const round=n=>Math.round(n);
const cap=(n,min,max)=>Math.min(max,Math.max(min,n));
const clean=(value,label,max=40)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error(`INVALID_INPUT: ${label}`);return value.trim()};
const matchById=id=>{const found=matches.find(m=>m.id===clean(id,'match_id'));if(!found)throw new Error('NOT_FOUND: match_id');return found};

export function predict(match){
  const home=match.homePower*weights.power+match.homeForm*weights.form+match.homeAttack*weights.attack+match.homeDefense*weights.defense+3;
  const away=match.awayPower*weights.power+match.awayForm*weights.form+match.awayAttack*weights.attack+match.awayDefense*weights.defense;
  const delta=home-away;
  const draw=cap(27-Math.abs(delta)*1.4+match.volatility*.08,15,31);
  const remaining=100-draw;
  const homeWin=cap(remaining/2+delta*2.4,12,73);
  const awayWin=100-draw-homeWin;
  const confidence=cap(55+Math.abs(delta)*2.8-match.volatility*.35,42,82);
  const favorite=homeWin>=awayWin?match.home:match.away;
  return {homeWin:round(homeWin),draw:round(draw),awayWin:round(awayWin),confidence:round(confidence),favorite,delta:Number(delta.toFixed(1))};
}

export function createDesk(onChange=()=>{}){
  const state={riskProfile:'balanced',favoriteTeam:'',shortlist:[]};
  const emit=()=>onChange(structuredClone(state));
  return {
    state,
    overview(){return {prototype:true,matchCount:matches.length,model:'transparent-weighted-v1',disclaimer:'Illustrative scenarios, not live data or betting advice'}},
    list({risk_profile='balanced'}={}){if(!['balanced','safe','upset'].includes(risk_profile))throw new Error('INVALID_INPUT: risk_profile');return [...matches].sort((a,b)=>{const pa=predict(a),pb=predict(b);if(risk_profile==='safe')return pb.confidence-pa.confidence;if(risk_profile==='upset')return b.volatility-a.volatility;return Math.abs(pa.homeWin-pa.awayWin)-Math.abs(pb.homeWin-pb.awayWin)}).map(m=>({...m,prediction:predict(m)}))},
    details({match_id}={}){const m=matchById(match_id);return {...m,prediction:predict(m)}},
    compare({match_id}={}){const m=matchById(match_id);return {matchId:m.id,teams:[{name:m.home,power:m.homePower,form:m.homeForm,attack:m.homeAttack,defense:m.homeDefense},{name:m.away,power:m.awayPower,form:m.awayForm,attack:m.awayAttack,defense:m.awayDefense}],edge:predict(m).delta}},
    explain({match_id}={}){const m=matchById(match_id),p=predict(m);const homeEdge=m.homeAttack-m.awayDefense,awayEdge=m.awayAttack-m.homeDefense;return {matchId:m.id,favorite:p.favorite,confidence:p.confidence,why:[`${p.favorite} leads the weighted signals`,homeEdge>=awayEdge?`${m.home} has the stronger attack-to-defense edge`:`${m.away} has the stronger attack-to-defense edge`,m.note],counterfactor:`Volatility ${m.volatility}/100 keeps the result uncertain`}},
    upset({match_id}={}){const m=matchById(match_id),p=predict(m);return {matchId:m.id,upsetRisk:m.volatility>=33?'high':m.volatility>=24?'medium':'low',volatility:m.volatility,closestOutcomeGap:Math.abs(p.homeWin-p.awayWin),reason:m.note}},
    setPreferences({risk_profile='balanced',favorite_team=''}={}){if(!['balanced','safe','upset'].includes(risk_profile))throw new Error('INVALID_INPUT: risk_profile');if(typeof favorite_team!=='string'||favorite_team.length>30)throw new Error('INVALID_INPUT: favorite_team');const teams=new Set(matches.flatMap(m=>[m.home,m.away]));if(favorite_team&&!teams.has(favorite_team))throw new Error('NOT_FOUND: favorite_team');state.riskProfile=risk_profile;state.favoriteTeam=favorite_team;emit();return {...state,message:'Session preferences applied locally'}},
    buildShortlist({match_ids}={}){if(!Array.isArray(match_ids)||match_ids.length<1||match_ids.length>3||new Set(match_ids).size!==match_ids.length)throw new Error('INVALID_INPUT: match_ids');match_ids.forEach(matchById);state.shortlist=[...match_ids];emit();return {matchIds:[...state.shortlist],count:state.shortlist.length,message:'Watchlist replaced; action is reversible'}},
    toggleShortlist(id){matchById(id);state.shortlist=state.shortlist.includes(id)?state.shortlist.filter(x=>x!==id):[...state.shortlist,id].slice(-3);emit();return [...state.shortlist]}
  };
}

export { matches };
