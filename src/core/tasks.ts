import type {Sheet,Task} from './model';
export const dayNumber=(value:string)=>Math.floor(Date.parse(value+'T00:00:00Z')/86400000);
export const dateFromDay=(value:number)=>new Date(value*86400000).toISOString().slice(0,10);
export function taskDuration(task:Task):number|undefined{return task.start&&task.due?dayNumber(task.due)-dayNumber(task.start)+1:undefined;}
export function validateDependencies(sheet:Sheet){
  const visiting=new Set<string>(),done=new Set<string>();
  const visit=(id:string)=>{if(visiting.has(id))throw new Error('任務相依性不能形成循環。');if(done.has(id))return;visiting.add(id);
    for(const dependency of sheet.nodes[id].task?.dependencies??[]){if(!sheet.nodes[dependency]?.task)throw new Error('相依任務不存在。');visit(dependency);}
    visiting.delete(id);done.add(id);};
  for(const id of Object.keys(sheet.nodes))if(sheet.nodes[id].task)visit(id);
}
export function scheduleDependencies(sheet:Sheet){
  validateDependencies(sheet);const done=new Set<string>();
  const schedule=(id:string)=>{if(done.has(id))return;const task=sheet.nodes[id].task!;for(const dep of task.dependencies??[])schedule(dep);
    const duration=taskDuration(task);if(duration){const earliest=Math.max(dayNumber(task.start),...(task.dependencies??[]).map(dep=>sheet.nodes[dep].task?.due?dayNumber(sheet.nodes[dep].task!.due)+1:-Infinity));task.start=dateFromDay(earliest);task.due=dateFromDay(earliest+duration-1);}
    done.add(id);};
  Object.keys(sheet.nodes).filter(id=>sheet.nodes[id].task).forEach(schedule);
}
