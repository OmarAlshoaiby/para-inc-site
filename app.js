// ===== Para-Inc site config (fill before deploy) =====
const CONFIG = {
  // Contact + work requests via GitHub Issues (no email/KYC needed):
  SERVICE_ISSUE_URL: "https://github.com/OmarAlshoaiby/para-inc-site/issues/new?title=Automation%20request&body=Describe%20what%20you%20want%20automated%20and%20your%20budget%20(%24200%2F%24500%2F%241000).%20Services%20paid%20in%20crypto%20to%20the%20Para-Inc%20wallets.",
  // Crypto wallets (verified, owned by Omar/Para-Inc):
  BTC_ADDR: "bc1q579hezg4jcnja063wfpatufp345f5g2pmz6xkt",
  ETH_ADDR: "0xc6021f8a10a4dadd564310180292fb7548183252",
  PRODUCT_USD: 10
};
// ====================================================

const USD = CONFIG.PRODUCT_USD;
let coin = "BTC";
const RATES = { BTC: 64000, ETH: 3100 };

function fmt(n, d){ return n.toLocaleString("en-US",{maximumFractionDigits:d,minimumFractionDigits:d}); }

document.querySelectorAll("#cta-service").forEach(el => {
  el.href = CONFIG.SERVICE_ISSUE_URL;
  el.target = "_blank";
  el.rel = "noopener";
});

async function price(){
  try{
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    const j = await r.json();
    RATES.BTC = j.bitcoin.usd; RATES.ETH = j.ethereum.usd;
  }catch(e){}
  render();
}
function render(){
  const btc = USD / RATES.BTC, eth = USD / RATES.ETH;
  document.getElementById("btcAmt").textContent = fmt(btc,8) + " BTC ≈ $" + USD;
  document.getElementById("btcAddr").textContent = CONFIG.BTC_ADDR;
  document.getElementById("ethAmt").textContent = fmt(eth,6) + " ETH ≈ $" + USD;
  document.getElementById("ethAddr").textContent = CONFIG.ETH_ADDR;
  window._btc = btc; window._eth = eth;
}
function sel(c){
  coin = c;
  document.getElementById("tBTC").classList.toggle("on", c==="BTC");
  document.getElementById("tETH").classList.toggle("on", c==="ETH");
  document.getElementById("BTC").style.display = c==="BTC"?"block":"none";
  document.getElementById("ETH").style.display = c==="ETH"?"block":"none";
}
async function verify(){
  const txid = document.getElementById("txid").value.trim();
  const msg = document.getElementById("msg");
  msg.className = "msg"; msg.textContent = "";
  if(!txid){ msg.className="msg err"; msg.textContent="Paste your transaction ID first."; return; }
  msg.textContent="Verifying on-chain…";
  try{
    let ok = coin==="BTC" ? await checkBTC(txid) : await checkETH(txid);
    if(ok){ msg.className="msg ok"; msg.textContent="✓ Confirmed. Your download is unlocked."; document.getElementById("dl").style.display="block"; }
    else{ msg.className="msg err"; msg.textContent="Could not confirm a $"+USD+"+ payment to the Para-Inc address yet. Wait for 1 confirmation and retry, or contact Para-Inc."; }
  }catch(e){ msg.className="msg err"; msg.textContent="Verification error: "+e.message; }
}
async function checkBTC(txid){
  const r = await fetch("https://blockstream.info/api/tx/"+txid);
  if(!r.ok) throw new Error("tx not found");
  const j = await r.json();
  const sats = j.vout.filter(o=>o.scriptpubkey_address===CONFIG.BTC_ADDR).reduce((a,o)=>a+Math.round(o.value),0);
  return sats >= Math.round(window._btc*1e8*0.98);
}
async function checkETH(txid){
  const r = await fetch("https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash="+txid);
  const data = (await r.json()).result;
  if(!data || !data.to) throw new Error("tx not found on Etherscan");
  if((data.to||"").toLowerCase() !== CONFIG.ETH_ADDR.toLowerCase()) return false;
  return parseInt(data.value,16)/1e18 >= window._eth*0.98;
}
price();
