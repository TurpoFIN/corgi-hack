import React,{useState} from 'react';
import {ArrowUp,Check,Pause,Play,RotateCcw,Plus,ChevronDown,ExternalLink} from 'lucide-react';
import {taskSections,taskStage,taskOutcome,completionTime} from './task-presentation';
import './tasks.css';
function Task({task,onAnswer,onRetry,context}){
 const [answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(false);
 const completed=task.status==='completed',outcome=completed?taskOutcome(task):'';
 async function submit(e){e.preventDefault();if(!answer.trim())return;setBusy(true);try{await onAnswer(task.id,answer);setAnswer('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <li className={'task-row task-'+task.status}>
 <div className="task-line"><span className={'task-check '+(completed?'is-complete':'')} role="img" aria-label={completed?'Completed task':'Incomplete task'}>{completed&&<Check size={12} strokeWidth={3}/>}</span><button className="task-title" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}><span>{task.text}</span>{outcome&&<small>{outcome}</small>}</button><div className="task-meta">{!completed&&<span className={'task-status status-'+task.status}>{taskStage(task,context)}</span>}{completed&&task.finishedAt&&<time dateTime={task.finishedAt}>{completionTime(task.finishedAt)}</time>}{['failed','paused'].includes(task.status)&&<button className="task-retry" aria-label={'Retry '+task.text} onClick={()=>onRetry(task.id)}><RotateCcw size={13}/></button>}</div></div>
 {task.status==='needs_input'&&task.question&&<form className="task-question" onSubmit={submit}><p>{task.question.prompt}</p>{task.question.choices?.length>0&&<div className="task-choices">{task.question.choices.map(choice=><button type="button" key={choice} aria-pressed={answer===choice} onClick={()=>setAnswer(choice)}>{choice}</button>)}</div>}<div className="task-answer"><input aria-label="Your answer" placeholder="Or write your answer…" value={answer} onChange={e=>setAnswer(e.target.value)} disabled={busy}/><button aria-label="Send answer" disabled={busy||!answer.trim()}><ArrowUp size={16}/></button></div>{error&&<small role="alert">{error}</small>}</form>}
 {expanded&&<div className="task-detail"><p>{task.result||task.text}</p>{(task.opportunities||[]).map(o=><a key={o.id||o.url} href={o.url} target="_blank" rel="noreferrer">{o.title}<ExternalLink size={12}/></a>)}</div>}
 {task.error&&<p className="task-error">{task.error}</p>}
 </li>
}
export default function TaskList({tasks=[],paused,onAdd,onAnswer,onRetry,onPause,mission,discovery}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[showAll,setShowAll]=useState(false);
 async function submit(e){e.preventDefault();if(!text.trim())return;setBusy(true);setError('');try{await onAdd(text);setText('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 const {open,completed,completedToday}=taskSections(tasks),context={mission,discovery,paused};
 const row=t=><Task key={t.id} task={t} onAnswer={onAnswer} onRetry={onRetry} context={context}/>;
 return <section className="scout-tasks" aria-label="Scout tasks"><div className="tasks-heading"><h2>Tasks</h2><div><span className="tasks-today"><Check size={12}/>{completedToday} completed today</span>{open.length>0&&<button className="task-pause" onClick={()=>onPause(!paused)}>{paused?<Play size={12}/>:<Pause size={12}/>} {paused?'Resume queue':'Pause queue'}</button>}</div></div>
 <form className="task-composer" onSubmit={submit} aria-busy={busy}><Plus size={15}/><input aria-label="Give Scout a task" maxLength={1200} placeholder="Add a task for Scout…" value={text} onChange={e=>setText(e.target.value)} disabled={busy}/><button aria-label="Add task" disabled={busy||text.trim().length<3}><ArrowUp size={16}/></button></form>{error&&<p className="task-error" role="alert">{error}</p>}
 <div className="task-section-label"><h3>To do</h3><span>{open.length}</span></div>{open.length?<ul className="task-list" aria-label="To do">{open.map(row)}</ul>:<p className="tasks-clear">All caught up. Nothing waiting.</p>}
 {completed.length>0&&<><div className="task-section-label recent"><h3>Recently completed</h3></div><ul className="task-list completed-task-cards" aria-label="Recently completed">{(showAll?completed:completed.slice(0,5)).map(row)}</ul>{completed.length>5&&<button className="task-history" onClick={()=>setShowAll(!showAll)}>{showAll?'Show recent only':`Show all ${completed.length} completed tasks`}<ChevronDown size={12}/></button>}</>}
 </section>
}
