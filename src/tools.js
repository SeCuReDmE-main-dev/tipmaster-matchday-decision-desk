const objectSchema=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const matchId={type:'string',description:'Scenario identifier returned by list_matches.',maxLength:40};
const annotations=readOnlyHint=>({readOnlyHint,untrustedContentHint:false,consequentialHint:false});
const safeExecute=fn=>async(input={},context={})=>{if(context.signal?.aborted)throw new DOMException('Tool call cancelled','AbortError');try{return JSON.stringify({ok:true,data:fn(input)}).slice(0,1500)}catch(error){return JSON.stringify({ok:false,error:String(error.message||'INTERNAL_ERROR').slice(0,160)})}};

export function createToolDefinitions(desk){return [
  {name:'get_matchday_overview',description:'Returns the prototype scope, match count, model identity, and safety disclaimer. Use before exploring match scenarios.',inputSchema:objectSchema(),annotations:annotations(true),execute:safeExecute(()=>desk.overview())},
  {name:'list_matches',description:'Lists all curated match scenarios, ranked for a balanced, favorites-first, or upset-focused view.',inputSchema:objectSchema({risk_profile:{type:'string',enum:['balanced','safe','upset'],description:'Ranking lens for the returned scenarios.'}}),annotations:annotations(true),execute:safeExecute(x=>desk.list(x).map(m=>({id:m.id,stage:m.stage,kickoff:m.kickoff,home:m.home,away:m.away,volatility:m.volatility,prediction:m.prediction})))},
  {name:'get_match_details',description:'Returns teams, signals, narrative context, and prediction probabilities for one match scenario.',inputSchema:objectSchema({match_id:matchId},['match_id']),annotations:annotations(true),execute:safeExecute(x=>desk.details(x))},
  {name:'compare_teams',description:'Compares power, form, attack, and defense signals for both teams in one scenario.',inputSchema:objectSchema({match_id:matchId},['match_id']),annotations:annotations(true),execute:safeExecute(x=>desk.compare(x))},
  {name:'explain_prediction',description:'Explains the predicted favorite, confidence, strongest signals, and a counterfactor for one scenario.',inputSchema:objectSchema({match_id:matchId},['match_id']),annotations:annotations(true),execute:safeExecute(x=>desk.explain(x))},
  {name:'assess_upset_risk',description:'Returns a low, medium, or high upset-risk assessment with volatility and outcome-gap context.',inputSchema:objectSchema({match_id:matchId},['match_id']),annotations:annotations(true),execute:safeExecute(x=>desk.upset(x))},
  {name:'set_fan_preferences',description:'Applies a ranking lens and optional favorite team to this browser session. This reversible action sends nothing externally.',inputSchema:objectSchema({risk_profile:{type:'string',enum:['balanced','safe','upset'],description:'Balanced, favorites-first, or upset-focused ranking.'},favorite_team:{type:'string',description:'Optional team name from the curated scenarios.',maxLength:30}},['risk_profile']),annotations:annotations(false),execute:safeExecute(x=>desk.setPreferences(x))},
  {name:'build_match_shortlist',description:'Replaces the session watchlist with one to three valid match identifiers. This local action is reversible.',inputSchema:objectSchema({match_ids:{type:'array',description:'One to three unique scenario identifiers.',items:{type:'string',maxLength:40},minItems:1,maxItems:3,uniqueItems:true}},['match_ids']),annotations:annotations(false),execute:safeExecute(x=>desk.buildShortlist(x))}
]}

export async function registerWebMCP(definitions,modelContext=globalThis.document?.modelContext){
  if(!modelContext?.registerTool)return {available:false,registered:0};
  for(const tool of definitions)await modelContext.registerTool(tool);
  return {available:true,registered:definitions.length};
}
