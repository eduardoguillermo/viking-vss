
// =======================================================
// DATA
// =======================================================
const SKEY='vss4';
function defData(){
  return {
    nid:1,
    clientes:[],
    versiones:[],
    tipos:['Puerta','Ventana','Movimiento PIR','Botón','Humo','Vibración','Agua','Temperatura'],
    presupuestos:[],
    componentes:[],
    movimientos:[],
    ordenes:[]
  };
}

// Initialize DB from localStorage or defaults
let DB;
try {
  DB = JSON.parse(localStorage.getItem(SKEY));
  if(!DB || !DB.clientes) DB = defData();
} catch(e) {
  DB = defData();
}
// Migrate missing fields
if(!DB.presupuestos) DB.presupuestos = [];
if(!DB.componentes) DB.componentes = [];
if(!DB.movimientos) DB.movimientos = [];
if(!DB.ordenes) DB.ordenes = [];
DB.clientes.forEach(function(c){
  if(!c.barrio) c.barrio='';
  if(!c.email) c.email='';
  if(!c.ambientes) c.ambientes='';
  if(!c.equipo) c.equipo={};
  if(!c.zigbee) c.zigbee=[];
  if(!c.ota) c.ota=[];
  if(!c.mant) c.mant=[];
});
DB.presupuestos.forEach(function(p){if(!p.email) p.email='';if(!p.ambientes) p.ambientes='';});
DB.componentes.forEach(function(c){if(!c.area) c.area='Fábrica';});

function save(){ localStorage.setItem(SKEY,JSON.stringify(DB)); }

// =======================================================
// NAV
// =======================================================
let curCid=null, curSub='datos';
const PANELS=['clientes','alta','detalle','versiones','tipos','backup','presupuestos','stock','catalogo','movimientos','ordenes'];

function goTo(p){
  PANELS.forEach(x=>{
    document.getElementById('panel-'+x).classList.toggle('on',x===p);
    const n=document.getElementById('nav-'+x);
    if(n) n.classList.toggle('on',x===p);
  });
  const titles={clientes:'Clientes',alta:'Alta de cliente',detalle:'Ficha de cliente',versiones:'Versiones de software',tipos:'Tipos de sensor',backup:'Backup / Restaurar',presupuestos:'Presupuestos',stock:'Stock actual',catalogo:'Catálogo de componentes',movimientos:'Movimientos de stock',ordenes:'Órdenes de compra'};
  document.getElementById('ptitle').textContent=titles[p]||p;
  document.getElementById('tctx').textContent='';
  const pa=document.getElementById('pacts'); pa.innerHTML='';
  if(p==='clientes'){
    pa.innerHTML='<button class="btn btn-p" onclick="goTo(\'alta\')">➕ Nuevo cliente</button>';
    renderStats(); renderClientes();
  }
  if(p==='alta') limpiarAlta();
  if(p==='versiones') renderVersiones();
  if(p==='tipos') renderTipos();
  if(p==='backup') renderBackupInfo();
  if(p==='presupuestos') renderPresupuestos();
  if(p==='stock') renderStock();
  if(p==='catalogo') renderCatalogo();
  if(p==='movimientos') renderMovimientos();
  if(p==='ordenes') renderOrdenes();
}

// =======================================================
// SUBPANELS
// =======================================================
const SUBS=['datos','equipo','zigbee','ota','mant'];
function goSub(s){
  SUBS.forEach(x=>{
    document.getElementById('sp-'+x).classList.toggle('on',x===s);
    document.getElementById('sni-'+x).classList.toggle('on',x===s);
  });
  curSub=s;
  if(s==='datos') renderDatos();
  if(s==='equipo') renderEquipo();
  if(s==='zigbee') renderZigbee();
  if(s==='ota') renderOTA();
  if(s==='mant') renderMant();
}

