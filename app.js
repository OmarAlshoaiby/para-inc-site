// Para-Inc storefront client logic — data-driven, multi-tier catalog.
const BTC_ADDR = "364o5WYNJ1haHo1Boev2e3Kz3fGyeB9DfA";
const ETH_ADDR = "0xABF1Ef597CC830f801B8783d5f29780B452bc39B";
const USDT_ADDR = "0xABF1Ef597CC830f801B8783d5f29780B452bc39B";
const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
// Measurement beacon: Para-Inc server logs every store open. Updated per tunnel cycle.
const BEACON = "https://phantom-islands-vocals-continuity.trycloudflare.com/beacon";

// Each product: id, title, priceUSD, file (download path), items[]
const PRODUCTS = [
  { id:"starter", title:"AI & Automation Starter Pack", usd:10,
    file:"bundle/para-inc-starter-pack.zip",
    items:["The AI Automation Playbook","Prompt Engineering Field Manual","The Solo Founder's Systems Kit"] },
  { id:"hustle", title:"AI Side-Hustle Playbook + Client Magnet Scripts", usd:29,
    file:"bundle/ai-sidehustle-bundle.zip",
    items:["AI Side-Hustle Playbook (5 pages)","Client Magnet Scripts (copy-paste outreach)"] },
  { id:"prompt", title:"Vertical Prompt Pack (Agency / Solopreneur / Freelancer)", usd:19,
    file:"bundle/prompt-pack-bundle.zip",
    items:["Agency Cold Outreach prompts","Solo Founder Systems prompts","Freelancer Proposal prompts","Chained recipes + Quickstart"] },
  { id:"n8n", title:"n8n Workflow Bundle (5 importable automations)", usd:39,
    file:"bundle/n8n-workflow-bundle.zip",
    items:["RSS->Telegram","Gmail->Sheet","Webhook->Discord","Weekly Report","TG Bot Logger","Setup + Credentials + Troubleshooting + docker-compose"] },
  { id:"seo", title:"AI SEO Programmatic Kit", usd:49,
    file:"bundle/ai-seo-kit.zip",
    items:["SEO Publish n8n workflow","E-E-A-T + FAQ prompt","Sitemap + internal-link scripts","SOP"] },
  { id:"yt", title:"Faceless YouTube Kit", usd:47,
    file:"bundle/faceless-yt-kit.zip",
    items:["Faceless Video n8n workflow","Script + Title/Thumbnail prompts","25 niches","Upload checklist"] },
  { id:"agency", title:"Agency Tier (Resell License + Everything)", usd:99,
    file:"bundle/agency-tier.zip",
    items:["All products above","Resell license","Client-reporting workflow"] },
  { id:"full", title:"The Complete Para-Inc Bundle", usd:49,
    file:"bundle/para-inc-complete-bundle.zip",
    items:["All Starter Pack PDFs","Both playbooks","Prompt pack","n8n bundle","Free preview + future updates"] },
];

const RATES = { BTC: 64000, ETH: 3100, USDT: 1 };
let cur = PRODUCTS[0];

function fmt(n,d){ return n.toLocaleString("en-US",{maximumFractionDigits:d,minimumFractionDigits:d}); }

async function price(){
  try{
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd");
    const j = await r.json();
    RATES.BTC = j.bitcoin.usd; RATES.ETH = j.ethereum.usd; RATES.USDT = j.tether.usd;
  }catch(e){}
  renderProducts();
}

