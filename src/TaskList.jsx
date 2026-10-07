import React,{useState} from 'react';
import {ArrowUp,Check,LoaderCircle,MessageCircle,Pause,Play,RotateCcw,Plus} from 'lucide-react';
import './tasks.css';
const statusLabel={queued:'Up next',running:'Working on it',needs_input:'Needs your input',completed:'Done',failed:'Needs a retry',paused:'Paused'};
function Task({task,onAnswer,onRetry}){
 const [answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(false);
 async function submit(e){e.preventDefault();if(!answer.trim())return;setBusy(true);try{await onAnswer(task.id,answer);setAnswer('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <li className={'task-row task-'+task.status}><div className="task-line"><span className="task-state">{task.status==='completed'?<Check size={16}/>:task.status==='running'?<LoaderCircle size={16} className="spin"/>:task.status==='needs_input'?<MessageCircle size={16}/>:<span className="task-circle"/>}</span><button className="task-title" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>{task.text}</button><small>{task.status==='running'?'Working':task.status==='needs_input'?'Your input':statusLabel[task.status]||task.status}</small>{['failed','paused'].includes(task.status)&&<button aria-label={'Retry '+task.text} onClick={()=>onRetry(task.id)}><RotateCcw size={14}/></button>}</div>
 {task.status==='needs_input'&&task.question&&<form className="task-question" onSubmit={submit}><p>{task.question.prompt}</p>{task.question.choices?.length>0&&<div className="task-choices">{task.question.choices.map(choice=><button type="button" key={choice} aria-pressed={answer===choice} onClick={()=>setAnswer(choice)}>{choice}</button>)}</div>}<div className="task-answer"><input aria-label="Your answer" placeholder="Or write your answer…" value={answer} onChange={e=>setAnswer(e.target.value)} disabled={busy}/><button aria-label="Send answer" disabled={busy||!answer.trim()}><ArrowUp size={16}/></button></div>{error&&<small role="alert">{error}</small>}</form>}
 {expanded&&<p className="task-result">{task.result||task.text}</p>}
 {task.error&&<p className="task-error">{task.error}</p>}
 
 </li>
}
export default function TaskList({tasks=[],paused,onAdd,onAnswer,onRetry,onPause}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e){e.preventDefault();if(!text.trim())return;setBusy(true);setError('');try{await onAdd(text);setText('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 const active=tasks.filter(t=>!['completed','cancelled'].includes(t.status)),done=tasks.filter(t=>t.status==='completed');
 return <section className="scout-tasks"><div className="tasks-heading"><span className="tasks-label">Scout’s to-do</span>{active.length>0&&<button className="task-pause" onClick={()=>onPause(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>} {paused?'Resume':'Pause'}</button>}</div><form className="task-composer" onSubmit={submit}><Plus size={18}/><input aria-label="Give Scout a task" maxLength={1200} placeholder="Ask Scout to do something…" value={text} onChange={e=>setText(e.target.value)} disabled={busy}/><button aria-label="Add task" disabled={busy||text.trim().length<3}>{busy?<LoaderCircle size={18} className="spin"/>:<ArrowUp size={18}/>}</button></form>{error&&<p className="task-error" role="alert">{error}</p>}
 <ul className="task-list">{active.map(t=><Task key={t.id} task={t} onAnswer={onAnswer} onRetry={onRetry}/>)}</ul>{done.length>0&&<details className="tasks-done"><summary>{done.length} taken care of</summary><ul className="task-list">{done.map(t=><Task key={t.id} task={t} onAnswer={onAnswer} onRetry={onRetry}/>)}</ul></details>}
 </section>
}
