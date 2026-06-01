const https = require('https');
const YF_HEADERS = {'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',Accept:'application/json, text/plain, */*','Accept-Language':'en-US,en;q=0.9',Referer:'https://finance.yahoo.com/',Origin:'https://finance.yahoo.com'};
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'*','Content-Type':'application/json'};
function get(url){return new Promise((resolve,reject)=>{const req=https.get(url,{headers:YF_HEADERS},(res)=>{const chunks=[];res.on('data',(c)=>chunks.push(c));res.on('end',()=>resolve(Buffer.concat(chunks).toString()));});req.on('error',reject);req.setTimeout(9000,()=>{req.destroy();reject(new Error('timeout'));});});}
exports.handler = async(event)=>{
  if(event.httpMethod==='OPTIONS')return{statusCode:204,headers:CORS,body:''};
  const symbol=(event.queryStringParameters?.symbol||'').toUpperCase().trim();
  if(!symbol)return{statusCode:400,headers:CORS,body:JSON.stringify({error:'Missing symbol'})};
  const path=`${encodeURIComponent(symbol)}?interval=1d&range=6mo&includePrePost=false`;
  const url1=`https://query1.finance.yahoo.com/v8/finance/chart/${path}`;
  const url2=`https://query2.finance.yahoo.com/v8/finance/chart/${path}`;
  try{const body=await get(url1);return{statusCode:200,headers:CORS,body};}
  catch(e){try{const body=await get(url2);return{statusCode:200,headers:CORS,body};}catch(e2){return{statusCode:502,headers:CORS,body:JSON.stringify({error:e2.message})};}}
};