// =======================================================
// HELPERS
// =======================================================
function gc(){ return DB.clientes.find(x=>x.id===curCid); }
function ini(n){ return n.split(/[,\s]+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
const AVC=['background:#E3F2FD;color:#0D47A1','background:#E8F5E9;color:#1B5E20','background:#FFF8E1;color:#7B4F00','background:#FCE4EC;color:#880E4F','background:#E8EAF6;color:#283593','background:#E0F2F1;color:#004D40'];
function avC(n){ let h=0; for(let c of n) h=(h+c.charCodeAt(0))%AVC.length; return AVC[h]; }
function mPill(m){ const mp={Base:'p-x',Energy:'p-a',Comfort:'p-b',Black:'p-r'}; return `<span class="pill ${mp[m]||'p-x'}">${m}</span>`; }
function ePill(e){ return `<span class="pill ${e==='Activo'?'p-g':'p-r'}">${e}</span>`; }
function tPill(t){ const tp={Puerta:'p-b',Ventana:'p-x','Movimiento PIR':'p-a',Botón:'p-g',Humo:'p-r',Vibración:'p-p'}; return `<span class="pill ${tp[t]||'p-x'}">${t}</span>`; }
function metPill(m){ const mp={OTA:'p-b',Serial:'p-a',Manual:'p-x'}; return `<span class="pill ${mp[m]||'p-x'}">${m}</span>`; }
function resPill(r){ const rp={Exitoso:'p-g',Fallido:'p-r',Parcial:'p-a'}; return `<span class="pill ${rp[r]||'p-x'}">${r}</span>`; }
function verPill(t){ const vp={Mayor:'p-r',Menor:'p-a',Patch:'p-x'}; return `<span class="pill ${vp[t]||'p-x'}">${t}</span>`; }
function garPill(g){ return g==='Sí'?'<span class="pill p-g">Sí</span>':'<span class="pill p-x">No</span>'; }
function tipMantPill(t){ const tp={Correctivo:'p-r',Configuración:'p-b',Actualización:'p-g','Cambio de pilas':'p-p'}; return `<span class="pill ${tp[t]||'p-x'}">${t||'Correctivo'}</span>`; }
function fbox(l,v,mono=false){ return `<div class="fbox"><div class="fl">${l}</div><div class="fv${mono?' mono':''}">${v||'—'}</div></div>`; }
function today(){ return new Date().toISOString().slice(0,10); }

// =======================================================
// STATS
// =======================================================
function renderStats(){
  const c=DB.clientes;
  const act=c.filter(x=>x.estado==='Activo').length;
  const baj=c.filter(x=>x.estado==='Baja').length;
  const base=c.filter(x=>x.estado==='Activo'&&x.modelo==='Base').length;
  const energy=c.filter(x=>x.estado==='Activo'&&x.modelo==='Energy').length;
  const comfort=c.filter(x=>x.estado==='Activo'&&x.modelo==='Comfort').length;
  const black=c.filter(x=>x.estado==='Activo'&&x.modelo==='Black').length;
  document.getElementById('stats-box').innerHTML=`
    <div class="stat"><div class="stat-n green">${act}</div><div class="stat-l">Activos</div></div>
    <div class="stat"><div class="stat-n red">${baj}</div><div class="stat-l">Bajas</div></div>
    <div class="stat"><div class="stat-n">${base}</div><div class="stat-l">Base</div></div>
    <div class="stat"><div class="stat-n amber">${energy}</div><div class="stat-l">Energy</div></div>
    <div class="stat"><div class="stat-n blue">${comfort}</div><div class="stat-l">Comfort</div></div>
    <div class="stat"><div class="stat-n red">${black}</div><div class="stat-l">Black</div></div>`;
}

// =======================================================
// CLIENTES LIST
// =======================================================
function renderClientes(){
  const q=(document.getElementById('qc').value||'').toLowerCase();
  const fm=document.getElementById('fc-modelo').value;
  const fe=document.getElementById('fc-estado').value;
  const list=DB.clientes.filter(c=>{
    return(!q||(c.nombre+c.lote+(c.barrio||'')+c.tel).toLowerCase().includes(q))&&(!fm||c.modelo===fm)&&(!fe||c.estado===fe);
  });
  const tb=document.getElementById('tbody-c');
  if(!list.length){tb.innerHTML='<tr><td colspan="9" class="empty">Sin resultados</td></tr>';return;}
  tb.innerHTML=list.map(c=>`<tr>
    <td style="color:var(--text3);font-size:11px">${String(c.id).padStart(3,'0')}</td>
    <td><div style="display:flex;align-items:center;gap:7px"><div class="av" style="${avC(c.nombre)}">${ini(c.nombre)}</div>${c.nombre}</div></td>
    <td>${c.lote}</td>
    <td>${c.barrio||'—'}</td>
    <td>${c.tel}</td>
    <td>${mPill(c.modelo)}</td>
    <td style="font-family:monospace;font-size:11px">${c.version||'—'}</td>
    <td>${ePill(c.estado)}</td>
    <td style="display:flex;gap:4px;flex-wrap:wrap">
      <button class="btn btn-sm" onclick="verCliente(${c.id})">👁️ Ver</button>
      ${c.estado==='Activo'
        ?`<button class="btn btn-sm" style="color:var(--red)" onclick="darBaja(${c.id})">🚫 Baja</button>`
        :`<button class="btn btn-sm" style="color:var(--green)" onclick="reactivar(${c.id})">✅ Activar</button>`}
    </td>
  </tr>`).join('');
}

function darBaja(id){
  if(!confirm('¿Confirmar baja del cliente?')) return;
  DB.clientes.find(x=>x.id===id).estado='Baja';
  save(); renderStats(); renderClientes();
}
function reactivar(id){
  DB.clientes.find(x=>x.id===id).estado='Activo';
  save(); renderStats(); renderClientes();
}

// =======================================================
// ALTA
// =======================================================
function limpiarAlta(){
  ['an','al','aba','at','av','amac','apin','achat','aemail','aambientes'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
  const af=document.getElementById('af'); if(af) af.value=today();
}
function guardarCliente(){
  const n=document.getElementById('an').value.trim();
  const l=document.getElementById('al').value.trim();
  const t=document.getElementById('at').value.trim();
  if(!n||!l||!t){alert('Nombre, lote y teléfono son obligatorios.');return;}
  DB.clientes.unshift({
    id:DB.nid++,nombre:n,lote:l,barrio:document.getElementById('aba').value,tel:t,
    modelo:document.getElementById('am').value,
    version:document.getElementById('av').value,
    fecha:document.getElementById('af').value,
    mac:document.getElementById('amac').value,
    pin:document.getElementById('apin').value,
    chatid:document.getElementById('achat').value,
    email:document.getElementById('aemail')?document.getElementById('aemail').value:'',
    ambientes:document.getElementById('aambientes')?document.getElementById('aambientes').value:'',
    estado:'Activo',
    equipo:{esp_serie:'',proveedor:'',fcompra:'',bat_marca:'',bat_modelo:'',carg_marca:'',carg_modelo:'',fuente_marca:'',fuente_modelo:'',fuente_tension:'',sirena_marca:'',sirena_modelo:'',sirena_serie:'',sirena_corte:'No',garantia:'No',gar_vence:'',ultimo_service:''},
    zigbee:[],ota:[],mant:[]
  });
  save(); limpiarAlta(); goTo('clientes');
}

// =======================================================
// VER CLIENTE
// =======================================================
function verCliente(id){
  curCid=id;
  goTo('detalle');
  const c=gc();
  document.getElementById('tctx').textContent=c.nombre+' · '+c.lote;
  document.getElementById('pacts').innerHTML=`
    <button class="btn btn-sm" onclick="goTo('clientes')">← Volver</button>
    ${c.estado==='Activo'
      ?`<button class="btn btn-sm btn-d" onclick="darBaja(${c.id});verCliente(${c.id})">🚫 Dar de baja</button>`
      :`<button class="btn btn-sm btn-g" onclick="reactivar(${c.id});verCliente(${c.id})">✅ Reactivar</button>`}`;
  document.getElementById('det-head').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0">
      <div class="av" style="${avC(c.nombre)};width:40px;height:40px;font-size:14px">${ini(c.nombre)}</div>
      <div>
        <div style="font-size:15px;font-weight:700">${c.nombre}</div>
        <div style="font-size:11px;color:var(--text2)">${c.lote}${c.barrio?' · '+c.barrio:''} &nbsp;${mPill(c.modelo)} ${ePill(c.estado)}</div>
      </div>
    </div>`;
  SUBS.forEach(x=>{
    document.getElementById('sp-'+x).classList.toggle('on',x==='datos');
    document.getElementById('sni-'+x).classList.toggle('on',x==='datos');
  });
  renderDatos();
}

// =======================================================
// SUB: DATOS
// =======================================================
function renderDatos(){
  const c=gc();
  document.getElementById('cont-datos').innerHTML=`
    <div class="fgrid">${fbox('Nombre',c.nombre)}${fbox('Lote',c.lote)}${fbox('Barrio',c.barrio)}</div>
    <div class="fgrid">${fbox('Teléfono',c.tel)}${fbox('Email',c.email||'—')}${fbox('Ambientes',c.ambientes?c.ambientes+' amb':'—')}</div>\n    <div class=\"fgrid\">${fbox('Estado',ePill(c.estado))}<div></div><div></div></div>
    <hr class="div">
    <div class="fgrid">${fbox('Modelo Zpro',mPill(c.modelo))}${fbox('Versión instalada',c.version,true)}${fbox('Fecha instalación',c.fecha)}</div>
    <hr class="div">
    <div class="fgrid">${fbox('MAC del ESP32',c.mac,true)}${fbox('PIN OTA',c.pin?'••••••':'')}${fbox('Chat ID Telegram',c.chatid,true)}</div>`;
}

function editarDatos(){
  const c=gc();
  openModal('Editar datos del cliente',`
    <div class="fg3">
      <div class="fg"><label>Nombre *</label><input id="ed-n" value="${c.nombre}"></div>
      <div class="fg"><label>Lote *</label><input id="ed-l" value="${c.lote}"></div>
      <div class="fg"><label>Barrio</label><input id="ed-ba" value="${c.barrio||''}"></div>
      <div class="fg"><label>Teléfono *</label><input id="ed-t" value="${c.tel}"></div>
      <div class="fg"><label>Modelo Zpro</label><select id="ed-m">${['Base','Energy','Comfort','Black'].map(m=>`<option${c.modelo===m?' selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Versión instalada</label><input id="ed-v" value="${c.version||''}"></div>
      <div class="fg"><label>Fecha instalación</label><input id="ed-f" type="date" value="${c.fecha||''}"></div>
      <div class="fg"><label>MAC del ESP32</label><input id="ed-mac" value="${c.mac||''}" style="font-family:monospace"></div>
      <div class="fg"><label>PIN OTA</label><input id="ed-pin" type="password" value="${c.pin||''}"></div>
      <div class="fg"><label>Chat ID Telegram</label><input id="ed-chat" value="${c.chatid||''}" style="font-family:monospace"></div>
    </div>`,()=>{
    const n=document.getElementById('ed-n').value.trim();
    const l=document.getElementById('ed-l').value.trim();
    const t=document.getElementById('ed-t').value.trim();
    if(!n||!l||!t){alert('Nombre, lote y teléfono son obligatorios.');return false;}
    c.nombre=n;c.lote=l;c.barrio=document.getElementById('ed-ba').value;c.tel=t;
    c.modelo=document.getElementById('ed-m').value;
    c.version=document.getElementById('ed-v').value;
    c.fecha=document.getElementById('ed-f').value;
    c.mac=document.getElementById('ed-mac').value;
    c.pin=document.getElementById('ed-pin').value;
    c.chatid=document.getElementById('ed-chat').value;
    if(document.getElementById('ed-email')) c.email=document.getElementById('ed-email').value;
    if(document.getElementById('ed-amb')) c.ambientes=document.getElementById('ed-amb').value;
    save();renderDatos();verCliente(c.id);return true;
  });
}

// =======================================================
// SUB: EQUIPAMIENTO
// =======================================================
function renderEquipo(){
  const e=gc().equipo;
  document.getElementById('cont-equipo').innerHTML=`
    <div class="sectitle">Procesador</div>
    <div class="fgrid">${fbox('N° serie ESP32',e.esp_serie,true)}${fbox('Proveedor',e.proveedor)}${fbox('Fecha de compra',e.fcompra)}</div>
    <hr class="div">
    <div class="twocol">
      <div>
        <div class="sectitle">Batería y cargador</div>
        <div class="fgrid2">
          ${fbox('Marca batería',e.bat_marca)}${fbox('Modelo batería',e.bat_modelo)}
          ${fbox('Capacidad','12V — 7Ah')}${fbox('Marca cargador',e.carg_marca)}
          <div style="grid-column:1/-1">${fbox('Modelo cargador',e.carg_modelo)}</div>
        </div>
      </div>
      <div>
        <div class="sectitle">Sirena</div>
        <div class="fgrid2">
          ${fbox('Marca',e.sirena_marca)}${fbox('Modelo',e.sirena_modelo)}
          ${fbox('N° de serie',e.sirena_serie,true)}${fbox('Corte de energía',garPill(e.sirena_corte))}
        </div>
      </div>
    </div>
    <hr class="div">
    <div class="sectitle">Fuente / transformador y garantía</div>
    <div class="fgrid">
      ${fbox('Marca fuente',e.fuente_marca)}${fbox('Modelo fuente',e.fuente_modelo)}${fbox('Tensión de salida',e.fuente_tension)}
      ${fbox('Garantía',garPill(e.garantia))}${fbox('Vencimiento garantía',e.gar_vence)}${fbox('Último service',e.ultimo_service)}
    </div>`;
}

function editarEquipo(){
  const c=gc();const e=c.equipo;
  openModal('Editar equipamiento',`
    <div class="fg3">
      <div class="fsec" style="border-top:none;padding-top:0;margin-top:0">Procesador</div>
      <div class="fg"><label>N° serie ESP32</label><input id="eq-es" value="${e.esp_serie||''}"></div>
      <div class="fg"><label>Proveedor</label><input id="eq-pr" value="${e.proveedor||''}"></div>
      <div class="fg"><label>Fecha compra</label><input id="eq-fc" type="date" value="${e.fcompra||''}"></div>
      <div class="fsec">Batería y cargador</div>
      <div class="fg"><label>Marca batería</label><input id="eq-bm" value="${e.bat_marca||''}"></div>
      <div class="fg"><label>Modelo batería</label><input id="eq-bmo" value="${e.bat_modelo||''}"></div>
      <div class="fg"><label>Marca cargador</label><input id="eq-cm" value="${e.carg_marca||''}"></div>
      <div class="fg"><label>Modelo cargador</label><input id="eq-cmo" value="${e.carg_modelo||''}"></div>
      <div class="fsec">Fuente / transformador</div>
      <div class="fg"><label>Marca fuente</label><input id="eq-fm" value="${e.fuente_marca||''}"></div>
      <div class="fg"><label>Modelo fuente</label><input id="eq-fmo" value="${e.fuente_modelo||''}"></div>
      <div class="fg"><label>Tensión de salida</label><input id="eq-ft" value="${e.fuente_tension||''}"></div>
      <div class="fsec">Sirena</div>
      <div class="fg"><label>Marca sirena</label><input id="eq-sm" value="${e.sirena_marca||''}"></div>
      <div class="fg"><label>Modelo sirena</label><input id="eq-smo" value="${e.sirena_modelo||''}"></div>
      <div class="fg"><label>N° serie sirena</label><input id="eq-ss" value="${e.sirena_serie||''}"></div>
      <div class="fg"><label>Corte de energía</label><select id="eq-sc"><option${e.sirena_corte==='Sí'?' selected':''}>Sí</option><option${e.sirena_corte!=='Sí'?' selected':''}>No</option></select></div>
      <div class="fsec">Garantía</div>
      <div class="fg"><label>Garantía</label><select id="eq-g"><option${e.garantia==='Sí'?' selected':''}>Sí</option><option${e.garantia!=='Sí'?' selected':''}>No</option></select></div>
      <div class="fg"><label>Vencimiento</label><input id="eq-gv" type="date" value="${e.gar_vence||''}"></div>
      <div class="fg"><label>Último service</label><input id="eq-us" type="date" value="${e.ultimo_service||''}"></div>
    </div>`,()=>{
    e.esp_serie=document.getElementById('eq-es').value;e.proveedor=document.getElementById('eq-pr').value;e.fcompra=document.getElementById('eq-fc').value;
    e.bat_marca=document.getElementById('eq-bm').value;e.bat_modelo=document.getElementById('eq-bmo').value;
    e.carg_marca=document.getElementById('eq-cm').value;e.carg_modelo=document.getElementById('eq-cmo').value;
    e.fuente_marca=document.getElementById('eq-fm').value;e.fuente_modelo=document.getElementById('eq-fmo').value;e.fuente_tension=document.getElementById('eq-ft').value;
    e.sirena_marca=document.getElementById('eq-sm').value;e.sirena_modelo=document.getElementById('eq-smo').value;e.sirena_serie=document.getElementById('eq-ss').value;e.sirena_corte=document.getElementById('eq-sc').value;
    e.garantia=document.getElementById('eq-g').value;e.gar_vence=document.getElementById('eq-gv').value;e.ultimo_service=document.getElementById('eq-us').value;
    save();renderEquipo();return true;
  });
}

// =======================================================
// SUB: ZIGBEE
// =======================================================
function renderZigbee(){
  const c=gc();
  if(!c.zigbee.length){document.getElementById('cont-zigbee').innerHTML='<div class="empty">📡 Sin dispositivos registrados. Usá "Agregar dispositivo" para registrar el primero.</div>';return;}
  document.getElementById('cont-zigbee').innerHTML=`<table>
    <colgroup><col style="width:9%"><col style="width:13%"><col style="width:10%"><col style="width:10%"><col style="width:17%"><col style="width:15%"><col style="width:20%"><col style="width:6%"></colgroup>
    <thead><tr><th>Tipo</th><th>Nombre</th><th>Marca</th><th>Modelo</th><th>Dir. hex</th><th>Ubicación</th><th>Marca pilas</th><th>Mod. pilas</th><th>Cambio pilas</th><th></th></tr></thead>
    <tbody>${c.zigbee.map((d,i)=>`<tr>
      <td>${tPill(d.tipo)}</td><td>${d.nombre}</td><td>${d.marca||'—'}</td><td>${d.modelo||'—'}</td>
      <td class="mono">${d.hex||'—'}</td><td>${d.ubicacion||'—'}</td><td>${d.obs||'—'}</td>
      <td><button class="btn btn-sm" style="color:var(--red)" title="Eliminar" onclick="elimZigbee(${i})">🗑️</button></td>
    </tr>`).join('')}</tbody></table>`;
}

function modalZigbee(idx=-1){
  const c=gc();
  const d=idx>=0?c.zigbee[idx]:{};
  const tipos=DB.tipos.map(t=>`<option${(d.tipo||'')==t?' selected':''}>${t}</option>`).join('');
  openModal(idx>=0?'Editar dispositivo Zigbee':'Agregar dispositivo Zigbee',`
    <div class="fg3">
      <div class="fg"><label>Tipo *</label><select id="z-t">${tipos}</select></div>
      <div class="fg"><label>Nombre *</label><input id="z-n" value="${d.nombre||''}" placeholder="Ej: Entrada principal"></div>
      <div class="fg"><label>Marca</label><input id="z-ma" value="${d.marca||''}" placeholder="Aqara, Sonoff, Tuya..."></div>
      <div class="fg"><label>Modelo</label><input id="z-mo" value="${d.modelo||''}" placeholder="MCCGQ11LM"></div>
      <div class="fg"><label>Dirección hex</label><input id="z-h" value="${d.hex||''}" placeholder="0x00158D0001A2B3C4" style="font-family:monospace"></div>
      <div class="fg"><label>Ubicación física</label><input id="z-u" value="${d.ubicacion||''}" placeholder="Ej: Frente, puerta madera"></div>
      <div class="fg"><label>Marca de pilas</label><input id="z-mp" value="${d.marcaPilas||''}" placeholder="Ej: Energizer"></div>
      <div class="fg"><label>Modelo de pilas</label><input id="z-mop" value="${d.modeloPilas||''}" placeholder="Ej: AA 1.5V"></div>
      <div class="fg"><label>Fecha último cambio pilas</label><input id="z-fcp" type="date" value="${d.fechaCambioPilas||''}"></div>
      <div class="fg full"><label>Observaciones</label><input id="z-o" value="${d.obs||''}" placeholder="Opcional"></div>
    </div>`,()=>{
    const n=document.getElementById('z-n').value.trim();
    if(!n){alert('El nombre es obligatorio.');return false;}
    const mp=document.getElementById('z-mp')?document.getElementById('z-mp').value:'';
    const mop=document.getElementById('z-mop')?document.getElementById('z-mop').value:'';
    const fcp=document.getElementById('z-fcp')?document.getElementById('z-fcp').value:'';
    const obj={tipo:document.getElementById('z-t').value,nombre:n,marca:document.getElementById('z-ma').value,modelo:document.getElementById('z-mo').value,hex:document.getElementById('z-h').value,marcaPilas:mp,modeloPilas:mop,fechaCambioPilas:fcp,ubicacion:document.getElementById('z-u').value,obs:document.getElementById('z-o').value};
    if(idx>=0) c.zigbee[idx]=obj; else c.zigbee.push(obj);
    save();renderZigbee();return true;
  });
}
function elimZigbee(i){if(!confirm('¿Eliminar este dispositivo?'))return;gc().zigbee.splice(i,1);save();renderZigbee();}

// =======================================================
// SUB: OTA
// =======================================================
function renderOTA(){
  const c=gc();
  const tot=c.ota.length,ex=c.ota.filter(x=>x.resultado==='Exitoso').length,fa=c.ota.filter(x=>x.resultado==='Fallido').length;
  document.getElementById('ota-stats').innerHTML=`<div class="stats stats-3">
    <div class="stat"><div class="stat-n">${tot}</div><div class="stat-l">Total actualizaciones</div></div>
    <div class="stat"><div class="stat-n green">${ex}</div><div class="stat-l">Exitosas</div></div>
    <div class="stat"><div class="stat-n red">${fa}</div><div class="stat-l">Fallidas</div></div>
  </div>`;
  if(!c.ota.length){document.getElementById('cont-ota').innerHTML='<div class="empty">🔄 Sin actualizaciones registradas</div>';return;}
  document.getElementById('cont-ota').innerHTML=`<table>
    <colgroup><col style="width:10%"><col style="width:12%"><col style="width:12%"><col style="width:9%"><col style="width:10%"><col style="width:37%"><col style="width:10%"></colgroup>
    <thead><tr><th>Fecha</th><th>Versión anterior</th><th>Versión nueva</th><th>Método</th><th>Resultado</th><th>Observaciones</th><th></th></tr></thead>
    <tbody>${c.ota.map((o,i)=>`<tr>
      <td>${o.fecha}</td><td class="mono">${o.vant}</td><td class="mono">${o.vnueva}</td>
      <td>${metPill(o.metodo)}</td><td>${resPill(o.resultado)}</td><td>${o.obs||'—'}</td>
      <td><button class="btn btn-sm" onclick="modalOTA(${i})" title="Editar">✏️</button></td>
    </tr>`).join('')}</tbody></table>`;
}

function modalOTA(idx){
  const c=gc();
  const o=idx>=0?c.ota[idx]:{};
  const vers=DB.versiones.map(v=>`<option${(o.vnueva||'')==v.ver?' selected':''}>${v.ver}</option>`).join('');
  openModal(idx>=0?'Editar actualización OTA':'Registrar actualización OTA',`
    <div class="fg2">
      <div class="fg"><label>Fecha *</label><input id="ot-f" type="date" value="${o.fecha||today()}"></div>
      <div class="fg"><label>Método *</label><select id="ot-m">${['OTA','Serial','Manual'].map(m=>`<option${(o.metodo||'')==m?' selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Versión anterior *</label><input id="ot-va" value="${o.vant||''}" placeholder="v2.3.0" style="font-family:monospace"></div>
      <div class="fg"><label>Versión nueva *</label><select id="ot-vn"><option value="">— seleccionar —</option>${vers}</select></div>
      <div class="fg"><label>Resultado *</label><select id="ot-r">${['Exitoso','Fallido','Parcial'].map(r=>`<option${(o.resultado||'')==r?' selected':''}>${r}</option>`).join('')}</select></div>
      <div class="fg full"><label>Observaciones</label><textarea id="ot-o">${o.obs||''}</textarea></div>
    </div>`,()=>{
    const va=document.getElementById('ot-va').value.trim();
    const vn=document.getElementById('ot-vn').value;
    if(!va||!vn){alert('Versión anterior y nueva son obligatorias.');return false;}
    const obj={fecha:document.getElementById('ot-f').value,vant:va,vnueva:vn,metodo:document.getElementById('ot-m').value,resultado:document.getElementById('ot-r').value,obs:document.getElementById('ot-o').value};
    if(idx>=0) c.ota[idx]=obj; else c.ota.unshift(obj);
    if(idx<0) c.version=vn;
    save();renderOTA();if(idx<0)renderDatos();return true;
  });
}

// =======================================================
// SUB: MANTENIMIENTO
// =======================================================
function renderMant(){
  const c=gc();
  const tot=c.mant.length,gar=c.mant.filter(x=>x.garantia==='Sí').length,costo=c.mant.reduce((a,x)=>a+(parseFloat(x.costo)||0),0);
  document.getElementById('mant-stats').innerHTML=`<div class="stats stats-3">
    <div class="stat"><div class="stat-n">${tot}</div><div class="stat-l">Visitas totales</div></div>
    <div class="stat"><div class="stat-n green">${gar}</div><div class="stat-l">En garantía</div></div>
    <div class="stat"><div class="stat-n blue">$${Math.round(costo).toLocaleString('es-AR')}</div><div class="stat-l">Costo acumulado</div></div>
  </div>`;
  if(!c.mant.length){document.getElementById('cont-mant').innerHTML='<div class="empty">🛠️ Sin visitas registradas</div>';return;}
  document.getElementById('cont-mant').innerHTML=`<table>
    <colgroup><col style="width:9%"><col style="width:10%"><col style="width:13%"><col style="width:12%"><col style="width:12%"><col style="width:7%"><col style="width:7%"><col style="width:10%"><col style="width:14%"><col style="width:6%"></colgroup>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Motivo llamado</th><th>Falla detectada</th><th>Reparación</th><th>Garantía</th><th>Costo</th><th>Técnico</th><th>Observaciones</th><th></th></tr></thead>
    <tbody>${c.mant.map((m,i)=>`<tr>
      <td>${m.fecha}</td>
      <td>${tipMantPill(m.tipo)}</td>
      <td>${m.motivo}</td><td>${m.falla||'—'}</td><td>${m.reparacion||'—'}</td>
      <td>${garPill(m.garantia)}</td>
      <td>$${Math.round(parseFloat(m.costo)||0).toLocaleString('es-AR')}</td>
      <td>${m.tecnico||'—'}</td><td>${m.obs||'—'}</td>
      <td><button class="btn btn-sm" onclick="modalMant(${i})" title="Editar">✏️</button></td>
    </tr>`).join('')}</tbody></table>`;
}

function modalMant(idx){
  const c=gc();
  const m=idx>=0?c.mant[idx]:{};
  openModal(idx>=0?'Editar visita de mantenimiento':'Registrar visita de mantenimiento',`
    <div class="fg2">
      <div class="fg"><label>Fecha *</label><input id="mt-f" type="date" value="${m.fecha||today()}"></div>
      <div class="fg"><label>Tipo *</label><select id="mt-ti">${['Correctivo','Configuración','Actualización','Cambio de pilas'].map(t=>`<option${(m.tipo||'')==t?' selected':''}>${t}</option>`).join('')}</select></div>
      <div class="fg"><label>Motivo del llamado *</label><input id="mt-mo" value="${m.motivo||''}" placeholder="Ej: Sirena no activa, falsa alarma..."></div>
      <div class="fg"><label>Falla detectada</label><input id="mt-fa" value="${m.falla||''}" placeholder="Ej: Conexión suelta"></div>
      <div class="fg"><label>Reparación realizada</label><input id="mt-re" value="${m.reparacion||''}" placeholder="Ej: Reconexión terminal"></div>
      <div class="fg"><label>En garantía</label><select id="mt-g"><option${(m.garantia||'No')==='No'?' selected':''}>No</option><option${(m.garantia||'')==='Sí'?' selected':''}>Sí</option></select></div>
      <div class="fg"><label>Costo ($)</label><input id="mt-c" type="number" min="0" value="${m.costo||0}"></div>
      <div class="fg"><label>Técnico</label><input id="mt-te" value="${m.tecnico||''}" placeholder="Nombre del técnico"></div>
      <div class="fg full"><label>Observaciones</label><textarea id="mt-o">${m.obs||''}</textarea></div>
    </div>`,()=>{
    const mo=document.getElementById('mt-mo').value.trim();
    if(!mo){alert('El motivo del llamado es obligatorio.');return false;}
    const obj={fecha:document.getElementById('mt-f').value,tipo:document.getElementById('mt-ti').value,motivo:mo,falla:document.getElementById('mt-fa').value,reparacion:document.getElementById('mt-re').value,garantia:document.getElementById('mt-g').value,costo:document.getElementById('mt-c').value||'0',tecnico:document.getElementById('mt-te').value,obs:document.getElementById('mt-o').value};
    if(idx>=0) c.mant[idx]=obj; else c.mant.unshift(obj);
    save();renderMant();return true;
  });
}

// =======================================================
// VERSIONES
// =======================================================
function renderVersiones(){
  const tb=document.getElementById('tbody-ver');
  if(!DB.versiones.length){tb.innerHTML='<tr><td colspan="5" class="empty">Sin versiones</td></tr>';return;}
  tb.innerHTML=DB.versiones.map((v,i)=>`<tr>
    <td style="font-family:monospace;font-weight:700">${v.ver}</td>
    <td>${verPill(v.tipo)}</td><td>${v.fecha}</td><td>${v.notas||'—'}</td>
    <td><button class="btn btn-sm" style="color:var(--red)" onclick="elimVer(${i})">🗑️</button></td>
  </tr>`).join('');
}
function modalVersion(){
  openModal('Nueva versión de software',`
    <div class="fg3">
      <div class="fg"><label>Versión *</label><input id="v-v" placeholder="v2.5.0" style="font-family:monospace"></div>
      <div class="fg"><label>Tipo</label><select id="v-t"><option>Mayor</option><option>Menor</option><option>Patch</option></select></div>
      <div class="fg"><label>Fecha</label><input id="v-f" type="date" value="${today()}"></div>
      <div class="fg full"><label>Notas / cambios</label><textarea id="v-n" placeholder="Descripción de los cambios..."></textarea></div>
    </div>`,()=>{
    const v=document.getElementById('v-v').value.trim();
    if(!v){alert('La versión es obligatoria.');return false;}
    DB.versiones.unshift({ver:v,tipo:document.getElementById('v-t').value,fecha:document.getElementById('v-f').value,notas:document.getElementById('v-n').value});
    save();renderVersiones();return true;
  });
}
function elimVer(i){if(!confirm('¿Eliminar versión?'))return;DB.versiones.splice(i,1);save();renderVersiones();}

// =======================================================
// TIPOS SENSOR
// =======================================================
function renderTipos(){
  document.getElementById('tipos-list').innerHTML=DB.tipos.map((t,i)=>`
    <div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:5px 12px;font-size:12px">
      ${t}<button style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;line-height:1;padding:0" onclick="elimTipo(${i})">×</button>
    </div>`).join('');
}
function agregarTipo(){
  const inp=document.getElementById('nuevo-tipo');const v=inp.value.trim();
  if(!v)return;if(DB.tipos.includes(v)){alert('Ya existe ese tipo.');return;}
  DB.tipos.push(v);save();inp.value='';renderTipos();
}
function elimTipo(i){if(!confirm('¿Eliminar tipo de sensor?'))return;DB.tipos.splice(i,1);save();renderTipos();}

// =======================================================
// BACKUP
// =======================================================
function borrarTodo(){
  if(!confirm('¿Borrar TODOS los datos? Esta accion no se puede deshacer.')) return;
  if(!confirm('Ultima confirmacion. ¿Estas seguro?')) return;
  localStorage.removeItem(SKEY);
  alert('Datos borrados. La app se reiniciara.');
  location.reload();
}

function exportarJSON(){
  const fecha=today();
  const json=JSON.stringify(DB,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`viking_backup_${fecha}.json`;a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(){
  const file=document.getElementById('import-file').files[0];
  if(!file){alert('Seleccioná un archivo JSON primero.');return;}
  if(!confirm('⚠️ Esto reemplazará TODOS los datos actuales. ¿Confirmás?'))return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.clientes||!data.versiones){alert('Archivo inválido. No es un backup de Viking Security.');return;}
      DB=data;save();
      alert('✔ Backup restaurado correctamente. Se recargará la aplicación.');
      location.reload();
    }catch(err){alert('Error al leer el archivo: '+err.message);}
  };
  reader.readAsText(file);
}

function renderBackupInfo(){
  const c=DB.clientes;
  const devs=c.reduce((a,x)=>a+x.zigbee.length,0);
  const otas=c.reduce((a,x)=>a+x.ota.length,0);
  const mantos=c.reduce((a,x)=>a+x.mant.length,0);
  const kb=Math.round(JSON.stringify(DB).length/1024);
  document.getElementById('backup-info').innerHTML=`
    ${fbox('Clientes totales',c.length)}
    ${fbox('Dispositivos Zigbee',devs)}
    ${fbox('Actualizaciones OTA',otas)}
    ${fbox('Visitas de mantenimiento',mantos)}
    ${fbox('Versiones SW',DB.versiones.length)}
    ${fbox('Tamaño de datos',kb+' KB')}`;
}

// =======================================================
// MODAL GEN=RICO
// =======================================================
function openModal(title,body,onSave){
  document.getElementById('mbox').innerHTML=`
    <div class="moverlay" onclick="if(event.target===this)cerrarModal()">
      <div class="modal">
        <div class="mhead"><h3>${title}</h3><button class="btn btn-sm" onclick="cerrarModal()">✕</button></div>
        <div class="mbody">${body}</div>
        <div class="mfoot">
          <button class="btn" onclick="cerrarModal()">Cancelar</button>
          <button class="btn btn-p" id="msave">✔ Guardar</button>
        </div>
      </div>
    </div>`;
  document.getElementById('msave').onclick=()=>{ if(onSave()!==false) cerrarModal(); };
}
function cerrarModal(){ document.getElementById('mbox').innerHTML=''; }

// =======================================================
// PWA
// =======================================================
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;
  document.getElementById('install-btn').classList.add('show');
});
function instalarPWA(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(()=>{
    deferredPrompt=null;
    document.getElementById('install-btn').classList.remove('show');
  });
}
window.addEventListener('appinstalled',()=>{
  document.getElementById('install-btn').classList.remove('show');
});

// Service Worker inline registration
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    console.log('Viking SW OK');
  }).catch(e=>console.log('SW error:',e));
}


// PRESUPUESTOS ========================================
const LOGO_PDF = document.getElementById('logo-pdf-data').src;

function presEstadoPill(e){
  const mp={Borrador:'p-x',Enviado:'p-b',Aprobado:'p-g',Rechazado:'p-r'};
  return '<span class="pill '+(mp[e]||'p-x')+'">'+e+'</span>';
}

function renderPresupuestos(){
  const q=(document.getElementById('qp').value||'').toLowerCase();
  const fe=document.getElementById('fp-estado').value;
  const list=DB.presupuestos.filter(p=>{
    return(!q||(p.nombre+p.dir).toLowerCase().includes(q))&&(!fe||p.estado===fe);
  });
  const tb=document.getElementById('tbody-pres');
  if(!list.length){
    tb.innerHTML='<tr><td colspan="7" class="empty">Sin presupuestos. Importá un relevamiento desde la app móvil.</td></tr>';
    return;
  }
  tb.innerHTML=list.map(p=>{
    const aprBtn=p.estado==='Aprobado'?'<button class="btn btn-sm btn-g" onclick="convertirCliente('+p.id+')">👤 Cliente</button>':'';
    return '<tr>'+
      '<td><strong>'+p.nombre+'</strong></td>'+
      '<td>'+p.dir+(p.barrio?' · '+p.barrio:'')+'</td>'+
      '<td>'+mPill(p.modelo)+'</td>'+
      '<td>'+p.fecha+'</td>'+
      '<td>'+(p.tecnico||'—')+'</td>'+
      '<td>'+presEstadoPill(p.estado)+'</td>'+
      '<td style="display:flex;gap:4px;flex-wrap:wrap">'+
        '<button class="btn btn-sm" onclick="abrirEditorPres('+p.id+')">✏️ Editar</button>'+
        '<button class="btn btn-sm" onclick="verPresupuesto('+p.id+')">👁️ Ver</button>'+
        '<button class="btn btn-sm btn-p" onclick="generarPDF('+p.id+')">📄 PDF</button>'+
        '<button class="btn btn-sm" onclick="enviarEmailPres('+p.id+')" title="Enviar por email" style="color:var(--blue);border-color:var(--blue)">📧 Email</button>'+
        aprBtn+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarPres('+p.id+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

function importarRelevamiento(input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.relevamientos||data.tipo!=='viking_relevamiento'){
        alert('Archivo inválido. No es un relevamiento de Viking.');return;
      }
      let importados=0;
      data.relevamientos.forEach(r=>{
        const existe=DB.presupuestos.find(p=>p.relId===r.id&&p.nombre===r.nombre);
        if(!existe){
          DB.presupuestos.unshift({
            id:DB.nid++,relId:r.id,nombre:r.nombre,tel:r.tel,dir:r.dir,barrio:r.barrio||'',
            tipo:r.tipo,sup:r.sup,plantas:r.plantas,material:r.material,alarma:r.alarma,
            perro:r.perro,horario:r.horario,modelo:r.modelo,sensores:r.sensores,
            router:r.router,distancia:r.distancia,obstaculos:r.obstaculos,
            tecnico:r.tecnico,obs:r.obs,estado:r.estado||'Borrador',fecha:r.fecha||today()
          });
          importados++;
        }
      });
      save(); input.value=''; renderPresupuestos();
      alert('✔ '+importados+' relevamiento'+(importados!==1?'s':'')+' importado'+(importados!==1?'s':'')+' correctamente.');
    }catch(err){alert('Error al leer el archivo: '+err.message);}
  };
  reader.readAsText(file);
}

function cambiarEstadoPres(id,estado){
  const p=DB.presupuestos.find(x=>x.id===id);
  if(p){p.estado=estado;save();renderPresupuestos();}
}

function eliminarPres(id){
  if(!confirm('¿Eliminar este presupuesto?'))return;
  DB.presupuestos=DB.presupuestos.filter(x=>x.id!==id);
  save();renderPresupuestos();
}

function convertirCliente(id){
  const p=DB.presupuestos.find(x=>x.id===id);
  if(!p)return;
  if(!confirm('¿Convertir el presupuesto de "'+p.nombre+'" en cliente?'))return;
  document.getElementById('an').value=p.nombre||'';
  document.getElementById('al').value='';
  document.getElementById('aba').value=p.barrio||'';
  document.getElementById('at').value=p.tel||'';
  document.getElementById('am').value=p.modelo||'Base';
  document.getElementById('af').value=today();
  document.getElementById('av').value='';
  cerrarModal();
  goTo('alta');
  alert('Datos pre-cargados desde el presupuesto. Completá MAC, PIN y versión instalada.');
}

function verPresupuesto(id){
  const p=DB.presupuestos.find(x=>x.id===id);
  if(!p)return;
  let sensorHtml='';
  Object.entries(p.sensores||{}).forEach(([tipo,s])=>{
    if(!s||s.qty===0)return;
    const ubics=s.ubicaciones.filter(Boolean).map(u=>'<li>'+u+'</li>').join('');
    sensorHtml+='<div style="margin-bottom:8px"><strong>'+tipo+'</strong>: '+s.qty+' unidad'+(s.qty>1?'es':'')+'<ul style="padding-left:16px;color:var(--text2);font-size:11px">'+ubics+'</ul></div>';
  });
  const aprBtn=p.estado==='Aprobado'?'<button class="btn btn-sm btn-g" onclick="convertirCliente('+p.id+');cerrarModal()">👤 Convertir en cliente</button>':'';
  openModal('Presupuesto — '+p.nombre,
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<select onchange="cambiarEstadoPres('+p.id+',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px">'+
        ['Borrador','Enviado','Aprobado','Rechazado'].map(e=>'<option'+(p.estado===e?' selected':'')+'>'+e+'</option>').join('')+
      '</select>'+
      '<button class="btn btn-sm btn-p" onclick="generarPDF('+p.id+');cerrarModal()">📄 Generar PDF</button>'+
      aprBtn+
    '</div>'+
    '<div class="fg2">'+
      '<div class="fbox"><div class="fl">Cliente</div><div class="fv">'+p.nombre+'</div></div>'+
      '<div class="fbox"><div class="fl">Teléfono</div><div class="fv">'+p.tel+'</div></div>'+
      '<div class="fbox"><div class="fl">Dirección</div><div class="fv">'+p.dir+'</div></div>'+
      '<div class="fbox"><div class="fl">Barrio</div><div class="fv">'+(p.barrio||'—')+'</div></div>'+
      '<div class="fbox"><div class="fl">Tipo inmueble</div><div class="fv">'+p.tipo+'</div></div>'+
      '<div class="fbox"><div class="fl">Superficie</div><div class="fv">'+(p.sup?p.sup+' m²':'—')+'</div></div>'+
      '<div class="fbox"><div class="fl">Plantas</div><div class="fv">'+p.plantas+'</div></div>'+
      '<div class="fbox"><div class="fl">Material</div><div class="fv">'+p.material+'</div></div>'+
      '<div class="fbox"><div class="fl">Alarma previa</div><div class="fv">'+p.alarma+'</div></div>'+
      '<div class="fbox"><div class="fl">Perro</div><div class="fv">'+p.perro+'</div></div>'+
      '<div class="fbox"><div class="fl">Horario</div><div class="fv">'+p.horario+'</div></div>'+
      '<div class="fbox"><div class="fl">Modelo Zpro</div><div class="fv">'+mPill(p.modelo)+'</div></div>'+
    '</div>'+
    '<hr class="div"><div class="sectitle">Sensores relevados</div>'+
    '<div style="margin-bottom:12px">'+(sensorHtml||'<span style="color:var(--text3)">Sin sensores</span>')+'</div>'+
    '<hr class="div">'+
    '<div class="fg2">'+
      '<div class="fbox"><div class="fl">Router Zigbee</div><div class="fv">'+(p.router||'—')+'</div></div>'+
      '<div class="fbox"><div class="fl">Distancia máx.</div><div class="fv">'+(p.distancia?p.distancia+' mts':'—')+'</div></div>'+
      '<div class="fbox" style="grid-column:1/-1"><div class="fl">Obstáculos</div><div class="fv">'+(p.obstaculos||'—')+'</div></div>'+
    '</div>'+
    (p.obs?'<hr class="div"><div class="sectitle">Observaciones</div><p style="font-size:12px;color:var(--text2)">'+p.obs+'</p>':'')
  ,null,true);
}

function generarPDF(id){
  const p=DB.presupuestos.find(x=>x.id===id);
  if(!p)return;
  const fecha=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  const vence=new Date(Date.now()+15*86400000).toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  let sensorRows='';
  Object.entries(p.sensores||{}).forEach(([tipo,s])=>{
    if(!s||s.qty===0)return;
    const ubics=s.ubicaciones.filter(Boolean);
    sensorRows+='<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">'+tipo+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">'+s.qty+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#555">'+(ubics.join(', ')||'—')+'</td></tr>';
  });
  const pdfHtml='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto — '+p.nombre+'</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;color:#222;font-size:13px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.no-print{display:none}@page{margin:20mm 15mm}}.header{background:#111;color:#fff;padding:20px 30px;display:flex;align-items:center;gap:20px}.header img{width:70px;height:70px;border-radius:50%;border:2px solid #B71C1C}.header-text h1{font-size:22px;font-weight:700}.header-text p{font-size:11px;color:#aaa;margin-top:2px}.header-right{margin-left:auto;text-align:right;color:#ddd;font-size:12px}.body{padding:24px 30px}.section{margin-bottom:22px}.section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#B71C1C;border-bottom:2px solid #B71C1C;padding-bottom:4px;margin-bottom:12px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.field{background:#f8f8f8;border-radius:6px;padding:8px 10px}.field .fl{font-size:9px;color:#888;font-weight:700;text-transform:uppercase;margin-bottom:2px}.field .fv{font-size:13px;font-weight:500}table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:9px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase}.validez{background:#FFF8E1;border:1px solid #FFD54F;border-radius:6px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#7B4F00}.footer{margin-top:30px;padding:16px 30px;background:#f5f5f5;border-top:3px solid #B71C1C;font-size:11px;color:#888;text-align:center}.modelo-badge{display:inline-block;background:#E3F2FD;color:#0D47A1;padding:4px 14px;border-radius:20px;font-weight:700;font-size:14px}.btn-print{position:fixed;top:16px;right:16px;background:#B71C1C;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600}</style></head><body>'+
    '<button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>'+
    '<div class="header"><img src="'+LOGO_PDF+'" alt="Viking Security Systems"><div class="header-text"><h1>VIKING SECURITY SYSTEMS</h1><p>Sistema de seguridad inteligente</p></div><div class="header-right"><div>PRESUPUESTO</div><div>'+fecha+'</div></div></div>'+
    '<div class="body">'+
    '<div class="validez">⏱️ <strong>Validez del presupuesto: 15 días</strong> — Vence el '+vence+'</div>'+
    '<div class="section"><div class="section-title">Datos del cliente</div><div class="grid2"><div class="field"><div class="fl">Nombre / Razón social</div><div class="fv">'+p.nombre+'</div></div><div class="field"><div class="fl">Teléfono</div><div class="fv">'+p.tel+'</div></div><div class="field"><div class="fl">Dirección</div><div class="fv">'+p.dir+'</div></div><div class="field"><div class="fl">Barrio</div><div class="fv">'+(p.barrio||'—')+'</div></div></div></div>'+
    '<div class="section"><div class="section-title">Inmueble relevado</div><div class="grid3"><div class="field"><div class="fl">Tipo</div><div class="fv">'+p.tipo+'</div></div><div class="field"><div class="fl">Superficie</div><div class="fv">'+(p.sup?p.sup+' m²':'—')+'</div></div><div class="field"><div class="fl">Plantas</div><div class="fv">'+p.plantas+'</div></div><div class="field"><div class="fl">Material</div><div class="fv">'+p.material+'</div></div><div class="field"><div class="fl">Alarma previa</div><div class="fv">'+p.alarma+'</div></div><div class="field"><div class="fl">Horario de uso</div><div class="fv">'+p.horario+'</div></div></div></div>'+
    '<div class="section"><div class="section-title">Modelo propuesto</div><div style="padding:12px 0"><span class="modelo-badge">Zpro '+p.modelo+'</span></div></div>'+
    '<div class="section"><div class="section-title">Sensores relevados</div>'+(sensorRows?'<table><thead><tr><th>Tipo de sensor</th><th style="text-align:center">Cantidad</th><th>Ubicaciones</th></tr></thead><tbody>'+sensorRows+'</tbody></table>':'<p style="color:#888">Sin sensores registrados</p>')+'</div>'+
    '<div class="section"><div class="section-title">Red Zigbee</div><div class="grid3"><div class="field"><div class="fl">Ubicación router</div><div class="fv">'+(p.router||'—')+'</div></div><div class="field"><div class="fl">Distancia máx. sensor</div><div class="fv">'+(p.distancia?p.distancia+' mts':'—')+'</div></div><div class="field"><div class="fl">Obstáculos señal</div><div class="fv">'+(p.obstaculos||'—')+'</div></div></div></div>'+
    (p.obs?'<div class="section"><div class="section-title">Observaciones</div><div style="background:#f8f8f8;border-radius:6px;padding:12px;font-size:13px;color:#444">'+p.obs+'</div></div>':'')+
    '<div style="margin-top:16px;font-size:11px;color:#888">Relevamiento realizado por: <strong>'+(p.tecnico||'—')+'</strong> · Fecha: '+p.fecha+'</div>'+
    '</div>'+
    '<div class="footer">Viking Security Systems &nbsp;|&nbsp; Presupuesto sin precio — válido 15 días desde la fecha de emisión</div>'+
    '</body></html>';
  const w=window.open('','_blank');
  w.document.write(pdfHtml);
  w.document.close();
}


// STOCK ================================================

let stockSoloCritico = false;

function toggleStockCritico(){
  stockSoloCritico = !stockSoloCritico;
  document.getElementById('btn-critico').style.background = stockSoloCritico ? 'var(--amber-bg)' : '';
  document.getElementById('btn-critico').style.color = stockSoloCritico ? 'var(--amber)' : '';
  renderStock();
}

function stockActual(cid){
  const entradas = DB.movimientos.filter(m=>m.cid===cid&&m.tipo==='Entrada').reduce(function(a,m){return a+(parseFloat(m.cant)||0);},0);
  const salidas = DB.movimientos.filter(m=>m.cid===cid&&m.tipo!=='Entrada').reduce(function(a,m){return a+(parseFloat(m.cant)||0);},0);
  return entradas - salidas;
}

function stockPill(cant, min){
  if(cant<=0) return '<span class="pill p-r">Sin stock</span>';
  if(cant<=min) return '<span class="pill p-a">⚠️ Crítico</span>';
  return '<span class="pill p-g">OK</span>';
}

function fillCatFilter(selId){
  const cats=[...new Set(DB.componentes.map(function(c){return c.categoria;}))].sort();
  const sel=document.getElementById(selId);
  if(!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Todas las categorías</option>'+cats.map(function(c){return '<option'+(c===cur?' selected':'')+'>'+c+'</option>';}).join('');
}

function renderStock(){
  fillCatFilter('stock-cat-filter');
  const fcat=document.getElementById('stock-cat-filter').value;
  let list=DB.componentes.filter(function(c){return !fcat||c.categoria===fcat;});
  const farea=document.getElementById('stock-area-filter')?document.getElementById('stock-area-filter').value:'';
  if(farea) list=list.filter(function(c){return c.area===farea||c.area==='Ambas';});
  if(stockSoloCritico) list=list.filter(function(c){return stockActual(c.id)<=(parseFloat(c.min)||0);});

  const total=DB.componentes.length;
  const criticos=DB.componentes.filter(function(c){return stockActual(c.id)<=(parseFloat(c.min)||0)&&stockActual(c.id)>=0;}).length;
  const sinStock=DB.componentes.filter(function(c){return stockActual(c.id)<=0;}).length;
  const valorTotal=DB.componentes.reduce(function(a,c){return a+stockActual(c.id)*(parseFloat(c.precio)||0);},0);

  document.getElementById('stock-stats').innerHTML=
    '<div class="stat"><div class="stat-n">'+(total)+'</div><div class="stat-l">Componentes</div></div>'+
    '<div class="stat"><div class="stat-n red">'+sinStock+'</div><div class="stat-l">Sin stock</div></div>'+
    '<div class="stat"><div class="stat-n amber">'+criticos+'</div><div class="stat-l">Stock crítico</div></div>'+
    '<div class="stat"><div class="stat-n blue">$'+Math.round(valorTotal).toLocaleString('es-AR')+'</div><div class="stat-l">Valor inventario</div></div>';

  const tb=document.getElementById('tbody-stock');
  if(!list.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin componentes. Cargalos desde Catálogo.</td></tr>';return;}
  tb.innerHTML=list.map(function(c){
    const cant=stockActual(c.id);
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px">'+c.codigo+'</td>'+
      '<td><strong>'+c.desc+'</strong></td>'+
      '<td>'+c.categoria+'</td>'+
      '<td style="font-weight:700;font-size:13px;color:'+(cant<=0?'var(--red)':cant<=(parseFloat(c.min)||0)?'var(--amber)':'var(--green)')+'">'+cant+' '+c.unidad+'</td>'+
      '<td>'+(c.min||0)+' '+c.unidad+'</td>'+
      '<td>'+(c.ubicacion||'—')+'</td>'+
      '<td>'+(c.proveedor||'—')+'</td>'+
      '<td style="display:flex;gap:4px">'+
        '<button class="btn btn-sm btn-p" onclick="modalMovimiento(\'Entrada\','+c.id+')" title="Entrada">📥</button>'+
        '<button class="btn btn-sm" onclick="modalMovimiento(\'Salida manual\','+c.id+')" title="Salida">📤</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

// CAT=LOGO ============================================
function renderCatalogo(){
  fillCatFilter('cat-filter');
  const q=(document.getElementById('q-cat').value||'').toLowerCase();
  const fc=document.getElementById('cat-filter').value;
  const list=DB.componentes.filter(function(c){
    return(!q||(c.codigo+c.desc+c.proveedor).toLowerCase().includes(q))&&(!fc||c.categoria===fc);
  });
  const tb=document.getElementById('tbody-cat');
  if(!list.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin componentes registrados.</td></tr>';return;}
  tb.innerHTML=list.map(function(c){
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px">'+c.codigo+'</td>'+
      '<td>'+c.desc+'</td>'+
      '<td>'+c.categoria+'</td>'+
      '<td>'+c.unidad+'</td>'+
      '<td>'+(c.min||0)+'</td>'+
      '<td><span class="pill '+(c.area==='Mantenimiento'?'p-b':c.area==='Ambas'?'p-p':'p-g')+'">'+(c.area||'Fábrica')+'</span></td>'+
      '<td>'+(c.ubicacion||'—')+'</td>'+
      '<td>'+(c.proveedor||'—')+'</td>'+
      '<td style="display:flex;gap:4px">'+
        '<button class="btn btn-sm" onclick="modalComponente('+c.id+')">✏️</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarComponente('+c.id+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

function modalComponente(id){
  const c=id>=0?DB.componentes.find(function(x){return x.id===id;}):null;
  const cats=[...new Set(DB.componentes.map(function(x){return x.categoria;}))].filter(Boolean);
  const catOpts=cats.map(function(x){return '<option'+(c&&c.categoria===x?' selected':'')+'>'+x+'</option>';}).join('');
  openModal(c?'Editar componente':'Nuevo componente',
    '<div class="fg2">'+
      '<div class="fg"><label>Código *</label><input id="cp-cod" value="'+(c?c.codigo:'')+'" placeholder="Ej: ESP32-D0WD"></div>'+
      '<div class="fg"><label>Descripción *</label><input id="cp-desc" value="'+(c?c.desc:'')+'" placeholder="Ej: Módulo ESP32 D0WD-V3"></div>'+
      '<div class="fg"><label>Categoría *</label>'+
        '<input id="cp-cat" value="'+(c?c.categoria:'')+'" placeholder="Ej: Electrónica" list="cats-list">'+
        '<datalist id="cats-list">'+catOpts+'</datalist></div>'+
      '<div class="fg"><label>Unidad</label><select id="cp-uni" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px">'+
        ['u','m','ml','kg','g','par','juego'].map(function(u){return '<option'+(c&&c.unidad===u?' selected':'')+'>'+u+'</option>';}).join('')+
      '</select></div>'+
      '<div class="fg"><label>Stock mínimo</label><input id="cp-min" type="number" min="0" value="'+(c?c.min||0:0)+'"></div>'+
      '<div class="fg"><label>Precio de costo (ref.)</label><input id="cp-precio" type="number" min="0" value="'+(c?c.precio||0:0)+'"></div>'+
      '<div class="fg"><label>Proveedor</label><input id="cp-prov" value="'+(c?c.proveedor||'':'')+'" placeholder="Nombre del proveedor"></div>'+
      '<div class="fg"><label>Área *</label>'+
        '<select id="cp-area" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          ['Fábrica','Mantenimiento','Ambas'].map(function(a){return '<option'+(c&&c.area===a?' selected':'')+'>'+a+'</option>';}).join('')+
        '</select></div>'+
      '<div class="fg"><label>Ubicación</label><input id="cp-ubic" value="'+(c?c.ubicacion||'':'')+'" placeholder="Ej: Estante A, cajón 3"></div>'+
    '</div>',
    function(){
      const cod=document.getElementById('cp-cod').value.trim();
      const desc=document.getElementById('cp-desc').value.trim();
      const cat=document.getElementById('cp-cat').value.trim();
      if(!cod||!desc||!cat){alert('Código, descripción y categoría son obligatorios.');return false;}
      if(c){
        c.codigo=cod;c.desc=desc;c.categoria=cat;
        c.unidad=document.getElementById('cp-uni').value;
        c.min=parseFloat(document.getElementById('cp-min').value)||0;
        c.precio=parseFloat(document.getElementById('cp-precio').value)||0;
        c.area=document.getElementById('cp-area')?document.getElementById('cp-area').value:'Fábrica';
        c.proveedor=document.getElementById('cp-prov').value;
        c.ubicacion=document.getElementById('cp-ubic').value;
      } else {
        DB.componentes.push({
          id:DB.nid++,codigo:cod,desc:desc,categoria:cat,
          unidad:document.getElementById('cp-uni').value,
          min:parseFloat(document.getElementById('cp-min').value)||0,
          precio:parseFloat(document.getElementById('cp-precio').value)||0,
          area:document.getElementById('cp-area')?document.getElementById('cp-area').value:'Fábrica',
          proveedor:document.getElementById('cp-prov').value,
          ubicacion:document.getElementById('cp-ubic').value
        });
      }
      save();renderCatalogo();return true;
    });
}

function eliminarComponente(id){
  if(!confirm('¿Eliminar este componente? Se perderán sus movimientos.'))return;
  DB.componentes=DB.componentes.filter(function(x){return x.id!==id;});
  DB.movimientos=DB.movimientos.filter(function(x){return x.cid!==id;});
  save();renderCatalogo();
}

// MOVIMIENTOS =========================================
function movTipoPill(t){
  const mp={'Entrada':'p-g','Salida manual':'p-r','Salida instalación':'p-b'};
  return '<span class="pill '+(mp[t]||'p-x')+'">'+t+'</span>';
}

function renderMovimientos(){
  const q=(document.getElementById('q-mov').value||'').toLowerCase();
  const ft=document.getElementById('mov-tipo-filter').value;
  const list=DB.movimientos.filter(function(m){
    const comp=DB.componentes.find(function(c){return c.id===m.cid;})||{desc:'',codigo:''};
    return(!q||(comp.desc+comp.codigo+(m.ref||'')+(m.nota||'')).toLowerCase().includes(q))&&(!ft||m.tipo===ft);
  }).sort(function(a,b){return b.fecha.localeCompare(a.fecha);});

  const tb=document.getElementById('tbody-mov');
  if(!list.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin movimientos registrados.</td></tr>';return;}
  tb.innerHTML=list.map(function(m){
    const comp=DB.componentes.find(function(c){return c.id===m.cid;})||{desc:'—',codigo:'—',unidad:''};
    const cli=m.clienteId?DB.clientes.find(function(c){return c.id===m.clienteId;}):null;
    return '<tr>'+
      '<td>'+m.fecha+'</td>'+
      '<td>'+movTipoPill(m.tipo)+'</td>'+
      '<td>'+comp.desc+'<div style="font-size:10px;color:var(--text3)">'+comp.codigo+'</div></td>'+
      '<td style="font-weight:600">'+(m.tipo==='Entrada'?'+':'-')+(m.cant||0)+' '+comp.unidad+'</td>'+
      '<td>'+(m.precio?'$'+parseFloat(m.precio).toLocaleString('es-AR'):'—')+'</td>'+
      '<td>'+(m.ref||'—')+'</td>'+
      '<td>'+(cli?cli.nombre:(m.nota||'—'))+'</td>'+
      '<td style="font-family:monospace;font-size:10px">'+(m.lote||'—')+'</td>'+
    '</tr>';
  }).join('');
}

function modalMovimiento(tipo, preselCid){
  const compOpts=DB.componentes.map(function(c){
    return '<option value="'+c.id+'"'+(preselCid===c.id?' selected':'')+'>'+c.codigo+' — '+c.desc+'</option>';
  }).join('');
  const cliOpts=DB.clientes.filter(function(c){return c.estado==='Activo';}).map(function(c){
    return '<option value="'+c.id+'">'+c.nombre+' · '+c.lote+'</option>';
  }).join('');
  const esInstalacion=tipo==='Salida instalación';
  openModal(tipo,
    '<div class="fg2">'+
      '<div class="fg"><label>Componente *</label>'+
        '<select id="mv-cid" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compOpts+
        '</select></div>'+
      '<div class="fg"><label>Cantidad *</label><input id="mv-cant" type="number" min="1" value="1"></div>'+
      '<div class="fg"><label>Fecha</label><input id="mv-fecha" type="date" value="'+today()+'"></div>'+
      (tipo==='Entrada'?
        '<div class="fg"><label>Precio unitario</label><input id="mv-precio" type="number" min="0" value="0"></div>'+
        '<div class="fg"><label>Remito / Factura ref.</label><input id="mv-ref" placeholder="Ej: FAC-00123"></div>'+
        '<div class="fg"><label>Lote / N° de serie</label><input id="mv-lote" placeholder="Opcional"></div>'
      :
        (esInstalacion?
          '<div class="fg"><label>Cliente *</label>'+
            '<select id="mv-cli" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
              '<option value="">— seleccionar cliente —</option>'+cliOpts+
            '</select></div>'
          :'')+
        '<div class="fg"><label>Motivo / Nota</label><input id="mv-nota" placeholder="Ej: Merma, uso interno..."></div>'
      )+
    '</div>',
    function(){
      const cid=parseInt(document.getElementById('mv-cid').value);
      const cant=parseFloat(document.getElementById('mv-cant').value)||0;
      if(!cid||cant<=0){alert('Seleccioná un componente e ingresá la cantidad.');return false;}
      const mov={
        id:DB.nid++, cid:cid, tipo:tipo, cant:cant,
        fecha:document.getElementById('mv-fecha').value
      };
      if(tipo==='Entrada'){
        mov.precio=parseFloat(document.getElementById('mv-precio').value)||0;
        mov.ref=document.getElementById('mv-ref').value;
        mov.lote=document.getElementById('mv-lote').value;
      } else if(esInstalacion){
        const cliId=parseInt(document.getElementById('mv-cli').value);
        if(!cliId){alert('Seleccioná un cliente.');return false;}
        mov.clienteId=cliId;
      } else {
        mov.nota=document.getElementById('mv-nota').value;
      }
      DB.movimientos.push(mov);
      save();renderMovimientos();renderStock();return true;
    });
}

// =RDENES =============================================
function renderOrdenes(){
  const tb=document.getElementById('tbody-ord');
  if(!DB.ordenes.length){tb.innerHTML='<tr><td colspan="7" class="empty">Sin órdenes de compra.</td></tr>';return;}
  const list=[...DB.ordenes].sort(function(a,b){return b.fecha.localeCompare(a.fecha);});
  tb.innerHTML=list.map(function(o){
    const estPill={'Pendiente':'p-a',Enviada:'p-b',Recibida:'p-g',Cancelada:'p-r'};
    const items=o.items.map(function(i){
      const c=DB.componentes.find(function(x){return x.id===i.cid;})||{desc:'?'};
      return c.desc+' ('+i.cant+')';
    }).join(', ');
    const total=o.items.reduce(function(a,i){
      const c=DB.componentes.find(function(x){return x.id===i.cid;})||{precio:0};
      return a+(c.precio||0)*i.cant;
    },0);
    return '<tr>'+
      '<td>'+o.fecha+'</td>'+
      '<td><span class="pill '+(estPill[o.estado]||'p-x')+'">'+o.estado+'</span></td>'+
      '<td style="font-size:11px">'+items+'</td>'+
      '<td>'+(o.proveedor||'—')+'</td>'+
      '<td>'+(total?'$'+Math.round(total).toLocaleString('es-AR'):'—')+'</td>'+
      '<td style="font-size:11px">'+(o.obs||'—')+'</td>'+
      '<td style="display:flex;gap:4px">'+
        '<button class="btn btn-sm" onclick="cambiarEstadoOrden('+o.id+')">📋</button>'+
        '<button class="btn btn-sm btn-p" onclick="pdfOrden('+o.id+')">📄</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarOrden('+o.id+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

function generarOrdenAutomatica(){
  const criticos=DB.componentes.filter(function(c){
    return stockActual(c.id)<=(parseFloat(c.min)||0);
  });
  if(!criticos.length){alert('No hay componentes por debajo del stock mínimo.');return;}
  const items=criticos.map(function(c){
    const faltante=Math.max(0,(parseFloat(c.min)||0)-stockActual(c.id));
    return {cid:c.id, cant:faltante+Math.ceil((parseFloat(c.min)||1))};
  });
  const o={
    id:DB.nid++, fecha:today(), estado:'Pendiente',
    items:items, proveedor:'', obs:'Generada automáticamente por stock crítico'
  };
  DB.ordenes.unshift(o);
  save();renderOrdenes();
  alert('✔ Orden generada con '+items.length+' componente'+(items.length!==1?'s':'')+' crítico'+(items.length!==1?'s':'')+'.');
}

function modalOrden(){
  const compOpts=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');
  openModal('Nueva orden de compra',
    '<div id="orden-items"><div class="fg2" style="margin-bottom:8px" id="orden-item-0">'+
      '<div class="fg"><label>Componente *</label>'+
        '<select class="ord-cid" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compOpts+'</select></div>'+
      '<div class="fg"><label>Cantidad *</label><input class="ord-cant" type="number" min="1" value="1"></div>'+
    '</div></div>'+
    '<button class="btn btn-sm" onclick="addOrdenItem()" style="margin-bottom:10px">➕ Agregar ítem</button>'+
    '<div class="fg"><label>Proveedor</label><input id="ord-prov" placeholder="Nombre del proveedor"></div>'+
    '<div class="fg"><label>Observaciones</label><input id="ord-obs" placeholder="Notas..."></div>',
    function(){
      const cids=[...document.querySelectorAll('.ord-cid')].map(function(s){return parseInt(s.value);});
      const cants=[...document.querySelectorAll('.ord-cant')].map(function(i){return parseFloat(i.value)||0;});
      const items=cids.map(function(cid,i){return {cid:cid,cant:cants[i]};}).filter(function(x){return x.cid&&x.cant>0;});
      if(!items.length){alert('Agregá al menos un componente con cantidad.');return false;}
      DB.ordenes.unshift({
        id:DB.nid++, fecha:today(), estado:'Pendiente',
        items:items,
        proveedor:document.getElementById('ord-prov').value,
        obs:document.getElementById('ord-obs').value
      });
      save();renderOrdenes();return true;
    });
}

function addOrdenItem(){
  const cont=document.getElementById('orden-items');
  const idx=cont.children.length;
  const compOpts=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');
  const div=document.createElement('div');
  div.className='fg2';div.style.marginBottom='8px';
  div.innerHTML='<div class="fg"><label>Componente *</label>'+
    '<select class="ord-cid" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
    '<option value="">— seleccionar —</option>'+compOpts+'</select></div>'+
    '<div class="fg"><label>Cantidad *</label><input class="ord-cant" type="number" min="1" value="1"></div>';
  cont.appendChild(div);
}

function cambiarEstadoOrden(id){
  const o=DB.ordenes.find(function(x){return x.id===id;});
  if(!o) return;
  const estados=['Pendiente','Enviada','Recibida','Cancelada'];
  const cur=estados.indexOf(o.estado);
  const sig=estados[(cur+1)%estados.length];
  if(!confirm('Cambiar estado a "'+sig+'"?'))return;
  o.estado=sig;
  if(sig==='Recibida'){
    o.items.forEach(function(item){
      DB.movimientos.push({
        id:DB.nid++, cid:item.cid, tipo:'Entrada',
        cant:item.cant, fecha:today(),
        ref:'Orden #'+o.id, lote:'', precio:0, nota:'Recepción orden de compra'
      });
    });
    alert('Stock actualizado automáticamente con los ítems recibidos.');
  }
  save();renderOrdenes();renderStock();
}

function eliminarOrden(id){
  if(!confirm('¿Eliminar esta orden?'))return;
  DB.ordenes=DB.ordenes.filter(function(x){return x.id!==id;});
  save();renderOrdenes();
}

function pdfOrden(id){
  const o=DB.ordenes.find(function(x){return x.id===id;});
  if(!o) return;
  let rows='';
  o.items.forEach(function(item){
    const c=DB.componentes.find(function(x){return x.id===item.cid;})||{codigo:'?',desc:'?',unidad:'u',precio:0,ubicacion:''};
    const sub=(c.precio||0)*item.cant;
    rows+='<tr><td>'+c.codigo+'</td><td>'+c.desc+'</td><td style="text-align:center">'+item.cant+' '+c.unidad+'</td>'+
      '<td style="text-align:right">$'+Math.round(c.precio||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(sub).toLocaleString('es-AR')+'</td>'+
      '<td>'+( c.ubicacion||'—')+'</td></tr>';
  });
  const total=o.items.reduce(function(a,i){const c=DB.componentes.find(function(x){return x.id===i.cid;})||{precio:0};return a+(c.precio||0)*i.cant;},0);
  const w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orden #'+o.id+'</title>'+
    '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:28px;font-size:13px}'+
    'h1{font-size:18px;font-weight:700;color:#B71C1C;margin-bottom:4px}'+
    '.meta{font-size:12px;color:#666;margin-bottom:20px}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:8px 12px;text-align:left;font-size:11px}'+
    'td{padding:7px 12px;border-bottom:1px solid #eee;font-size:12px}'+
    'tfoot td{background:#f8f8f8;font-weight:700}'+
    '.btn-print{position:fixed;top:14px;right:14px;background:#B71C1C;color:#fff;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:12px}'+
    '@media print{.btn-print{display:none}}</style></head><body>'+
    '<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>ORDEN DE COMPRA</h1>'+
    '<div class="meta">Viking Security Systems &nbsp;·&nbsp; Orden #'+o.id+' &nbsp;·&nbsp; Fecha: '+o.fecha+' &nbsp;·&nbsp; Estado: '+o.estado+
    (o.proveedor?'<br>Proveedor: <strong>'+o.proveedor+'</strong>':'')+
    (o.obs?'<br>Obs: '+o.obs:'')+'</div>'+
    '<table><thead><tr><th>Código</th><th>Descripción</th><th style="text-align:center">Cantidad</th><th style="text-align:right">P. unitario</th><th style="text-align:right">Subtotal</th><th>Ubicación</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr><td colspan="4" style="text-align:right;padding:8px 12px">TOTAL ESTIMADO</td>'+
    '<td style="text-align:right;padding:8px 12px;color:#B71C1C">$'+Math.round(total).toLocaleString('es-AR')+'</td><td></td></tr></tfoot>'+
    '</table></body></html>');
  w.document.close();
}



function enviarEmailPres(id){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p) return;
  const email = p.email || '';
  if(!email){
    alert('Este presupuesto no tiene email del cliente. Editalo y agregá el email antes de enviar.');
    return;
  }
  const num = presNum(p);
  const asunto = encodeURIComponent('Presupuesto ' + num + ' — Viking Security Systems');
  const cuerpo = encodeURIComponent(
    'Estimado/a ' + p.nombre + ',\n\n' +
    'Adjunto el presupuesto ' + num + ' para Zpro ' + p.modelo + ' en ' + p.dir + '.\n\n' +
    'Validez: ' + (p.validez||15) + ' dias.\n\n' +
    'Saludos,\nViking Security Systems'
  );
  window.location.href = 'mailto:' + email + '?subject=' + asunto + '&body=' + cuerpo;
  // Cambiar estado a Enviado
  setTimeout(function(){
    if(confirm('¿Marcar el presupuesto como Enviado?')){
      p.estado='Enviado';
      save();
      renderPresupuestos();
    }
  }, 500);
}

// =======================================================
// INIT
// =======================================================
goTo('clientes');
// PRESUPUESTOS helpers =====================================
function defPrecios(){
  const items={};
  ['Central Zpro','ESP32','Bateria 12V 7Ah','Cargador','Fuente/Transformador'].forEach(function(k){ items[k]={cant:1,precio:0}; });
  ['Puerta','Ventana','Boton','Vibracion','Router Zigbee','Rele','Luz','UPS','Sirena exterior'].forEach(function(s){ items[s]={cant:0,precio:0}; });
  ['Hs. instalacion','Hs. configuracion'].forEach(function(k){ items[k]={cant:1,precio:0}; });
  ['Cableado (ml)','Cajas de paso','Gabinete/caja estanca','Tornilleria y fijaciones','Traslado/viaticos'].forEach(function(k){ items[k]={cant:0,precio:0}; });
  return items;
}

function defPres(){
  return {
    validez:15, plazo:'5 dias habiles',
    formaPago:'50% adelanto - 50% contra entrega',
    garantia:'12 meses en materiales y mano de obra',
    incluye:'Instalacion, configuracion y puesta en marcha',
    noIncluye:'Obras civiles, cableado de red electrica',
    moneda:'ARS', tipoCambio:1, descuento:0, margen:30, obsInternas:''
  };
}

function getCorrelativo(){
  const yr = String(new Date().getFullYear());
  const same = DB.presupuestos.filter(function(p){ return (p.fecha||today()).slice(0,4)===yr; });
  return same.length + 1;
}

function presNum(p){
  const yr = (p.fecha||today()).slice(0,4);
  const num = String(p.correlativo||1).padStart(4,'0');
  const ver = p.version > 1 ? '-v'+p.version : '';
  return 'VSS-'+yr+'-'+num+ver;
}

function formatMonto(v,moneda){
  return ((moneda==='USD')?'U$S ':'$')+Math.round(v).toLocaleString('es-AR');
}

function calcSubtotales(p){
  const cat={materiales:0,sensores:0,mo:0,adicionales:0};
  const matK=['Central Zpro','ESP32','Bateria 12V 7Ah','Cargador','Fuente/Transformador'];
  const moK=['Hs. instalacion','Hs. configuracion'];
  const adK=['Cableado (ml)','Cajas de paso','Gabinete/caja estanca','Tornilleria y fijaciones','Traslado/viaticos'];
  const SENSOR_ITEMS=['Puerta','Ventana','Boton','Vibracion','Router Zigbee','Rele','Luz','UPS','Sirena exterior'];
  if(!p.precios) return cat;
  Object.entries(p.precios).forEach(function(entry){
    const k=entry[0], i=entry[1];
    const val=(parseFloat(i.cant)||0)*(parseFloat(i.precio)||0);
    if(matK.includes(k)) cat.materiales+=val;
    else if(SENSOR_ITEMS.includes(k)) cat.sensores+=val;
    else if(moK.includes(k)) cat.mo+=val;
    else if(adK.includes(k)) cat.adicionales+=val;
  });
  return cat;
}

function calcTotal(p){
  const sub=calcSubtotales(p);
  const bruto=Object.values(sub).reduce(function(a,v){return a+v;},0);
  const margen=bruto*(parseFloat(p.margen)||0)/100;
  return bruto+margen-(parseFloat(p.descuento)||0);
}

function updPres(id,campo,valor){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p) return;
  p[campo]=valor; save();
}

function updatePrecio(id,key,field,valor){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p||!p.precios||!p.precios[key]) return;
  p.precios[key][field]=parseFloat(valor)||0;
  save();
}

function nuevaVersionPres(id){
  const orig=DB.presupuestos.find(function(x){return x.id===id;});
  if(!orig) return;
  if(!confirm('Crear nueva version de '+presNum(orig)+'?')) return;
  const nueva=JSON.parse(JSON.stringify(orig));
  nueva.id=DB.nid++;
  nueva.version=(orig.version||1)+1;
  nueva.estado='Borrador';
  nueva.fecha=today();
  DB.presupuestos.unshift(nueva);
  save(); renderPresupuestos();
}

function abrirEditorPres(id){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p) return;
  if(!p.precios) p.precios=defPrecios();
  const SENSOR_ITEMS=['Puerta','Ventana','Boton','Vibracion','Router Zigbee','Rele','Luz','UPS','Sirena exterior'];
  SENSOR_ITEMS.forEach(function(s){
    if(p.sensores&&p.sensores[s]&&p.sensores[s].qty>0){
      if(!p.precios[s]) p.precios[s]={cant:0,precio:0};
      p.precios[s].cant=p.sensores[s].qty;
    }
  });

  function fila(key,label,readonlyCant){
    var i=p.precios[key]||{cant:0,precio:0};
    var sub=(parseFloat(i.cant)||0)*(parseFloat(i.precio)||0);
    var ro=readonlyCant?"readonly":"";
    var h="<tr style='border-bottom:1px solid var(--border)'>";
    h+="<td style='padding:6px 10px;font-size:12px'>"+label+"</td>";
    h+="<td style='padding:4px 6px'><input type='number' min='0' value='"+(i.cant||0)+"'";
    h+=" "+ro+" style='width:60px;text-align:center;border:1px solid var(--border);padding:4px 6px;font-size:12px'";
    h+=" data-pid='"+id+"' data-key='"+key+"' data-field='cant'";
    h+=" oninput='updatePrecio(parseInt(this.dataset.pid),this.dataset.key,this.dataset.field,this.value)'></td>";
    h+="<td style='padding:4px 6px'><input type='number' min='0' value='"+(i.precio||0)+"'";
    h+=" style='width:110px;border:1px solid var(--border);padding:4px 8px;font-size:12px'";
    h+=" data-pid='"+id+"' data-key='"+key+"' data-field='precio'";
    h+=" oninput='updatePrecio(parseInt(this.dataset.pid),this.dataset.key,this.dataset.field,this.value)'></td>";
    h+="<td style='padding:6px 10px;font-size:12px;font-weight:600;text-align:right'>"+formatMonto(sub,p.moneda)+"</td>";
    h+="</tr>";
    return h;
  }

  function sec(titulo,filas){
    return '<tr style="background:#1a1a1a"><td colspan="4" style="padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#fff">'+titulo+'</td></tr>'+filas;
  }

  const sub=calcSubtotales(p);
  const bruto=Object.values(sub).reduce(function(a,v){return a+v;},0);
  const margenVal=bruto*(parseFloat(p.margen)||0)/100;
  const totalFinal=bruto+margenVal-(parseFloat(p.descuento)||0);

  var inp=function(label,campo,val,type){
    type=type||'text';
    var h="<div class='fg' style='margin:0'><label>"+label+"</label>";
    h+="<input type='"+type+"' value='"+(val||"")+"'";
    h+=" style='padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%'";
    h+=" data-pid='"+id+"' data-campo='"+campo+"'";
    h+=" oninput='updPres(parseInt(this.dataset.pid),this.dataset.campo,this.value)'></div>";
    return h;
  };

  var sel=function(label,campo,opts,cur){
    var h="<div class='fg' style='margin:0'><label>"+label+"</label>";
    h+="<select style='padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%'";
    h+=" data-pid='"+id+"' data-campo='"+campo+"'";
    h+=" onchange='updPres(parseInt(this.dataset.pid),this.dataset.campo,this.value)'>";
    h+=opts.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+o+'</option>';}).join('');
    h+="</select></div>";
    return h;
  };

  const tablaPrecios=
    '<table style="width:100%;border-collapse:collapse;margin-bottom:12px">'+
    '<thead><tr style="background:var(--surface2)">'+
      '<th style="padding:7px 10px;text-align:left;font-size:10px">Item</th>'+
      '<th style="padding:7px 10px;font-size:10px;text-align:center">Cant.</th>'+
      '<th style="padding:7px 10px;font-size:10px">Precio unit.</th>'+
      '<th style="padding:7px 10px;font-size:10px;text-align:right">Subtotal</th>'+
    '</tr></thead><tbody>'+
    sec('Equipamiento central',
      fila('Central Zpro','Central Zpro')+fila('ESP32','Modulo ESP32')+
      fila('Bateria 12V 7Ah','Bateria 12V 7Ah')+fila('Cargador','Cargador')+
      fila('Fuente/Transformador','Fuente/Transformador')
    )+
    sec('Sensores y dispositivos',
      SENSOR_ITEMS.map(function(s){
        const ro=!!(p.sensores&&p.sensores[s]&&p.sensores[s].qty>0);
        return fila(s,s,ro);
      }).join('')
    )+
    sec('Mano de obra',fila('Hs. instalacion','Horas de instalacion')+fila('Hs. configuracion','Horas de configuracion'))+
    sec('Adicionales',
      fila('Cableado (ml)','Cableado (ml)')+fila('Cajas de paso','Cajas de paso')+
      fila('Gabinete/caja estanca','Gabinete/caja estanca')+
      fila('Tornilleria y fijaciones','Tornilleria y fijaciones')+
      fila('Traslado/viaticos','Traslado/viaticos')
    )+
    '</tbody></table>';

  const resumen=
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:12px">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;font-size:12px;color:var(--text2)">'+
        '<div>Equipamiento: <strong>'+formatMonto(sub.materiales,p.moneda)+'</strong></div>'+
        '<div>Sensores: <strong>'+formatMonto(sub.sensores,p.moneda)+'</strong></div>'+
        '<div>Mano de obra: <strong>'+formatMonto(sub.mo,p.moneda)+'</strong></div>'+
        '<div>Adicionales: <strong>'+formatMonto(sub.adicionales,p.moneda)+'</strong></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:end">'+
        '<div class="fg" style="margin:0"><label>Margen (%)</label>'+
          '<input type="number" min="0" max="100" value="'+(p.margen||0)+'" '+
          'style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%" '+
          "oninput=\"updPres("+id+",'margen',this.value)\"></div>"+
        '<div class="fg" style="margin:0"><label>Descuento ($)</label>'+
          '<input type="number" min="0" value="'+(p.descuento||0)+'" '+
          'style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%" '+
          "oninput=\"updPres("+id+",'descuento',this.value)\"></div>"+
        '<div style="background:#111;color:#fff;border-radius:var(--r);padding:10px;text-align:center">'+
          '<div style="font-size:9px;color:#aaa;text-transform:uppercase;margin-bottom:3px">Total final</div>'+
          '<div style="font-size:17px;font-weight:700">'+formatMonto(totalFinal,p.moneda)+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';

  openModal('Presupuesto '+presNum(p),
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">'+
      sel('Estado','estado',['Borrador','Enviado','Aprobado','Rechazado'],p.estado)+
      sel('Moneda','moneda',['ARS','USD'],p.moneda)+
      inp('Tipo de cambio','tipoCambio',p.tipoCambio,'number')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
      inp('Nombre cliente *','nombre',p.nombre)+
      inp('Telefono','tel',p.tel)+
      inp('Email','email',p.email,'email')+
      inp('Direccion','dir',p.dir)+
      inp('Barrio','barrio',p.barrio)+
      sel('Modelo Zpro','modelo',['Base','Energy','Comfort','Black'],p.modelo)+
      inp('Tecnico','tecnico',p.tecnico)+
    '</div>'+
    '<hr class="div"><div class="sectitle">Computo de materiales y precios</div>'+
    tablaPrecios+resumen+
    '<hr class="div"><div class="sectitle">Condiciones comerciales</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
      inp('Validez (dias)','validez',p.validez,'number')+
      inp('Plazo de entrega','plazo',p.plazo)+
      inp('Forma de pago','formaPago',p.formaPago)+
      inp('Garantia','garantia',p.garantia)+
      inp('Incluye','incluye',p.incluye)+
      inp('No incluye','noIncluye',p.noIncluye)+
    '</div>'+
    '<hr class="div">'+
    '<div class="fg"><label>Observaciones internas (no aparecen en el PDF)</label>'+
      "<textarea style='padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%;min-height:56px;font-family:inherit'" +"oninput='updPres("+id+",\"obsInternas\",this.value)'>"+(p.obsInternas||'')+"</textarea></div>"+
    '<div style="display:flex;gap:8px;margin-top:8px">'+
      '<button class="btn btn-p" style="flex:1" onclick="generarPDF('+id+');cerrarModal()">PDF</button>'+
      '<button class="btn" style="flex:1;color:var(--blue);border-color:var(--blue)" onclick="enviarEmailPres('+id+');cerrarModal()">Email</button>'+
      (p.estado==='Aprobado'?'<button class="btn btn-g" style="flex:1" onclick="convertirCliente('+id+');cerrarModal()">Cliente</button>':'')+
    '</div>'
  ,null,true);
}

function nuevoPresupuesto(){
  const p = Object.assign({
    id:DB.nid++, relId:null,
    correlativo:getCorrelativo(), version:1,
    nombre:'', tel:'', email:'', dir:'', barrio:'', ambientes:'',
    tipo:'Casa', sup:'', plantas:'Planta baja', material:'Mampostería',
    alarma:'No', perro:'No', horario:'Siempre habitado',
    modelo:'Base', sensores:{}, router:'', distancia:'', obstaculos:'',
    tecnico:'', obs:'', estado:'Borrador', fecha:today(),
    precios:defPrecios()
  }, defPres());
  DB.presupuestos.unshift(p);
  save();
  abrirEditorPres(p.id);
}


