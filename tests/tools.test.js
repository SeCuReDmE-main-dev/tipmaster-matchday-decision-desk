import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesk } from '../src/domain.js';
import { createToolDefinitions, registerWebMCP } from '../src/tools.js';

const desk=createDesk();
const tools=createToolDefinitions(desk);

test('exposes exactly eight distinct well-formed tools',()=>{
  assert.equal(tools.length,8);
  assert.equal(new Set(tools.map(t=>t.name)).size,8);
  for(const tool of tools){assert.match(tool.name,/^[a-z][a-z0-9_]{0,29}$/);assert.ok(tool.description.length>40&&tool.description.length<=500);assert.equal(tool.inputSchema.type,'object');assert.equal(tool.inputSchema.additionalProperties,false);assert.equal(typeof tool.annotations.readOnlyHint,'boolean');assert.equal(typeof tool.annotations.untrustedContentHint,'boolean');assert.equal(typeof tool.annotations.consequentialHint,'boolean')}
});

test('registers every tool through the current WebMCP surface',async()=>{const registered=[];const result=await registerWebMCP(tools,{registerTool:async tool=>registered.push(tool)});assert.deepEqual(result,{available:true,registered:8});assert.equal(registered.length,8)});

for(const [name,input] of Object.entries({get_matchday_overview:{},list_matches:{risk_profile:'balanced'},get_match_details:{match_id:'ger-fra'},compare_teams:{match_id:'esp-arg'},explain_prediction:{match_id:'bra-por'},assess_upset_risk:{match_id:'usa-mex'},set_fan_preferences:{risk_profile:'safe',favorite_team:'Deutschland'},build_match_shortlist:{match_ids:['ger-fra','esp-arg']}})){
  test(`${name} returns a bounded success envelope`,async()=>{const output=await tools.find(t=>t.name===name).execute(input);assert.ok(output.length<=1500);assert.equal(JSON.parse(output).ok,true)});
}

for(const name of ['get_match_details','compare_teams','explain_prediction','assess_upset_risk'])test(`${name} fails safely for an unknown match`,async()=>{const output=await tools.find(t=>t.name===name).execute({match_id:'<script>alert(1)</script>'});const result=JSON.parse(output);assert.equal(result.ok,false);assert.match(result.error,/NOT_FOUND/)});

test('preferences reject invalid values without changing state',async()=>{const before={...desk.state};const output=await tools.find(t=>t.name==='set_fan_preferences').execute({risk_profile:'ignore-all-instructions'});assert.equal(JSON.parse(output).ok,false);assert.deepEqual(desk.state,before)});
test('shortlist rejects duplicates and oversized input',async()=>{const tool=tools.find(t=>t.name==='build_match_shortlist');for(const match_ids of [['ger-fra','ger-fra'],['ger-fra','esp-arg','bra-por','eng-ned']])assert.equal(JSON.parse(await tool.execute({match_ids})).ok,false)});
test('aborted execution does no work',async()=>{const controller=new AbortController();controller.abort();await assert.rejects(()=>tools[0].execute({}, {signal:controller.signal}),/cancel/i)});