function renderProducts(){
  const grid = document.getElementById("products");
  grid.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const btc = p.usd / RATES.BTC, eth = p.usd / RATES.ETH, usdt = p.usd / RATES.USDT;
    const card = document.createElement("div");
    card.className = "prod";
    card.innerHTML = `
      <div class="ptitle">${p.title}</div>
      <div class="price">$${p.usd} <span class="life">/ lifetime, instant download</span></div>
      <ul class="pitems">${p.items.map(i=>`<li>${i}</li>`).join("")}</ul>
      <div class="tabs">
        <div class="tab on" data-c="BTC" onclick="sel('${p.id}','BTC',this)">Bitcoin</div>
        <div class="tab" data-c="ETH" onclick="sel('${p.id}','ETH',this)">Ethereum</div>
        <div class="tab" data-c="USDT" onclick="sel('${p.id}','USDT',this)">USDT</div>
      </div>
      <div id="${p.id}-BTC"><div class="amt">${fmt(btc,8)} BTC</div><div class="addr">${BTC_ADDR}</div></div>
      <div id="${p.id}-ETH" style="display:none"><div class="amt">${fmt(eth,6)} ETH</div><div class="addr">${ETH_ADDR}</div></div>
      <div id="${p.id}-USDT" style="display:none"><div class="amt">${fmt(usdt,2)} USDT</div><div class="addr">${USDT_ADDR}</div></div>
      <label class="lbl">Transaction ID / Hash</label>
      <input id="${p.id}-txid" placeholder="paste txid or 0x... hash" autocomplete="off">
      <button onclick="verify('${p.id}')">Verify & Unlock</button>
      <div class="msg" id="${p.id}-msg"></div>
      <div class="dl" id="${p.id}-dl"><a href="${p.file}" download>Download ${p.title} (ZIP)</a></div>`;
    grid.appendChild(card);
  });
}

function sel(id, coin, el){
  ["BTC","ETH","USDT"].forEach(c=>{
    document.getElementById(`${id}-${c}`).style.display = c===coin?"block":"none";
  });
  const tabs = el.parentElement.querySelectorAll(".tab");
  tabs.forEach(t=>t.classList.toggle("on", t.dataset.c===coin));
}

async function verify(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const coin = [...document.getElementById(`${id}-BTC`).parentElement.querySelectorAll(".tab")].find(t=>t.classList.contains("on")).dataset.c;
  const txid = document.getElementById(`${id}-txid`).value.trim();
  const msg = document.getElementById(`${id}-msg`);
  const dl = document.getElementById(`${id}-dl`);
  msg.className="msg"; msg.textContent=""; dl.style.display="none";
  if(!txid){ msg.className="msg err"; msg.textContent="Paste your transaction ID first."; return; }
  msg.className="msg"; msg.textContent="Verifying on-chain...";
  const slack = 0.98;
  try{
    let ok=false;
    if(coin==="BTC"){
      const tx = await (await fetch("https://blockstream.info/api/tx/"+txid)).json();
      const sats = tx.vout.filter(o=>o.scriptpubkey_address===BTC_ADDR).reduce((a,o)=>a+Math.round(o.value),0);
      ok = sats >= Math.round((p.usd/RATES.BTC)*1e8*slack);
    } else if(coin==="ETH"){
      const r = await fetch("https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash="+txid);
      const d = (await r.json()).result;
      if(!d || !d.to) throw new Error("tx not found");
      if(d.to.toLowerCase()===ETH_ADDR.toLowerCase()){
        ok = parseInt(d.value,16)/1e18 >= (p.usd/RATES.ETH)*slack;
      }
    } else {
      const r = await fetch("https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash="+txid);
      const d = (await r.json()).result;
      if(!d || !d.to) throw new Error("tx not found");
      if(d.to.toLowerCase()===USDT_CONTRACT.toLowerCase()){
        const inp=(d.input||"").toLowerCase();
        if(inp.startsWith("0xa9059cbb")){
          const amt=parseInt(inp.slice(10+40,10+40+64),16)/1e6;
          ok = amt >= (p.usd/RATES.USDT)*slack;
        }
      }
    }
    if(ok){ msg.className="msg ok"; msg.textContent="Confirmed. Download unlocked."; dl.style.display="block"; }
    else { msg.className="msg err"; msg.textContent="No $"+p.usd+"+ payment to Para-Inc found yet. If you just sent it, wait 1 confirmation and retry."; }
  }catch(e){ msg.className="msg err"; msg.textContent="Verification error: "+e.message; }
}

price();
