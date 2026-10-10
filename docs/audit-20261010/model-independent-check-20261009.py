"""Independent arithmetic check using public, dated production observations only."""
import json, math, datetime, statistics
from collections import defaultdict
from pathlib import Path
p=json.loads(Path(__file__).with_name('model-production-20261009.json').read_text()); s=p['series']
def past(key,days):
    end=s[key][-1]; cutoff=datetime.date.fromisoformat(end['date'])-datetime.timedelta(days=days)
    return end,next(x for x in reversed(s[key]) if datetime.date.fromisoformat(x['date'])<=cutoff)
def pct(key,days):
    a,b=past(key,days);return 100*(a['value']/b['value']-1)
def diff(key,days):
    a,b=past(key,days);return a['value']-b['value']
def monthly(key,average=False):
    d=defaultdict(list)
    for x in s[key]:d[x['date'][:7]].append(x['value'])
    return {m:statistics.mean(v) if average else v[-1] for m,v in d.items()}
def cl(x):return max(0,min(100,math.floor(x+.5)))
changes={'m2Growth':pct('m2',365),'rateChange':diff('fedFunds',365),'cpiGrowth':pct('cpi',365),'oilMomentum':pct('oil',90),'dollarMomentum':pct('dollar',90),'industrialGrowth':pct('industrialProduction',365),'unemploymentChange':diff('unemployment',365),'capacityChange':diff('capacityUtilization',365)}
for k,v in changes.items():assert abs(v-p['derived']['changes'][k])<1e-10,k
c=monthly('cpi',True);f=monthly('fedFunds',True);month=max(m for m in c.keys()&f.keys() if str(int(m[:4])-1)+m[4:] in c); prior=str(int(month[:4])-1)+month[4:];rr=f[month]-100*(c[month]/c[prior]-1)
assert abs(rr-p['derived']['ratios']['realRate'])<1e-10
v=changes; scores={'money':cl(50+6*v['m2Growth']),'monetaryStance':cl(45-8*v['rateChange']-3*rr),'creditRisk':cl(15+17*s['creditSpread'][-1]['value']+.9*s['vix'][-1]['value']),'termStructure':cl(35+35*max(0,-s['yieldCurve'][-1]['value'])),'production':cl(45-6*v['industrialGrowth']-5*v['capacityChange']),'labour':cl(35+25*v['unemploymentChange']),'consumerPrices':cl(25+12*v['cpiGrowth']),'resourcesFx':cl(40+.55*v['oilMomentum']-.65*v['dollarMomentum'])}
weights=dict(zip(scores,[.14,.13,.13,.10,.12,.08,.09,.06]));total=sum(weights.values());unrounded=sum(v*weights[k] for k,v in scores.items())/total
for k,v in scores.items():assert v==p['derived']['scores'][k],k
assert cl(unrounded)==p['derived']['scores']['composite']
ratios={}
for name,a,b in [('bitcoinGoldOunces','bitcoin','gold'),('sp500Gold','sp500','gold')]:
    a,b=monthly(a,True),monthly(b,True);m=max(a.keys()&b.keys());value=a[m]/b[m];assert abs(value-p['derived']['ratios'][name])<1e-10;ratios[name]={'month':m,'value':value}
correlations={}
for name,a,b in [('m2_sp500','m2','sp500'),('dollar_gold','dollar','gold'),('oil_cpi','oil','cpi'),('bitcoin_m2','bitcoin','m2'),('bitcoin_gold','bitcoin','gold'),('sp500_gold','sp500','gold')]:
    a,b=monthly(a),monthly(b);months=sorted(a.keys()&b.keys());pairs=[]
    serial=lambda m:int(m[:4])*12+int(m[5:])
    for left,right in zip(months,months[1:]):
        if serial(right)-serial(left)==1 and a[left] and b[left]:pairs.append((a[right]/a[left]-1,b[right]/b[left]-1))
    pairs=pairs[-60:];value=statistics.correlation([x for x,y in pairs],[y for x,y in pairs]);assert abs(value-p['derived']['correlations'][name])<1e-12,name;correlations[name]={'pairs':len(pairs),'value':value}
print(json.dumps({'edition':p['requestedAt'],'changes':changes,'alignedRealRate':{'month':month,'value':rr},'scores':scores,'weight':total,'weightedNumerator':sum(v*weights[k] for k,v in scores.items()),'unroundedComposite':unrounded,'composite':cl(unrounded),'ratios':ratios,'correlations':correlations,'result':'PASS for arithmetic on eligible live inputs; excluded fiscal scores are not valid observations'},indent=2))
