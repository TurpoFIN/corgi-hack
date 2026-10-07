import test from 'node:test';
import assert from 'node:assert/strict';
import {newTask,answerTask,taskInstruction,questionSchema} from './tasks.js';
test('tasks retain free text, choices and clarification across resume',()=>{const t=newTask({text:'Find a workout'});t.status='needs_input';t.question=questionSchema.parse({prompt:'Which workout?',choices:['Yoga','Weights']});answerTask(t,{answer:'Yoga, after 5 pm'});assert.equal(t.status,'queued');assert.equal(t.question,null);assert.ok(taskInstruction(t).includes('Yoga, after 5 pm'));assert.throws(()=>answerTask(t,{answer:'Again'}));});
test('empty requests and unbounded choice lists are rejected',()=>{assert.throws(()=>newTask({text:' '}));assert.throws(()=>questionSchema.parse({prompt:'Which?',choices:['a','b','c','d','e']}));});
