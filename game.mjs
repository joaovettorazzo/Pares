export function player(name,bot=false){return {id:crypto.randomUUID(),name,bot,hand:[],pairs:[],score:0,total:0}}
const pick=a=>a[Math.floor(Math.random()*a.length)]
function receive(p,c){let i=p.hand.findIndex(x=>x.n===c.n);if(i<0)p.hand.push(c);else p.pairs.push([p.hand.splice(i,1)[0],c])}
function clock(r){r.since=Date.now()}
function contenders(r){return r.round>r.rounds && r.finalists ? r.players.filter(p=>r.finalists.includes(p.id)) : r.players}
function finish(r){let empty=contenders(r).filter(p=>!p.hand.length);if(!empty.length)return false
let best=Math.max(...empty.map(p=>p.pairs.length)), winners=empty.filter(p=>p.pairs.length===best)
for(let p of r.players)p.total+=p.pairs.length
if(winners.length===1){winners[0].score+=best;r.result=winners[0].name+' venceu e marcou '+best+' ponto(s).'}else r.result='Empate na rodada. Ninguém pontuou.'
r.phase='intervalo'
if(r.round>=r.rounds){
  const top=Math.max(...r.players.map(p=>p.score))
  const leaders=r.players.filter(p=>p.score===top)
  const decisive=r.round>r.rounds && winners.length===1
  if(decisive || (r.round===r.rounds && leaders.length===1)){
    r.champion=(decisive?winners[0]:leaders[0]).id
    r.phase='fim'
  }else{
    if(!r.finalists)r.finalists=leaders.map(p=>p.id)
    r.result+=' Os líderes disputam uma rodada de desempate.'
  }
}
return true}
export function deal(r){r.round++;r.deck=[];for(let color=0;color<4;color++)for(let n=0;n<10;n++)for(let k=0;k<(n?4:2);k++)r.deck.push({n,color})
for(let i=r.deck.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[r.deck[i],r.deck[j]]=[r.deck[j],r.deck[i]]}
for (const p of r.players) {
  p.hand = []
  p.pairs = []
}
for (let pass = 0; pass < 8; pass++) {
  for (const p of contenders(r)) {
    let candidates = r.deck
    if (Math.random() < 0.88) {
      const unmatched = r.deck.filter(card => !p.hand.some(held => held.n === card.n))
      if (unmatched.length) candidates = unmatched
    }
    const chosen = pick(candidates)
    r.deck.splice(r.deck.indexOf(chosen), 1)
    receive(p, chosen)
  }
}
r.turn=r.players.indexOf(pick(contenders(r)));r.phase='jogo';r.log='Cartas distribuídas.';clock(r);finish(r)}
function advance(r){const seats=contenders(r);r.turn=r.players.indexOf(seats[(seats.indexOf(r.players[r.turn])+1)%seats.length]);clock(r)}
export function ask(r,id,n,color){let p=r.players[r.turn],q=r.players.find(x=>x.id===id);if(!q||q===p||!contenders(r).includes(q)||!p.hand.some(c=>c.n===n&&c.color===color))throw Error('Pedido inválido.')
let i=q.hand.findIndex(c=>c.n===n);r.log=p.name+' pediu '+n+' a '+q.name+'. '
if(i>=0){receive(p,q.hand.splice(i,1)[0]);r.log+='Par formado!'}else if(r.deck.length){receive(p,r.deck.pop());r.log+='Comprou uma carta.'}else r.log+='Monte vazio.'
if(!finish(r))advance(r)}
export function tick(r){if(r.phase!=='jogo')return false;let p=r.players[r.turn],age=Date.now()-r.since
if(p.bot&&age>=Math.min(1200,r.seconds?r.seconds*500:1200)){ask(r,pick(contenders(r).filter(q=>q!==p)).id,pick(p.hand).n);return true}
if(r.seconds&&age>=r.seconds*1000){r.log=p.name+' perdeu a vez por tempo.';advance(r);return true}return false}
