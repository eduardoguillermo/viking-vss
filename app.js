
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
    ordenes:[],
    fondos:[],
    proveedores:[],
    gestiones:[],
    fabricacion:[],
    instalaciones:[],
    kit:[],
    kitinst:[],
    kitVersion:1,
    kitinstVersion:1,
    config:{
      empresa:'Viking Security Systems',
      email:'',
      tel:'',
      direccion:'',
      web:'',
      firma:'Viking Security Systems',
      tipoCambio:1,
      pdf_incluir_monto:true,
      pdf_incluir_sensores:true,
      pdf_incluir_condiciones:true,
      desc_Base:'Sistema de seguridad basico con control remoto via Telegram. Notificaciones en tiempo real y activacion remota.',
      desc_Energy:'Sistema con gestion energetica integrada, monitoreo de corte de suministro, bateria de respaldo y sirena exterior.',
      desc_Comfort:'Sistema avanzado con automatizacion, integracion Zigbee completa, control de cargas y notificaciones inteligentes.',
      desc_Black:'Sistema de maxima prestacion con multiples usuarios, historial extendido, integracion de camaras y soporte prioritario.'
    }
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
if(!DB.proveedores) DB.proveedores = [];
if(!DB.gestiones) DB.gestiones = [];
if(!DB.fabricacion) DB.fabricacion = [];
if(!DB.instalaciones) DB.instalaciones = [];
if(!DB.kitinst) DB.kitinst = [];
if(!DB.kitinstVersion) DB.kitinstVersion = 1;
if(!DB.kitinstFecha) DB.kitinstFecha = today();
if(!DB.kit) DB.kit = [];
if(!DB.kitVersion) DB.kitVersion = 1;
if(!DB.kitFecha) DB.kitFecha = today();
// Migrate ordenes - add numero if missing
DB.ordenes.forEach(function(o,i){
  if(!o.numero) o.numero = 'OC-'+( o.fecha?o.fecha.slice(0,4):new Date().getFullYear())+'-'+String(i+1).padStart(4,'0');
});
if(!DB.fondos) DB.fondos = [];
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
const PANELS=['clientes','alta','detalle','versiones','tipos','backup','presupuestos','stock','catalogo','movimientos','ordenes','config','reportes','proveedores','gestion','fondos','fabricacion','kit','instalaciones','kitinst'];

function goTo(p){
  PANELS.forEach(x=>{
    const panel=document.getElementById('panel-'+x);
    if(panel) panel.classList.toggle('on',x===p);
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
  if(p==='alta' && !window._convData) limpiarAlta();
  if(p==='versiones') renderVersiones();
  if(p==='tipos') renderTipos();
  if(p==='backup') renderBackupInfo();
  if(p==='fabricacion') renderFabricacion();
  if(p==='kit') renderKit();
  if(p==='instalaciones') renderInstalaciones();
  if(p==='kitinst') renderKitInst();
  if(p==='presupuestos') renderPresupuestos();
  if(p==='stock') renderStock();
  if(p==='catalogo') renderCatalogo();
  if(p==='movimientos') renderMovimientos();
  if(p==='ordenes') renderOrdenes();
  if(p==='config') renderConfig();
  if(p==='reportes') renderReportes();
  if(p==='proveedores') renderProveedores();
  if(p==='gestion') renderGestion();
  if(p==='fondos') renderFondos();
}

// =======================================================
// SUBPANELS
// =======================================================
const SUBS=['datos','equipo','zigbee','ota','mant','acta'];
function goSub(s){
  SUBS.forEach(x=>{
    var sp=document.getElementById('sp-'+x); if(sp) sp.classList.toggle('on',x===s);
    var sni=document.getElementById('sni-'+x); if(sni) sni.classList.toggle('on',x===s);
  });
  curSub=s;
  if(s==='datos') renderDatos();
  if(s==='equipo') renderEquipo();
  if(s==='zigbee') renderZigbee();
  if(s==='ota') renderOTA();
  if(s==='mant') renderMant();
  if(s==='acta') renderActa();
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
        ?`<button class="btn btn-sm" style="color:var(--red)" onclick="darBaja(${c.id})">🚫 Baja</button><button class="btn btn-sm" style="color:var(--red);margin-left:3px" onclick="borrarCliente(${c.id})">🗑️</button>`
        :`<button class="btn btn-sm" style="color:var(--green)" onclick="reactivar(${c.id})">✅ Activar</button>`}
    </td>
  </tr>`).join('');
}

function darBaja(id){
  if(!confirm('¿Confirmar baja del cliente?')) return;
  DB.clientes.find(x=>x.id===id).estado='Baja';
  save(); renderStats(); renderClientes();
}

function borrarCliente(id){
  const c=DB.clientes.find(function(x){return x.id===id;});
  if(!c) return;
  if(!confirm('¿Eliminar permanentemente al cliente "'+c.nombre+'"? Esta acción no se puede deshacer.')) return;
  if(!confirm('Última confirmación. ¿Eliminar "'+c.nombre+'"?')) return;
  DB.clientes=DB.clientes.filter(function(x){return x.id!==id;});
  save(); renderStats(); renderClientes(); goTo('clientes');
setTimeout(initNavCollapse, 50);

// Backup reminder on every load
setTimeout(function(){
  var banner = document.createElement('div');
  banner.id = 'backup-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#B71C1C;color:#fff;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:9999;font-size:13px;font-family:inherit';
  var btnExp = document.createElement('button');
  btnExp.textContent = 'Exportar ahora';
  btnExp.style.cssText = 'background:#fff;color:#B71C1C;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700';
  btnExp.onclick = function(){ exportarJSON(); document.getElementById('backup-banner').remove(); };
  var btnCer = document.createElement('button');
  btnCer.textContent = 'Cerrar';
  btnCer.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnCer.onclick = function(){ document.getElementById('backup-banner').remove(); };
  var btnDrive = document.createElement('button');
  btnDrive.textContent = '☁️ Drive';
  btnDrive.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnDrive.onclick = function(){ exportarADrive(); document.getElementById('backup-banner').remove(); };
  var span = document.createElement('span');
  span.textContent = '💾 Recordatorio: hacé un backup de tus datos para no perderlos.';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
  btns.appendChild(btnExp); btns.appendChild(btnDrive); btns.appendChild(btnCer);
  banner.appendChild(span); banner.appendChild(btns);
  document.body.appendChild(banner);
}, 1500);
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

// Backup reminder on every load
setTimeout(function(){
  var banner = document.createElement('div');
  banner.id = 'backup-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#B71C1C;color:#fff;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:9999;font-size:13px;font-family:inherit';
  var btnExp = document.createElement('button');
  btnExp.textContent = 'Exportar ahora';
  btnExp.style.cssText = 'background:#fff;color:#B71C1C;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700';
  btnExp.onclick = function(){ exportarJSON(); document.getElementById('backup-banner').remove(); };
  var btnCer = document.createElement('button');
  btnCer.textContent = 'Cerrar';
  btnCer.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnCer.onclick = function(){ document.getElementById('backup-banner').remove(); };
  var btnDrive = document.createElement('button');
  btnDrive.textContent = '☁️ Drive';
  btnDrive.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnDrive.onclick = function(){ exportarADrive(); document.getElementById('backup-banner').remove(); };
  var span = document.createElement('span');
  span.textContent = '💾 Recordatorio: hacé un backup de tus datos para no perderlos.';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
  btns.appendChild(btnExp); btns.appendChild(btnDrive); btns.appendChild(btnCer);
  banner.appendChild(span); banner.appendChild(btns);
  document.body.appendChild(banner);
}, 1500);
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
      ?`<button class="btn btn-sm btn-d" onclick="darBaja(${c.id});verCliente(${c.id})">🚫 Dar de baja</button><button class="btn btn-sm" style="background:#7F0000;color:#fff;margin-left:6px" onclick="borrarCliente(${c.id})">🗑️ Eliminar cliente</button>`
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
    var sp=document.getElementById('sp-'+x);
    var sni=document.getElementById('sni-'+x);
    if(sp) sp.classList.toggle('on',x==='datos');
    if(sni) sni.classList.toggle('on',x==='datos');
  });
  renderDatos();
}

// =======================================================
// SUB: DATOS
// =======================================================

function setEstadoInstalacion(id, estado){
  var c = DB.clientes.find(function(x){return x.id===id;});
  if(!c) return;
  c.estadoInstalacion = estado;
  save(); renderDatos();
}

function saveNotasCliente(id, texto){
  var c = DB.clientes.find(function(x){return x.id===id;});
  if(!c) return;
  c.notas = texto;
  save();
}

function renderDatos(){
  const c=gc();
  document.getElementById('cont-datos').innerHTML=`
    <div class="fgrid">${fbox('Nombre',c.nombre)}${fbox('Lote',c.lote)}${fbox('Barrio',c.barrio)}</div>
    <div class="fgrid">${fbox('Teléfono',c.tel)}${fbox('Email',c.email||'—')}${fbox('Ambientes',c.ambientes?c.ambientes+' amb':'—')}</div>\n    <div class=\"fgrid\">${fbox('Estado',ePill(c.estado))}<div></div><div></div></div>
    <hr class="div">
    <div class="fgrid">${fbox('Modelo Zpro',mPill(c.modelo))}${fbox('Versión instalada',c.version,true)}${fbox('Fecha instalación',c.fecha)}</div>
    <hr class="div">
    <div class="fgrid">${fbox('MAC del ESP32',c.mac,true)}${fbox('PIN OTA',c.pin?'••••••':'')}${fbox('Chat ID Telegram',c.chatid,true)}</div>
    <hr class="div">
    <div class="sectitle">Instalación y notas</div>
    <div style="margin-top:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--text2)">Estado:</span>
        ${['Programado','En fabricación','Terminado','Pendiente','En curso','Completada'].map(s=>
          '<button onclick="setEstadoInstalacion('+c.id+',\''+s+'\')" style="padding:3px 10px;border-radius:12px;font-size:11px;border:1px solid var(--border);cursor:pointer;background:'+(c.estadoInstalacion===s?'var(--primary)':'var(--surface2)')+';color:'+(c.estadoInstalacion===s?'#fff':'var(--text)')+'">'+s+'</button>'
        ).join('')}
      </div>
      <label style="font-size:11px;color:var(--text2);display:block;margin-bottom:4px">Notas internas</label>
      <textarea onblur="saveNotasCliente(${c.id},this.value)" style="width:100%;min-height:70px;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;font-family:inherit;background:var(--surface2);color:var(--text);resize:vertical">${c.notas||''}</textarea>
    </div>`;
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
    <div class="sectitle">Procesador / Central</div>
    <div class="fgrid">${fbox('N° serie',e.esp_serie,true)}${fbox('Proveedor',e.proveedor)}${fbox('Fecha de compra',e.fcompra)}</div>
    <hr class="div">
    <div class="twocol">
      <div>
        <div class="sectitle">UPS</div>
        <div class="fgrid2">
          ${fbox('Marca',e.ups_marca||'—')}${fbox('Modelo',e.ups_modelo||'—')}
          ${fbox('Tensión de salida',e.ups_tension||'—')}${fbox('Garantía',garPill(e.ups_garantia))}
          ${fbox('Venc. garantía',e.ups_gar_vence||'—')}${fbox('Último service',e.ups_ultimo_service||'—')}
        </div>
      </div>
      <div>
        <div class="sectitle">Sirena</div>
        <div class="fgrid2">
          ${fbox('Marca',e.sirena_marca)}${fbox('Modelo',e.sirena_modelo)}
          ${fbox('N° de serie',e.sirena_serie,true)}
        </div>
      </div>
    </div>`;
}


function stockOpts(categoria){
  // Get components from stock filtered by category keywords
  var items = DB.componentes.filter(function(c){
    if(!categoria) return true;
    return c.categoria && c.categoria.toLowerCase().indexOf(categoria.toLowerCase()) >= 0;
  });
  if(!items.length) return DB.componentes; // fallback all
  return items;
}

function stockDatalist(id, categoria, mode){
  if(mode==='ubicaciones'){
    var ubics=[...new Set(DB.componentes.map(function(c){return c.ubicacion;}).filter(Boolean))];
    return '<datalist id="dl-'+id+'">'+ubics.map(function(u){return '<option value="'+u+'"></option>';}).join('')+'</datalist>';
  }
  var opts = DB.componentes;
  if(categoria){
    var filtered = opts.filter(function(c){
      return c.categoria && c.categoria.toLowerCase().indexOf(categoria.toLowerCase()) >= 0;
    });
    if(filtered.length) opts = filtered;
  }
  return '<datalist id="dl-'+id+'">'+opts.map(function(c){
    return '<option value="'+c.desc+'">'+c.codigo+'</option>';
  }).join('')+'</datalist>';
}

function editarEquipo(){
  const c=gc();const e=c.equipo;
  openModal('Editar equipamiento',`
    <div class="fg3">
      <div class="fsec" style="border-top:none;padding-top:0;margin-top:0">Procesador / Central</div>
      <div class="fg"><label>N° serie</label><input id="eq-es" value="${e.esp_serie||''}"></div>
      <div class="fg"><label>Proveedor</label><input id="eq-pr" value="${e.proveedor||''}"></div>
      <div class="fg"><label>Fecha compra</label><input id="eq-fc" type="date" value="${e.fcompra||''}"></div>
      <div class="fsec">UPS</div>
      <div class="fg"><label>Marca</label><input id="eq-ups-m" value="${e.ups_marca||''}"></div>
      <div class="fg"><label>Modelo</label><input id="eq-ups-mo" value="${e.ups_modelo||''}"></div>
      <div class="fg"><label>Tensión de salida</label><input id="eq-ups-t" value="${e.ups_tension||''}" placeholder="Ej: 12V DC"></div>
      <div class="fg"><label>Garantía</label><select id="eq-ups-g"><option${(e.ups_garantia||'No')==='Sí'?' selected':''}>Sí</option><option${(e.ups_garantia||'No')!=='Sí'?' selected':''}>No</option></select></div>
      <div class="fg"><label>Vencimiento garantía</label><input id="eq-ups-gv" type="date" value="${e.ups_gar_vence||''}"></div>
      <div class="fg"><label>Último service</label><input id="eq-ups-us" type="date" value="${e.ups_ultimo_service||''}"></div>
      <div class="fsec">Sirena</div>
      <div class="fg"><label>Marca</label><input id="eq-sm" value="${e.sirena_marca||''}"></div>
      <div class="fg"><label>Modelo</label><input id="eq-smo" value="${e.sirena_modelo||''}"></div>
      <div class="fg"><label>N° serie</label><input id="eq-ss" value="${e.sirena_serie||''}"></div>
    </div>`,()=>{
    e.esp_serie=document.getElementById('eq-es').value;
    e.proveedor=document.getElementById('eq-pr').value;
    e.fcompra=document.getElementById('eq-fc').value;
    e.ups_marca=document.getElementById('eq-ups-m').value;
    e.ups_modelo=document.getElementById('eq-ups-mo').value;
    e.ups_tension=document.getElementById('eq-ups-t').value;
    e.ups_garantia=document.getElementById('eq-ups-g').value;
    e.ups_gar_vence=document.getElementById('eq-ups-gv').value;
    e.ups_ultimo_service=document.getElementById('eq-ups-us').value;
    e.sirena_marca=document.getElementById('eq-sm').value;
    e.sirena_modelo=document.getElementById('eq-smo').value;
    e.sirena_serie=document.getElementById('eq-ss').value;
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
    <colgroup><col style="width:8%"><col style="width:11%"><col style="width:9%"><col style="width:9%"><col style="width:12%"><col style="width:11%"><col style="width:10%"><col style="width:10%"><col style="width:11%"><col style="width:9%"></colgroup>
    <thead><tr><th>Tipo</th><th>Nombre</th><th>Marca</th><th>Modelo</th><th>Dir. hex</th><th>Ubicación</th><th>Marca pilas</th><th>Modelo pilas</th><th>Cambio pilas</th><th></th></tr></thead>
    <tbody>${c.zigbee.map((d,i)=>`<tr>
      <td>${tPill(d.tipo)}</td><td>${d.nombre}</td><td>${d.marca||'—'}</td><td>${d.modelo||'—'}</td>
      <td class="mono">${d.hex||'—'}</td><td>${d.ubicacion||'—'}</td>
      <td>${d.marcaPilas||'—'}</td><td>${d.modeloPilas||'—'}</td><td>${d.fechaCambioPilas||'—'}</td>
      <td style="display:flex;gap:3px">
        <button class="btn btn-sm" title="Editar" onclick="modalZigbee(${i})">✏️</button>
        <button class="btn btn-sm" style="color:var(--red)" title="Eliminar" onclick="elimZigbee(${i})">🗑️</button>
      </td>
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
      <div class="fg"><label>Modelo</label><input id="z-mo" value="${d.modelo||''}" placeholder="MCCGQ11LM" list="dl-z-mo">${stockDatalist("z-mo","")}</div>
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
    <div class="stat"><div class="stat-n blue">$${Math.round(costo).toLocaleString('es-AR').toLocaleString('es-AR')}</div><div class="stat-l">Costo acumulado</div></div>
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
      <td>$${Math.round(parseFloat(m.costo)||0).toLocaleString('es-AR').toLocaleString('es-AR')}</td>
      <td>${m.tecnico||'—'}</td><td>${m.obs||'—'}</td>
      <td><button class="btn btn-sm" onclick="modalMant(${i})" title="Editar">✏️</button></td>
    </tr>`).join('')}</tbody></table>`;
}


function getMantDatalist(campo, dlId){
  var vals = [];
  DB.clientes.forEach(function(c){
    if(!c.mant) return;
    c.mant.forEach(function(m){
      if(m[campo]&&m[campo].trim()) vals.push(m[campo].trim());
    });
  });
  vals = [...new Set(vals)].sort();
  return '<datalist id="'+dlId+'">'+vals.map(function(v){return '<option value="'+v.replace(/"/g,"'")+'">';}).join('')+'</datalist>';
}

function modalMant(idx){
  const c=gc();
  const m=idx>=0?c.mant[idx]:{};
  openModal(idx>=0?'Editar visita de mantenimiento':'Registrar visita de mantenimiento',`
    <div class="fg2">
      <div class="fg"><label>Fecha *</label><input id="mt-f" type="date" value="${m.fecha||today()}"></div>
      <div class="fg"><label>Tipo *</label><select id="mt-ti">${['Correctivo','Configuración','Actualización','Cambio de pilas'].map(t=>`<option${(m.tipo||'')==t?' selected':''}>${t}</option>`).join('')}</select></div>
      <div class="fg"><label>Motivo del llamado *</label><input id="mt-mo" value="${m.motivo||''}" placeholder="Ej: Sirena no activa, falsa alarma..." list="dl-mt-mo">${getMantDatalist('motivo','dl-mt-mo')}</div>
      <div class="fg"><label>Falla detectada</label><input id="mt-fa" value="${m.falla||''}" placeholder="Ej: Conexión suelta" list="dl-mt-fa">${getMantDatalist('falla','dl-mt-fa')}</div>
      <div class="fg"><label>Reparación realizada</label><input id="mt-re" value="${m.reparacion||''}" placeholder="Ej: Reconexión terminal" list="dl-mt-re">${getMantDatalist('reparacion','dl-mt-re')}</div>
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
function reiniciarOperativo(){
  if(!confirm('⚠️ Esto borrará todos los datos operativos (clientes, presupuestos, movimientos, OC, fabricación, instalaciones y finanzas).\n\nSe PRESERVAN: catálogo, proveedores, configuración, kits y versiones SW.\n\n¿Confirmás?')) return;
  if(!confirm('Última confirmación. Esta acción no se puede deshacer.')) return;

  // Preserve
  var config = DB.config;
  var componentes = DB.componentes;
  var proveedores = DB.proveedores;
  var versiones = DB.versiones;
  var tipos = DB.tipos;
  var kit = DB.kit;
  var kitVersion = DB.kitVersion;
  var kitFecha = DB.kitFecha;
  var kitinst = DB.kitinst;
  var kitinstVersion = DB.kitinstVersion;
  var kitinstFecha = DB.kitinstFecha;

  // Reset operational data
  DB.clientes = [];
  DB.presupuestos = [];
  DB.movimientos = [];
  DB.ordenes = [];
  DB.gestiones = [];
  DB.fondos = [];
  DB.fabricacion = [];
  DB.instalaciones = [];
  DB.nid = 1;

  // Restore preserved
  DB.config = config;
  DB.componentes = componentes;
  DB.proveedores = proveedores;
  DB.versiones = versiones;
  DB.tipos = tipos;
  DB.kit = kit;
  DB.kitVersion = kitVersion;
  DB.kitFecha = kitFecha;
  DB.kitinst = kitinst;
  DB.kitinstVersion = kitinstVersion;
  DB.kitinstFecha = kitinstFecha;

  save();
  alert('✅ Datos operativos reiniciados. Catálogo, proveedores y configuración preservados.');
  location.reload();
}

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
  a.href=url;a.download='viking_backup_'+fecha+'.json';a.click();
  URL.revokeObjectURL(url);
}

function exportarADrive(){
  const fecha=today();
  const json=JSON.stringify(DB,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const file=new File([blob],'viking_backup_'+fecha+'.json',{type:'application/json'});
  // Use Web Share API if available (Android/mobile)
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({
      files:[file],
      title:'Viking Backup '+fecha,
      text:'Backup del sistema Viking Security Systems'
    }).then(function(){
      alert('Archivo compartido. Seleccioná Google Drive como destino.');
    }).catch(function(e){
      if(e.name!=='AbortError') exportarJSON(); // fallback
    });
  } else {
    // Desktop fallback - download and show instructions
    exportarJSON();
    alert('En PC: el archivo se descargó. Subilo manualmente a Google Drive.\nEn Android: usá el botón "Compartir" del archivo descargado y seleccioná Drive.');
  }
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
  const devs=c.reduce((a,x)=>a+((x.zigbee&&x.zigbee.length)||0),0);
  const otas=c.reduce((a,x)=>a+((x.ota&&x.ota.length)||0),0);
  const mantos=c.reduce((a,x)=>a+((x.mant&&x.mant.length)||0),0);
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
function openModal(title,body,onSave,soloVista){
  var footer = soloVista
    ? '<button class="btn" onclick="cerrarModal()">Cerrar</button>'
    : '<button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn btn-p" id="msave">✔ Guardar</button>';
  document.getElementById('mbox').innerHTML=`
    <div class="moverlay" onclick="if(event.target===this)cerrarModal()">
      <div class="modal">
        <div class="mhead"><h3>${title}</h3><button class="btn btn-sm" onclick="cerrarModal()">✕</button></div>
        <div class="mbody">${body}</div>
        <div class="mfoot">${footer}</div>
      </div>
    </div>`;
  if(!soloVista && onSave){
    document.getElementById('msave').onclick=function(){ if(onSave()!==false) cerrarModal(); };
  }
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
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p)return;
  if(!confirm('¿Convertir el presupuesto de "'+p.nombre+'" en cliente?'))return;
  cerrarModal();
  // Store data to load after navigation
  window._convData = p;
  goTo('alta');
  setTimeout(function(){
    var d = window._convData;
    if(!d) return;
    var f=function(eid,val){var el=document.getElementById(eid);if(el)el.value=val||'';};
    f('an', d.nombre);
    f('al', '');
    f('aba', d.barrio);
    f('at', d.tel);
    f('aemail', d.email);
    f('aambientes', d.ambientes);
    f('af', today());
    f('av', '');
    f('amac', '');
    f('apin', '');
    f('achat', '');
    var am=document.getElementById('am');
    if(am) am.value=d.modelo||'Base';
    window._convData = null;
    alert('Datos cargados desde presupuesto. Completá lote, MAC, PIN y versión.');
  }, 300);
}

function verPresupuesto(id){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p)return;

  // Calcular total
  const sub=calcSubtotales(p);
  const bruto=Object.values(sub).reduce(function(a,v){return a+v;},0);
  const margenVal=bruto*(parseFloat(p.margen)||0)/100;
  const totalConMargen=bruto+margenVal;
  const descVal=parseFloat(p.descuento)||0;
  const totalFinal=totalConMargen-descVal;
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const totalUSD=tc>0?(totalFinal/tc).toFixed(2):0;

  // Sensores
  var sensorHtml='';
  const SENSOR_ITEMS=['Puerta','Ventana','PuertaVentana','Boton','Vibracion','Agua','Interruptor s/neutro','Interruptor router','Rele','Luz'];
  SENSOR_ITEMS.forEach(function(tipo){
    const s=p.sensores&&p.sensores[tipo];
    if(!s||s.qty===0)return;
    const ubics=(s.ubicaciones||[]).filter(Boolean).map(function(u){return '<li>'+u+'</li>';}).join('');
    sensorHtml+='<div style="margin-bottom:8px"><strong>'+tipo+'</strong>: '+s.qty+' unidad'+(s.qty>1?'es':'')+'<ul style="padding-left:16px;color:var(--text2);font-size:11px">'+ubics+'</ul></div>';
  });

  const aprBtn=p.estado==='Aprobado'?'<button class="btn btn-sm btn-g" onclick="convertirCliente('+p.id+');cerrarModal()">👤 Convertir en cliente</button>':'';

  openModal('Presupuesto '+presNum(p),
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<select onchange="cambiarEstadoPres('+p.id+',this.value)" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px">'+
        ['Borrador','Enviado','Aprobado','Rechazado'].map(function(e){return '<option'+(p.estado===e?' selected':'')+'>'+e+'</option>';}).join('')+
      '</select>'+
      '<button class="btn btn-sm btn-p" onclick="generarPDF('+p.id+');cerrarModal()">📄 PDF</button>'+
      '<button class="btn btn-sm" style="color:var(--blue)" onclick="enviarEmailPres('+p.id+');cerrarModal()">📧 Email</button>'+
      aprBtn+
    '</div>'+
    '<div class="fg2">'+
      '<div class="fbox"><div class="fl">Cliente</div><div class="fv">'+p.nombre+'</div></div>'+
      '<div class="fbox"><div class="fl">Teléfono</div><div class="fv">'+p.tel+'</div></div>'+
      '<div class="fbox"><div class="fl">Dirección</div><div class="fv">'+(p.dir||'—')+'</div></div>'+
      '<div class="fbox"><div class="fl">Barrio</div><div class="fv">'+(p.barrio||'—')+'</div></div>'+
      '<div class="fbox"><div class="fl">Modelo</div><div class="fv">'+mPill(p.modelo)+'</div></div>'+
      '<div class="fbox"><div class="fl">Estado</div><div class="fv">'+presEstadoPill(p.estado)+'</div></div>'+
    '</div>'+
    '<hr class="div">'+
    '<div class="sectitle">Sensores relevados</div>'+
    '<div style="margin-bottom:12px">'+(sensorHtml||'<span style="color:var(--text3)">Sin sensores</span>')+'</div>'+
    '<hr class="div">'+
    '<div class="sectitle">Valor de la cotización</div>'+
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:12px">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">'+
        '<div>Subtotal: <strong>'+formatMonto(totalConMargen,p.moneda)+'</strong></div>'+
        (descVal>0?'<div style="color:var(--red)">Descuento: <strong>-'+formatMonto(descVal,p.moneda)+'</strong></div>':'<div></div>')+
        '<div style="font-size:15px;font-weight:700">TOTAL: '+formatMonto(totalFinal,p.moneda)+'</div>'+
        '<div style="color:var(--text2)">U$S: '+totalUSD+'</div>'+
      '</div>'+
    '</div>'+
    (p.obsInternas?'<hr class="div"><div class="sectitle">Notas internas</div><p style="font-size:12px;color:var(--text2)">'+p.obsInternas+'</p>':'')
  ,null,true);
}


function generarPDF(id){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p)return;

  // Get config
  const cfg = DB.config || {};
  const empresa = cfg.empresa || 'Viking Security Systems';
  const cfgEmail = cfg.email || '';
  const cfgTel = cfg.tel || '';
  const cfgDireccion = cfg.direccion || '';
  const cfgWeb = cfg.web || '';

  const fecha=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  const venceDate=new Date(Date.now()+(parseInt(p.validez)||15)*86400000);
  const vence=venceDate.toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'});
  const num=presNum(p);

  // Calcular totales
  const sub=calcSubtotales(p);
  const bruto=Object.values(sub).reduce(function(a,v){return a+v;},0);
  const margenVal=bruto*(parseFloat(p.margen)||0)/100;
  const totalConMargen=bruto+margenVal;
  const descVal=parseFloat(p.descuento)||0;
  const totalFinal=totalConMargen-descVal;

  // Sensores
  var sensorRows='';
  const SENSOR_ITEMS=['Puerta','Ventana','PuertaVentana','Boton','Vibracion','Agua','Interruptor s/neutro','Interruptor router','Rele','Luz'];
  SENSOR_ITEMS.forEach(function(s){
    const qty=p.precios&&p.precios[s]?parseFloat(p.precios[s].cant)||0:0;
    if(qty<=0)return;
    var ubics='';
    if(p.sensores&&p.sensores[s]&&p.sensores[s].ubicaciones){
      ubics=p.sensores[s].ubicaciones.filter(Boolean).join(', ');
    }
    sensorRows+='<tr><td>'+s+'</td><td style="text-align:center">'+qty+'</td><td style="color:#555">'+(ubics||'—')+'</td></tr>';
  });

  const descRow=descVal>0?
    '<tr><td colspan="2" style="padding:8px 14px;text-align:right;color:#B71C1C;font-weight:600">Descuento</td>'+
    '<td style="padding:8px 14px;text-align:right;color:#B71C1C;font-weight:600">- '+formatMonto(descVal,p.moneda)+'</td></tr>':'';

  const LOGO=document.getElementById('logo-pdf-data')?document.getElementById('logo-pdf-data').src:'';

  const CSS='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;color:#222;font-size:12px}'+
    '@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.no-print{display:none}@page{margin:15mm 12mm}}'+
    '.header{background:#111;color:#fff;padding:12px 24px;display:flex;align-items:center;gap:14px}'+
    '.header img{width:52px;height:52px;border-radius:50%;border:2px solid #B71C1C}'+
    '.header h1{font-size:16px;font-weight:700}.header p{font-size:10px;color:#aaa;margin-top:1px}'+
    '.hr{margin-left:auto;text-align:right}.pn{font-size:14px;font-weight:700;letter-spacing:.5px}.ps{font-size:10px;color:#aaa;margin-top:2px}'+
    '.body{padding:16px 24px}.section{margin-bottom:14px}'+
    '.st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#B71C1C;border-bottom:2px solid #B71C1C;padding-bottom:3px;margin-bottom:10px}'+
    '.g2{display:grid;grid-template-columns:1fr 1fr;gap:7px}'+
    '.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}'+
    '.field{background:#f8f8f8;border-radius:5px;padding:6px 9px}'+
    '.field .fl{font-size:8px;color:#999;font-weight:700;text-transform:uppercase;margin-bottom:1px}'+
    '.field .fv{font-size:12px;font-weight:500}'+
    'table.t{width:100%;border-collapse:collapse}'+
    'table.t th{background:#B71C1C;color:#fff;padding:7px 11px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase}'+
    'table.t td{padding:6px 11px;border-bottom:1px solid #eee;font-size:11px}'+
    'table.t tfoot td{background:#f8f8f8}'+
    '.validez{background:#FFF8E1;border:1px solid #FFD54F;border-radius:5px;padding:7px 11px;margin-bottom:14px;font-size:11px;color:#7B4F00}'+
    '.mb{display:inline-block;background:#E3F2FD;color:#0D47A1;padding:3px 12px;border-radius:20px;font-weight:700;font-size:13px;margin-bottom:5px}'+
    '.mdesc{font-size:11px;color:#555;line-height:1.4}'+
    '.cg{display:grid;grid-template-columns:1fr 1fr;gap:7px}'+
    '.leyenda{padding:8px 24px;background:#f0f0f0;border-top:1px solid #ddd;font-size:9px;color:#888;font-style:italic;line-height:1.4}'+
    '.footer{padding:10px 24px;background:#f5f5f5;border-top:3px solid #B71C1C;display:flex;justify-content:space-between;align-items:center}'+
    '.footer div{font-size:9px;color:#888}'+
    '.btn-print{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:8px 18px;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600}';

  const body=
    '<button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>'+
    '<div class="header">'+
      (LOGO?'<img src="'+LOGO+'" alt="'+empresa+'">':'')+
      '<div><h1>'+empresa.toUpperCase()+'</h1><p>Sistema de seguridad inteligente Zigbee</p></div>'+
      '<div class="hr"><div class="pn">'+num+'</div><div class="ps">Emitido: '+fecha+'</div></div>'+
    '</div>'+
    '<div class="body">'+
    '<div class="validez">⏱️ <strong>Validez: '+(p.validez||15)+' días corridos</strong> — Vence el '+vence+'</div>'+

    '<div class="section"><div class="st">Datos del cliente</div>'+
      '<div class="g2">'+
        '<div class="field"><div class="fl">Nombre</div><div class="fv">'+p.nombre+'</div></div>'+
        '<div class="field"><div class="fl">Teléfono</div><div class="fv">'+p.tel+'</div></div>'+
        '<div class="field"><div class="fl">Dirección</div><div class="fv">'+p.dir+'</div></div>'+
        '<div class="field"><div class="fl">Barrio</div><div class="fv">'+(p.barrio||'—')+'</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="section"><div class="st">Sistema propuesto</div>'+
      '<div class="mb">Zpro '+(p.modelo||'Base')+'</div>'+
      '<div class="mdesc">'+(DB.config&&DB.config['desc_'+p.modelo]?DB.config['desc_'+p.modelo]:{Base:'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora.',Energy:'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención.',Comfort:'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención. Control de luces Zigbee integrado al sistema de seguridad. Activación automática de luces ante detección de alarma. Automatización por horario o evento. Control de cargas eléctricas mediante relés.',Black:'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención. Control de luces Zigbee integrado al sistema de seguridad. Activación automática de luces ante detección de alarma. Automatización por horario o evento. Control de cargas eléctricas mediante relés. Simulador de presencia inteligente con sincronización horaria NTP, activación en horario nocturno y secuencias aleatorias de luces. Gestión de múltiples usuarios con perfiles de acceso diferenciados. Historial extendido de eventos del sistema. Automatizaciones personalizadas adaptadas a las necesidades del inmueble.'}[p.modelo]||'')+'</div>'+
    '</div>'+

    (sensorRows?
    '<div class="section"><div class="st">Sensores y dispositivos</div>'+
      '<table class="t"><thead><tr><th>Dispositivo</th><th style="text-align:center">Cant.</th><th>Ubicaciones</th></tr></thead>'+
      '<tbody>'+sensorRows+'</tbody></table></div>':'')+

    '<div class="section"><div class="st">Condiciones comerciales</div>'+
      '<div class="cg">'+
        '<div class="field"><div class="fl">Plazo de entrega</div><div class="fv">'+(p.plazo||'—')+'</div></div>'+
        '<div class="field"><div class="fl">Forma de pago</div><div class="fv">'+(p.formaPago||'—')+'</div></div>'+
        '<div class="field"><div class="fl">Garantía</div><div class="fv">'+(p.garantia||'—')+'</div></div>'+
        '<div class="field"><div class="fl">Incluye</div><div class="fv">'+(p.incluye||'—')+'</div></div>'+
        (p.noIncluye?'<div class="field" style="grid-column:1/-1"><div class="fl">No incluye</div><div class="fv">'+p.noIncluye+'</div></div>':'')+
      '</div>'+
    '</div>'+

    '<div class="section"><div class="st">Valor de la cotización</div>'+
      '<table class="t">'+
        '<thead><tr><th colspan="2">Descripción</th><th style="text-align:right">Importe</th></tr></thead>'+
        '<tbody>'+
          '<tr><td colspan="2">Sistema de seguridad Zpro '+(p.modelo||'Base')+' — instalación y configuración completa</td>'+
            '<td style="text-align:right;font-weight:600">'+formatMonto(totalConMargen,p.moneda)+'</td></tr>'+
          descRow+
        '</tbody>'+
        '<tfoot>'+
          '<tr><td colspan="2" style="padding:9px 11px;font-weight:700;font-size:13px">TOTAL</td>'+
            '<td style="padding:9px 11px;text-align:right;font-weight:700;font-size:16px;color:#B71C1C">'+formatMonto(totalFinal,p.moneda)+'</td></tr>'+
        '</tfoot>'+
      '</table>'+
    '</div>'+
    '</div>'+

    '<div class="leyenda">La presente propuesta es de carácter personal e intransferible, y ha sido elaborada específicamente para el inmueble y las condiciones relevadas. Viking Security Systems se reserva el derecho de modificar los términos ante variaciones en los requerimientos o condiciones del sitio.</div>'+

    '<div class="footer">'+
      '<div>'+empresa+(cfgTel?' · '+cfgTel:'')+(cfgEmail?' · '+cfgEmail:'')+(cfgDireccion?' · '+cfgDireccion:'')+'</div>'+
      '<div style="text-align:right">'+num+' · Emitido por: '+(p.tecnico||'—')+'<br>Válido '+( p.validez||15)+' días · Vence: '+vence+'</div>'+
    '</div>';

  const w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Presupuesto '+num+'</title><style>'+CSS+'</style></head><body>'+body+'</body></html>');
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


function pdfStock(){
  const q=(document.getElementById('qs')?document.getElementById('qs').value||'':'').toLowerCase();
  const fa=document.getElementById('fs-area')?document.getElementById('fs-area').value:'';
  const fc=document.getElementById('fs-cat')?document.getElementById('fs-cat').value:'';
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  
  var list=DB.componentes.filter(function(c){
    var qty=stockActual(c.id);
    return(!q||(c.desc+c.codigo+(c.categoria||'')).toLowerCase().includes(q))
      &&(!fa||c.area===fa)
      &&(!fc||c.categoria===fc);
  }).sort(function(a,b){return (a.desc||'').localeCompare(b.desc||'');});

  var rows='';
  var totalVal=0;
  list.forEach(function(c){
    var qty=stockActual(c.id);
    var val=qty*(parseFloat(c.precio)||0);
    totalVal+=val;
    var critico=qty<=(parseFloat(c.min)||0);
    rows+='<tr style="'+(critico?'background:#FFF3E0':'')+'">'+
      '<td>'+c.codigo+'</td>'+
      '<td>'+c.desc+'</td>'+
      '<td>'+(c.categoria||'—')+'</td>'+
      '<td>'+(c.area||'—')+'</td>'+
      '<td>'+(c.ubicacion||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+(critico?'#B71C1C':'#222')+'">'+qty+' '+(c.unidad||'')+'</td>'+
      '<td style="text-align:center">'+(c.min||0)+'</td>'+
      '<td style="text-align:right">$'+Math.round(parseFloat(c.precio)||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(val).toLocaleString('es-AR')+'</td>'+
    '</tr>';
  });

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:20px;font-size:11px}'+
    'h1{font-size:16px;font-weight:700;color:#B71C1C;margin-bottom:2px}'+
    '.meta{font-size:11px;color:#666;margin-bottom:14px}'+
    'table{width:100%;border-collapse:collapse}'+
    'th{background:#B71C1C;color:#fff;padding:6px 8px;text-align:left;font-size:10px}'+
    'td{padding:5px 8px;border-bottom:1px solid #eee}'+
    'tfoot td{background:#f5f5f5;font-weight:700}'+
    '.btn-print{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:11px}'+
    '@media print{.btn-print{display:none}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Stock — '+empresa+'</title><style>'+css+'</style></head><body>'+
    '<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>INVENTARIO DE STOCK</h1>'+
    '<div class="meta">'+empresa+' · Generado: '+today()+(fa?' · Área: '+fa:'')+(fc?' · Categoría: '+fc:'')+'</div>'+
    '<table><thead><tr><th>Código</th><th>Descripción</th><th>Categoría</th><th>Área</th><th>Ubicación</th><th style="text-align:center">Stock</th><th style="text-align:center">Mín.</th><th style="text-align:right">Precio</th><th style="text-align:right">Valor</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr><td colspan="8" style="text-align:right;padding:7px 8px">VALOR TOTAL</td>'+
    '<td style="text-align:right;padding:7px 8px;color:#B71C1C">$'+Math.round(totalVal).toLocaleString('es-AR')+'</td></tr>'+
    (tc>1?'<tr><td colspan="8" style="text-align:right;padding:5px 8px;color:#666">Equivalente U$S</td><td style="text-align:right;padding:5px 8px;color:#666">U$S '+(totalVal/tc).toFixed(0)+'</td></tr>':'')+
    '</tfoot></table></body></html>');
  w.document.close();
}

var _stockSort = {col:'desc', dir:1};

function sortStock(col){
  if(_stockSort.col===col) _stockSort.dir*=-1;
  else { _stockSort.col=col; _stockSort.dir=1; }
  renderStock();
}

function renderStock(){
  fillCatFilter('stock-cat-filter');
  const fcat=document.getElementById('stock-cat-filter').value;
  const farea=document.getElementById('stock-area-filter')?document.getElementById('stock-area-filter').value:'';
  const qs=(document.getElementById('q-stock')?document.getElementById('q-stock').value||'':'').toLowerCase();
  let list=DB.componentes.filter(function(c){
    return (!fcat||c.categoria===fcat) &&
           (!farea||c.area===farea||c.area==='Ambas') &&
           (!qs||(c.codigo+c.desc+(c.ubicacion||'')+(c.proveedor||'')).toLowerCase().includes(qs));
  });
  if(stockSoloCritico) list=list.filter(function(c){return stockActual(c.id)<=(parseFloat(c.min)||0);});

  // Sort
  list.sort(function(a,b){
    var va='', vb='';
    if(_stockSort.col==='desc'){va=a.desc||'';vb=b.desc||'';}
    else if(_stockSort.col==='codigo'){va=a.codigo||'';vb=b.codigo||'';}
    else if(_stockSort.col==='categoria'){va=a.categoria||'';vb=b.categoria||'';}
    else if(_stockSort.col==='area'){va=a.area||'';vb=b.area||'';}
    else if(_stockSort.col==='ubicacion'){va=a.ubicacion||'';vb=b.ubicacion||'';}
    else if(_stockSort.col==='cant'){va=stockActual(a.id);vb=stockActual(b.id);return _stockSort.dir*(va-vb);}
    return _stockSort.dir*va.localeCompare(vb);
  });

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

  // Update sort indicators
  var scols = {codigo:'Código',desc:'Descripción',categoria:'Categoría',cant:'Cantidad',area:'Área',ubicacion:'Ubicación'};
  Object.keys(scols).forEach(function(col){
    var th = document.getElementById('sth-'+col);
    if(!th) return;
    th.innerHTML = scols[col] + (col===_stockSort.col?(_stockSort.dir===1?' ▲':' ▼'):'');
  });
}

// CAT=LOGO ============================================
var _catSort = {col:'desc', dir:1};

function fillProvFilter(){
  var sel = document.getElementById('cat-prov-filter');
  if(!sel) return;
  var cur = sel.value;
  var provs = [...new Set(DB.componentes.map(function(c){return (c.proveedor||'').trim();}).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">Todos los proveedores</option>'+
    provs.map(function(p){return '<option value="'+p+'"'+(p===cur?' selected':'')+'>'+p+'</option>';}).join('');
}

function renderCatalogo(){
  fillCatFilter('cat-filter');
  fillProvFilter();
  const q=(document.getElementById('q-cat').value||'').toLowerCase();
  const fc=document.getElementById('cat-filter').value;
  var fprov=document.getElementById('cat-prov-filter')?document.getElementById('cat-prov-filter').value:'';
  var list=DB.componentes.filter(function(c){
    return(!q||(c.codigo+c.desc+(c.proveedor||'')+(c.ubicacion||'')+( c.categoria||'')).toLowerCase().includes(q))
      &&(!fc||c.categoria===fc)
      &&(!fprov||(c.proveedor||'').trim()===fprov);
  });

  // Sort
  list.sort(function(a,b){
    var va='', vb='';
    if(_catSort.col==='desc'){va=a.desc||'';vb=b.desc||'';}
    else if(_catSort.col==='codigo'){va=a.codigo||'';vb=b.codigo||'';}
    else if(_catSort.col==='categoria'){va=a.categoria||'';vb=b.categoria||'';}
    else if(_catSort.col==='area'){va=a.area||'';vb=b.area||'';}
    else if(_catSort.col==='stock'){va=stockActual(a.id);vb=stockActual(b.id);return _catSort.dir*(va-vb);}
    return _catSort.dir*va.localeCompare(vb);
  });

  const tb=document.getElementById('tbody-cat');
  if(!list.length){tb.innerHTML='<tr><td colspan="9" class="empty">Sin componentes registrados.</td></tr>';return;}

  tb.innerHTML=list.map(function(c){
    var qty=stockActual(c.id);
    var min=parseFloat(c.min)||0;
    var stockColor=qty<=0?'var(--red)':qty<=min?'#E65100':'var(--green)';
    var stockIcon=qty<=0?'🔴':qty<=min?'🟡':'🟢';
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px">'+c.codigo+'</td>'+
      '<td>'+c.desc+'</td>'+
      '<td>'+( c.categoria||'—')+'</td>'+
      '<td>'+(c.unidad||'—')+'</td>'+
      '<td>'+(c.min||0)+'</td>'+
      '<td style="font-weight:700;color:'+stockColor+'">'+stockIcon+' '+qty+'</td>'+
      '<td><span class="pill '+(c.area==='Mantenimiento'?'p-b':c.area==='Instalacion'?'p-a':c.area==='Ambas'?'p-p':'p-g')+'">'+(c.area||'Fábrica')+'</span></td>'+
      '<td>'+(c.ubicacion||'—')+'</td>'+
      '<td>'+(c.proveedor||'—')+'</td>'+
      '<td style="display:flex;gap:3px">'+
        '<button class="btn btn-sm" onclick="modalComponente('+c.id+')" title="Editar">✏️</button>'+
        '<button class="btn btn-sm" onclick="duplicarComponente('+c.id+')" title="Duplicar">📋</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarComponente('+c.id+')" title="Eliminar">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');

  // Update sort indicators on headers
  var cols = {codigo:'Código',desc:'Descripción',categoria:'Categoría',stock:'Stock',area:'Área'};
  Object.keys(cols).forEach(function(col){
    var th = document.getElementById('th-'+col);
    if(!th) return;
    th.innerHTML = cols[col] + (col===_catSort.col?(_catSort.dir===1?' ▲':' ▼'):'');
  });
}

function sortCatalogo(col){
  if(_catSort.col===col) _catSort.dir*=-1;
  else { _catSort.col=col; _catSort.dir=1; }
  renderCatalogo();
}

function duplicarComponente(id){
  var c=DB.componentes.find(function(x){return x.id===id;});
  if(!c) return;
  var nuevo=Object.assign({},c,{id:DB.nid++,codigo:c.codigo+'-2',desc:'Copia de '+c.desc});
  DB.componentes.push(nuevo);
  save(); renderCatalogo();
  // Open edit modal for the new component
  modalComponente(nuevo.id);
}

function pdfCatalogo(){
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var q=(document.getElementById('q-cat')?document.getElementById('q-cat').value||'':'').toLowerCase();
  var fc=document.getElementById('cat-filter')?document.getElementById('cat-filter').value:'';
  var list=DB.componentes.filter(function(c){
    return(!q||(c.codigo+c.desc+(c.proveedor||'')).toLowerCase().includes(q))&&(!fc||c.categoria===fc);
  }).sort(function(a,b){return (a.desc||'').localeCompare(b.desc||'');});

  var rows=list.map(function(c){
    var qty=stockActual(c.id);
    var min=parseFloat(c.min)||0;
    var critico=qty<=min;
    return '<tr style="'+(critico?'background:#FFF3E0':'')+'">'+
      '<td>'+c.codigo+'</td><td>'+c.desc+'</td><td>'+(c.categoria||'—')+'</td>'+
      '<td>'+(c.area||'—')+'</td><td>'+(c.ubicacion||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+(critico?'#B71C1C':'#222')+'">'+qty+'</td>'+
      '<td style="text-align:center">'+(c.min||0)+'</td>'+
      '<td>'+(c.proveedor||'—')+'</td>'+
      '<td style="text-align:right">$'+Math.round(parseFloat(c.precio)||0).toLocaleString('es-AR')+'</td>'+
    '</tr>';
  }).join('');

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:20px;font-size:11px}'+
    'h1{font-size:15px;color:#B71C1C;margin-bottom:2px}.meta{color:#666;font-size:10px;margin-bottom:12px}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:6px 8px;font-size:10px;text-align:left}'+
    'td{padding:5px 8px;border-bottom:1px solid #eee}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer}'+
    '@media print{.btn{display:none}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Catálogo</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>CATÁLOGO DE COMPONENTES</h1>'+
    '<div class="meta">'+empresa+' · '+today()+'</div>'+
    '<table><thead><tr><th>Código</th><th>Descripción</th><th>Categoría</th><th>Área</th><th>Ubicación</th>'+
    '<th style="text-align:center">Stock</th><th style="text-align:center">Mín.</th><th>Proveedor</th><th style="text-align:right">Precio</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></body></html>');
  w.document.close();
}


function getUbicDatalist(){
  var ubicaciones = DB.componentes
    .map(function(c){ return c.ubicacion; })
    .filter(function(u){ return u && u.length > 0; });
  ubicaciones = [...new Set(ubicaciones)].sort();
  var opts = ubicaciones.map(function(u){
    return '<option value="'+u+'"></option>';
  }).join('');
  return '<datalist id="dl-cp-ubic">'+opts+'</datalist>';
}


function calcPreciosComp(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var v=parseFloat(document.getElementById('cp-costo').value)||0;
  var el=document.getElementById('cp-costo-usd');
  if(el&&tc>0) el.value=(v/tc).toFixed(2);
}
function calcPreciosCompUSD(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var v=parseFloat(document.getElementById('cp-costo-usd').value)||0;
  var el=document.getElementById('cp-costo');
  if(el) el.value=Math.round(v*tc);
}
function calcPreciosVentaComp(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var v=parseFloat(document.getElementById('cp-venta').value)||0;
  var el=document.getElementById('cp-venta-usd');
  if(el&&tc>0) el.value=(v/tc).toFixed(2);
}
function calcPreciosVentaCompUSD(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var v=parseFloat(document.getElementById('cp-venta-usd').value)||0;
  var el=document.getElementById('cp-venta');
  if(el) el.value=Math.round(v*tc);
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
      '<div class="fg full" style="grid-column:1/-1"><hr style="border:none;border-top:1px solid var(--border);margin:4px 0"></div>'+
      '<div class="fg full"><div class="sectitle" style="margin:0 0 6px">Precios</div></div>'+
      '<div class="fg"><label>Costo ($)</label><input id="cp-costo" type="number" min="0" value="'+(c?c.costo||c.precio||0:0)+'" oninput="calcPreciosComp()"></div>'+
      '<div class="fg"><label>Costo (U$S)</label><input id="cp-costo-usd" type="number" min="0" step="0.01" value="'+(c&&(DB.config&&DB.config.tipoCambio)?((c.costo||c.precio||0)/(DB.config.tipoCambio||1)).toFixed(2):0)+'" oninput="calcPreciosCompUSD()"></div>'+
      '<div class="fg"><label>Venta ($)</label><input id="cp-venta" type="number" min="0" value="'+(c?c.venta||0:0)+'" oninput="calcPreciosVentaComp()"></div>'+
      '<div class="fg"><label>Venta (U$S)</label><input id="cp-venta-usd" type="number" min="0" step="0.01" value="'+(c&&(DB.config&&DB.config.tipoCambio)?((c.venta||0)/(DB.config.tipoCambio||1)).toFixed(2):0)+'" oninput="calcPreciosVentaCompUSD()"></div>'+
      '<div class="fg"><label>Proveedor</label><input id="cp-prov" value="'+(c?c.proveedor||'':'')+'" placeholder="Nombre del proveedor" list="dl-cp-prov">'+
      '<datalist id="dl-cp-prov">'+(DB.proveedores.map(function(p){return '<option value="'+p.empresa+'">'+p.empresa+'</option>';}).join(''))+'</datalist></div>'+
      '<div class="fg"><label>Área *</label>'+
        '<select id="cp-area" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          ['Fábrica','Mantenimiento','Instalacion'].map(function(a){return '<option'+(c&&c.area===a?' selected':'')+'>'+a+'</option>';}).join('')+
        '</select></div>'+
      '<div class="fg"><label>Ubicación</label><input id="cp-ubic" value="'+(c?c.ubicacion||'':'')+'" placeholder="Ej: Estante A, cajón 3" list="dl-cp-ubic">'+
      '<datalist id="dl-cp-ubic">'+(function(){var u=[...new Set(DB.componentes.filter(function(x){return x.ubicacion;}).map(function(x){return x.ubicacion;}))];return u.map(function(u){return '<option value="'+u+'">'+u+'</option>';}).join('');})()+'</datalist></div>'+
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
        c.costo=parseFloat(document.getElementById('cp-costo').value)||0;
        c.precio=c.costo; // backward compat
        c.costo_usd=parseFloat(document.getElementById('cp-costo-usd').value)||0;
        c.venta=parseFloat(document.getElementById('cp-venta').value)||0;
        c.venta_usd=parseFloat(document.getElementById('cp-venta-usd').value)||0;
        c.area=document.getElementById('cp-area')?document.getElementById('cp-area').value:'Fábrica';
        c.proveedor=document.getElementById('cp-prov').value;
        c.ubicacion=document.getElementById('cp-ubic').value;
      } else {
        var newCosto=parseFloat(document.getElementById('cp-costo')?document.getElementById('cp-costo').value:0)||0;
        DB.componentes.push({
          id:DB.nid++,codigo:cod,desc:desc,categoria:cat,
          unidad:document.getElementById('cp-uni').value,
          unidad:document.getElementById('cp-uni')?document.getElementById('cp-uni').value:'',
          min:parseFloat(document.getElementById('cp-min')?document.getElementById('cp-min').value:0)||0,
          precio:newCosto,
          costo_usd:parseFloat(document.getElementById('cp-costo-usd')?document.getElementById('cp-costo-usd').value:0)||0,
          venta:parseFloat(document.getElementById('cp-venta')?document.getElementById('cp-venta').value:0)||0,
          venta_usd:parseFloat(document.getElementById('cp-venta-usd')?document.getElementById('cp-venta-usd').value:0)||0,
          area:document.getElementById('cp-area')?document.getElementById('cp-area').value:'Fábrica',
          proveedor:document.getElementById('cp-prov')?document.getElementById('cp-prov').value:'',
          ubicacion:document.getElementById('cp-ubic')?document.getElementById('cp-ubic').value:''
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
    const comp=DB.componentes.find(function(c){return c.id===(m.cid||m.compId);})||{desc:'—',codigo:'',unidad:''};
    return(!q||(comp.desc+comp.codigo+(m.ref||'')+(m.nota||'')).toLowerCase().includes(q))&&(!ft||m.tipo===ft);
  }).sort(function(a,b){return b.fecha.localeCompare(a.fecha);});

  const tb=document.getElementById('tbody-mov');
  if(!list.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin movimientos registrados.</td></tr>';return;}
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  tb.innerHTML=list.map(function(m){
    const comp=DB.componentes.find(function(c){return c.id===(m.cid||m.compId);})||{desc:'—',codigo:'—',unidad:''};
    const cli=m.clienteId?DB.clientes.find(function(c){return c.id===m.clienteId;}):null;
    const precioUSD=m.precio&&tc>0?'U$S '+(parseFloat(m.precio)/tc).toFixed(2):'—';
    return '<tr>'+
      '<td>'+m.fecha+'</td>'+
      '<td>'+movTipoPill(m.tipo)+'</td>'+
      '<td>'+comp.desc+'<div style="font-size:10px;color:var(--text3)">'+comp.codigo+'</div></td>'+
      '<td style="font-weight:600">'+(m.tipo==='Entrada'?'+':'-')+(m.cant||0)+' '+comp.unidad+'</td>'+
      '<td>'+(m.precio?'$'+parseFloat(m.precio).toLocaleString('es-AR'):'—')+'</td>'+
      '<td>'+precioUSD+'</td>'+
      '<td>'+(m.ref||'—')+'</td>'+
      '<td>'+(cli?cli.nombre:(m.nota||'—'))+'</td>'+
      '<td style="font-family:monospace;font-size:10px">'+(m.lote||'—')+'</td>'+
      '<td style="display:flex;gap:3px"><button class="btn btn-sm" onclick="editarMovimiento('+m.id+')">✏️</button>'+
      '<button class="btn btn-sm" style="color:var(--red)" onclick="borrarMovimiento('+m.id+')">🗑️</button></td>'+
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
        '<div class="fg"><label>Ubicación</label><input id="mv-ubic" list="dl-mv-ubic" placeholder="Ej: Estante A">'+stockDatalist("mv-ubic","",'ubicaciones')+'</div>'+
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
  var q=(document.getElementById('q-ord')?document.getElementById('q-ord').value||'':'').toLowerCase();
  const list=[...DB.ordenes].filter(function(o){
    return !q||((o.numero||'')+(o.proveedor||'')).toLowerCase().includes(q);
  }).sort(function(a,b){return b.fecha.localeCompare(a.fecha);});
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

  // Group by proveedor
  var porProv = {};
  criticos.forEach(function(c){
    var prov = c.proveedor||'Sin proveedor';
    if(!porProv[prov]) porProv[prov]=[];
    var faltante=Math.max(1,(parseFloat(c.min)||1)-stockActual(c.id)+Math.ceil((parseFloat(c.min)||1)));
    porProv[prov].push({cid:c.id, cant:faltante});
  });

  var count = Object.keys(porProv).length;
  if(!confirm('Se generarán '+count+' orden'+(count>1?'es':'')+' de compra (una por proveedor). ¿Continuar?')) return;

  Object.entries(porProv).forEach(function(entry){
    var prov=entry[0], items=entry[1];
    DB.ordenes.unshift({
      id:DB.nid++, fecha:today(), estado:'Pendiente',
      items:items, proveedor:prov,
      obs:'Generada automáticamente — stock crítico'
    });
  });

  save(); renderOrdenes();
  alert('Se generaron '+count+' orden'+(count>1?'es':'')+' de compra por proveedor.');
}


function getNumOC(){
  var yr = new Date().getFullYear();
  var same = DB.ordenes.filter(function(o){
    return o.numero && o.numero.startsWith('OC-'+yr);
  });
  var max = 0;
  same.forEach(function(o){
    var n = parseInt((o.numero||'').split('-')[2]||'0');
    if(n>max) max=n;
  });
  return 'OC-'+yr+'-'+String(max+1).padStart(4,'0');
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
    '<div class="fg"><label>Proveedor</label>'+
      '<select id="ord-prov" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
        '<option value="">— sin vincular —</option>'+
        DB.proveedores.map(function(p){return '<option value="'+p.empresa+'">'+p.empresa+'</option>';}).join('')+
      '</select></div>'+
    '<div class="fg"><label>Observaciones</label><input id="ord-obs" placeholder="Notas..."></div>',
    function(){
      const cids=[...document.querySelectorAll('.ord-cid')].map(function(s){return parseInt(s.value);});
      const cants=[...document.querySelectorAll('.ord-cant')].map(function(i){return parseFloat(i.value)||0;});
      const items=cids.map(function(cid,i){return {cid:cid,cant:cants[i]};}).filter(function(x){return x.cid&&x.cant>0;});
      if(!items.length){alert('Agregá al menos un componente con cantidad.');return false;}
      DB.ordenes.unshift({
        id:DB.nid++, numero:getNumOC(), fecha:today(), estado:'Pendiente',
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

function borrarMovimiento(id){
  var m = DB.movimientos.find(function(x){return x.id===id;});
  if(!m) return;
  var comp = DB.componentes.find(function(c){return c.id===m.compId;});
  var desc = comp?comp.desc:'componente';
  if(!confirm('¿Eliminar el movimiento de '+m.tipo.toLowerCase()+' de "'+desc+'" del '+m.fecha+'?')) return;
  DB.movimientos = DB.movimientos.filter(function(x){return x.id!==id;});
  save(); renderMovimientos();
}

function editarMovimiento(id){
  const m=DB.movimientos.find(function(x){return x.id===id;});
  if(!m) return;
  const comp=DB.componentes.find(function(c){return c.id===m.cid;})||{desc:'?'};
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  openModal('Editar movimiento — '+comp.desc,
    '<div class="fg2">'+
    '<div class="fg"><label>Fecha</label><input id="em-fecha" type="date" value="'+(m.fecha||today())+'"></div>'+
    '<div class="fg"><label>Precio unitario ($)</label><input id="em-precio" type="number" min="0" value="'+(m.precio||0)+'"></div>'+
    '<div class="fg"><label>Precio U$S (calculado)</label><input readonly value="'+(m.precio&&tc>0?(m.precio/tc).toFixed(2):'')+'" style="background:var(--surface2)"></div>'+
    '<div class="fg"><label>Referencia</label><input id="em-ref" value="'+(m.ref||'')+'"></div>'+
    '<div class="fg"><label>Lote</label><input id="em-lote" value="'+(m.lote||'')+'"></div>'+
    '<div class="fg"><label>Nota</label><input id="em-nota" value="'+(m.nota||'')+'"></div>'+
    '</div>',
    function(){
      m.fecha=document.getElementById('em-fecha').value;
      m.precio=parseFloat(document.getElementById('em-precio').value)||0;
      m.ref=document.getElementById('em-ref').value;
      m.lote=document.getElementById('em-lote').value;
      m.nota=document.getElementById('em-nota').value;
      save(); renderMovimientos(); return true;
    });
}

function eliminarOrden(id){
  if(!confirm('¿Eliminar esta orden?'))return;
  DB.ordenes=DB.ordenes.filter(function(x){return x.id!==id;});
  save();renderOrdenes();
}

function pdfOrden(id){
  const o=DB.ordenes.find(function(x){return x.id===id;});
  if(!o) return;
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  let rows='';
  o.items.forEach(function(item){
    const c=DB.componentes.find(function(x){return x.id===item.cid;})||{codigo:'?',desc:'?',unidad:'u',precio:0,ubicacion:''};
    const sub=(c.costo||c.precio||0)*item.cant;
    rows+='<tr><td>'+c.codigo+'</td><td>'+c.desc+'</td><td style="text-align:center">'+item.cant+' '+c.unidad+'</td>'+
      '<td style="text-align:right">$'+Math.round(c.costo||c.precio||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(sub).toLocaleString('es-AR')+'</td>'+
      '<td>'+( c.ubicacion||'—')+'</td></tr>';
  });
  const total=o.items.reduce(function(a,i){const c=DB.componentes.find(function(x){return x.id===i.cid;})||{costo:0,precio:0};return a+(c.costo||c.precio||0)*i.cant;},0);
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
    '<h1>ORDEN DE COMPRA — '+(o.numero||'OC')+'</h1>'+
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
  const emailDest = p.email || '';
  const cfg = DB.config || {};
  const num = presNum(p);
  const empresa = cfg.empresa || 'Viking Security Systems';
  const firma = cfg.firma || empresa;
  const asunto = encodeURIComponent('Presupuesto ' + num + ' - ' + empresa);
  const cuerpo = encodeURIComponent(
    'Estimado/a ' + p.nombre + ',\n\n' +
    'Le enviamos adjunto el presupuesto ' + num + ' correspondiente al sistema de seguridad Zpro ' + p.modelo + '.\n\n' +
    'Validez: ' + (p.validez||15) + ' dias corridos.\n\n' +
    'Ante cualquier consulta no dude en contactarnos.\n\n' +
    'Saludos cordiales,\n' + firma +
    (cfg.tel ? '\nTel: ' + cfg.tel : '') +
    (cfg.email ? '\n' + cfg.email : '')
  );
  // Open Gmail compose
  var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1' +
    (emailDest ? '&to=' + encodeURIComponent(emailDest) : '') +
    '&su=' + asunto +
    '&body=' + cuerpo;
  window.open(gmailUrl, '_blank');
  // Mark as sent
  setTimeout(function(){
    if(confirm('¿Marcar el presupuesto como Enviado?')){
      p.estado='Enviado';
      save();
      renderPresupuestos();
    }
  }, 1000);
}

// =======================================================

// CONFIGURACION ============================================

function resetearContadores(){
  if(!confirm('¿Reiniciar todos los contadores? Los números de OC y presupuestos volverán a empezar desde 1.')) return;
  if(!confirm('Última confirmación. Esta acción no se puede deshacer.')) return;
  DB.nid = 1;
  // Reset OC numbers
  DB.ordenes.forEach(function(o,i){ o.id = i+1; });
  // Reset presupuesto correlativos
  DB.presupuestos.forEach(function(p,i){ p.correlativo = i+1; });
  if(DB.ordenes.length) DB.nid = Math.max(DB.nid, DB.ordenes.length+1);
  if(DB.presupuestos.length) DB.nid = Math.max(DB.nid, DB.presupuestos.length+1);
  save();
  renderConfig();
  alert('Contadores reiniciados correctamente.');
}

function renderConfig(){
  var cfg = DB.config || {};
  var el = document.getElementById('config-body');
  if(!el){ console.error('config-body not found'); return; }
  var h = '';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  h += cfgInp('Nombre de la empresa','cfg-empresa', cfg.empresa||'', 'Viking Security Systems');
  h += cfgInp('Email de contacto','cfg-email', cfg.email||'', 'contacto@empresa.com');
  h += cfgInp('Teléfono','cfg-tel', cfg.tel||'', '+54 9 261...');
  h += cfgInp('Dirección','cfg-direccion', cfg.direccion||'', 'Calle y número, ciudad');
  h += cfgInp('Sitio web','cfg-web', cfg.web||'', 'www.empresa.com');
  h += cfgInp('Firma en emails','cfg-firma', cfg.firma||cfg.empresa||'', 'Firma para emails');
  h += cfgInp('Tipo de cambio U$S (referencia)','cfg-tipoCambio', cfg.tipoCambio||'1', '1300');
  h += cfgInp('Tipo de cambio U$S','cfg-tc', cfg.tipoCambio||1, '1', 'number');
  h += '</div>';
  h += '<hr class="div"><div class="sectitle" style="margin-bottom:10px">Meta de facturación mensual</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
  h += cfgInp('Meta mensual ($)','cfg-meta-mensual', cfg.metaMensual?Number(cfg.metaMensual).toLocaleString('es-AR'):'0', 'Ej: 500.000');
  h += '</div>';
  h += '<div class="sectitle" style="margin-bottom:10px">Descripciones de modelos (aparecen en el PDF)</div>';
  h += '<hr class="div">';
  h += '<div class="sectitle" style="margin-bottom:10px">Contadores</div>';
  h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">';
  h += '<div style="font-size:12px;color:var(--text2)">Numeración actual: OC #'+DB.ordenes.length+' · Presupuestos: '+DB.presupuestos.length+' · ID interno: '+DB.nid+'</div>';
  h += '<button class="btn btn-d" onclick="resetearContadores()" style="font-size:12px">🔄 Reiniciar contadores</button>';
  h += '</div>';
  h += cfgTxt('Zpro Base','cfg-desc-Base', cfg.desc_Base||'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora.');
  h += cfgTxt('Zpro Energy','cfg-desc-Energy', cfg.desc_Energy||'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención.');
  h += cfgTxt('Zpro Comfort','cfg-desc-Comfort', cfg.desc_Comfort||'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención. Control de luces Zigbee integrado al sistema de seguridad. Activación automática de luces ante detección de alarma. Automatización por horario o evento. Control de cargas eléctricas mediante relés.');
  h += cfgTxt('Zpro Black','cfg-desc-Black', cfg.desc_Black||'Activación y desactivación del sistema desde el celular, en cualquier momento y desde cualquier lugar. Notificaciones instantáneas ante cualquier evento de seguridad — apertura de puertas, ventanas o activación de sensores. Monitoreo del estado del sistema en tiempo real desde Telegram. Historial de eventos registrados con fecha y hora. Control mediante menú interactivo en Telegram — sin necesidad de aplicaciones adicionales. Compatible con sensores de puerta, ventana y botón de pánico. Sirena exterior de larga durabilidad y alta potencia sonora. Detección y notificación inmediata ante cortes de energía eléctrica. Batería de respaldo que mantiene el sistema activo sin suministro eléctrico. Monitoreo del nivel de carga de la batería con alertas cuando requiere atención. Control de luces Zigbee integrado al sistema de seguridad. Activación automática de luces ante detección de alarma. Automatización por horario o evento. Control de cargas eléctricas mediante relés. Simulador de presencia inteligente con sincronización horaria NTP, activación en horario nocturno y secuencias aleatorias de luces. Gestión de múltiples usuarios con perfiles de acceso diferenciados. Historial extendido de eventos del sistema. Automatizaciones personalizadas adaptadas a las necesidades del inmueble.');
  el.innerHTML = h;
}

function cfgInp(label, id, val, ph, type){
  type = type||'text';
  var v = String(val||'').replace(/"/g,"'");
  return '<div class="fg" style="margin:0"><label>'+label+'</label>'+
    '<input type="'+type+'" id="'+id+'" value="'+v+'" placeholder="'+ph+'" oninput="saveConfig()"></div>';
}

function cfgTxt(label, id, val){
  return '<div class="fg"><label>'+label+'</label>'+
    '<textarea id="'+id+'" style="min-height:60px;padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%;font-family:inherit" oninput="saveConfig()">'+val+'</textarea></div>';
}

function saveConfig(){
  if(!DB.config) DB.config={};
  var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
  DB.config.empresa = g('cfg-empresa');
  DB.config.email = g('cfg-email');
  DB.config.tel = g('cfg-tel');
  DB.config.direccion = g('cfg-direccion');
  DB.config.web = g('cfg-web');
  DB.config.firma = g('cfg-firma');
  DB.config.tipoCambio = parseFloat(g('cfg-tipoCambio'))||1;
  DB.config.metaMensual = parseFloat((g('cfg-meta-mensual')||'0').replace(/\./g,'').replace(',','.'))||0;
  DB.config.tipoCambio = parseFloat(g('cfg-tc'))||1;
  DB.config.desc_Base = g('cfg-desc-Base');
  DB.config.desc_Energy = g('cfg-desc-Energy');
  DB.config.desc_Comfort = g('cfg-desc-Comfort');
  DB.config.desc_Black = g('cfg-desc-Black');
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function(){ save(); }, 800);
}
function reporteFinanciero(){
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  
  var totalSistemas=0, totalAdelantos=0, totalPagos=0, totalPendiente=0;
  var rows='';

  DB.gestiones.forEach(function(g){
    var pagosTotal=g.pagos?g.pagos.reduce(function(a,p){return a+(parseFloat(p.monto)||0);},0):0;
    var saldo=(g.montoSistema||0)-(g.adelanto||0)-pagosTotal;
    var cobrado=(g.adelanto||0)+pagosTotal;

    totalSistemas+=g.montoSistema||0;
    totalAdelantos+=g.adelanto||0;
    totalPagos+=pagosTotal;
    totalPendiente+=saldo;

    rows+='<tr>'+
      '<td><strong>'+g.clienteNombre+'</strong></td>'+
      '<td style="text-align:right">$'+Math.round(g.montoSistema||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;color:var(--green)">$'+Math.round(g.adelanto||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;color:var(--blue)">$'+Math.round(pagosTotal).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;font-weight:700">$'+Math.round(cobrado).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+(saldo>0?'#E65100':'var(--green)')+'">$'+Math.round(saldo).toLocaleString('es-AR')+'</td>'+
    '</tr>';

    // Detalle pagos
    if(g.pagos&&g.pagos.length){
      g.pagos.forEach(function(p){
        rows+='<tr style="background:var(--surface2);font-size:11px">'+
          '<td style="padding-left:24px;color:var(--text2)">↳ Pago: '+p.fecha+(p.nota?' — '+p.nota:'')+'</td>'+
          '<td></td><td></td>'+
          '<td style="text-align:right;color:var(--blue)">$'+Math.round(p.monto||0).toLocaleString('es-AR')+'</td>'+
          '<td></td><td></td>'+
        '</tr>';
      });
    }
  });

  if(!DB.gestiones.length){
    reporteContainer('💰 Resumen financiero','<div class="empty">Sin gestiones económicas registradas.</div>');
    return;
  }

  var totalCobrado=totalAdelantos+totalPagos;
  var h='';

  // Stats
  // Meta mensual
  var metaCfg=(DB.config&&DB.config.metaMensual)||0;
  var mesAct=hoy.slice(0,7);
  var facMesAct=(DB.fondos||[]).filter(function(f){return f.tipo==='Ingreso'&&f.fecha&&f.fecha.slice(0,7)===mesAct;}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);
  var pctMeta=metaCfg>0?Math.round(facMesAct/metaCfg*100):0;

  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  h+='<div class="stat"><div class="stat-n">$'+Math.round(totalSistemas).toLocaleString('es-AR')+'</div><div class="stat-l">Total facturado</div></div>';
  h+='<div class="stat"><div class="stat-n green">$'+Math.round(totalCobrado).toLocaleString('es-AR')+'</div><div class="stat-l">Total cobrado</div></div>';
  h+='<div class="stat"><div class="stat-n '+(totalPendiente>0?'amber':'green')+'">$'+Math.round(totalPendiente).toLocaleString('es-AR')+'</div><div class="stat-l">Saldo pendiente</div></div>';
  h+='<div class="stat"><div class="stat-n">'+(totalSistemas>0?Math.round(totalCobrado/totalSistemas*100):0)+'%</div><div class="stat-l">% cobrado</div></div>';
  h+='</div>';

  if(tc>1){
    h+='<div style="background:var(--surface2);border-radius:var(--r);padding:8px 12px;font-size:12px;margin-bottom:14px;color:var(--text2)">'+
      'En U$S (TC $'+tc+'): '+
      'Facturado: <strong>U$S '+(totalSistemas/tc).toFixed(0)+'</strong> · '+
      'Cobrado: <strong>U$S '+(totalCobrado/tc).toFixed(0)+'</strong> · '+
      'Pendiente: <strong>U$S '+(totalPendiente/tc).toFixed(0)+'</strong>'+
    '</div>';
  }

  // Tabla por cliente
  h+='<table style="width:100%;border-collapse:collapse">'+
    '<thead><tr style="background:var(--surface2)">'+
      '<th style="padding:7px 10px;font-size:11px">Cliente</th>'+
      '<th style="padding:7px 10px;font-size:11px;text-align:right">Sistema</th>'+
      '<th style="padding:7px 10px;font-size:11px;text-align:right">Adelanto</th>'+
      '<th style="padding:7px 10px;font-size:11px;text-align:right">Pagos saldo</th>'+
      '<th style="padding:7px 10px;font-size:11px;text-align:right">Total cobrado</th>'+
      '<th style="padding:7px 10px;font-size:11px;text-align:right">Pendiente</th>'+
    '</tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot>'+
      '<tr style="font-weight:700;background:#1a1a1a;color:#fff">'+
        '<td style="padding:8px 10px">CONSOLIDADO</td>'+
        '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalSistemas).toLocaleString('es-AR')+'</td>'+
        '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalAdelantos).toLocaleString('es-AR')+'</td>'+
        '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalPagos).toLocaleString('es-AR')+'</td>'+
        '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalCobrado).toLocaleString('es-AR')+'</td>'+
        '<td style="padding:8px 10px;text-align:right;color:'+(totalPendiente>0?'#FFB74D':'#81C784')+'">$'+Math.round(totalPendiente).toLocaleString('es-AR')+'</td>'+
      '</tr>'+
    '</tfoot>'+
  '</table>';

  // Add print button
  h = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px">'+
    '<button class="btn btn-p" onclick="imprimirReporteFinanciero()">🖨️ Imprimir PDF</button>'+
  '</div>' + h;
  reporteContainer('💰 Resumen financiero', h);
}

function imprimirReporteFinanciero(){
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';

  var totalSistemas=0, totalAdelantos=0, totalPagos=0;
  var rows='';

  DB.gestiones.forEach(function(g){
    var pagosTotal=g.pagos?g.pagos.reduce(function(a,p){return a+(parseFloat(p.monto)||0);},0):0;
    var saldo=(g.montoSistema||0)-(g.adelanto||0)-pagosTotal;
    var cobrado=(g.adelanto||0)+pagosTotal;
    totalSistemas+=g.montoSistema||0;
    totalAdelantos+=g.adelanto||0;
    totalPagos+=pagosTotal;

    rows+='<tr>'+
      '<td><strong>'+g.clienteNombre+'</strong></td>'+
      '<td style="text-align:right">$'+Math.round(g.montoSistema||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(g.adelanto||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(pagosTotal).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;font-weight:700">$'+Math.round(cobrado).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+(saldo>0?'#E65100':'green')+'">$'+Math.round(saldo).toLocaleString('es-AR')+'</td>'+
    '</tr>';
    if(g.pagos&&g.pagos.length){
      g.pagos.forEach(function(p){
        rows+='<tr style="background:#f8f8f8;font-size:10px"><td style="padding-left:22px;color:#666">↳ '+p.fecha+(p.nota?' — '+p.nota:'')+'</td>'+
          '<td></td><td></td><td style="text-align:right">$'+Math.round(p.monto||0).toLocaleString('es-AR')+'</td><td></td><td></td></tr>';
      });
    }
  });

  var totalCobrado=totalAdelantos+totalPagos;
  var totalPendiente=totalSistemas-totalCobrado;

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:24px;font-size:12px}'+
    'h1{font-size:16px;color:#B71C1C;margin-bottom:2px}.meta{font-size:11px;color:#666;margin-bottom:16px}'+
    '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}'+
    '.stat{background:#f5f5f5;border-radius:6px;padding:10px;text-align:center}'+
    '.stat .n{font-size:15px;font-weight:700;margin-bottom:2px}.stat .l{font-size:9px;color:#888;text-transform:uppercase}'+
    'table{width:100%;border-collapse:collapse}'+
    'th{background:#B71C1C;color:#fff;padding:7px 10px;font-size:10px;text-align:left}'+
    'td{padding:6px 10px;border-bottom:1px solid #eee}'+
    'tfoot td{background:#222;color:#fff;font-weight:700}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer}'+
    '@media print{.btn{display:none}@page{margin:12mm}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resumen financiero</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>RESUMEN FINANCIERO</h1>'+
    '<div class="meta">'+empresa+' · '+today()+'</div>'+
    '<div class="stats">'+
      '<div class="stat"><div class="n">$'+Math.round(totalSistemas).toLocaleString('es-AR')+'</div><div class="l">Total facturado</div></div>'+
      '<div class="stat"><div class="n" style="color:green">$'+Math.round(totalCobrado).toLocaleString('es-AR')+'</div><div class="l">Total cobrado</div></div>'+
      '<div class="stat"><div class="n" style="color:'+(totalPendiente>0?'#E65100':'green')+'">$'+Math.round(totalPendiente).toLocaleString('es-AR')+'</div><div class="l">Saldo pendiente</div></div>'+
      '<div class="stat"><div class="n">'+(totalSistemas>0?Math.round(totalCobrado/totalSistemas*100):0)+'%</div><div class="l">% cobrado</div></div>'+
    '</div>'+
    (tc>1?'<div style="background:#FFF8E1;border-radius:5px;padding:7px 12px;font-size:11px;margin-bottom:14px;color:#7B4F00">'+
      'TC $'+tc+' — Facturado: U$S '+(totalSistemas/tc).toFixed(0)+
      ' · Cobrado: U$S '+(totalCobrado/tc).toFixed(0)+
      ' · Pendiente: U$S '+(totalPendiente/tc).toFixed(0)+'</div>':'')+
    '<table><thead><tr><th>Cliente</th><th style="text-align:right">Sistema</th><th style="text-align:right">Adelanto</th><th style="text-align:right">Pagos saldo</th><th style="text-align:right">Total cobrado</th><th style="text-align:right">Pendiente</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr>'+
      '<td style="padding:8px 10px">CONSOLIDADO</td>'+
      '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalSistemas).toLocaleString('es-AR')+'</td>'+
      '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalAdelantos).toLocaleString('es-AR')+'</td>'+
      '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalPagos).toLocaleString('es-AR')+'</td>'+
      '<td style="padding:8px 10px;text-align:right">$'+Math.round(totalCobrado).toLocaleString('es-AR')+'</td>'+
      '<td style="padding:8px 10px;text-align:right;color:'+(totalPendiente>0?'#FFB74D':'#81C784')+'">$'+Math.round(totalPendiente).toLocaleString('es-AR')+'</td>'+
    '</tr></tfoot></table>'+
    '</body></html>');
  w.document.close();
}




// REPORTES ================================================
function cerrarReporte(){
  var el=document.getElementById('reporte-resultado');
  if(el) el.innerHTML='';
}

function reporteContainer(titulo, html){
  document.getElementById('reporte-resultado').innerHTML =
    '<div class="card" style="margin-top:10px">'+
    '<div class="ch"><div class="ct">'+titulo+'</div>'+
    '<button class="btn btn-sm" onclick="cerrarReporte()">✕ Cerrar</button></div>'+
    '<div class="card-body">'+html+'</div></div>';
}

function reporteClientes(){
  var modelos=['Base','Energy','Comfort','Black'];
  var activos=DB.clientes.filter(function(c){return c.estado==='Activo';});
  var bajas=DB.clientes.filter(function(c){return c.estado==='Baja';});

  // Summary stats
  var h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">';
  modelos.forEach(function(m){
    var n=activos.filter(function(c){return c.modelo===m;}).length;
    h+='<div class="stat"><div class="stat-n">'+n+'</div><div class="stat-l">'+m+'</div></div>';
  });
  h+='</div>';

  // Model filter
  var fModelo=document.getElementById('rc-modelo')?document.getElementById('rc-modelo').value:'';
  h+='<div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">'+
    '<label style="font-size:11px;color:var(--text2)">Filtrar por modelo:</label>'+
    '<select id="rc-modelo" onchange="reporteClientes()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
      '<option value="">Todos</option>'+
      modelos.map(function(m){return '<option value="'+m+'"'+(m===fModelo?' selected':'')+'>'+m+'</option>';}).join('')+
    '</select>'+
    '<span style="font-size:11px;color:var(--text2)">'+
      (fModelo?activos.filter(function(c){return c.modelo===fModelo;}).length:activos.length)+' cliente'+
      ((fModelo?activos.filter(function(c){return c.modelo===fModelo;}).length:activos.length)!==1?'s':'')+' activos'+
    '</span>'+
  '</div>';

  // Client list
  var lista=activos.filter(function(c){return !fModelo||c.modelo===fModelo;})
    .sort(function(a,b){return (a.modelo+a.nombre).localeCompare(b.modelo+b.nombre);});

  h+='<table><thead><tr><th>Cliente</th><th>Lote / Barrio</th><th>Modelo</th><th>Fecha inst.</th></tr></thead><tbody>';
  lista.forEach(function(c){
    h+='<tr>'+
      '<td><strong>'+c.nombre+'</strong></td>'+
      '<td style="font-size:11px;color:var(--text2)">'+(c.lote||'')+(c.barrio?' · '+c.barrio:'')+'</td>'+
      '<td>'+mPill(c.modelo)+'</td>'+
      '<td style="font-size:11px">'+(c.fecha||'—')+'</td>'+
    '</tr>';
  });
  h+='</tbody></table>';
  reporteContainer('👥 Clientes por modelo', h);
}

function limpiarFiltrosPres(){
  var d=document.getElementById('rpres-desde');
  var h=document.getElementById('rpres-hasta');
  if(d) d.value='';
  if(h) h.value='';
  reportePresupuestos();
}

function reportePresupuestos(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var fDesde=document.getElementById('rpres-desde')?document.getElementById('rpres-desde').value:'';
  var fHasta=document.getElementById('rpres-hasta')?document.getElementById('rpres-hasta').value:'';
  var hoy=today();
  var primerMes=hoy.slice(0,7)+'-01';

  var lista=DB.presupuestos.filter(function(p){
    return (!fDesde||p.fecha>=fDesde) && (!fHasta||p.fecha<=fHasta);
  });

  var estados=['Borrador','Enviado','Aprobado','Rechazado'];
  var h='<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;flex-wrap:wrap">'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Desde</label>'+
      '<input id="rpres-desde" type="date" value="'+(fDesde||primerMes)+'" onchange="reportePresupuestos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Hasta</label>'+
      '<input id="rpres-hasta" type="date" value="'+(fHasta||hoy)+'" onchange="reportePresupuestos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<button class="btn btn-sm" onclick="limpiarFiltrosPres()">✕ Ver todos</button>'+
  '</div>';

  estados.forEach(function(est){
    var grupo=lista.filter(function(p){return p.estado===est;});
    if(!grupo.length) return;
    var total=grupo.reduce(function(a,p){return a+calcTotal(p);},0);
    h += '<div style="margin-bottom:12px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
        '<span>'+presEstadoPill(est)+'<strong style="margin-left:8px">'+grupo.length+' presupuesto'+(grupo.length!==1?'s':'')+'</strong></span>'+
        '<span style="font-weight:700">$'+Math.round(total).toLocaleString('es-AR')+(tc>1?' / U$S '+(total/tc).toFixed(0):'')+'</span>'+
      '</div>'+
      '<table style="width:100%;border-collapse:collapse">'+
      '<thead><tr style="background:var(--surface2)"><th style="padding:5px 10px;font-size:10px">N°</th><th style="padding:5px 10px;font-size:10px">Cliente</th><th style="padding:5px 10px;font-size:10px">Modelo</th><th style="padding:5px 10px;font-size:10px">Fecha</th><th style="padding:5px 10px;font-size:10px;text-align:right">Total</th></tr></thead>'+
      '<tbody>'+grupo.map(function(p){
        var tot=calcTotal(p);
        return '<tr style="border-bottom:1px solid var(--border)">'+
          '<td style="padding:5px 10px;font-family:monospace;font-size:11px">'+presNum(p)+'</td>'+
          '<td style="padding:5px 10px">'+p.nombre+'</td>'+
          '<td style="padding:5px 10px">'+mPill(p.modelo)+'</td>'+
          '<td style="padding:5px 10px;font-size:11px">'+p.fecha+'</td>'+
          '<td style="padding:5px 10px;text-align:right;font-weight:700">$'+Math.round(tot).toLocaleString('es-AR')+'</td>'+
        '</tr>';
      }).join('')+'</tbody></table></div>';
  });

  if(!lista.length) h += '<div class="empty">Sin presupuestos en el período.</div>';
  reporteContainer('📄 Presupuestos por período', h);
}

function reporteStockCritico(){
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const criticos=DB.componentes.filter(function(c){return stockActual(c.id)<=(parseFloat(c.min)||0);});
  if(!criticos.length){reporteContainer('⚠️ Stock crítico','<p style="color:var(--green)">✔ No hay componentes en stock crítico.</p>');return;}
  var h='<table><thead><tr><th>Código</th><th>Componente</th><th>Stock</th><th>Mínimo</th><th>Faltante</th><th>Valor rep. $</th><th>Valor rep. U$S</th></tr></thead><tbody>';
  criticos.forEach(function(c){
    const actual=stockActual(c.id);
    const faltante=Math.max(0,(c.min||0)-actual);
    const valor=faltante*(c.precio||0);
    h+='<tr><td style="font-family:monospace;font-size:10px">'+c.codigo+'</td><td>'+c.desc+'</td>'+
      '<td style="color:var(--red);font-weight:700">'+actual+'</td><td>'+(c.min||0)+'</td><td>'+faltante+'</td>'+
      '<td>'+formatMonto(valor,'ARS')+'</td><td>U$S '+(tc>0?(valor/tc).toFixed(0):0)+'</td></tr>';
  });
  h+='</tbody></table>';
  reporteContainer('⚠️ Stock crítico', h);
}

function reporteInventario(){
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const areas=['Fábrica','Mantenimiento','Instalacion','Ambas'];
  var h='<table><thead><tr><th>Área</th><th>Componentes</th><th>Valor $</th><th>Valor U$S</th></tr></thead><tbody>';
  var totalVal=0;
  areas.forEach(function(area){
    const comps=DB.componentes.filter(function(c){return c.area===area;});
    const val=comps.reduce(function(a,c){return a+stockActual(c.id)*(c.precio||0);},0);
    totalVal+=val;
    h+='<tr><td>'+area+'</td><td>'+comps.length+'</td><td>'+formatMonto(val,'ARS')+'</td><td>U$S '+(tc>0?(val/tc).toFixed(0):0)+'</td></tr>';
  });
  const totalVal2=DB.componentes.reduce(function(a,c){return a+stockActual(c.id)*(c.precio||0);},0);
  h+='<tr style="font-weight:700"><td>TOTAL</td><td>'+DB.componentes.length+'</td><td>'+formatMonto(totalVal2,'ARS')+'</td><td>U$S '+(tc>0?(totalVal2/tc).toFixed(0):0)+'</td></tr>';
  h+='</tbody></table>';
  reporteContainer('📦 Inventario por área', h);
}

function reporteMovimientos(){
  const tc=(DB.config&&DB.config.tipoCambio)||1;
  const hoy=today();
  const hace30=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  const recientes=DB.movimientos.filter(function(m){return m.fecha>=hace30;});
  const entradas=recientes.filter(function(m){return m.tipo==='Entrada';});
  const salidas=recientes.filter(function(m){return m.tipo!=='Entrada';});
  const totalEnt=entradas.reduce(function(a,m){return a+(parseFloat(m.precio)||0)*(parseFloat(m.cant)||0);},0);
  const totalSal=salidas.reduce(function(a,m){return a+(parseFloat(m.precio)||0)*(parseFloat(m.cant)||0);},0);
  var h='<p style="font-size:12px;color:var(--text2);margin-bottom:12px">Últimos 30 días</p>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">';
  h+='<div class="stat"><div class="stat-n green">'+entradas.length+'</div><div class="stat-l">Entradas</div></div>';
  h+='<div class="stat"><div class="stat-n red">'+salidas.length+'</div><div class="stat-l">Salidas</div></div>';
  h+='<div class="stat"><div class="stat-n">'+recientes.length+'</div><div class="stat-l">Total movs.</div></div>';
  h+='</div>';
  h+='<table><thead><tr><th>Tipo</th><th>Movimientos</th><th>Valor $</th><th>Valor U$S</th></tr></thead><tbody>';
  h+='<tr><td><span class="pill p-g">Entradas</span></td><td>'+entradas.length+'</td><td>'+formatMonto(totalEnt,'ARS')+'</td><td>U$S '+(tc>0?(totalEnt/tc).toFixed(0):0)+'</td></tr>';
  h+='<tr><td><span class="pill p-r">Salidas</span></td><td>'+salidas.length+'</td><td>'+formatMonto(totalSal,'ARS')+'</td><td>U$S '+(tc>0?(totalSal/tc).toFixed(0):0)+'</td></tr>';
  h+='</tbody></table>';
  reporteContainer('🔄 Movimientos (últimos 30 días)', h);
}

function reporteMantenimiento(){
  const hace90=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
  const activos=DB.clientes.filter(function(c){return c.estado==='Activo';});
  const sinMant=activos.filter(function(c){
    if(!c.mant||!c.mant.length) return true;
    const ultimo=c.mant.map(function(m){return m.fecha;}).sort().pop();
    return ultimo<hace90;
  });
  var h='<p style="font-size:12px;color:var(--text2);margin-bottom:12px">Clientes activos sin mantenimiento en los últimos 90 días: <strong>'+sinMant.length+'</strong></p>';
  if(sinMant.length){
    h+='<table><thead><tr><th>Cliente</th><th>Barrio</th><th>Modelo</th><th>Último mant.</th></tr></thead><tbody>';
    sinMant.forEach(function(c){
      const ultimo=c.mant&&c.mant.length?c.mant.map(function(m){return m.fecha;}).sort().pop():'Nunca';
      h+='<tr><td><strong>'+c.nombre+'</strong></td><td>'+( c.barrio||'—')+'</td><td>'+mPill(c.modelo)+'</td><td>'+ultimo+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  reporteContainer('🔧 Clientes sin mantenimiento', h);
}

function reporteOTA(){
  var fCliente = document.getElementById('rf-cliente')?document.getElementById('rf-cliente').value:'';
  var fVersion = document.getElementById('rf-version')?document.getElementById('rf-version').value:'';

  var clientes = DB.clientes.filter(function(c){
    return c.estado==='Activo' &&
      (!fCliente||c.nombre.toLowerCase().includes(fCliente.toLowerCase())) &&
      (!fVersion||( c.version||'').toLowerCase().includes(fVersion.toLowerCase()));
  }).sort(function(a,b){return (a.nombre||'').localeCompare(b.nombre||'');});

  var versiones = {};
  clientes.forEach(function(c){
    versiones[c.version||'Sin versión']=(versiones[c.version||'Sin versión']||0)+1;
  });

  var rows = clientes.map(function(c){
    return '<tr>'+
      '<td><strong>'+c.nombre+'</strong></td>'+
      '<td style="font-size:11px;color:var(--text2)">'+(c.lote||'')+(c.barrio?' · '+c.barrio:'')+'</td>'+
      '<td>'+mPill(c.modelo)+'</td>'+
      '<td style="font-family:monospace;font-weight:700">'+(c.version||'—')+'</td>'+
      '<td style="font-size:11px">'+(c.fecha||'—')+'</td>'+
    '</tr>';
  }).join('');

  var h = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'+
    '<input id="rf-cliente" value="'+fCliente+'" placeholder="Filtrar por cliente..." onchange="reporteOTA()" '+
    'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
    '<input id="rf-version" value="'+fVersion+'" placeholder="Filtrar por versión..." onchange="reporteOTA()" '+
    'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
  '</div>';

  if(!clientes.length){
    h += '<div class="empty">Sin resultados.</div>';
  } else {
    h += '<table><thead><tr><th>Cliente</th><th>Ubicación</th><th>Modelo</th><th>Firmware</th><th>Fecha inst.</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table>';
  }
  reporteContainer('📡 Firmware instalado por cliente', h);
}

function reporteInstalaciones(){
  var estados = ['Pendiente','En curso','Completada','Sin definir'];
  var clientes = DB.clientes.filter(function(c){return c.estado==='Activo';});

  // Filter buttons
  var btnsFiltro = estados.map(function(e){
    var cnt = clientes.filter(function(c){
      return e==='Sin definir'?!c.estadoInstalacion:(c.estadoInstalacion||'Sin definir')===e;
    }).length;
    return '<button data-est="'+e+'" class="btn btn-sm" style="margin-right:4px">'+e+' ('+cnt+')</button>';
  }).join('');

  var rows = clientes.map(function(c){
    var est = c.estadoInstalacion||'Sin definir';
    var color = est==='Completada'?'var(--green)':est==='En curso'?'var(--amber)':est==='Pendiente'?'var(--red)':'var(--text2)';
    return '<tr>'+
      '<td><strong>'+c.nombre+'</strong></td>'+
      '<td>'+(c.lote||'—')+'</td>'+
      '<td>'+(c.barrio||'—')+'</td>'+
      '<td>'+mPill(c.modelo)+'</td>'+
      '<td>'+(c.fecha||'—')+'</td>'+
      '<td style="font-weight:700;color:'+color+'">'+est+'</td>'+
      '<td style="font-size:11px;color:var(--text2);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(c.notas||'—')+'</td>'+
    '</tr>';
  }).join('');

  var h = '<div style="margin-bottom:10px">'+btnsFiltro+'</div>'+
    '<div id="inst-tabla">'+
    '<table><thead><tr>'+
      '<th>Cliente</th><th>Lote</th><th>Barrio</th><th>Modelo</th><th>Fecha inst.</th><th>Estado</th><th>Notas</th>'+
    '</tr></thead><tbody id="inst-body">'+rows+'</tbody></table></div>';

  reporteContainer('🔧 Estado de instalaciones', h);
  // Attach filter button handlers
  document.querySelectorAll('[data-est]').forEach(function(btn){
    btn.onclick = function(){ reporteInstalaciones_filtro(this.dataset.est); };
  });
}

function reporteInstalaciones_filtro(estado){
  var clientes = DB.clientes.filter(function(c){return c.estado==='Activo';});
  var filtered = estado==='Sin definir'
    ? clientes.filter(function(c){return !c.estadoInstalacion;})
    : clientes.filter(function(c){return (c.estadoInstalacion||'Sin definir')===estado;});

  var rows = filtered.map(function(c){
    var est = c.estadoInstalacion||'Sin definir';
    var color = est==='Completada'?'var(--green)':est==='En curso'?'var(--amber)':est==='Pendiente'?'var(--red)':'var(--text2)';
    return '<tr>'+
      '<td><strong>'+c.nombre+'</strong></td>'+
      '<td>'+(c.lote||'—')+'</td>'+
      '<td>'+(c.barrio||'—')+'</td>'+
      '<td>'+mPill(c.modelo)+'</td>'+
      '<td>'+(c.fecha||'—')+'</td>'+
      '<td style="font-weight:700;color:'+color+'">'+est+'</td>'+
      '<td style="font-size:11px;color:var(--text2)">'+(c.notas||'—')+'</td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="7" class="empty">Sin clientes en este estado.</td></tr>';

  var tb = document.getElementById('inst-body');
  if(tb) tb.innerHTML = rows;
}

// REPORTE: Vencimientos de garantía ========================
function reporteVencimientos(){
  var hoy = today();
  var clientes = DB.clientes.filter(function(c){return c.estado==='Activo';});

  var items = [];
  clientes.forEach(function(c){
    if(c.equipo && c.equipo.ups_gar_vence){
      var dias = Math.round((new Date(c.equipo.ups_gar_vence)-new Date())/86400000);
      items.push({cliente:c.nombre, lote:c.lote||'', barrio:c.barrio||'', equipo:'UPS '+( c.equipo.ups_marca||'')+' '+(c.equipo.ups_modelo||''), vence:c.equipo.ups_gar_vence, dias:dias});
    }
  });

  items.sort(function(a,b){return a.dias-b.dias;});

  if(!items.length){
    reporteContainer('⏰ Vencimientos de garantía','<div class="empty">No hay garantías registradas.</div>');
    return;
  }

  var rows = items.map(function(i){
    var color = i.dias<0?'var(--red)':i.dias<=30?'#E65100':i.dias<=90?'var(--amber)':'var(--green)';
    var label = i.dias<0?'Vencida hace '+Math.abs(i.dias)+' días':i.dias===0?'Vence hoy':'Vence en '+i.dias+' días';
    return '<tr>'+
      '<td><strong>'+i.cliente+'</strong></td>'+
      '<td>'+(i.lote)+(i.barrio?' · '+i.barrio:'')+'</td>'+
      '<td>'+i.equipo+'</td>'+
      '<td>'+i.vence+'</td>'+
      '<td style="font-weight:700;color:'+color+'">'+label+'</td>'+
    '</tr>';
  }).join('');

  var vencidas = items.filter(function(i){return i.dias<0;}).length;
  var prox30 = items.filter(function(i){return i.dias>=0&&i.dias<=30;}).length;
  var prox90 = items.filter(function(i){return i.dias>30&&i.dias<=90;}).length;

  var h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">'+
    '<div class="stat"><div class="stat-n red">'+vencidas+'</div><div class="stat-l">Vencidas</div></div>'+
    '<div class="stat"><div class="stat-n amber">'+prox30+'</div><div class="stat-l">Vencen en 30 días</div></div>'+
    '<div class="stat"><div class="stat-n">'+prox90+'</div><div class="stat-l">Vencen en 31-90 días</div></div>'+
  '</div>'+
  '<table><thead><tr>'+
    '<th>Cliente</th><th>Ubicación</th><th>Equipo</th><th>Vence</th><th>Estado</th>'+
  '</tr></thead><tbody>'+rows+'</tbody></table>';

  reporteContainer('⏰ Vencimientos de garantía', h);
}

// REPORTE: Historial de presupuestos ========================
function reporteHistorialPres(){
  var pres = DB.presupuestos.filter(function(p){return p.historial&&p.historial.length;});

  if(!pres.length){
    reporteContainer('📋 Historial de presupuestos','<div class="empty">Sin historial registrado. Los cambios de estado se registran a partir de ahora.</div>');
    return;
  }

  var h = '';
  pres.forEach(function(p){
    h += '<div class="card" style="margin-bottom:10px">'+
      '<div class="ch"><div class="ct">'+presNum(p)+' — '+p.nombre+'</div>'+
      '<div>'+presEstadoPill(p.estado)+'</div></div>'+
      '<div class="card-body">'+
        '<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap">';

    // Timeline
    var steps = [{fecha:p.fecha||'',de:'',a:'Borrador'}].concat(p.historial||[]);
    steps.forEach(function(s,i){
      var color = s.a==='Aprobado'?'var(--green)':s.a==='Rechazado'?'var(--red)':s.a==='Enviado'?'var(--blue)':'var(--text2)';
      h += '<div style="display:flex;align-items:center;gap:6px">'+
        '<div style="text-align:center">'+
          '<div style="width:28px;height:28px;border-radius:50%;background:'+color+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin:0 auto 3px">'+( i+1)+'</div>'+
          '<div style="font-size:10px;font-weight:700;color:'+color+'">'+s.a+'</div>'+
          '<div style="font-size:9px;color:var(--text2)">'+s.fecha+'</div>'+
        '</div>'+
        (i<steps.length-1?'<div style="width:30px;height:2px;background:var(--border);margin:0 2px"></div>':'');
    });

    h += '</div></div></div>';
  });

  reporteContainer('📋 Historial de presupuestos', h);
}


function reporteMantenimientos(){
  var hoy = today();
  var tc = (DB.config&&DB.config.tipoCambio)||1;

  // Build full list of mantenimientos across all clients
  var todos = [];
  DB.clientes.forEach(function(c){
    if(!c.mant||!c.mant.length) return;
    c.mant.forEach(function(m){
      todos.push({
        cliente: c.nombre,
        lote: c.lote||'',
        barrio: c.barrio||'',
        modelo: c.modelo||'Base',
        fecha: m.fecha||'',
        tipo: m.tipo||'—',
        motivo: m.motivo||'—',
        falla: m.falla||'—',
        solucion: m.reparacion||'—',
        garantia: m.garantia||'No',
        costo: parseFloat(m.costo)||0,
        tecnico: m.tecnico||'—'
      });
    });
  });

  if(!todos.length){
    reporteContainer('🔧 Historial de mantenimientos','<div class="empty">Sin registros de mantenimiento.</div>');
    return;
  }

  // Get current filter values if they exist
  var fCliente = document.getElementById('rm-cliente')?document.getElementById('rm-cliente').value:'';
  var fTipo = document.getElementById('rm-tipo')?document.getElementById('rm-tipo').value:'';
  var fDesde = document.getElementById('rm-desde')?document.getElementById('rm-desde').value:'';
  var fHasta = document.getElementById('rm-hasta')?document.getElementById('rm-hasta').value:'';
  var fOrden = document.getElementById('rm-orden')?document.getElementById('rm-orden').value:'fecha-desc';
  var fMotivo = document.getElementById('rm-motivo')?document.getElementById('rm-motivo').value:'';
  var fFalla = document.getElementById('rm-falla')?document.getElementById('rm-falla').value:'';
  var fReparacion = document.getElementById('rm-reparacion')?document.getElementById('rm-reparacion').value:'';

  var lista = todos.filter(function(m){
    return (!fCliente||m.cliente.toLowerCase().includes(fCliente.toLowerCase())) &&
           (!fTipo||m.tipo===fTipo) &&
           (!fMotivo||m.motivo.toLowerCase().includes(fMotivo.toLowerCase())) &&
           (!fFalla||m.falla.toLowerCase().includes(fFalla.toLowerCase())) &&
           (!fReparacion||m.solucion.toLowerCase().includes(fReparacion.toLowerCase())) &&
           (!fDesde||m.fecha>=fDesde) &&
           (!fHasta||m.fecha<=fHasta);
  });

  // Sort
  lista.sort(function(a,b){
    if(fOrden==='fecha-desc') return a.fecha>b.fecha?-1:1;
    if(fOrden==='fecha-asc') return a.fecha>b.fecha?1:-1;
    if(fOrden==='cliente') return a.cliente.localeCompare(b.cliente);
    if(fOrden==='tipo') return a.tipo.localeCompare(b.tipo);
    return 0;
  });

  var totalCosto = lista.reduce(function(a,m){return a+m.costo;},0);
  var enGarantia = lista.filter(function(m){return m.garantia==='Sí';}).length;

  // Stats
  var h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">'+
    '<div class="stat"><div class="stat-n">'+lista.length+'</div><div class="stat-l">Visitas en período</div></div>'+
    '<div class="stat"><div class="stat-n green">'+enGarantia+'</div><div class="stat-l">En garantía</div></div>'+
    '<div class="stat"><div class="stat-n blue">$'+Math.round(totalCosto).toLocaleString('es-AR')+'</div><div class="stat-l">Costo total</div></div>'+
  '</div>';

  // Filters
  var clientes = [...new Set(todos.map(function(m){return m.cliente;}))].sort();
  var tipos = [...new Set(todos.map(function(m){return m.tipo;}))].sort();

  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px">'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Cliente</label>'+
      '<input id="rm-cliente" value="'+fCliente+'" placeholder="Filtrar por cliente..." onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Tipo</label>'+
      '<select id="rm-tipo" onchange="reporteMantenimientos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
        '<option value="">Todos</option>'+tipos.map(function(t){return '<option'+(t===fTipo?' selected':'')+'>'+t+'</option>';}).join('')+
      '</select></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Motivo</label>'+
      '<input id="rm-motivo" value="'+fMotivo+'" placeholder="Filtrar motivo..." onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Falla</label>'+
      '<input id="rm-falla" value="'+fFalla+'" placeholder="Filtrar falla..." onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Reparación</label>'+
      '<input id="rm-reparacion" value="'+fReparacion+'" placeholder="Filtrar reparación..." onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Desde</label>'+
      '<input id="rm-desde" type="date" value="'+fDesde+'" onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Hasta</label>'+
      '<input id="rm-hasta" type="date" value="'+fHasta+'" onchange="reporteMantenimientos()" '+
      'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)"></div>'+
    '<div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Ordenar por</label>'+
      '<select id="rm-orden" onchange="reporteMantenimientos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
        '<option value="fecha-desc"'+(fOrden==='fecha-desc'?' selected':'')+'>Fecha ↓</option>'+
        '<option value="fecha-asc"'+(fOrden==='fecha-asc'?' selected':'')+'>Fecha ↑</option>'+
        '<option value="cliente"'+(fOrden==='cliente'?' selected':'')+'>Cliente A-Z</option>'+
        '<option value="tipo"'+(fOrden==='tipo'?' selected':'')+'>Tipo</option>'+
      '</select></div>'+
    '<button class="btn btn-sm" onclick="pdfReporteMantenimientos()">🖨️ PDF</button>'+
  '</div>';

  if(!lista.length){
    h += '<div class="empty">Sin registros para los filtros aplicados.</div>';
    reporteContainer('🔧 Historial de mantenimientos', h);
    return;
  }

  h += '<table><thead><tr>'+
    '<th>Fecha</th><th>Cliente</th><th>Modelo</th><th>Tipo</th>'+
    '<th>Motivo</th><th>Falla</th><th>Reparación</th><th>Garantía</th>'+
    '<th style="text-align:right">Costo $</th><th>Técnico</th>'+
  '</tr></thead><tbody>';

  lista.forEach(function(m){
    h += '<tr>'+
      '<td style="font-size:11px">'+m.fecha+'</td>'+
      '<td><strong>'+m.cliente+'</strong><br><span style="font-size:10px;color:var(--text2)">'+m.lote+(m.barrio?' · '+m.barrio:'')+'</span></td>'+
      '<td>'+mPill(m.modelo)+'</td>'+
      '<td><span class="pill p-b">'+m.tipo+'</span></td>'+
      '<td style="font-size:11px">'+m.motivo+'</td>'+
      '<td style="font-size:11px">'+m.falla+'</td>'+
      '<td style="font-size:11px">'+m.solucion+'</td>'+
      '<td style="text-align:center">'+(m.garantia==='Sí'?'<span style="color:var(--green);font-weight:700">✔</span>':'—')+'</td>'+
      '<td style="text-align:right;font-weight:700">$'+Math.round(m.costo).toLocaleString('es-AR')+'</td>'+
      '<td style="font-size:11px">'+m.tecnico+'</td>'+
    '</tr>';
  });

  h += '</tbody></table>';
  reporteContainer('🔧 Historial de mantenimientos', h);
}

function pdfReporteMantenimientos(){
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var todos=[];
  DB.clientes.forEach(function(c){
    if(!c.mant||!c.mant.length) return;
    c.mant.forEach(function(m){
      todos.push({cliente:c.nombre,lote:c.lote||'',modelo:c.modelo||'',
        fecha:m.fecha||'',tipo:m.tipo||'',motivo:m.motivo||'',
        solucion:m.reparacion||'',garantia:m.garantia||'No',
        costo:parseFloat(m.costo)||0,tecnico:m.tecnico||''});
    });
  });
  todos.sort(function(a,b){return a.fecha>b.fecha?-1:1;});
  var total=todos.reduce(function(a,m){return a+m.costo;},0);
  var rows=todos.map(function(m){
    return '<tr><td>'+m.fecha+'</td><td>'+m.cliente+'</td><td>'+m.modelo+'</td>'+
      '<td>'+m.tipo+'</td><td>'+m.motivo+'</td><td>'+m.solucion+'</td>'+
      '<td style="text-align:center">'+(m.garantia==='Sí'?'✔':'—')+'</td>'+
      '<td style="text-align:right">$'+Math.round(m.costo).toLocaleString('es-AR')+'</td>'+
      '<td>'+m.tecnico+'</td></tr>';
  }).join('');
  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:20px;font-size:11px}'+
    'h1{font-size:15px;color:#B71C1C;margin-bottom:2px}.meta{color:#666;font-size:10px;margin-bottom:12px}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:6px 8px;font-size:10px;text-align:left}'+
    'td{padding:5px 8px;border-bottom:1px solid #eee}tfoot td{background:#222;color:#fff;font-weight:700}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer}'+
    '@media print{.btn{display:none}}';
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mantenimientos</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>HISTORIAL DE MANTENIMIENTOS</h1><div class="meta">'+empresa+' · '+today()+'</div>'+
    '<table><thead><tr><th>Fecha</th><th>Cliente</th><th>Modelo</th><th>Tipo</th><th>Motivo</th><th>Falla</th><th>Reparación</th><th>Gtía</th><th>Costo</th><th>Técnico</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr><td colspan="7" style="padding:7px 8px;text-align:right">TOTAL</td>'+
    '<td style="padding:7px 8px;text-align:right">$'+Math.round(total).toLocaleString('es-AR')+'</td><td></td></tr></tfoot>'+
    '</table></body></html>');
  w.document.close();
}

function reportePendientes(){
  var fCliente = document.getElementById('rp-cliente')?document.getElementById('rp-cliente').value:'';
  var hace15=new Date(Date.now()-15*86400000).toISOString().slice(0,10);
  var lista=DB.presupuestos.filter(function(p){
    return p.estado==='Enviado' && p.fecha < hace15 &&
      (!fCliente||(p.nombre||'').toLowerCase().includes(fCliente.toLowerCase()));
  }).sort(function(a,b){return a.fecha>b.fecha?1:-1;});

  var h = '<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<input id="rp-cliente" value="'+fCliente+'" placeholder="Filtrar por cliente..." onchange="reportePendientes()" '+
    'style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
  '</div>';

  if(!lista.length){
    h += '<div class="empty">Sin presupuestos enviados sin respuesta.</div>';
  } else {
    h += '<table><thead><tr><th>N°</th><th>Cliente</th><th>Modelo</th><th>Fecha envío</th><th>Días sin respuesta</th></tr></thead><tbody>';
    lista.forEach(function(p){
      var dias=Math.round((new Date()-new Date(p.fecha))/86400000);
      h += '<tr>'+
        '<td style="font-family:monospace">'+presNum(p)+'</td>'+
        '<td>'+p.nombre+'</td>'+
        '<td>'+mPill(p.modelo)+'</td>'+
        '<td>'+p.fecha+'</td>'+
        '<td style="font-weight:700;color:'+(dias>30?'var(--red)':'var(--amber)')+'">'+dias+' días</td>'+
      '</tr>';
    });
    h += '</tbody></table>';
  }
  reporteContainer('⏳ Presupuestos sin respuesta', h);
}

function renderReportes(){
  var el = document.getElementById('reportes-body');
  if(!el) return;

  var hoy = today();
  var hace90 = new Date(Date.now()-90*86400000).toISOString().slice(0,10);

  // 1. Clientes por modelo
  var modelos = ['Base','Energy','Comfort','Black'];
  var porModelo = {};
  modelos.forEach(function(m){ porModelo[m]=0; });
  DB.clientes.filter(function(c){return c.estado==='Activo';}).forEach(function(c){
    if(porModelo[c.modelo]!==undefined) porModelo[c.modelo]++;
  });

  // 2. Presupuestos stats
  var pres = DB.presupuestos;
  var presTotal = pres.length;
  var presAprobados = pres.filter(function(p){return p.estado==='Aprobado';}).length;
  var presRechazados = pres.filter(function(p){return p.estado==='Rechazado';}).length;
  var presEnviados = pres.filter(function(p){return p.estado==='Enviado';}).length;
  var tasa = presTotal>0?Math.round((presAprobados/presTotal)*100):0;
  var tc = (DB.config&&DB.config.tipoCambio)||1;

  // 3. Stock critico
  var criticos = DB.componentes.filter(function(c){
    var qty = stockActual(c.id);
    return qty <= (parseFloat(c.min)||0);
  });
  var valorReposicion = criticos.reduce(function(a,c){
    var faltante = Math.max(0,(parseFloat(c.min)||0)-stockActual(c.id));
    return a + faltante*(parseFloat(c.precio)||0);
  },0);

  // 4. Valor inventario por area
  var invAreas = {Fabrica:0,Mantenimiento:0,Instalacion:0,Ambas:0};
  DB.componentes.forEach(function(c){
    var area = c.area||'Fabrica';
    var val = stockActual(c.id)*(parseFloat(c.precio)||0);
    if(invAreas[area]!==undefined) invAreas[area]+=val;
  });

  // 5. Clientes sin mantenimiento en 90 dias
  var sinMant = DB.clientes.filter(function(c){
    if(c.estado!=='Activo') return false;
    if(!c.mant||!c.mant.length) return true;
    var ultima = c.mant.map(function(m){return m.fecha;}).sort().reverse()[0];
    return ultima < hace90;
  }).length;

  // 6. Presupuestos enviados sin respuesta hace mas de 15 dias
  var hace15 = new Date(Date.now()-15*86400000).toISOString().slice(0,10);
  var sinRespuesta = pres.filter(function(p){
    return p.estado==='Enviado' && p.fecha < hace15;
  }).length;

  // 7. Versiones firmware
  var versiones = {};
  DB.clientes.filter(function(c){return c.estado==='Activo'&&c.version;}).forEach(function(c){
    versiones[c.version] = (versiones[c.version]||0)+1;
  });

  // 8. Movimientos del mes
  var mes = hoy.slice(0,7);
  var movsEnt = DB.movimientos.filter(function(m){return m.tipo==='Entrada'&&m.fecha&&m.fecha.slice(0,7)===mes;});
  var movsSal = DB.movimientos.filter(function(m){return m.tipo!=='Entrada'&&m.fecha&&m.fecha.slice(0,7)===mes;});
  var totalEntradas = movsEnt.reduce(function(a,m){return a+(parseFloat(m.cant)||0)*(parseFloat(m.precio)||0);},0);

  var h = '';

  // Stats generales
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  h += stat(DB.clientes.filter(function(c){return c.estado==='Activo';}).length, 'Clientes activos', 'green');
  h += stat(presAprobados, 'Presupuestos aprobados', 'blue');
  h += stat(criticos.length, 'Stock crítico', 'red');
  h += stat(tasa+'%', 'Tasa conversión', 'amber');
  h += '</div>';

  // Clientes por modelo
  // Clientes list with model filter
  var fModelo = document.getElementById('rep-modelo')?document.getElementById('rep-modelo').value:'';
  var clientesActivos = DB.clientes.filter(function(c){
    return c.estado==='Activo' && (!fModelo||c.modelo===fModelo);
  }).sort(function(a,b){return (a.modelo+a.nombre).localeCompare(b.modelo+b.nombre);});

  h += '<div class="card" style="margin-bottom:12px">';
  h += '<div class="ch"><div class="ct">👥 Clientes activos por modelo</div>';
  h += '<select id="rep-modelo" onchange="renderReportes()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
    '<option value="">Todos los modelos</option>'+
    modelos.map(function(m){return '<option value="'+m+'"'+(m===fModelo?' selected':'')+'>'+m+'</option>';}).join('')+
  '</select></div>';
  h += '<div class="card-body">';
  h += '<table style="width:100%;border-collapse:collapse">';
  h += '<thead><tr style="background:var(--surface2)"><th style="padding:6px 10px;font-size:11px;text-align:left">Cliente</th><th style="padding:6px 10px;font-size:11px;text-align:left">Ubicación</th><th style="padding:6px 10px;font-size:11px;text-align:left">Modelo</th><th style="padding:6px 10px;font-size:11px">Inst.</th></tr></thead><tbody>';
  clientesActivos.forEach(function(c){
    h += '<tr style="border-bottom:1px solid var(--border)">'+
      '<td style="padding:5px 10px;font-size:11px"><strong>'+c.nombre+'</strong></td>'+
      '<td style="padding:5px 10px;font-size:11px;color:var(--text2)">'+(c.lote||'')+(c.barrio?' · '+c.barrio:'')+'</td>'+
      '<td style="padding:5px 10px">'+mPill(c.modelo)+'</td>'+
      '<td style="padding:5px 10px;font-size:11px">'+(c.fecha||'—')+'</td>'+
    '</tr>';
  });
  h += '</tbody></table></div></div>';

  // Presupuestos
  h += '<div class="card"><div class="ch"><div class="ct">📄 Presupuestos</div></div><div class="card-body">';
  h += '<table style="width:100%;border-collapse:collapse">';
  h += rRow('Total emitidos', presTotal);
  h += rRow('Aprobados', presAprobados, 'green');
  h += rRow('Enviados sin respuesta (+15 días)', sinRespuesta, sinRespuesta>0?'red':'');
  h += rRow('Rechazados', presRechazados, presRechazados>0?'red':'');
  h += rRow('Tasa de conversión', tasa+'%', tasa>=50?'green':'amber');
  h += '</table></div></div>';
  h += '</div>';

  // Stock critico
  h += '<div class="card" style="margin-bottom:12px"><div class="ch"><div class="ct">⚠️ Stock crítico</div></div><div class="card-body">';
  if(criticos.length===0){
    h += '<div class="empty">Sin componentes bajo mínimo ✔</div>';
  } else {
    h += '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:var(--surface2)"><th style="padding:6px 10px;text-align:left;font-size:11px">Componente</th><th style="padding:6px 10px;font-size:11px">Área</th><th style="padding:6px 10px;font-size:11px;text-align:center">Stock</th><th style="padding:6px 10px;font-size:11px;text-align:center">Mínimo</th><th style="padding:6px 10px;font-size:11px;text-align:right">Reposición est.</th></tr></thead><tbody>';
    criticos.forEach(function(c){
      var qty=stockActual(c.id);
      var falt=Math.max(0,(parseFloat(c.min)||0)-qty);
      h += '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px 10px">'+c.desc+'</td><td style="padding:6px 10px">'+( c.area||'—')+'</td><td style="padding:6px 10px;text-align:center;color:var(--red);font-weight:700">'+qty+'</td><td style="padding:6px 10px;text-align:center">'+( c.min||0)+'</td><td style="padding:6px 10px;text-align:right">$'+Math.round(falt*(parseFloat(c.precio)||0)).toLocaleString('es-AR')+'</td></tr>';
    });
    h += '</tbody></table>';
    h += '<div style="padding:10px;font-size:12px;color:var(--text2)">Valor total estimado de reposición: <strong>$'+Math.round(valorReposicion).toLocaleString('es-AR')+'</strong>';
    if(tc>1) h += ' / <strong>U$S '+(valorReposicion/tc).toFixed(0)+'</strong>';
    h += '</div>';
  }
  h += '</div></div>';

  // Valor inventario por area
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  h += '<div class="card"><div class="ch"><div class="ct">📦 Inventario por área</div></div><div class="card-body">';
  h += '<table style="width:100%;border-collapse:collapse">';
  Object.entries(invAreas).forEach(function(entry){
    h += rRow(entry[0], '$'+Math.round(entry[1]).toLocaleString('es-AR'));
  });
  h += rRow('TOTAL', '$'+Math.round(Object.values(invAreas).reduce(function(a,v){return a+v;},0)).toLocaleString('es-AR'), 'blue');
  h += '</table></div></div>';

  // Clientes sin mantenimiento
  h += '<div class="card"><div class="ch"><div class="ct">🔧 Mantenimiento</div></div><div class="card-body">';
  h += '<table style="width:100%;border-collapse:collapse">';
  h += rRow('Sin mantenimiento en 90 días', sinMant, sinMant>0?'amber':'green');
  h += rRow('Movimientos de stock este mes', movsEnt.length+' entradas / '+movsSal.length+' salidas');
  h += rRow('Valor entradas del mes', '$'+Math.round(totalEntradas).toLocaleString('es-AR'));
  h += '</table></div></div>';
  h += '</div>';

  // Versiones firmware
  h += '<div class="card"><div class="ch"><div class="ct">🔄 Versiones de firmware instaladas</div></div><div class="card-body">';
  var vkeys = Object.keys(versiones).sort().reverse();
  if(vkeys.length===0){
    h += '<div class="empty">Sin datos de versión registrados</div>';
  } else {
    h += '<table style="width:100%;border-collapse:collapse">';
    vkeys.forEach(function(v){
      h += rRow(v, versiones[v]+' cliente'+(versiones[v]!==1?'s':''));
    });
    h += '</table>';
  }
  h += '</div></div>';

  // 9. Vencimientos de garantía próximos 90 días
  var hoy2 = today();
  var en90 = new Date(Date.now()+90*86400000).toISOString().slice(0,10);
  var vencProx = DB.clientes.filter(function(c){
    return c.estado==='Activo' && c.equipo && c.equipo.ups_gar_vence &&
           c.equipo.ups_gar_vence >= hoy2 && c.equipo.ups_gar_vence <= en90;
  });

  if(vencProx.length){
    h += '<div class="card" style="margin-bottom:12px;border-left:3px solid #E65100"><div class="ch"><div class="ct">⏰ Garantías UPS por vencer (90 días)</div></div><div class="card-body">';
    h += '<table style="width:100%;border-collapse:collapse">';
    vencProx.forEach(function(c){
      var dias=Math.round((new Date(c.equipo.ups_gar_vence)-new Date())/86400000);
      h += '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px 10px">'+c.nombre+'</td>'+
        '<td style="padding:6px 10px;font-size:11px">'+c.lote+(c.barrio?' · '+c.barrio:'')+'</td>'+
        '<td style="padding:6px 10px;font-weight:700;color:#E65100">'+c.equipo.ups_gar_vence+' ('+dias+' días)</td></tr>';
    });
    h += '</table></div></div>';
  }

  el.innerHTML = h;
}

function stat(val, label, color){
  return '<div class="stat"><div class="stat-n '+(color||'')+'" style="font-size:22px">'+val+'</div><div class="stat-l">'+label+'</div></div>';
}

function rRow(label, val, color){
  return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:6px 10px;font-size:12px">'+label+'</td><td style="padding:6px 10px;font-weight:700;text-align:right;color:var(--'+(color||'text')+')">'+val+'</td></tr>';
}


// PROVEEDORES ===============================================
function renderProveedores(){
  var el=document.getElementById('prov-body');
  if(!el) return;
  var h='<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px">'+
    '<button class="btn btn-p" onclick="modalProveedor(-1)">➕ Nuevo proveedor</button>'+
    '<button class="btn btn-sm" onclick="pdfProveedores()">🖨️ PDF</button>'+
  '</div>';
  if(!DB.proveedores.length){
    h+='<div class="empty">Sin proveedores registrados.</div>';
    el.innerHTML=h; return;
  }
  h+='<table><thead><tr><th>Empresa</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Rubro</th><th>Condiciones</th><th></th></tr></thead><tbody>';
  DB.proveedores.forEach(function(p,i){
    h+='<tr>'+
      '<td><strong>'+p.empresa+'</strong></td>'+
      '<td>'+(p.contacto||'—')+'</td>'+
      '<td>'+(p.tel||'—')+'</td>'+
      '<td>'+(p.email||'—')+'</td>'+'<td>'+(p.web||'—')+'</td>'+
      '<td>'+(p.rubro||'—')+'</td>'+
      '<td style="font-size:11px">'+(p.condiciones||'—')+'</td>'+
      '<td style="display:flex;gap:4px">'+
        '<button class="btn btn-sm" onclick="modalProveedor('+i+')">✏️</button>'+
        '<button class="btn btn-sm btn-p" onclick="modalOrdenDesdeProveedor('+p.id+')" title="Nueva OC">🛒</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="borrarProveedor('+p.id+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  });
  h+='</tbody></table>';
  el.innerHTML=h;
}

function modalProveedor(idx){
  var p=idx>=0?DB.proveedores[idx]:{};
  openModal(idx>=0?'Editar proveedor':'Nuevo proveedor',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="fg"><label>Empresa *</label><input id="pv-emp" value="'+(p.empresa||'')+'"></div>'+
    '<div class="fg"><label>Rubro</label><input id="pv-rub" value="'+(p.rubro||'')+'" placeholder="Ej: Electrónica, Gabinetes..."></div>'+
    '<div class="fg"><label>Contacto</label><input id="pv-con" value="'+(p.contacto||'')+'"></div>'+
    '<div class="fg"><label>Teléfono</label><input id="pv-tel" value="'+(p.tel||'')+'"></div>'+
    '<div class="fg"><label>Email</label><input id="pv-email" type="email" value="'+(p.email||'')+'"></div>'+
    '<div class="fg"><label>Dirección</label><input id="pv-dir" value="'+(p.dir||'')+'"></div>'+
    '<div class="fg"><label>Sitio web</label><input id="pv-web" value="'+(p.web||'')+'" placeholder="www.proveedor.com"></div>'+
    '<div class="fg" style="grid-column:1/-1"><label>Condiciones comerciales</label><input id="pv-cond" value="'+(p.condiciones||'')+'" placeholder="Ej: 30 días, pago con transferencia..."></div>'+
    '<div class="fg" style="grid-column:1/-1"><label>Observaciones</label><textarea id="pv-obs" style="min-height:50px;padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%;font-family:inherit">'+(p.obs||'')+'</textarea></div>'+
    '</div>',
    function(){
      var emp=document.getElementById('pv-emp').value.trim();
      if(!emp){alert('El nombre de la empresa es obligatorio.');return false;}
      var obj={
        id:idx>=0?p.id:DB.nid++,
        empresa:emp,
        rubro:document.getElementById('pv-rub').value,
        contacto:document.getElementById('pv-con').value,
        tel:document.getElementById('pv-tel').value,
        email:document.getElementById('pv-email').value,
        dir:document.getElementById('pv-dir').value,
        condiciones:document.getElementById('pv-cond').value,
        obs:document.getElementById('pv-obs').value,
        web:document.getElementById('pv-web').value
      };
      if(idx>=0) DB.proveedores[idx]=obj;
      else DB.proveedores.push(obj);
      save(); renderProveedores(); return true;
    });
}

function borrarProveedor(id){
  if(!confirm('¿Eliminar este proveedor?')) return;
  DB.proveedores=DB.proveedores.filter(function(p){return p.id!==id;});
  save(); renderProveedores();
}

function modalOrdenDesdeProveedor(provId){
  var prov=DB.proveedores.find(function(p){return p.id===provId;});
  if(!prov) return;
  var compOpts=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');
  openModal('Nueva OC — '+prov.empresa,
    '<div id="orden-items-pv"><div class="fg2" style="margin-bottom:8px">'+
      '<div class="fg"><label>Componente *</label>'+
        '<select class="ord-cid" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compOpts+'</select></div>'+
      '<div class="fg"><label>Cantidad *</label><input class="ord-cant" type="number" min="1" value="1"></div>'+
    '</div></div>'+
    '<button class="btn btn-sm" onclick="addOrdenItemPv()" style="margin-bottom:10px">➕ Agregar ítem</button>'+
    '<div class="fg"><label>Observaciones</label><input id="ord-pv-obs" placeholder="Notas..."></div>',
    function(){
      var cids=[...document.querySelectorAll('.ord-cid')].map(function(s){return parseInt(s.value);});
      var cants=[...document.querySelectorAll('.ord-cant')].map(function(i){return parseFloat(i.value)||0;});
      var items=cids.map(function(cid,i){return {cid:cid,cant:cants[i]};}).filter(function(x){return x.cid&&x.cant>0;});
      if(!items.length){alert('Agregá al menos un componente.');return false;}
      DB.ordenes.unshift({
        id:DB.nid++, numero:getNumOC(), fecha:today(), estado:'Pendiente',
        items:items, proveedor:prov.empresa,
        obs:document.getElementById('ord-pv-obs').value
      });
      save(); goTo('ordenes'); return true;
    });
}

function addOrdenItemPv(){
  var cont=document.getElementById('orden-items-pv');
  var compOpts=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');
  var div=document.createElement('div');
  div.className='fg2'; div.style.marginBottom='8px';
  div.innerHTML='<div class="fg"><label>Componente *</label>'+
    '<select class="ord-cid" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
    '<option value="">— seleccionar —</option>'+compOpts+'</select></div>'+
    '<div class="fg"><label>Cantidad *</label><input class="ord-cant" type="number" min="1" value="1"></div>';
  cont.appendChild(div);
}

function pdfProveedores(){
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var rows='';
  DB.proveedores.forEach(function(p){
    rows+='<tr><td><strong>'+p.empresa+'</strong></td><td>'+(p.rubro||'—')+'</td><td>'+(p.contacto||'—')+'</td>'+
      '<td>'+(p.tel||'—')+'</td><td>'+(p.email||'—')+'</td><td>'+(p.condiciones||'—')+'</td></tr>';
  });
  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:24px;font-size:12px}'+
    'h1{font-size:16px;color:#B71C1C;margin-bottom:4px}p{color:#666;font-size:11px;margin-bottom:16px}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:7px 10px;font-size:10px;text-align:left}'+
    'td{padding:6px 10px;border-bottom:1px solid #eee}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer}'+
    '@media print{.btn{display:none}}';
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Proveedores</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>LISTA DE PROVEEDORES</h1><p>'+empresa+' · '+today()+'</p>'+
    '<table><thead><tr><th>Empresa</th><th>Rubro</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Condiciones</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></body></html>');
  w.document.close();
}


// GESTION ECONOMICA =========================================
function renderGestion(){
  var el=document.getElementById('gestion-body');
  if(!el) return;
  var h='<div style="display:flex;justify-content:flex-end;margin-bottom:10px">'+
    '<button class="btn btn-p" onclick="modalGestion()">➕ Nueva gestión</button>'+
  '</div>';
  
  if(!DB.gestiones.length){
    h+='<div class="empty">Sin gestiones económicas registradas.</div>';
    el.innerHTML=h; return;
  }

  DB.gestiones.forEach(function(g){
    var pres=DB.presupuestos.find(function(p){return p.id===g.presId;});
    var cli=pres?g.clienteNombre||pres.nombre:'—';
    var saldo=g.montoSistema-(g.adelanto||0)-( g.pagos?g.pagos.reduce(function(a,p){return a+(parseFloat(p.monto)||0);},0):0);
    var tc=(DB.config&&DB.config.tipoCambio)||1;
    h+='<div class="card" style="margin-bottom:12px">'+
      '<div class="ch">'+
        '<div class="ct">'+cli+' — '+(pres?'Zpro '+(pres.modelo||''):'')+'</div>'+
        '<div style="display:flex;gap:6px">'+
          '<button class="btn btn-sm" onclick="editarGestion('+g.id+')">✏️</button>'+
          '<button class="btn btn-sm btn-p" onclick="pdfGestion('+g.id+')">📄 PDF</button>'+
          '<button class="btn btn-sm" style="color:var(--red)" onclick="borrarGestion('+g.id+')">🗑️</button>'+
        '</div>'+
      '</div>'+
      '<div class="card-body">'+
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">'+
          '<div class="stat"><div class="stat-n">$'+Math.round(g.montoSistema||0).toLocaleString('es-AR')+'</div><div class="stat-l">Monto total</div></div>'+
          '<div class="stat"><div class="stat-n green">$'+Math.round(g.adelanto||0).toLocaleString('es-AR')+'</div><div class="stat-l">Adelanto</div></div>'+
          '<div class="stat"><div class="stat-n '+(saldo>0?'amber':'green')+'">$'+Math.round(saldo).toLocaleString('es-AR')+'</div><div class="stat-l">Saldo pendiente</div></div>'+
          '<div class="stat"><div class="stat-n">'+(g.fechaEntregaReal||g.fechaEntregaProm||'—')+'</div><div class="stat-l">Entrega</div></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text2);margin-bottom:8px">'+
          '<div>Forma de pago: <strong>'+(g.formaPago||'—')+'</strong></div>'+
          '<div>Entrega prometida: <strong>'+(g.fechaEntregaProm||'—')+'</strong></div>'+
          '<div>Entrega real: <strong>'+(g.fechaEntregaReal||'—')+'</strong></div>'+
          '<div>Adelanto fecha: <strong>'+(g.adelantoFecha||'—')+'</strong></div>'+
        '</div>'+
        (g.pagos&&g.pagos.length?
          '<div class="sectitle" style="margin-bottom:6px">Pagos de saldo</div>'+
          '<table style="width:100%;border-collapse:collapse">'+
            '<thead><tr style="background:var(--surface2)"><th style="padding:5px 8px;font-size:10px">Fecha</th><th style="padding:5px 8px;font-size:10px;text-align:right">Monto</th><th style="padding:5px 8px;font-size:10px">Nota</th></tr></thead>'+
            '<tbody>'+g.pagos.map(function(p){
              return '<tr><td style="padding:5px 8px">'+p.fecha+'</td><td style="padding:5px 8px;text-align:right;font-weight:600">$'+Math.round(p.monto||0).toLocaleString('es-AR')+'</td><td style="padding:5px 8px;font-size:11px">'+(p.nota||'—')+'</td></tr>';
            }).join('')+'</tbody></table>'
        :'')+
      '</div>'+
    '</div>';
  });
  el.innerHTML=h;
}

function modalGestion(){
  // Get approved presupuestos
  var presOpts=DB.presupuestos.filter(function(p){return p.estado==='Aprobado';}).map(function(p){
    return '<option value="'+p.id+'">'+presNum(p)+' — '+p.nombre+'</option>';
  }).join('');
  if(!presOpts){alert('No hay presupuestos aprobados. Aprobá un presupuesto primero.');return;}
  
  openModal('Nueva gestión económica',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="fg" style="grid-column:1/-1"><label>Presupuesto aprobado *</label>'+
      '<select id="gest-pres" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%" onchange="cargarDatosGestion()">'+
      '<option value="">— seleccionar —</option>'+presOpts+'</select></div>'+
    '<div class="fg"><label>Monto del sistema ($)</label><input id="gest-monto" type="number" min="0" value="0"></div>'+
    '<div class="fg"><label>Forma de pago</label><input id="gest-fp" value=""></div>'+
    '<div class="fg"><label>Entrega prometida</label><input id="gest-eprom" type="date" value="'+today()+'"></div>'+
    '<div class="fg"><label>Entrega real</label><input id="gest-ereal" type="date" value=""></div>'+
    '<div class="fg"><label>Fecha del adelanto</label><input id="gest-afecha" type="date" value="'+today()+'"></div>'+
    '<div class="fg"><label>Monto del adelanto ($)</label><input id="gest-amonto" type="number" min="0" value="0"></div>'+
    '</div>',
    function(){
      var presId=parseInt(document.getElementById('gest-pres').value);
      if(!presId){alert('Seleccioná un presupuesto.');return false;}
      var pres=DB.presupuestos.find(function(p){return p.id===presId;});
      DB.gestiones.unshift({
        id:DB.nid++,
        presId:presId,
        clienteNombre:pres?pres.nombre:'',
        montoSistema:parseFloat(document.getElementById('gest-monto').value)||0,
        formaPago:document.getElementById('gest-fp').value,
        fechaEntregaProm:document.getElementById('gest-eprom').value,
        fechaEntregaReal:document.getElementById('gest-ereal').value,
        adelantoFecha:document.getElementById('gest-afecha').value,
        adelanto:parseFloat(document.getElementById('gest-amonto').value)||0,
        pagos:[]
      });
      save(); renderGestion(); return true;
    });
}

function cargarDatosGestion(){
  var presId=parseInt(document.getElementById('gest-pres').value);
  if(!presId) return;
  var p=DB.presupuestos.find(function(x){return x.id===presId;});
  if(!p) return;
  var total=calcTotal(p);
  document.getElementById('gest-monto').value=Math.round(total);
  document.getElementById('gest-fp').value=p.formaPago||'';
}

function editarGestion(id){
  var g=DB.gestiones.find(function(x){return x.id===id;});
  if(!g) return;
  openModal('Gestión — '+g.clienteNombre,
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="fg"><label>Monto del sistema ($)</label><input id="eg-monto" type="number" value="'+(g.montoSistema||0)+'"></div>'+
    '<div class="fg"><label>Forma de pago</label><input id="eg-fp" value="'+(g.formaPago||'')+'"></div>'+
    '<div class="fg"><label>Entrega prometida</label><input id="eg-eprom" type="date" value="'+(g.fechaEntregaProm||'')+'"></div>'+
    '<div class="fg"><label>Entrega real</label><input id="eg-ereal" type="date" value="'+(g.fechaEntregaReal||'')+'"></div>'+
    '<div class="fg"><label>Fecha del adelanto</label><input id="eg-afecha" type="date" value="'+(g.adelantoFecha||'')+'"></div>'+
    '<div class="fg"><label>Monto del adelanto ($)</label><input id="eg-amonto" type="number" value="'+(g.adelanto||0)+'"></div>'+
    '</div>'+
    '<hr class="div"><div class="sectitle">Registrar pago de saldo</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'+
    '<div class="fg"><label>Fecha</label><input id="eg-pfecha" type="date" value="'+today()+'"></div>'+
    '<div class="fg"><label>Monto ($)</label><input id="eg-pmonto" type="number" min="0" value="0"></div>'+
    '<div class="fg"><label>Nota</label><input id="eg-pnota" placeholder="Ej: Transferencia..."></div>'+
    '</div>',
    function(){
      g.montoSistema=parseFloat(document.getElementById('eg-monto').value)||0;
      g.formaPago=document.getElementById('eg-fp').value;
      g.fechaEntregaProm=document.getElementById('eg-eprom').value;
      g.fechaEntregaReal=document.getElementById('eg-ereal').value;
      g.adelantoFecha=document.getElementById('eg-afecha').value;
      g.adelanto=parseFloat(document.getElementById('eg-amonto').value)||0;
      var pmonto=parseFloat(document.getElementById('eg-pmonto').value)||0;
      if(pmonto>0){
        if(!g.pagos) g.pagos=[];
        g.pagos.push({fecha:document.getElementById('eg-pfecha').value,monto:pmonto,nota:document.getElementById('eg-pnota').value});
      }
      save(); renderGestion(); return true;
    });
}

function borrarGestion(id){
  if(!confirm('¿Eliminar esta gestión económica?')) return;
  DB.gestiones=DB.gestiones.filter(function(x){return x.id!==id;});
  save(); renderGestion();
}

function pdfGestion(id){
  var g=DB.gestiones.find(function(x){return x.id===id;});
  if(!g) return;
  var pres=DB.presupuestos.find(function(p){return p.id===g.presId;});
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var saldo=g.montoSistema-(g.adelanto||0)-(g.pagos?g.pagos.reduce(function(a,p){return a+(parseFloat(p.monto)||0);},0):0);
  var tc=(DB.config&&DB.config.tipoCambio)||1;

  var pagosRows=g.pagos&&g.pagos.length?g.pagos.map(function(p){
    return '<tr><td>'+p.fecha+'</td><td style="text-align:right">$'+Math.round(p.monto||0).toLocaleString('es-AR')+'</td><td>'+(p.nota||'—')+'</td></tr>';
  }).join(''):'<tr><td colspan="3" style="color:#999;font-style:italic">Sin pagos de saldo registrados</td></tr>';

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:24px;font-size:12px}'+
    'h1{font-size:16px;color:#B71C1C;margin-bottom:2px}h2{font-size:13px;font-weight:600;color:#444;margin:16px 0 8px}'+
    '.meta{font-size:11px;color:#666;margin-bottom:16px}'+
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}'+
    '.box{background:#f8f8f8;border-radius:6px;padding:9px 12px}'+
    '.box .l{font-size:9px;text-transform:uppercase;color:#999;font-weight:700;margin-bottom:2px}'+
    '.box .v{font-size:14px;font-weight:700}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:6px 10px;font-size:10px;text-align:left}'+
    'td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}'+
    '.total{background:#B71C1C;color:#fff;padding:10px 16px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;margin-top:16px}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer}'+
    '@media print{.btn{display:none}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Gestión — '+g.clienteNombre+'</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>GESTIÓN ECONÓMICA</h1>'+
    '<div class="meta">'+empresa+' · '+(pres?presNum(pres)+' — Zpro '+(pres.modelo||''):'')+'</div>'+
    '<h2>Datos del cliente</h2>'+
    '<div class="grid">'+
      '<div class="box"><div class="l">Cliente</div><div class="v">'+g.clienteNombre+'</div></div>'+
      '<div class="box"><div class="l">Forma de pago pactada</div><div class="v" style="font-size:12px">'+(g.formaPago||'—')+'</div></div>'+
      '<div class="box"><div class="l">Entrega prometida</div><div class="v">'+(g.fechaEntregaProm||'—')+'</div></div>'+
      '<div class="box"><div class="l">Entrega real</div><div class="v">'+(g.fechaEntregaReal||'Pendiente')+'</div></div>'+
    '</div>'+
    '<h2>Estado económico</h2>'+
    '<div class="grid">'+
      '<div class="box"><div class="l">Monto del sistema</div><div class="v">$'+Math.round(g.montoSistema||0).toLocaleString('es-AR')+'</div></div>'+
      '<div class="box"><div class="l">Adelanto recibido ('+( g.adelantoFecha||'')+')</div><div class="v" style="color:green">$'+Math.round(g.adelanto||0).toLocaleString('es-AR')+'</div></div>'+
    '</div>'+
    '<h2>Pagos de saldo</h2>'+
    '<table><thead><tr><th>Fecha</th><th style="text-align:right">Monto</th><th>Detalle</th></tr></thead><tbody>'+pagosRows+'</tbody></table>'+
    '<div class="total">'+
      '<span>SALDO PENDIENTE</span>'+
      '<span style="font-size:18px;font-weight:700">$'+Math.round(saldo).toLocaleString('es-AR')+
      (tc>1?' / U$S '+(saldo/tc).toFixed(0):'')+
      '</span>'+
    '</div>'+
    '</body></html>');
  w.document.close();
}


// MOVIMIENTO DE FONDOS =====================================
const RUBROS_ING = ['Anticipos por ventas','Cancelaciones por ventas','Venta de partes y repuestos',
  'M.O. servicio de mantenimiento','M.O. actualizaciones','M.O. modificaciones de instalacion','Otros'];
const RUBROS_EGR = ['Compra de materiales','Gastos de movilidad','Reposicion de stock','Fletes y envios','Otros'];

function renderFondos(){
  var el = document.getElementById('fondos-body');
  if(!el) return;
  var tc = (DB.config&&DB.config.tipoCambio)||1;

  var hoy = today();
  var primerDiaMes = hoy.slice(0,7)+'-01';
  var h = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
      '<select id="ff-tipo" onchange="renderFondos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
        '<option value="">Todos</option><option>Ingreso</option><option>Egreso</option>'+
      '</select>'+
      '<select id="ff-rubro" onchange="renderFondos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
        '<option value="">Todos los rubros</option>'+
        RUBROS_ING.map(function(r){return '<option>'+r+'</option>';}).join('')+
        RUBROS_EGR.map(function(r){return '<option>'+r+'</option>';}).join('')+
      '</select>'+
      '<label style="font-size:11px;color:var(--text2)">Desde</label>'+
      '<input id="ff-desde" type="date" value="'+(document.getElementById('ff-desde')?document.getElementById('ff-desde').value:primerDiaMes)+'" onchange="renderFondos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
      '<label style="font-size:11px;color:var(--text2)">Hasta</label>'+
      '<input id="ff-hasta" type="date" value="'+(document.getElementById('ff-hasta')?document.getElementById('ff-hasta').value:hoy)+'" onchange="renderFondos()" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;background:var(--surface)">'+
      '<button class="btn btn-sm" onclick="limpiarFiltrosFondos()">✕ Limpiar</button>'+
    '</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="btn btn-sm" onclick="pdfFondos()">🖨️ PDF</button>'+
      '<button class="btn btn-p" onclick="modalFondo()">➕ Nuevo</button>'+
    '</div>'+
  '</div>';

  var ftipo = document.getElementById('ff-tipo')?document.getElementById('ff-tipo').value:'';
  var frubro = document.getElementById('ff-rubro')?document.getElementById('ff-rubro').value:'';
  var fdesde = document.getElementById('ff-desde')?document.getElementById('ff-desde').value:'';
  var fhasta = document.getElementById('ff-hasta')?document.getElementById('ff-hasta').value:'';

  var lista = (DB.fondos||[]).filter(function(f){
    return (!ftipo||f.tipo===ftipo) &&
           (!frubro||f.rubro===frubro) &&
           (!fdesde||f.fecha>=fdesde) &&
           (!fhasta||f.fecha<=fhasta);
  }).sort(function(a,b){ return a.fecha > b.fecha ? -1 : 1; });

  // Totals
  var totalIng = lista.filter(function(f){return f.tipo==='Ingreso';}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);
  var totalEgr = lista.filter(function(f){return f.tipo==='Egreso';}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);
  var saldo = totalIng - totalEgr;

  var meta = (DB.config&&DB.config.metaMensual)||0;
  var mesActual = today().slice(0,7);
  var facMes = (DB.fondos||[]).filter(function(f){return f.tipo==='Ingreso'&&f.fecha&&f.fecha.slice(0,7)===mesActual;}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);

  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">'+
    '<div class="stat"><div class="stat-n green">$'+Math.round(totalIng).toLocaleString('es-AR')+'</div><div class="stat-l">Total ingresos</div></div>'+
    '<div class="stat"><div class="stat-n red">$'+Math.round(totalEgr).toLocaleString('es-AR')+'</div><div class="stat-l">Total egresos</div></div>'+
    '<div class="stat"><div class="stat-n '+(saldo>=0?'green':'red')+'">$'+Math.round(saldo).toLocaleString('es-AR')+'</div><div class="stat-l">Saldo</div></div>'+
  '</div>';

  if(!lista.length){
    h += '<div class="empty">Sin movimientos registrados.</div>';
    el.innerHTML = h; return;
  }

  h += '<table><thead><tr>'+
    '<th style="width:90px">Fecha</th>'+
    '<th style="width:80px">Tipo</th>'+
    '<th>Rubro</th>'+
    '<th>Descripción</th>'+
    '<th>Cliente/Proveedor</th>'+
    '<th style="text-align:right">Monto $</th>'+
    '<th style="text-align:right">Monto U$S</th>'+
    '<th style="width:70px"></th>'+
  '</tr></thead><tbody>';

  lista.forEach(function(f){
    var esIng = f.tipo==='Ingreso';
    var usd = tc>1?(parseFloat(f.monto)||0)/tc:null;
    h += '<tr>'+
      '<td style="font-size:11px">'+f.fecha+'</td>'+
      '<td><span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:'+(esIng?'#1B5E20':'#B71C1C')+';color:#fff">'+f.tipo+'</span></td>'+
      '<td style="font-size:11px">'+f.rubro+'</td>'+
      '<td style="font-size:11px">'+(f.desc||'—')+'</td>'+
      '<td style="font-size:11px">'+(function(){
        if(!f.vinculo) return '—';
        if(f.vinculo.startsWith('cli:')){var c=DB.clientes.find(function(x){return x.id===parseInt(f.vinculo.slice(4));});return c?c.nombre:'—';}
        if(f.vinculo.startsWith('prov:')){var p=DB.proveedores.find(function(x){return x.id===parseInt(f.vinculo.slice(5));});return p?p.empresa:'—';}
        return '—';
      })()+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+(esIng?'var(--green)':'var(--red)')+'">$'+Math.round(parseFloat(f.monto)||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;font-size:11px;color:var(--text2)">'+(usd?'U$S '+usd.toFixed(0):'—')+'</td>'+
      '<td style="display:flex;gap:3px">'+
        '<button class="btn btn-sm" onclick="editarFondo('+f.id+')">✏️</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="borrarFondo('+f.id+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  });
  h += '</tbody></table>';
  el.innerHTML = h;
}

function limpiarFiltrosFondos(){
  var hoy = today();
  var primerDiaMes = hoy.slice(0,7)+'-01';
  var el;
  el=document.getElementById('ff-tipo'); if(el) el.value='';
  el=document.getElementById('ff-rubro'); if(el) el.value='';
  el=document.getElementById('ff-desde'); if(el) el.value=primerDiaMes;
  el=document.getElementById('ff-hasta'); if(el) el.value=hoy;
  renderFondos();
}

function modalFondo(id){
  var f = id?DB.fondos.find(function(x){return x.id===id;}):null;
  var rubIngOpts = RUBROS_ING.map(function(r){return '<option'+(f&&f.rubro===r?' selected':'')+'>'+r+'</option>';}).join('');
  var rubEgrOpts = RUBROS_EGR.map(function(r){return '<option'+(f&&f.rubro===r?' selected':'')+'>'+r+'</option>';}).join('');
  openModal(f?'Editar movimiento':'Nuevo movimiento de fondos',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div class="fg"><label>Tipo *</label>'+
      '<select id="fo-tipo" onchange="actualizarRubrosFondo()" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
        '<option'+(f&&f.tipo==='Ingreso'?' selected':'')+'>Ingreso</option>'+
        '<option'+(f&&f.tipo==='Egreso'?' selected':'')+'>Egreso</option>'+
      '</select></div>'+
    '<div class="fg"><label>Fecha *</label><input id="fo-fecha" type="date" value="'+(f?f.fecha:today())+'"></div>'+
    '<div class="fg" style="grid-column:1/-1"><label>Rubro *</label>'+
      '<select id="fo-rubro" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
        '<optgroup label="Ingresos">'+rubIngOpts+'</optgroup>'+
        '<optgroup label="Egresos">'+rubEgrOpts+'</optgroup>'+
      '</select></div>'+
    '<div class="fg"><label>Monto ($) *</label><input id="fo-monto" type="number" min="0" value="'+(f?f.monto:0)+'"></div>'+
    '<div class="fg"><label>Descripción</label><input id="fo-desc" value="'+(f?f.desc||'':'')+'" placeholder="Detalle opcional"></div>'+
    '<div class="fg" style="grid-column:1/-1"><label>Cliente / Proveedor</label>'+
      '<select id="fo-vinculo" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
        '<option value="">— sin vincular —</option>'+
        '<optgroup label="Clientes">'+DB.clientes.filter(function(c){return c.estado==='Activo';}).map(function(c){return '<option value="cli:'+c.id+'"'+(f&&f.vinculo==='cli:'+c.id?' selected':'')+'>'+c.nombre+'</option>';}).join('')+'</optgroup>'+
        '<optgroup label="Proveedores">'+DB.proveedores.map(function(p){return '<option value="prov:'+p.id+'"'+(f&&f.vinculo==='prov:'+p.id?' selected':'')+'>'+p.empresa+'</option>';}).join('')+'</optgroup>'+
      '</select></div>'+
    '</div>',
    function(){
      var tipo=document.getElementById('fo-tipo').value;
      var monto=parseFloat(document.getElementById('fo-monto').value)||0;
      if(!monto){alert('Ingresá un monto.');return false;}
      var obj={
        id:f?f.id:DB.nid++,
        tipo:tipo,
        fecha:document.getElementById('fo-fecha').value,
        rubro:document.getElementById('fo-rubro').value,
        monto:monto,
        desc:document.getElementById('fo-desc').value,
        vinculo:document.getElementById('fo-vinculo').value
      };
      if(f){ var idx=DB.fondos.findIndex(function(x){return x.id===f.id;}); DB.fondos[idx]=obj; }
      else DB.fondos.unshift(obj);
      save(); renderFondos(); return true;
    });
}

function actualizarRubrosFondo(){
  var tipo=document.getElementById('fo-tipo').value;
  var sel=document.getElementById('fo-rubro');
  if(!sel) return;
  var rubros=tipo==='Ingreso'?RUBROS_ING:RUBROS_EGR;
  sel.innerHTML='<optgroup label="'+tipo+'s">'+rubros.map(function(r){return '<option>'+r+'</option>';}).join('')+'</optgroup>';
}

function editarFondo(id){ modalFondo(id); }

function borrarFondo(id){
  if(!confirm('¿Eliminar este movimiento?')) return;
  DB.fondos=DB.fondos.filter(function(x){return x.id!==id;});
  save(); renderFondos();
}

function pdfFondos(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var lista=(DB.fondos||[]).slice().sort(function(a,b){return a.fecha>b.fecha?-1:1;});
  var totalIng=lista.filter(function(f){return f.tipo==='Ingreso';}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);
  var totalEgr=lista.filter(function(f){return f.tipo==='Egreso';}).reduce(function(a,f){return a+(parseFloat(f.monto)||0);},0);
  var saldo=totalIng-totalEgr;

  var rows=lista.map(function(f){
    var esIng=f.tipo==='Ingreso';
    var usd=tc>1?(parseFloat(f.monto)||0)/tc:null;
    return '<tr>'+
      '<td>'+f.fecha+'</td>'+
      '<td><strong style="color:'+(esIng?'green':'#B71C1C')+'">'+f.tipo+'</strong></td>'+
      '<td>'+f.rubro+'</td>'+
      '<td>'+(f.desc||'—')+'</td>'+
      '<td>'+(function(){
        if(!f.vinculo) return '—';
        if(f.vinculo.startsWith('cli:')){var c=DB.clientes.find(function(x){return x.id===parseInt(f.vinculo.slice(4));});return c?c.nombre:'—';}
        if(f.vinculo.startsWith('prov:')){var p=DB.proveedores.find(function(x){return x.id===parseInt(f.vinculo.slice(5));});return p?p.empresa:'—';}
        return '—';
      })()+'</td>'+
      '<td style="text-align:right;color:'+(esIng?'green':'#B71C1C')+'">$'+Math.round(parseFloat(f.monto)||0).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;color:#666">'+(usd?'U$S '+usd.toFixed(0):'—')+'</td>'+
    '</tr>';
  }).join('');

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:24px;font-size:11px}'+
    'h1{font-size:15px;color:#B71C1C;margin-bottom:2px}.meta{color:#666;font-size:10px;margin-bottom:14px}'+
    '.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}'+
    '.stat{background:#f5f5f5;border-radius:5px;padding:9px;text-align:center}'+
    '.stat .n{font-size:14px;font-weight:700;margin-bottom:2px}.stat .l{font-size:9px;color:#888;text-transform:uppercase}'+
    'table{width:100%;border-collapse:collapse}th{background:#B71C1C;color:#fff;padding:6px 9px;font-size:10px;text-align:left}'+
    'td{padding:5px 9px;border-bottom:1px solid #eee}'+
    'tfoot td{background:#222;color:#fff;font-weight:700;padding:7px 9px}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer}'+
    '@media print{.btn{display:none}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Movimiento de fondos</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>MOVIMIENTO DE FONDOS</h1>'+
    '<div class="meta">'+empresa+' · '+today()+'</div>'+
    '<div class="stats">'+
      '<div class="stat"><div class="n" style="color:green">$'+Math.round(totalIng).toLocaleString('es-AR')+'</div><div class="l">Total ingresos</div></div>'+
      '<div class="stat"><div class="n" style="color:#B71C1C">$'+Math.round(totalEgr).toLocaleString('es-AR')+'</div><div class="l">Total egresos</div></div>'+
      '<div class="stat"><div class="n" style="color:'+(saldo>=0?'green':'#B71C1C')+'">$'+Math.round(saldo).toLocaleString('es-AR')+'</div><div class="l">Saldo</div></div>'+
    '</div>'+
    '<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Rubro</th><th>Descripción</th><th>Cliente/Proveedor</th><th style="text-align:right">Monto $</th><th style="text-align:right">Monto U$S</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr><td colspan="4">TOTALES</td>'+
      '<td style="text-align:right">Ing: $'+Math.round(totalIng).toLocaleString('es-AR')+' / Egr: $'+Math.round(totalEgr).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">Saldo: $'+Math.round(saldo).toLocaleString('es-AR')+'</td>'+
    '</tr></tfoot></table></body></html>');
  w.document.close();
}


// BUSQUEDA GLOBAL ==========================================
function busquedaGlobal(q){
  if(!q||q.length<2) {
    document.getElementById('search-results').innerHTML='';
    document.getElementById('search-results').style.display='none';
    return;
  }
  var ql = q.toLowerCase();
  var results = [];

  // Clientes
  DB.clientes.forEach(function(c){
    if((c.nombre+c.lote+c.barrio+c.tel+c.email+(c.mac||'')).toLowerCase().includes(ql)){
      results.push({tipo:'Cliente',icon:'👤',label:c.nombre,sub:c.lote+(c.barrio?' · '+c.barrio:''),action:"goTo('clientes');setTimeout(function(){verCliente("+c.id+")},200)"});
    }
  });

  // Presupuestos
  DB.presupuestos.forEach(function(p){
    if((p.nombre+(p.dir||'')+(p.tel||'')+(p.email||'')).toLowerCase().includes(ql)){
      results.push({tipo:'Presupuesto',icon:'📄',label:presNum(p)+' — '+p.nombre,sub:p.estado+' · '+p.modelo,action:"abrirEditorPres("+p.id+")"});
    }
  });

  // Proveedores
  DB.proveedores.forEach(function(p){
    if((p.empresa+(p.contacto||'')+(p.email||'')+(p.rubro||'')).toLowerCase().includes(ql)){
      results.push({tipo:'Proveedor',icon:'🏭',label:p.empresa,sub:(p.rubro||'')+(p.contacto?' · '+p.contacto:''),action:"goTo('proveedores')"});
    }
  });

  // Componentes
  DB.componentes.forEach(function(c){
    if((c.codigo+c.desc+(c.proveedor||'')).toLowerCase().includes(ql)){
      results.push({tipo:'Componente',icon:'📦',label:c.codigo+' — '+c.desc,sub:(c.categoria||'')+(c.ubicacion?' · '+c.ubicacion:''),action:"goTo('catalogo')"});
    }
  });

  var el = document.getElementById('search-results');
  if(!results.length){
    el.innerHTML='<div style="padding:10px 14px;color:var(--text2);font-size:12px">Sin resultados para "'+q+'"</div>';
  } else {
    el.innerHTML = results.slice(0,8).map(function(r,i){
      return '<div id="sr'+i+'" style="padding:8px 14px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">'+
        '<span style="font-size:16px">'+r.icon+'</span>'+
        '<div><div style="font-size:12px;font-weight:600">'+r.label+'</div>'+
        '<div style="font-size:10px;color:var(--text2)">'+r.tipo+' · '+r.sub+'</div></div>'+
      '</div>';
    }).join('');
    results.slice(0,8).forEach(function(r,i){
      var d=document.getElementById('sr'+i);
      if(d){ (function(act){d.onclick=function(){eval(act);cerrarBusqueda();};})(r.action); }
    });
  }
  el.style.display='block';
}

function cerrarBusqueda(){
  var el=document.getElementById('search-results');
  if(el){el.innerHTML='';el.style.display='none';}
  var inp=document.getElementById('global-search');
  if(inp) inp.value='';
}


function reporteStockPrecios(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var empresa=(DB.config&&DB.config.empresa)||'Viking Security Systems';
  var list=DB.componentes.slice().sort(function(a,b){return (a.desc||'').localeCompare(b.desc||'');});

  var totalCosto=0, totalVenta=0;
  var rows=list.map(function(c){
    var qty=stockActual(c.id);
    var costo=parseFloat(c.costo||c.precio)||0;
    var venta=parseFloat(c.venta)||0;
    var subtotalCosto=qty*costo;
    var subtotalVenta=qty*venta;
    totalCosto+=subtotalCosto;
    totalVenta+=subtotalVenta;
    var critico=qty<=(parseFloat(c.min)||0);
    return '<tr style="'+(critico?'background:#FFF3E0':'')+'">'+
      '<td>'+c.codigo+'</td>'+
      '<td>'+c.desc+'</td>'+
      '<td>'+(c.categoria||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+(critico?'#B71C1C':'#222')+'">'+qty+'</td>'+
      '<td style="text-align:right">$'+Math.round(costo).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;color:#666">'+(tc>1?'U$S '+(costo/tc).toFixed(2):'—')+'</td>'+
      '<td style="text-align:right">$'+Math.round(venta).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;color:#666">'+(tc>1?'U$S '+(venta/tc).toFixed(2):'—')+'</td>'+
      '<td style="text-align:right">$'+Math.round(subtotalCosto).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right">$'+Math.round(subtotalVenta).toLocaleString('es-AR')+'</td>'+
    '</tr>';
  }).join('');

  var margen=totalCosto>0?((totalVenta-totalCosto)/totalCosto*100).toFixed(1):0;

  var css='*{box-sizing:border-box;margin:0;padding:0}body{font-family:Segoe UI,Arial,sans-serif;padding:20px;font-size:11px}'+
    'h1{font-size:15px;color:#B71C1C;margin-bottom:2px}.meta{color:#666;font-size:10px;margin-bottom:12px}'+
    '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}'+
    '.stat{background:#f5f5f5;border-radius:5px;padding:9px;text-align:center}'+
    '.stat .n{font-size:13px;font-weight:700;margin-bottom:2px}.stat .l{font-size:9px;color:#888;text-transform:uppercase}'+
    'table{width:100%;border-collapse:collapse}'+
    'th{background:#B71C1C;color:#fff;padding:6px 8px;font-size:9px;text-align:left}'+
    'td{padding:5px 8px;border-bottom:1px solid #eee}'+
    'tfoot td{background:#222;color:#fff;font-weight:700;padding:7px 8px}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer}'+
    '@media print{.btn{display:none}@page{margin:10mm}}';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Stock con precios</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<h1>STOCK CON PRECIOS DE COSTO Y VENTA</h1>'+
    '<div class="meta">'+empresa+' · '+today()+(tc>1?' · TC U$S: $'+tc:'')+'</div>'+
    '<div class="stats">'+
      '<div class="stat"><div class="n">'+list.length+'</div><div class="l">Componentes</div></div>'+
      '<div class="stat"><div class="n" style="color:#B71C1C">$'+Math.round(totalCosto).toLocaleString('es-AR')+'</div><div class="l">Valor a costo</div></div>'+
      '<div class="stat"><div class="n" style="color:green">$'+Math.round(totalVenta).toLocaleString('es-AR')+'</div><div class="l">Valor a venta</div></div>'+
      '<div class="stat"><div class="n">'+margen+'%</div><div class="l">Margen promedio</div></div>'+
    '</div>'+
    '<table><thead><tr>'+
      '<th>Código</th><th>Descripción</th><th>Categoría</th>'+
      '<th style="text-align:center">Stock</th>'+
      '<th style="text-align:right">Costo $</th>'+
      '<th style="text-align:right">Costo U$S</th>'+
      '<th style="text-align:right">Venta $</th>'+
      '<th style="text-align:right">Venta U$S</th>'+
      '<th style="text-align:right">Total costo</th>'+
      '<th style="text-align:right">Total venta</th>'+
    '</tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
    '<tfoot><tr>'+
      '<td colspan="8" style="text-align:right;padding:7px 8px">TOTALES</td>'+
      '<td style="text-align:right;padding:7px 8px">$'+Math.round(totalCosto).toLocaleString('es-AR')+'</td>'+
      '<td style="text-align:right;padding:7px 8px;color:#81C784">$'+Math.round(totalVenta).toLocaleString('es-AR')+'</td>'+
    '</tr></tfoot></table>'+
    '</body></html>');
  w.document.close();
}


// ACTA DE CONFORMIDAD =====================================
function renderActa(){
  const c = gc();
  const el = document.getElementById('cont-acta');
  if(!el) return;
  const numActa = 'ACR-'+new Date().getFullYear()+'-'+String(c.id).padStart(4,'0');
  
  el.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'+
      '<div>'+
        '<div style="font-size:12px;color:var(--text2)">Acta N°: <strong>'+numActa+'</strong></div>'+
        '<div style="font-size:12px;color:var(--text2)">Cliente: <strong>'+c.nombre+'</strong></div>'+
        '<div style="font-size:12px;color:var(--text2)">Modelo: <strong>Zpro '+(c.modelo||'Base')+'</strong></div>'+
      '</div>'+
      '<button class="btn btn-p" onclick="generarPDFActa('+c.id+')">📄 Generar acta PDF</button>'+
    '</div>'+
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:12px;font-size:12px;color:var(--text2);margin-bottom:12px">'+
      'El acta de recepción y conformidad certifica que el cliente recibió el sistema instalado y funcionando correctamente. '+
      'Su firma da inicio al período de garantía.'+
    '</div>'+
    '<hr class="div">'+
    '<div class="sectitle" style="margin-bottom:10px">Archivo del acta firmada</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
      '<div class="fg" style="margin:0"><label>N° de archivo físico</label>'+
        '<input id="acta-numfisico" value="'+(c.actaNumFisico||'')+'" placeholder="Ej: ACT-2026-001" '+
        'onblur="saveActaDatos('+c.id+')"></div>'+
      '<div class="fg" style="margin:0"><label>Fecha de firma</label>'+
        '<input id="acta-fechafirma" type="date" value="'+(c.actaFechaFirma||'')+'" '+
        'onchange="saveActaDatos('+c.id+')"></div>'+
      '<div class="fg" style="grid-column:1/-1;margin:0"><label>Link al archivo en Drive / OneDrive</label>'+
        '<input id="acta-link" value="'+(c.actaLink||'')+'" placeholder="https://drive.google.com/..." '+
        'onblur="saveActaDatos('+c.id+')"></div>'+
      '<div class="fg" style="grid-column:1/-1;margin:0"><label>Observaciones del acta</label>'+
        '<input id="acta-obs" value="'+(c.actaObs||'')+'" placeholder="Ej: Firmada por propietario, copia entregada..." '+
        'onblur="saveActaDatos('+c.id+')"></div>'+
    '</div>'+
    (c.actaLink?'<div style="margin-top:10px"><a href="'+c.actaLink+'" target="_blank" class="btn btn-sm" style="color:var(--blue);border-color:var(--blue)">☁️ Abrir archivo en Drive</a></div>':'');
}

function saveActaDatos(cid){
  var c = DB.clientes.find(function(x){return x.id===cid;});
  if(!c) return;
  var g = function(id){var el=document.getElementById(id);return el?el.value:'';};
  c.actaNumFisico = g('acta-numfisico');
  c.actaFechaFirma = g('acta-fechafirma');
  c.actaLink = g('acta-link');
  c.actaObs = g('acta-obs');
  save();
}

function generarPDFActa(cid){
  const c = DB.clientes.find(function(x){return x.id===cid;});
  if(!c) return;
  const empresa = (DB.config&&DB.config.empresa)||'Viking Security Systems';
  const tel = (DB.config&&DB.config.tel)||'';
  const email = (DB.config&&DB.config.email)||'';
  const web = (DB.config&&DB.config.web)||'';
  const numActa = 'ACR-'+new Date().getFullYear()+'-'+String(c.id).padStart(4,'0');
  const fecha = today();
  const garantia = (c.equipo&&c.equipo.garantia==='Sí')?'12 meses sobre materiales y mano de obra':'Consultar condiciones';

  // Dispositivos Zigbee
  var zigbeeRows = '';
  if(c.zigbee&&c.zigbee.length){
    zigbeeRows = c.zigbee.map(function(d){
      return '<tr><td>'+d.tipo+'</td><td>'+d.nombre+'</td><td>'+(d.ubicacion||'—')+'</td></tr>';
    }).join('');
  } else {
    zigbeeRows = '<tr><td colspan="3" style="color:#999;font-style:italic">Sin dispositivos registrados</td></tr>';
  }

  var css = '*{box-sizing:border-box;margin:0;padding:0}'+
    'body{font-family:Segoe UI,Arial,sans-serif;padding:0;font-size:12px;color:#222}'+
    '.header{background:#111;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}'+
    '.header h1{font-size:16px;font-weight:700;color:#fff}'+
    '.header .sub{font-size:10px;color:#aaa;margin-top:2px}'+
    '.acta-num{font-size:20px;font-weight:700;color:#B71C1C;text-align:right}'+
    '.body{padding:20px 24px}'+
    '.section{margin-bottom:18px}'+
    '.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#B71C1C;border-bottom:2px solid #B71C1C;padding-bottom:3px;margin-bottom:10px}'+
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
    '.field{background:#f8f8f8;border-radius:4px;padding:6px 10px}'+
    '.field .l{font-size:9px;color:#999;font-weight:700;text-transform:uppercase;margin-bottom:1px}'+
    '.field .v{font-size:12px;font-weight:500}'+
    'table{width:100%;border-collapse:collapse;margin-top:4px}'+
    'th{background:#B71C1C;color:#fff;padding:6px 10px;font-size:10px;text-align:left;font-weight:700}'+
    'td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}'+
    '.declaracion{background:#FFF8E1;border:1px solid #FFD54F;border-radius:5px;padding:12px 14px;font-size:11px;line-height:1.6;margin-bottom:18px}'+
    '.firmas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:10px}'+
    '.firma-box{border-top:2px solid #222;padding-top:8px}'+
    '.firma-label{font-size:10px;color:#666;margin-bottom:4px;font-weight:700;text-transform:uppercase}'+
    '.firma-line{font-size:11px;color:#444;margin-bottom:3px}'+
    '.footer{background:#f5f5f5;border-top:3px solid #B71C1C;padding:10px 24px;font-size:9px;color:#888;display:flex;justify-content:space-between}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:11px}'+
    '@media print{.btn{display:none}@page{margin:0}}';

  var body =
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<div class="header">'+
      '<div><div class="sub">ACTA DE RECEPCIÓN Y CONFORMIDAD</div><h1>'+empresa.toUpperCase()+'</h1></div>'+
      '<div class="acta-num">'+numActa+'<div style="font-size:11px;font-weight:400;color:#aaa;text-align:right">Fecha: '+fecha+'</div></div>'+
    '</div>'+
    '<div class="body">'+

    '<div class="section">'+
      '<div class="section-title">Datos del cliente</div>'+
      '<div class="grid">'+
        '<div class="field"><div class="l">Nombre</div><div class="v">'+c.nombre+'</div></div>'+
        '<div class="field"><div class="l">Domicilio</div><div class="v">'+(c.lote||'—')+(c.barrio?', '+c.barrio:'')+'</div></div>'+
        '<div class="field"><div class="l">Teléfono</div><div class="v">'+(c.tel||'—')+'</div></div>'+
        '<div class="field"><div class="l">Email</div><div class="v">'+(c.email||'—')+'</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="section">'+
      '<div class="section-title">Sistema instalado</div>'+
      '<div class="grid">'+
        '<div class="field"><div class="l">Modelo</div><div class="v">Zpro '+(c.modelo||'Base')+'</div></div>'+
        '<div class="field"><div class="l">Versión firmware</div><div class="v">'+(c.version||'—')+'</div></div>'+
        '<div class="field"><div class="l">N° de serie</div><div class="v">'+(c.equipo&&c.equipo.esp_serie||'—')+'</div></div>'+
        '<div class="field"><div class="l">Fecha de instalación</div><div class="v">'+(c.fecha||fecha)+'</div></div>'+
        '<div class="field"><div class="l">Técnico instalador</div><div class="v">___________________________</div></div>'+
        '<div class="field"><div class="l">Garantía</div><div class="v">'+garantia+'</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="section">'+
      '<div class="section-title">Dispositivos instalados</div>'+
      '<table><thead><tr><th>Tipo</th><th>Nombre / Ubicación</th><th>Sector</th></tr></thead>'+
      '<tbody>'+zigbeeRows+'</tbody></table>'+
    '</div>'+

    '<div class="declaracion">'+
      '<strong>DECLARACIÓN DE CONFORMIDAD</strong><br><br>'+
      'El/la Sr./Sra. <strong>'+c.nombre+'</strong>, en carácter de titular del inmueble ubicado en '+
      (c.lote||'el domicilio indicado')+(c.barrio?', '+c.barrio:'')+', declara haber recibido el sistema de seguridad '+
      'Zpro '+(c.modelo||'Base')+' instalado y en correcto funcionamiento, habiendo verificado personalmente '+
      'la operación de todos los dispositivos listados y recibido la capacitación necesaria para su uso.<br><br>'+
      'A partir de la fecha de firma del presente documento comienza a regir el período de <strong>garantía de '+garantia+'</strong>.'+
    '</div>'+

    '<div class="section">'+
      '<div class="section-title">Firmas</div>'+
      '<div class="firmas">'+
        '<div class="firma-box">'+
          '<div class="firma-label">Cliente</div>'+
          '<div style="height:50px"></div>'+
          '<div class="firma-line">Nombre: '+c.nombre+'</div>'+
          '<div class="firma-line">DNI: ___________________________</div>'+
          '<div class="firma-line">Fecha: '+fecha+'</div>'+
        '</div>'+
        '<div class="firma-box">'+
          '<div class="firma-label">'+empresa+'</div>'+
          '<div style="height:50px"></div>'+
          '<div class="firma-line">Técnico: ___________________________</div>'+
          '<div class="firma-line">Fecha: '+fecha+'</div>'+
        '</div>'+
      '</div>'+
    '</div>'+

    '</div>'+
    '<div class="footer">'+
      '<div>'+empresa+(tel?' · '+tel:'')+(email?' · '+email:'')+(web?' · '+web:'')+'</div>'+
      '<div>'+numActa+' · Sistema Administrativo Viking Security Systems</div>'+
    '</div>';

  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Acta '+numActa+'</title><style>'+css+'</style></head><body>'+body+'</body></html>');
  w.document.close();
}


function reporteOCporProveedor(){
  var tc=(DB.config&&DB.config.tipoCambio)||1;
  var provMap={};
  DB.ordenes.forEach(function(o){
    var prov=o.proveedor||'Sin proveedor';
    if(!provMap[prov]) provMap[prov]={ordenes:[],total:0};
    var total=o.items.reduce(function(a,i){
      var c=DB.componentes.find(function(x){return x.id===i.cid;})||{costo:0,precio:0};
      return a+(c.costo||c.precio||0)*i.cant;
    },0);
    provMap[prov].ordenes.push({numero:o.numero||'—',fecha:o.fecha,estado:o.estado,total:total});
    provMap[prov].total+=total;
  });

  if(!Object.keys(provMap).length){
    reporteContainer('🛒 OC por proveedor','<div class="empty">Sin órdenes de compra.</div>');
    return;
  }

  var h='';
  Object.entries(provMap).sort(function(a,b){return b[1].total-a[1].total;}).forEach(function(entry){
    var prov=entry[0], data=entry[1];
    h += '<div class="card" style="margin-bottom:10px">'+
      '<div class="ch"><div class="ct">🏭 '+prov+'</div>'+
      '<div style="font-size:12px;font-weight:700">$'+Math.round(data.total).toLocaleString('es-AR')+'</div></div>'+
      '<div class="card-body">'+
      '<table style="width:100%;border-collapse:collapse">'+
      '<thead><tr style="background:var(--surface2)"><th style="padding:5px 10px;font-size:10px">N° OC</th><th style="padding:5px 10px;font-size:10px">Fecha</th><th style="padding:5px 10px;font-size:10px">Estado</th><th style="padding:5px 10px;font-size:10px;text-align:right">Total</th></tr></thead>'+
      '<tbody>'+data.ordenes.map(function(o){
        return '<tr style="border-bottom:1px solid var(--border)">'+
          '<td style="padding:5px 10px;font-family:monospace">'+o.numero+'</td>'+
          '<td style="padding:5px 10px;font-size:11px">'+o.fecha+'</td>'+
          '<td style="padding:5px 10px"><span class="pill p-b">'+o.estado+'</span></td>'+
          '<td style="padding:5px 10px;text-align:right;font-weight:700">$'+Math.round(o.total).toLocaleString('es-AR')+'</td>'+
        '</tr>';
      }).join('')+'</tbody></table>'+
      '</div></div>';
  });

  reporteContainer('🛒 OC por proveedor', h);
}



// =======================================================
// FABRICACION
// =======================================================

var ETAPAS_FAB = [
  { id:'mecanizado', label:'Fase 1 — Mecanizado', ops:[
    'Apertura de unidad en sistema y generación del N° de serie',
    'Estampado del N/S en el fondo interno de la caja',
    'Perforación con fresa escalonada para prensaestopas',
    'Atornillado del transformador en la base del gabinete'
  ]},
  { id:'montaje', label:'Fase 2 — Montaje electrónico', ops:[
    'Soldadura de chicotes en salidas del transformador',
    'Crimpado de terminales Faston en cables de batería',
    'Montaje de placa ESP32-C6 sobre separadores',
    'Ruteo de líneas 220V y cables de salida (sirena y 12V aux)',
    'Verificación de margen técnico de 15cm'
  ]},
  { id:'calibracion', label:'Fase 3 — Calibración y CC', ops:[
    'Vinculación Zigbee — sensores asignados al cliente / sensores testigo',
    'Verificación de enlace Zigbee estable',
    'Protocolo QA Telegram — aprobado (ver checklist físico)'
  ]},
  { id:'embalaje', label:'Fase 4 — Embalaje', ops:[
    'Introducir batería de gel en habitáculo (sin conectar terminales)',
    'Proteger conectores Faston con capuchones o cinta',
    'Colocar kit de repuesto (fusibles) en bolsa accesoria',
    'Atornillar tapa frontal',
    'Empacar en caja de cartón con modelo visible'
  ]},
  { id:'egreso', label:'Fase 5 — Fabricación terminada', ops:[
    'Confirmar N° de serie en el sistema',
    'Vincular con ficha del cliente'
  ]}
];

var MODELO_LETRA = {Base:'B', Energy:'E', Comfort:'C', Black:'K'};

function getNumSerie(modelo, lote){
  var letra = MODELO_LETRA[modelo]||'X';
  var now = new Date();
  var aa = String(now.getFullYear()).slice(2);
  var mm = String(now.getMonth()+1).padStart(2,'0');
  var ll = String(lote).padStart(2,'0');
  var enLote = (DB.fabricacion||[]).filter(function(f){return f.lote===parseInt(lote);}).length;
  var nnn = String(enLote+1).padStart(3,'0');
  return 'VSS-'+letra+aa+mm+'-'+ll+'-'+nnn;
}

function renderFabricacion(){
  if(!DB.fabricacion) DB.fabricacion=[];
  var q=(document.getElementById('q-fab')?document.getElementById('q-fab').value||'':'').toLowerCase();
  var fest=document.getElementById('fab-estado-filter')?document.getElementById('fab-estado-filter').value:'';

  var lista=DB.fabricacion.filter(function(f){
    return (!q||(f.nserie+(f.cliente||'')+f.modelo).toLowerCase().includes(q)) &&
           (!fest||f.estado===fest);
  }).sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});

  var pendiente=(DB.fabricacion||[]).filter(function(f){return f.estado==='Pendiente';}).length;
  var enFab=(DB.fabricacion||[]).filter(function(f){return f.estado==='En fabricación';}).length;
  var term=(DB.fabricacion||[]).filter(function(f){return f.estado==='Terminado';}).length;
  var entregados=(DB.fabricacion||[]).filter(function(f){return f.estado==='Entregado';}).length;

  var el=document.getElementById('fab-stats');
  if(el) el.innerHTML=
    '<div class="stat"><div class="stat-n amber">'+pendiente+'</div><div class="stat-l">Pendientes</div></div>'+
    '<div class="stat"><div class="stat-n blue">'+enFab+'</div><div class="stat-l">En fabricación</div></div>'+
    '<div class="stat"><div class="stat-n green">'+term+'</div><div class="stat-l">Terminados</div></div>'+
    '<div class="stat"><div class="stat-n">'+entregados+'</div><div class="stat-l">Entregados</div></div>';

  var tb=document.getElementById('tbody-fab');
  if(!lista.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin órdenes de trabajo.</td></tr>';return;}

  tb.innerHTML=lista.map(function(f){
    var etapaActual=ETAPAS_FAB.find(function(e){return e.id===f.etapaActual;})||ETAPAS_FAB[0];
    var etapaIdx=ETAPAS_FAB.findIndex(function(e){return e.id===f.etapaActual;});
    var pct=f.estado==='Pendiente'?0:f.estado==='Terminado'||f.estado==='Entregado'?100:Math.round((etapaIdx/ETAPAS_FAB.length)*100);
    var estadoColor=f.estado==='Pendiente'?'p-a':f.estado==='En fabricación'?'p-b':f.estado==='Terminado'||f.estado==='Entregado'?'p-g':'p-r';
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px;font-weight:700">'+f.nserie+'</td>'+
      '<td>'+mPill(f.modelo)+'</td>'+
      '<td style="text-align:center">'+f.lote+'</td>'+
      '<td style="font-size:11px">'+(f.cliente||'Stock')+'</td>'+
      '<td>'+
        '<div style="font-size:10px;color:var(--text2);margin-bottom:2px">'+(f.estado==='Pendiente'?'No iniciado':etapaActual.label)+'</div>'+
        '<div style="background:var(--surface2);border-radius:3px;height:5px;overflow:hidden">'+
          '<div style="height:100%;background:var(--primary);width:'+pct+'%"></div>'+
        '</div>'+
      '</td>'+
      '<td><span class="pill '+estadoColor+'">'+f.estado+'</span></td>'+
      '<td style="font-size:11px">'+(f.fecha||'—')+'</td>'+
      '<td><button class="btn btn-sm btn-p" onclick="abrirOT('+f.id+')">📋 Ver</button></td>'+
    '</tr>';
  }).join('');
}

function modalNuevaOT(){
  if(!DB.fabricacion) DB.fabricacion=[];
  var presList=DB.presupuestos.filter(function(p){return p.estado==='Aprobado';});
  var loteMax=(DB.fabricacion||[]).reduce(function(a,f){return Math.max(a,f.lote||0);},0);

  openModal('Nueva orden de trabajo',
    '<div class="fg2">'+
      '<div class="fg"><label>Origen</label>'+
        '<select id="ot-origen" onchange="toggleOTCliente()" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="manual">Manual (para stock)</option>'+
          '<option value="presupuesto">Desde presupuesto aprobado</option>'+
        '</select></div>'+
      '<div class="fg" id="ot-pres-wrap" style="display:none"><label>Presupuesto / Cliente</label>'+
        '<select id="ot-presupuesto" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+
          presList.map(function(p){return '<option value="'+p.id+'">'+presNum(p)+' — '+p.nombre+'</option>';}).join('')+
        '</select></div>'+
      '<div class="fg"><label>Modelo</label>'+
        '<select id="ot-modelo" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          ['Base','Energy','Comfort','Black'].map(function(m){return '<option>'+m+'</option>';}).join('')+
        '</select></div>'+
      '<div class="fg"><label>N° de lote</label>'+
        '<input id="ot-lote" type="number" min="1" value="'+(loteMax+1)+'"></div>'+
      '<div class="fg full"><label>Observaciones</label>'+
        '<input id="ot-obs" placeholder="Observaciones..."></div>'+
    '</div>',
    function(){
      var modelo=document.getElementById('ot-modelo').value;
      var lote=parseInt(document.getElementById('ot-lote').value)||1;
      var origen=document.getElementById('ot-origen').value;
      var presId=origen==='presupuesto'?(parseInt(document.getElementById('ot-presupuesto').value)||null):null;
      var pres=presId?DB.presupuestos.find(function(p){return p.id===presId;}):null;
      var cliente=pres?pres.nombre:'';
      var nserie=getNumSerie(modelo,lote);

      // Buscar cliente dado de alta
      var clienteObj=pres?DB.clientes.find(function(c){return c.nombre===pres.nombre;}):null;

      var ot={
        id:DB.nid++,
        nserie:nserie,
        modelo:modelo,
        lote:lote,
        cliente:cliente,
        clienteId:clienteObj?clienteObj.id:null,
        presId:presId||null,
        fecha:today(),
        estado:'Pendiente',
        etapaActual:'mecanizado',
        obs:document.getElementById('ot-obs').value,
        etapas:{},
        materiales:[],
        fechaInicio:''
      };

      // Initialize etapas
      ETAPAS_FAB.forEach(function(e){
        ot.etapas[e.id]={completada:false,fecha:'',responsable:'',obs:'',ops:{}};
        e.ops.forEach(function(op){ot.etapas[e.id].ops[op]=false;});
      });

      // Set cliente estado to Programado
      if(clienteObj){
        clienteObj.estadoInstalacion='Programado';
      }

      DB.fabricacion.push(ot);
      save();
      renderFabricacion();
      alert('OT creada: '+nserie+'\nEstado: Pendiente de inicio.'+(clienteObj?'\nCliente actualizado a: Programado':''));
      return true;
    }
  );
}

function toggleOTCliente(){
  var origen=document.getElementById('ot-origen').value;
  var wrap=document.getElementById('ot-pres-wrap');
  if(wrap) wrap.style.display=origen==='presupuesto'?'':'none';
}

function iniciarFabricacion(otId){
  var f=DB.fabricacion.find(function(x){return x.id===otId;});
  if(!f) return;

  // Verificar stock vs kit
  var kit=DB.kit||[];
  var faltantes=[];
  kit.forEach(function(item){
    var disponible=stockActual(item.compId);
    if(disponible<item.cant){
      var comp=DB.componentes.find(function(c){return c.id===item.compId;})||{};
      faltantes.push({nombre:comp.desc||item.compNombre,necesita:item.cant,tiene:disponible});
    }
  });

  if(faltantes.length){
    var msg='⚠️ Stock insuficiente para los siguientes materiales:\n\n';
    faltantes.forEach(function(f){msg+='• '+f.nombre+': necesita '+f.necesita+', hay '+f.tiene+'\n';});
    msg+='\n¿Iniciás la fabricación de todas formas?';
    if(!confirm(msg)) return;
  }

  if(!confirm('¿Confirmar inicio de fabricación para '+f.nserie+'?\nSe realizará la salida de materiales del kit al stock de fábrica.')) return;

  // Salida del stock al registro de materiales en fábrica
  f.materiales=[];
  kit.forEach(function(item){
    var comp=DB.componentes.find(function(c){return c.id===item.compId;})||{};
    // Stock movement - salida
    DB.movimientos.push({
      id:DB.nid++,
      compId:item.compId,
      fecha:today(),
      tipo:'Salida',
      motivo:'Fabricación — '+f.nserie,
      ref:f.nserie,
      cant:item.cant,
      precio:parseFloat(comp.costo||comp.precio)||0
    });
    // Register in materiales en fabrica
    f.materiales.push({
      compId:item.compId,
      compCodigo:comp.codigo||'',
      compNombre:comp.desc||item.compNombre||'',
      cant:item.cant,
      devuelto:0
    });
  });

  f.estado='En fabricación';
  f.fechaInicio=today();

  // Update cliente estado
  if(f.clienteId){
    var clienteObj=DB.clientes.find(function(c){return c.id===f.clienteId;});
    if(clienteObj) clienteObj.estadoInstalacion='En fabricación';
  }

  save();
  cerrarModal();
  abrirOT(otId);
}

function abrirOT(id){
  var f=DB.fabricacion.find(function(x){return x.id===id;});
  if(!f) return;

  var esPendiente=f.estado==='Pendiente';

  // Header info
  var headerHTML=
    '<div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
      '<span style="font-family:monospace;font-weight:700;font-size:14px;color:var(--primary)">'+f.nserie+'</span>'+
      mPill(f.modelo)+
      '<span class="pill '+(f.estado==='Pendiente'?'p-a':f.estado==='En fabricación'?'p-b':'p-g')+'">'+f.estado+'</span>'+
      (f.cliente?'<span style="font-size:11px;color:var(--text2)">Cliente: '+f.cliente+'</span>':'')+
      '<span style="font-size:11px;color:var(--text2)">Lote '+f.lote+' · Creada '+f.fecha+'</span>'+
      (f.fechaInicio?'<span style="font-size:11px;color:var(--text2)">Iniciada '+f.fechaInicio+'</span>':'')+
    '</div>';

  // Boton iniciar
  var iniciarHTML='';
  if(esPendiente){
    iniciarHTML='<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:12px;text-align:center">'+
      '<div style="font-size:13px;margin-bottom:10px;color:var(--text2)">OT pendiente de inicio. Al iniciar se realizará la salida del kit del stock.</div>'+
      '<button class="btn btn-p" style="font-size:13px;padding:8px 20px" onclick="iniciarFabricacion('+id+')">▶️ Iniciar fabricación</button>'+
    '</div>';
  }

  // Materiales en fabrica
  var matHTML='';
  if(f.materiales&&f.materiales.length){
    matHTML='<div class="card" style="margin-bottom:10px">'+
      '<div class="ch"><div class="ct">📦 Materiales en fábrica — '+f.nserie+'</div>'+
      '<button class="btn btn-sm" onclick="agregarMaterialExtra('+id+')">➕ Consumo adicional</button>'+
      '<button class="btn btn-sm" onclick="devolverMaterial('+id+')">↩️ Devolver</button>'+
      '</div>'+
      '<div class="card-body">'+
      '<table style="width:100%;border-collapse:collapse">'+
      '<thead><tr style="background:var(--surface2)">'+
        '<th style="padding:5px 10px;font-size:10px">Código</th>'+
        '<th style="padding:5px 10px;font-size:10px">Componente</th>'+
        '<th style="padding:5px 10px;font-size:10px;text-align:center">Asignado</th>'+
        '<th style="padding:5px 10px;font-size:10px;text-align:center">Devuelto</th>'+
        '<th style="padding:5px 10px;font-size:10px;text-align:center">En uso</th>'+
      '</tr></thead><tbody>'+
      f.materiales.map(function(m){
        var enUso=m.cant-(m.devuelto||0);
        return '<tr style="border-bottom:1px solid var(--border)">'+
          '<td style="padding:5px 10px;font-family:monospace;font-size:11px">'+(function(){var c=DB.componentes.find(function(x){return x.id===m.compId;});return c?c.codigo:m.compCodigo||'—';})()+'</td>'+
          '<td style="padding:5px 10px;font-size:11px">'+(function(){var c=DB.componentes.find(function(x){return x.id===m.compId;});return c?c.desc:m.compNombre||'—';})()+'</td>'+
          '<td style="padding:5px 10px;text-align:center">'+m.cant+'</td>'+
          '<td style="padding:5px 10px;text-align:center;color:var(--text2)">'+(m.devuelto||0)+'</td>'+
          '<td style="padding:5px 10px;text-align:center;font-weight:700">'+enUso+'</td>'+
        '</tr>';
      }).join('')+'</tbody></table></div></div>';
  }

  // Etapas
  var etapaActualIdx=ETAPAS_FAB.findIndex(function(e){return e.id===f.etapaActual;});
  var etapasHTML=!esPendiente?ETAPAS_FAB.map(function(e,ei){
    var et=f.etapas[e.id]||{completada:false,fecha:'',responsable:'',obs:'',ops:{}};
    var esActual=e.id===f.etapaActual&&f.estado==='En fabricación';
    var completada=et.completada;
    var bloqueada=ei>etapaActualIdx&&!completada;

    var opsHTML=e.ops.map(function(op){
      var checked=et.ops[op]?'checked':'';
      var disabled=bloqueada||completada?'disabled':'';
      return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;cursor:'+(bloqueada||completada?'default':'pointer')+'">'+
        '<input type="checkbox" '+checked+' '+disabled+' onchange="toggleOpFab('+id+',\''+e.id+'\',\''+op.replace(/\'/g,"\\'")+'\')" style="margin:0">'+
        '<span style="'+(et.ops[op]?'text-decoration:line-through;color:var(--text2)':'')+'">'+op+'</span>'+
      '</label>';
    }).join('');

    var borderColor=completada?'var(--green)':esActual?'var(--primary)':'var(--border)';
    var icon=completada?'✅':esActual?'▶️':'⬜';

    return '<div class="card" style="margin-bottom:8px;border-left:3px solid '+borderColor+'">'+
      '<div class="ch">'+
        '<div class="ct" style="color:'+(completada?'var(--green)':esActual?'var(--primary)':'var(--text2)')+'">'+icon+' '+(ei+1)+'. '+e.label+'</div>'+
        (esActual?
          '<button class="btn btn-sm btn-g" onclick="completarEtapaFab('+id+',\''+e.id+'\')">✔ Completar etapa</button>'+
          (e.id==='calibracion'?'<button class="btn btn-sm" onclick="pdfChecklistQA('+id+')">🖨️ Checklist QA</button>':''):
          '')+ 
        (completada?'<span style="font-size:11px;color:var(--green)">✅ '+et.fecha+(et.responsable?' · '+et.responsable:'')+'</span>':'')+
      '</div>'+
      '<div class="card-body">'+
        (e.ops.length?opsHTML:'<span style="color:var(--text2);font-size:11px">Sin operaciones definidas.</span>')+
        (esActual?
          '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'+
            '<input id="fab-resp-'+e.id+'" placeholder="Responsable" value="'+(et.responsable||'')+'" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;flex:1;min-width:120px">'+
            '<input id="fab-obs-'+e.id+'" placeholder="Observaciones de la etapa" value="'+(et.obs||'')+'" style="padding:5px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;flex:2;min-width:180px">'+
          '</div>':'')+
      '</div></div>';
  }).join(''):'';

  openModal('OT — '+f.nserie, headerHTML+iniciarHTML+matHTML+etapasHTML, null, true);
}

function toggleOpFab(otId, etapaId, op){
  var f=DB.fabricacion.find(function(x){return x.id===otId;});
  if(!f||!f.etapas[etapaId]) return;
  f.etapas[etapaId].ops[op]=!f.etapas[etapaId].ops[op];
  save();
}

function completarEtapaFab(otId, etapaId){
  var f=DB.fabricacion.find(function(x){return x.id===otId;});
  if(!f) return;
  if(!f.etapas[etapaId]) f.etapas[etapaId]={completada:false,fecha:'',responsable:'',obs:'',ops:{}};

  var respEl=document.getElementById('fab-resp-'+etapaId);
  var obsEl=document.getElementById('fab-obs-'+etapaId);
  f.etapas[etapaId].responsable=respEl?respEl.value:'';
  f.etapas[etapaId].obs=obsEl?obsEl.value:'';
  f.etapas[etapaId].completada=true;
  f.etapas[etapaId].fecha=today();

  var etapaIdx=ETAPAS_FAB.findIndex(function(e){return e.id===etapaId;});
  if(etapaIdx<ETAPAS_FAB.length-1){
    f.etapaActual=ETAPAS_FAB[etapaIdx+1].id;
  } else {
    f.estado='Terminado';
    f.etapaActual='entrega';
    if(f.clienteId){
      var clienteObj=DB.clientes.find(function(c){return c.id===f.clienteId;});
      if(clienteObj) clienteObj.estadoInstalacion='Terminado';
    }
    // Auto-create pedido de instalacion
    if(!DB.instalaciones) DB.instalaciones=[];
    var piExist=DB.instalaciones.find(function(p){return p.otId===f.id;});
    if(!piExist){
      var piNuevo=crearPedidoInstalacion(f.id);
      if(piNuevo) alert('✅ Fabricación terminada.\nPedido de instalación creado automáticamente: '+piNuevo.numero);
    }
  }

  save();
  renderFabricacion();
  cerrarModal();
  abrirOT(otId);
}

function agregarMaterialExtra(otId){
  var f=DB.fabricacion.find(function(x){return x.id===otId;});
  if(!f) return;
  var compSel=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');

  openModal('Consumo adicional de material',
    '<div class="fg2">'+
      '<div class="fg full"><label>Componente</label>'+
        '<select id="me-comp" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compSel+
        '</select></div>'+
      '<div class="fg"><label>Cantidad</label><input id="me-cant" type="number" min="1" value="1"></div>'+
      '<div class="fg"><label>Motivo</label><input id="me-motivo" placeholder="Motivo del consumo adicional..."></div>'+
    '</div>',
    function(){
      var compId=parseInt(document.getElementById('me-comp').value)||0;
      var cant=parseFloat(document.getElementById('me-cant').value)||0;
      if(!compId||!cant){alert('Seleccioná componente y cantidad.');return false;}
      var comp=DB.componentes.find(function(c){return c.id===compId;})||{};
      // Stock salida
      DB.movimientos.push({
        id:DB.nid++, compId:compId, fecha:today(),
        tipo:'Salida', motivo:'Consumo adicional fabricación — '+f.nserie,
        ref:f.nserie, cant:cant,
        precio:parseFloat(comp.costo||comp.precio)||0
      });
      // Add to materiales
      var existing=f.materiales.find(function(m){return m.compId===compId;});
      if(existing){ existing.cant+=cant; }
      else { f.materiales.push({compId:compId,compCodigo:comp.codigo||'',compNombre:comp.desc||'',cant:cant,devuelto:0}); }
      save(); cerrarModal(); abrirOT(otId); return true;
    }
  );
}

function devolverMaterial(otId){
  var f=DB.fabricacion.find(function(x){return x.id===otId;});
  if(!f||!f.materiales||!f.materiales.length){alert('Sin materiales asignados.');return;}
  var disponibles=f.materiales.filter(function(m){return m.cant>(m.devuelto||0);});
  if(!disponibles.length){alert('No hay materiales para devolver.');return;}

  openModal('Devolver material al stock',
    '<div class="fg2">'+
      '<div class="fg full"><label>Componente</label>'+
        '<select id="dev-comp" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          disponibles.map(function(m){
            return '<option value="'+m.compId+'">'+m.compCodigo+' — '+m.compNombre+' (en uso: '+(m.cant-(m.devuelto||0))+')</option>';
          }).join('')+
        '</select></div>'+
      '<div class="fg"><label>Cantidad a devolver</label><input id="dev-cant" type="number" min="1" value="1"></div>'+
    '</div>',
    function(){
      var compId=parseInt(document.getElementById('dev-comp').value);
      var cant=parseFloat(document.getElementById('dev-cant').value)||0;
      if(!cant) return false;
      var mat=f.materiales.find(function(m){return m.compId===compId;});
      if(!mat){return false;}
      var enUso=mat.cant-(mat.devuelto||0);
      if(cant>enUso){alert('No podés devolver más de lo que está en uso ('+enUso+').');return false;}
      mat.devuelto=(mat.devuelto||0)+cant;
      DB.movimientos.push({
        id:DB.nid++, compId:compId, fecha:today(),
        tipo:'Entrada', motivo:'Devolución fabricación — '+f.nserie,
        ref:f.nserie, cant:cant, precio:0
      });
      save(); cerrarModal(); abrirOT(otId); return true;
    }
  );
}

// KIT DE FABRICACION =====================================
function renderKit(){
  if(!DB.kit) DB.kit=[];
  var ver=document.getElementById('kit-version');
  if(ver) ver.textContent='Versión '+(DB.kitVersion||1)+' · '+(DB.kitFecha||today());

  var tb=document.getElementById('tbody-kit');
  if(!DB.kit.length){tb.innerHTML='<tr><td colspan="5" class="empty">Sin materiales en el kit.</td></tr>';return;}

  var totalComp=DB.kit.length;
  tb.innerHTML=DB.kit.map(function(item,i){
    var comp=DB.componentes.find(function(c){return c.id===item.compId;})||{};
    var stock=stockActual(item.compId);
    var color=stock<item.cant?'var(--red)':stock<item.cant*2?'var(--amber)':'var(--green)';
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px">'+(comp.codigo||'—')+'</td>'+
      '<td>'+(comp.desc||item.compNombre||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700">'+item.cant+'</td>'+
      '<td>'+(comp.unidad||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+color+'">'+stock+'</td>'+
      '<td style="display:flex;gap:3px">'+
        '<button class="btn btn-sm" onclick="modalKitItem('+i+')">✏️</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarKitItem('+i+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

function modalKitItem(idx){
  var item=idx>=0?(DB.kit[idx]||{}):null;
  var compSel=DB.componentes.map(function(c){
    return '<option value="'+c.id+'"'+(item&&item.compId===c.id?' selected':'')+'>'+c.codigo+' — '+c.desc+'</option>';
  }).join('');

  openModal(idx>=0?'Editar material del kit':'Agregar material al kit',
    '<div class="fg2">'+
      '<div class="fg full"><label>Componente</label>'+
        '<select id="kit-comp" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar componente —</option>'+compSel+
        '</select></div>'+
      '<div class="fg"><label>Cantidad</label>'+
        '<input id="kit-cant" type="number" min="1" value="'+(item?item.cant:1)+'"></div>'+
    '</div>',
    function(){
      var compId=parseInt(document.getElementById('kit-comp').value)||0;
      var cant=parseFloat(document.getElementById('kit-cant').value)||0;
      if(!compId||!cant){alert('Seleccioná un componente e ingresá la cantidad.');return false;}
      var comp=DB.componentes.find(function(c){return c.id===compId;})||{};
      var newItem={compId:compId,compCodigo:comp.codigo||'',compNombre:comp.desc||'',cant:cant};
      if(idx>=0){DB.kit[idx]=newItem;}else{DB.kit.push(newItem);}
      DB.kitVersion=(parseInt(DB.kitVersion||0)+1);
      DB.kitFecha=today();
      save(); renderKit(); return true;
    }
  );
}

function eliminarKitItem(idx){
  if(!confirm('¿Eliminar este material del kit?')) return;
  DB.kit.splice(idx,1);
  DB.kitVersion=(parseInt(DB.kitVersion||0)+1);
  DB.kitFecha=today();
  save(); renderKit();
}




// =======================================================
// INSTALACIONES
// =======================================================

function getNumPI(){
  var yr = new Date().getFullYear();
  var existing = (DB.instalaciones||[]).filter(function(p){
    return p.numero && p.numero.startsWith('PI-'+yr);
  });
  var max=0;
  existing.forEach(function(p){
    var n=parseInt((p.numero||'').split('-')[2]||'0');
    if(n>max) max=n;
  });
  return 'PI-'+yr+'-'+String(max+1).padStart(4,'0');
}

function crearPedidoInstalacion(otId){
  // Called automatically when OT reaches Entrega completada
  var ot = (DB.fabricacion||[]).find(function(f){return f.id===otId;});
  if(!ot) return;

  var cliente = DB.clientes.find(function(c){return c.id===ot.clienteId;})||null;

  // Build kit from client zigbee sensors + kitinst base
  var kitItems = [];

  // 1. Kit base instalacion
  (DB.kitinst||[]).forEach(function(item){
    var comp = DB.componentes.find(function(c){return c.id===item.compId;})||{};
    kitItems.push({
      compId:item.compId,
      compCodigo:comp.codigo||'',
      compNombre:comp.desc||item.compNombre||'',
      cant:item.cant,
      unidad:comp.unidad||'',
      origen:'kit-base',
      devuelto:0
    });
  });

  // 2. Zigbee sensors from client
  if(cliente&&cliente.zigbee&&cliente.zigbee.length){
    // Group zigbee by model to count
    var zigbeeMap={};
    cliente.zigbee.forEach(function(z){
      var key=(z.marca||'')+'|'+(z.modelo||'')+'|'+(z.tipo||'');
      if(!zigbeeMap[key]) zigbeeMap[key]={tipo:z.tipo||'',marca:z.marca||'',modelo:z.modelo||'',cant:0};
      zigbeeMap[key].cant++;
    });
    Object.values(zigbeeMap).forEach(function(z){
      // Try to find in componentes
      var comp=DB.componentes.find(function(c){
        return c.desc&&c.desc.toLowerCase().includes((z.modelo||'').toLowerCase())&&(z.modelo);
      })||null;
      kitItems.push({
        compId:comp?comp.id:null,
        compCodigo:comp?comp.codigo:'',
        compNombre:z.tipo+(z.marca?' '+z.marca:'')+(z.modelo?' '+z.modelo:''),
        cant:z.cant,
        unidad:'u',
        origen:'zigbee',
        devuelto:0
      });
    });
  }

  var pi={
    id:DB.nid++,
    numero:getNumPI(),
    otId:otId,
    nserie:ot.nserie,
    modelo:ot.modelo,
    clienteId:ot.clienteId||null,
    cliente:ot.cliente||'Stock',
    direccion:cliente?(cliente.lote||'')+(cliente.barrio?' · '+cliente.barrio:''):'',
    tel:cliente?cliente.tel||'':'',
    tecnico:'',
    fechaTentativa:'',
    estado:'Pendiente',
    fecha:today(),
    kit:kitItems,
    obs:''
  };

  DB.instalaciones.push(pi);
  // Update cliente estado
  if(cliente) cliente.estadoInstalacion='Pendiente';
  save();
  return pi;
}

function renderInstalaciones(){
  if(!DB.instalaciones) DB.instalaciones=[];
  var q=(document.getElementById('q-inst')?document.getElementById('q-inst').value||'':'').toLowerCase();
  var fest=document.getElementById('inst-estado-filter')?document.getElementById('inst-estado-filter').value:'';

  var lista=DB.instalaciones.filter(function(p){
    return (!q||((p.numero||'')+(p.cliente||'')+(p.nserie||'')).toLowerCase().includes(q))&&
           (!fest||p.estado===fest);
  }).sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});

  var pendiente=(DB.instalaciones||[]).filter(function(p){return p.estado==='Pendiente';}).length;
  var enCurso=(DB.instalaciones||[]).filter(function(p){return p.estado==='En curso';}).length;
  var completado=(DB.instalaciones||[]).filter(function(p){return p.estado==='Completado';}).length;

  var el=document.getElementById('inst-stats');
  if(el) el.innerHTML=
    '<div class="stat"><div class="stat-n amber">'+pendiente+'</div><div class="stat-l">Pendientes</div></div>'+
    '<div class="stat"><div class="stat-n blue">'+enCurso+'</div><div class="stat-l">En curso</div></div>'+
    '<div class="stat"><div class="stat-n green">'+completado+'</div><div class="stat-l">Completados</div></div>'+
    '<div class="stat"><div class="stat-n">'+DB.instalaciones.length+'</div><div class="stat-l">Total</div></div>';

  var tb=document.getElementById('tbody-inst');
  if(!lista.length){tb.innerHTML='<tr><td colspan="8" class="empty">Sin pedidos de instalación.</td></tr>';return;}

  tb.innerHTML=lista.map(function(p){
    var estadoColor=p.estado==='Pendiente'?'p-a':p.estado==='En curso'?'p-b':p.estado==='Completado'?'p-g':'p-r';
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px;font-weight:700">'+p.numero+'</td>'+
      '<td style="font-family:monospace;font-size:11px">'+p.nserie+'</td>'+
      '<td style="font-size:11px"><strong>'+(p.cliente||'Stock')+'</strong>'+
        (p.direccion?'<br><span style="font-size:10px;color:var(--text2)">'+p.direccion+'</span>':'')+
      '</td>'+
      '<td>'+mPill(p.modelo)+'</td>'+
      '<td style="font-size:11px">'+(p.tecnico||'—')+'</td>'+
      '<td style="font-size:11px">'+(p.fechaTentativa||'—')+'</td>'+
      '<td><span class="pill '+estadoColor+'">'+p.estado+'</span></td>'+
      '<td><button class="btn btn-sm btn-p" onclick="abrirPI('+p.id+')">📋 Ver</button></td>'+
    '</tr>';
  }).join('');
}

function abrirPI(id){
  var p=DB.instalaciones.find(function(x){return x.id===id;});
  if(!p) return;

  var estadoColor=p.estado==='Pendiente'?'p-a':p.estado==='En curso'?'p-b':p.estado==='Completado'?'p-g':'p-r';

  // Kit table
  var kitHTML='<div class="card" style="margin-bottom:10px">'+
    '<div class="ch"><div class="ct">🧰 Materiales de instalación</div>'+
      '<button class="btn btn-sm" onclick="agregarMatInst('+id+')">➕ Agregar</button>'+
    '</div>'+
    '<div class="card-body">'+
    '<table style="width:100%;border-collapse:collapse">'+
    '<thead><tr style="background:var(--surface2)">'+
      '<th style="padding:5px 10px;font-size:10px">Código</th>'+
      '<th style="padding:5px 10px;font-size:10px">Material</th>'+
      '<th style="padding:5px 10px;font-size:10px;text-align:center">Cant.</th>'+
      '<th style="padding:5px 10px;font-size:10px">Origen</th>'+
      '<th style="padding:5px 10px;font-size:10px;text-align:center">Stock</th>'+
      '<th style="padding:5px 10px;font-size:10px"></th>'+
    '</tr></thead><tbody>'+
    (p.kit||[]).map(function(item,i){
      var stock=item.compId?stockActual(item.compId):'—';
      var stockColor=typeof stock==='number'?(stock<item.cant?'var(--red)':stock<item.cant*2?'var(--amber)':'var(--green)'):'var(--text2)';
      return '<tr style="border-bottom:1px solid var(--border)">'+
        '<td style="padding:5px 10px;font-family:monospace;font-size:11px">'+(item.compCodigo||'—')+'</td>'+
        '<td style="padding:5px 10px;font-size:11px">'+item.compNombre+'</td>'+
        '<td style="padding:5px 10px;text-align:center">'+item.cant+'</td>'+
        '<td style="padding:5px 10px;font-size:10px;color:var(--text2)">'+(item.origen==='zigbee'?'Zigbee cliente':item.origen==='kit-base'?'Kit base':'Manual')+'</td>'+
        '<td style="padding:5px 10px;text-align:center;font-weight:700;color:'+stockColor+'">'+(typeof stock==='number'?stock:'—')+'</td>'+
        '<td style="padding:5px 10px"><button class="btn btn-sm" style="color:var(--red)" onclick="quitarMatInst('+id+','+i+')">🗑️</button></td>'+
      '</tr>';
    }).join('')+
    '</tbody></table></div></div>';

  var body=
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">'+
      '<span style="font-family:monospace;font-weight:700;color:var(--primary)">'+p.numero+'</span>'+
      '<span style="font-family:monospace;font-size:11px">'+p.nserie+'</span>'+
      mPill(p.modelo)+
      '<span class="pill '+estadoColor+'">'+p.estado+'</span>'+
    '</div>'+
    '<div class="fg2" style="margin-bottom:12px">'+
      '<div class="fg"><label>Cliente</label><div style="font-size:12px;padding:6px 0">'+(p.cliente||'Stock')+'</div></div>'+
      '<div class="fg"><label>Dirección</label><div style="font-size:12px;padding:6px 0">'+(p.direccion||'—')+'</div></div>'+
      '<div class="fg"><label>Teléfono</label><div style="font-size:12px;padding:6px 0">'+(p.tel||'—')+'</div></div>'+
      '<div class="fg"><label>Técnico</label><input id="pi-tecnico" value="'+(p.tecnico||'')+'" placeholder="Técnico asignado" onblur="savePI('+id+')"></div>'+
      '<div class="fg"><label>Fecha tentativa</label><input id="pi-fecha" type="date" value="'+(p.fechaTentativa||'')+'" onchange="savePI('+id+')"></div>'+
      '<div class="fg"><label>Estado</label>'+
        '<select id="pi-estado" onchange="cambiarEstadoPI('+id+')" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          ['Pendiente','En curso','Completado','Cancelado'].map(function(s){
            return '<option'+(s===p.estado?' selected':'')+'>'+s+'</option>';
          }).join('')+
        '</select></div>'+
      '<div class="fg full"><label>Observaciones</label><input id="pi-obs" value="'+(p.obs||'')+'" placeholder="Observaciones..." onblur="savePI('+id+')"></div>'+
    '</div>'+
    kitHTML+
    (p.estado==='Pendiente'?
      '<div style="text-align:center;margin-top:8px">'+
        '<button class="btn btn-p" onclick="confirmarSalidaStockInst('+id+')">📦 Confirmar salida de stock</button>'+
      '</div>':'');

  openModal('Pedido de instalación — '+p.numero, body, null, true);
}

function savePI(id){
  var p=DB.instalaciones.find(function(x){return x.id===id;});
  if(!p) return;
  var g=function(elId){var el=document.getElementById(elId);return el?el.value:'';};
  p.tecnico=g('pi-tecnico');
  p.fechaTentativa=g('pi-fecha');
  p.obs=g('pi-obs');
  save();
}

function cambiarEstadoPI(id){
  var p=DB.instalaciones.find(function(x){return x.id===id;});
  if(!p) return;
  var nuevo=document.getElementById('pi-estado').value;
  p.estado=nuevo;
  // Update cliente estado
  if(p.clienteId){
    var c=DB.clientes.find(function(x){return x.id===p.clienteId;});
    if(c){
      if(nuevo==='En curso') c.estadoInstalacion='En curso';
      if(nuevo==='Completado') c.estadoInstalacion='Completada';
      if(nuevo==='Pendiente') c.estadoInstalacion='Pendiente';
    }
  }
  save();
  renderInstalaciones();
  cerrarModal();
}

function confirmarSalidaStockInst(id){
  var p=DB.instalaciones.find(function(x){return x.id===id;});
  if(!p) return;

  var faltantes=[];
  (p.kit||[]).forEach(function(item){
    if(!item.compId) return;
    var disponible=stockActual(item.compId);
    if(disponible<item.cant){
      faltantes.push({nombre:item.compNombre,necesita:item.cant,tiene:disponible});
    }
  });

  if(faltantes.length){
    var msg='⚠️ Stock insuficiente:\n\n';
    faltantes.forEach(function(f){msg+='• '+f.nombre+': necesita '+f.necesita+', hay '+f.tiene+'\n';});
    msg+='\n¿Confirmar salida de todas formas?';
    if(!confirm(msg)) return;
  }

  if(!confirm('¿Confirmar salida de stock para instalación '+p.numero+'?')) return;

  (p.kit||[]).forEach(function(item){
    if(!item.compId) return;
    var comp=DB.componentes.find(function(c){return c.id===item.compId;})||{};
    DB.movimientos.push({
      id:DB.nid++, compId:item.compId, fecha:today(),
      tipo:'Salida', motivo:'Instalación — '+p.numero+' — '+p.cliente,
      ref:p.nserie, cant:item.cant,
      precio:parseFloat(comp.costo||comp.precio)||0
    });
  });

  p.estado='En curso';
  if(p.clienteId){
    var c=DB.clientes.find(function(x){return x.id===p.clienteId;});
    if(c) c.estadoInstalacion='En curso';
  }
  save();
  cerrarModal();
  renderInstalaciones();
  alert('Salida de stock confirmada. Pedido en curso.');
}

function agregarMatInst(piId){
  var p=DB.instalaciones.find(function(x){return x.id===piId;});
  if(!p) return;
  var compSel=DB.componentes.map(function(c){
    return '<option value="'+c.id+'">'+c.codigo+' — '+c.desc+'</option>';
  }).join('');

  openModal('Agregar material a instalación',
    '<div class="fg2">'+
      '<div class="fg full"><label>Componente</label>'+
        '<select id="mi-comp" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compSel+
        '</select></div>'+
      '<div class="fg"><label>Cantidad</label><input id="mi-cant" type="number" min="1" value="1"></div>'+
    '</div>',
    function(){
      var compId=parseInt(document.getElementById('mi-comp').value)||0;
      var cant=parseFloat(document.getElementById('mi-cant').value)||0;
      if(!compId||!cant){alert('Seleccioná componente y cantidad.');return false;}
      var comp=DB.componentes.find(function(c){return c.id===compId;})||{};
      if(!p.kit) p.kit=[];
      p.kit.push({compId:compId,compCodigo:comp.codigo||'',compNombre:comp.desc||'',cant:cant,unidad:comp.unidad||'',origen:'manual',devuelto:0});
      save(); cerrarModal(); abrirPI(piId); return true;
    }
  );
}

function quitarMatInst(piId, idx){
  var p=DB.instalaciones.find(function(x){return x.id===piId;});
  if(!p||!p.kit) return;
  if(!confirm('¿Quitar este material del kit?')) return;
  p.kit.splice(idx,1);
  save(); cerrarModal(); abrirPI(piId);
}

// KIT BASE INSTALACION =====================================
function renderKitInst(){
  if(!DB.kitinst) DB.kitinst=[];
  var ver=document.getElementById('kitinst-version');
  if(ver) ver.textContent='Versión '+(DB.kitinstVersion||1)+' · '+(DB.kitinstFecha||today());

  var tb=document.getElementById('tbody-kitinst');
  if(!DB.kitinst.length){tb.innerHTML='<tr><td colspan="6" class="empty">Sin materiales en el kit base.</td></tr>';return;}

  tb.innerHTML=DB.kitinst.map(function(item,i){
    var comp=DB.componentes.find(function(c){return c.id===item.compId;})||{};
    var stock=stockActual(item.compId);
    var color=stock<item.cant?'var(--red)':stock<item.cant*2?'var(--amber)':'var(--green)';
    return '<tr>'+
      '<td style="font-family:monospace;font-size:11px">'+(comp.codigo||'—')+'</td>'+
      '<td>'+(comp.desc||item.compNombre||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700">'+item.cant+'</td>'+
      '<td>'+(comp.unidad||'—')+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+color+'">'+stock+'</td>'+
      '<td style="display:flex;gap:3px">'+
        '<button class="btn btn-sm" onclick="modalKitInstItem('+i+')">✏️</button>'+
        '<button class="btn btn-sm" style="color:var(--red)" onclick="eliminarKitInstItem('+i+')">🗑️</button>'+
      '</td>'+
    '</tr>';
  }).join('');
}

function modalKitInstEditar(){
  // Filter components with area Instalacion
  var compsInst = DB.componentes.filter(function(c){
    return c.area === 'Instalacion';
  }).sort(function(a,b){return (a.desc||'').localeCompare(b.desc||'');});

  if(!compsInst.length){
    alert('No hay componentes con área "Instalacion" en el catálogo.');
    return;
  }

  // Build kit map for quick lookup
  var kitMap = {};
  (DB.kitinst||[]).forEach(function(item){
    kitMap[item.compId] = item.cant;
  });

  // Build table with all Instalacion components
  var rows = compsInst.map(function(c){
    var cant = kitMap[c.id]||0;
    var stock = stockActual(c.id);
    var stockColor = stock<=0?'var(--red)':stock<cant?'var(--amber)':'var(--green)';
    return '<tr style="border-bottom:1px solid var(--border)">'+
      '<td style="padding:5px 10px;font-family:monospace;font-size:11px">'+c.codigo+'</td>'+
      '<td style="padding:5px 10px;font-size:12px">'+c.desc+'</td>'+
      '<td style="padding:5px 10px;font-size:11px;color:var(--text2)">'+c.unidad+'</td>'+
      '<td style="padding:5px 10px;font-weight:700;color:'+stockColor+'">'+stock+'</td>'+
      '<td style="padding:5px 10px">'+
        '<input type="number" min="0" value="'+cant+'" data-compid="'+c.id+'" '+
        'style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px;text-align:center">'+
      '</td>'+
    '</tr>';
  }).join('');

  var body =
    '<div style="font-size:11px;color:var(--text2);margin-bottom:10px">'+
      'Ingresá la cantidad de cada componente. Poné <strong>0</strong> para excluirlo del kit.'+
    '</div>'+
    '<div style="max-height:400px;overflow-y:auto">'+
    '<table style="width:100%;border-collapse:collapse">'+
    '<thead><tr style="background:var(--surface2);position:sticky;top:0">'+
      '<th style="padding:6px 10px;font-size:10px;text-align:left">Código</th>'+
      '<th style="padding:6px 10px;font-size:10px;text-align:left">Descripción</th>'+
      '<th style="padding:6px 10px;font-size:10px;text-align:left">Unidad</th>'+
      '<th style="padding:6px 10px;font-size:10px;text-align:center">Stock</th>'+
      '<th style="padding:6px 10px;font-size:10px;text-align:center">Cantidad en kit</th>'+
    '</tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>';

  openModal('Editar kit base de instalación', body, function(){
    var inputs = document.querySelectorAll('#mbox input[data-compid]');
    var newKit = [];
    inputs.forEach(function(input){
      var compId = parseInt(input.dataset.compid);
      var cant = parseFloat(input.value)||0;
      if(cant > 0){
        var comp = DB.componentes.find(function(c){return c.id===compId;})||{};
        newKit.push({
          compId: compId,
          compCodigo: comp.codigo||'',
          compNombre: comp.desc||'',
          cant: cant
        });
      }
    });
    DB.kitinst = newKit;
    DB.kitinstVersion = (parseInt(DB.kitinstVersion||0)+1);
    DB.kitinstFecha = today();
    save();
    renderKitInst();
    return true;
  });
}

function modalKitInstItem(idx){
  // Keep for edit individual items from table
  var item=idx>=0?(DB.kitinst[idx]||{}):null;
  var compsInst=DB.componentes.filter(function(c){return c.area==='Instalacion';});
  var compSel=compsInst.map(function(c){
    return '<option value="'+c.id+'"'+(item&&item.compId===c.id?' selected':'')+'>'+c.codigo+' — '+c.desc+'</option>';
  }).join('');

  openModal(idx>=0?'Editar material del kit':'Agregar material al kit',
    '<div class="fg2">'+
      '<div class="fg full"><label>Componente (área Instalación)</label>'+
        '<select id="ki-comp" style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%">'+
          '<option value="">— seleccionar —</option>'+compSel+
        '</select></div>'+
      '<div class="fg"><label>Cantidad</label>'+
        '<input id="ki-cant" type="number" min="1" value="'+(item?item.cant:1)+'"></div>'+
    '</div>',
    function(){
      var compId=parseInt(document.getElementById('ki-comp').value)||0;
      var cant=parseFloat(document.getElementById('ki-cant').value)||0;
      if(!compId||!cant){alert('Seleccioná un componente e ingresá la cantidad.');return false;}
      var comp=DB.componentes.find(function(c){return c.id===compId;})||{};
      var newItem={compId:compId,compCodigo:comp.codigo||'',compNombre:comp.desc||'',cant:cant};
      if(idx>=0){DB.kitinst[idx]=newItem;}else{DB.kitinst.push(newItem);}
      DB.kitinstVersion=(parseInt(DB.kitinstVersion||0)+1);
      DB.kitinstFecha=today();
      save(); renderKitInst(); return true;
    }
  );
}


function eliminarKitInstItem(idx){
  if(!confirm('¿Eliminar este material del kit base?')) return;
  DB.kitinst.splice(idx,1);
  DB.kitinstVersion=(parseInt(DB.kitinstVersion||0)+1);
  DB.kitinstFecha=today();
  save(); renderKitInst();
}



function toggleNav(el){
  var items = el.nextElementSibling;
  if(!items||!items.classList.contains('nav-section-items')) return;
  var isOpen = items.classList.contains('open');
  if(isOpen){
    items.classList.remove('open');
    el.innerHTML = el.innerHTML.replace('▾','▸');
  } else {
    items.classList.add('open');
    el.innerHTML = el.innerHTML.replace('▸','▾');
  }
}

function initNavCollapse(){
  // All sections closed by default via CSS - nothing needed
  // Arrows already show ▸ in HTML
}


function pdfChecklistQA(otId){
  var f = (DB.fabricacion||[]).find(function(x){return x.id===otId;});
  if(!f) return;
  var empresa = (DB.config&&DB.config.empresa)||'Viking Security Systems';
  var modelo = f.modelo||'Base';
  var modelos_all = ['Base','Energy','Comfort','Black'];
  var es_energy_plus = ['Energy','Comfort','Black'].includes(modelo);
  var es_comfort_plus = ['Comfort','Black'].includes(modelo);
  var es_black = modelo==='Black';

  var modelo_pill = {'Base':'🔵 BASE','Energy':'🟡 ENERGY','Comfort':'🟠 COMFORT','Black':'⚫ BLACK'};

  var fases = [
    {num:1, titulo:'Verificación de arranque', todos:true, items:[
      'Conectar por USB, monitor serie 115200 bps',
      '[BOOT] Z-PRO Security v10.01 iniciando...',
      '[NVS] Usuarios: N cargados',
      '[WIFI] Conectado — IP: 192.168.x.x',
      '[SSL] Certificado DigiCert cargado',
      '[NTP] Zona: UTC-3',
      '[ZB] Coordinador Zigbee iniciado',
      '[BOOT] Sistema listo.'
    ]},
    {num:2, titulo:'Comandos de lectura', todos:true, items:[
      '/start — Menú con estado del sistema',
      '/estado — Alarma desarmada, energía OK, rol Admin',
      '/version — Muestra v10.01, lote y barrio',
      '/ids — Lista dispositivos',
      '/bypass_list — Sin sensores en bypass',
      '/retardos — Muestra retardos configurados',
      '/historial — Sin eventos (primera vez)',
      '/zona — Muestra UTC-3 por defecto'
    ]},
    {num:3, titulo:'Gestión de usuarios y roles', todos:true, items:[
      '/user_list — Solo Admin de fábrica',
      '/user_add ID_TEST Tester usuario — Confirmación + bienvenida',
      'Desde Tester: /estado — Responde correctamente',
      'Desde Tester: /vincular — Sin autorización',
      '/user_rol ID_TEST lectura — Confirmación de cambio',
      'Desde Tester: /desarmar — Sin autorización',
      '/user_del ID_TEST — Confirmación de eliminación',
      'Desde Tester: /estado — Sin autorización'
    ]},
    {num:4, titulo:'Zona horaria y NTP', todos:true, items:[
      '/zona -5 — Confirmación UTC-5',
      '/historial — Eventos usan hora UTC-5',
      '/zona -3 — Retorno a UTC-3'
    ]},
    {num:5, titulo:'Ciclo de armado y pánico', todos:true, items:[
      '/armar — Notifica armado a todos',
      '/estado — Muestra alarma ARMADA',
      '/panico — Sirena ON + notif. propietario + notif. guardia barrio',
      '/historial — Evento pánico con hora correcta',
      '/desarmar — Sirena OFF + notifica a todos',
      '/estado — Muestra alarma DESARMADA'
    ]},
    {num:6, titulo:'Retardo de egreso', todos:true, items:[
      '/armar 15 — Responde: Tienes 15s para salir',
      'Esperar 15s — Arma automático + notifica',
      '/desarmar — Desarma normalmente',
      '/armar 15 — Inicia retardo nuevamente',
      '/desarmar antes de 15s — Retardo cancelado'
    ]},
    {num:7, titulo:'Sensores Zigbee', todos:true, items:[
      '/vincular — Red Zigbee abierta 60s',
      'Emparejar SNZB-04 (puerta) — Log confirma',
      '/armar → Abrir sensor → Disparo + sirena ON',
      '/desarmar — Sirena OFF',
      '/bypass 0xADDR — Bypass activo',
      '/armar → Abrir sensor → NO dispara (bypass)',
      '/bypass_off 0xADDR — Sensor reincorporado',
      'Emparejar SNZB-01P (pánico) — Log confirma',
      '/armar → 1 click → Pánico + sirena + notif.',
      '/desarmar — Sirena OFF',
      '2 clicks SNZB-01P — Toggle armado/desarmado'
    ]},
    {num:8, titulo:'Retardo de entrada', todos:true, items:[
      'Configurar retardoSeg = 15 en sensor puerta',
      '/armar → Abrir sensor → Notifica: 15s para desarmar',
      'Esperar sin desarmar → Disparo al vencer tiempo',
      '/desarmar — Sirena OFF',
      '/armar → Abrir sensor → /desarmar antes de 15s → NO dispara'
    ]},
    {num:9, titulo:'Historial y persistencia NVS', todos:true, items:[
      '/historial — Todos los eventos con hora correcta',
      'Presionar RESET en ESP32',
      '/historial — Mismos eventos persisten tras reinicio',
      '/estado — Zona horaria y usuarios siguen configurados'
    ]},
    {num:10, titulo:'Actualización OTA', todos:true, items:[
      '/update PIN_MAL URL — Responde: PIN incorrecto',
      '/update 1234 URL — Descarga + reinicio + /version confirma'
    ]},
    {num:11, titulo:'Monitor de energía y UPS', todos:false, modelos:'Energy / Comfort / Black', aplica:es_energy_plus, items:[
      'Cortar 12V CC → Notif. corte al propietario, sistema activo con batería',
      '/estado — Responde con batería',
      'Reconectar 12V CC → Notif. recuperación',
      '/historial — Corte y recuperación con hora'
    ]},
    {num:12, titulo:'Luces Zigbee — Domótica Nivel A', todos:false, modelos:'Comfort / Black', aplica:es_comfort_plus, items:[
      '/luz_on — Todas las luces encienden',
      '/luz_off — Todas apagan',
      '/luz_on Entrada — Solo luz Entrada enciende',
      '/luz_off Entrada — Solo Entrada apaga',
      '/armar y /panico → Luces encienden automáticamente',
      '/desarmar — Sirena OFF',
      'Click largo SNZB-01P — Toggle luz más cercana'
    ]},
    {num:13, titulo:'Sensor de agua', todos:false, modelos:'Comfort / Black', aplica:es_comfort_plus, items:[
      'Activar sensor agua → Notif. SOLO al propietario',
      'Chat guardia — NO recibe notificación',
      'Sirena — NO suena',
      '/historial — Evento agua con hora'
    ]},
    {num:14, titulo:'Simulador de presencia — Domótica Nivel B', todos:false, modelos:'Solo Black', aplica:es_black, items:[
      '/presencia_on — Confirmación activado',
      '/estado — Muestra Presencia: Activa',
      'Log serie — Aparece [PRESENCIA] Luz X ON/OFF',
      '/presencia_off — Luces apagan + confirmación',
      '/estado — Muestra Presencia: Inactiva'
    ]}
  ];

  var css = '*{box-sizing:border-box;margin:0;padding:0}'+
    'body{font-family:Segoe UI,Arial,sans-serif;padding:20px;font-size:11px;color:#222}'+
    '.header{background:#111;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}'+
    '.header h1{font-size:14px;font-weight:700}'+
    '.header .sub{font-size:10px;color:#aaa}'+
    '.datos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}'+
    '.dato{background:#f8f8f8;border-radius:4px;padding:6px 10px}'+
    '.dato .l{font-size:9px;color:#999;font-weight:700;text-transform:uppercase}'+
    '.dato .v{font-size:12px;font-weight:600}'+
    '.fase{margin-bottom:10px;border:1px solid #ddd;border-radius:4px;overflow:hidden}'+
    '.fase-head{background:#B71C1C;color:#fff;padding:5px 10px;font-size:10px;font-weight:700;display:flex;justify-content:space-between}'+
    '.fase-head.na{background:#999}'+
    '.item{display:flex;align-items:flex-start;gap:8px;padding:4px 10px;border-bottom:1px solid #f0f0f0}'+
    '.item:last-child{border-bottom:none}'+
    '.cb{width:14px;height:14px;border:1.5px solid #999;border-radius:2px;flex-shrink:0;margin-top:1px}'+
    '.result{margin-left:auto;font-size:9px;color:#999;white-space:nowrap}'+
    '.footer{margin-top:16px;border-top:2px solid #B71C1C;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:20px}'+
    '.sign{border-top:1px solid #333;padding-top:4px;font-size:9px;color:#666}'+
    '.btn{position:fixed;top:12px;right:12px;background:#B71C1C;color:#fff;border:none;padding:6px 14px;border-radius:5px;cursor:pointer;font-size:11px}'+
    '@media print{.btn{display:none}@page{margin:10mm}}';

  var fasesHTML = fases.map(function(fase){
    var aplica = fase.todos || fase.aplica;
    var headClass = aplica ? 'fase-head' : 'fase-head na';
    var items = aplica ? fase.items.map(function(item){
      return '<div class="item"><div class="cb"></div><div style="flex:1;font-size:10px">'+item+'</div><div class="result">PASS &nbsp; FAIL &nbsp; N/A</div></div>';
    }).join('') : '<div class="item" style="color:#999;font-style:italic;padding:6px 10px">No aplica a este modelo</div>';
    var modLabel = fase.todos ? 'Todos los modelos' : fase.modelos;
    return '<div class="fase">'+
      '<div class="'+headClass+'"><span>FASE '+fase.num+' — '+fase.titulo+'</span><span>'+modLabel+'</span></div>'+
      items+'</div>';
  }).join('');

  var w = window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>QA '+f.nserie+'</title><style>'+css+'</style></head><body>'+
    '<button class="btn" onclick="window.print()">🖨️ Imprimir</button>'+
    '<div class="header">'+
      '<div><div class="sub">PROTOCOLO QA DE FÁBRICA — Z-PRO Security v10.01</div>'+
      '<h1>'+empresa.toUpperCase()+'</h1></div>'+
      '<div style="text-align:right;font-size:11px">'+modelo_pill[modelo]+'<br><span style="font-family:monospace;font-size:13px;font-weight:700">'+f.nserie+'</span></div>'+
    '</div>'+
    '<div class="datos">'+
      '<div class="dato"><div class="l">N° de serie</div><div class="v" style="font-family:monospace">'+f.nserie+'</div></div>'+
      '<div class="dato"><div class="l">Modelo</div><div class="v">Zpro '+modelo+'</div></div>'+
      '<div class="dato"><div class="l">Lote</div><div class="v">'+f.lote+'</div></div>'+
      '<div class="dato"><div class="l">Fecha</div><div class="v">'+today()+'</div></div>'+
      '<div class="dato"><div class="l">Técnico</div><div class="v">___________________________</div></div>'+
      '<div class="dato"><div class="l">MAC WiFi</div><div class="v">___________________________</div></div>'+
    '</div>'+
    fasesHTML+
    '<div class="footer">'+
      '<div>'+
        '<div style="margin-bottom:8px"><strong>✅ APROBADA para embalaje</strong> &nbsp;&nbsp; <strong>❌ RECHAZADA</strong></div>'+
        '<div class="sign">Firma técnico: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fecha: ___________</div>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:10px;color:#666;margin-bottom:4px">Observaciones:</div>'+
        '<div style="border:1px solid #ddd;height:50px;border-radius:4px"></div>'+
      '</div>'+
    '</div>'+
    '</body></html>');
  w.document.close();
}

// INIT
// =======================================================
goTo('clientes');

// Backup reminder on every load
setTimeout(function(){
  var banner = document.createElement('div');
  banner.id = 'backup-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#B71C1C;color:#fff;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:9999;font-size:13px;font-family:inherit';
  var btnExp = document.createElement('button');
  btnExp.textContent = 'Exportar ahora';
  btnExp.style.cssText = 'background:#fff;color:#B71C1C;border:none;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:700';
  btnExp.onclick = function(){ exportarJSON(); document.getElementById('backup-banner').remove(); };
  var btnCer = document.createElement('button');
  btnCer.textContent = 'Cerrar';
  btnCer.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnCer.onclick = function(){ document.getElementById('backup-banner').remove(); };
  var btnDrive = document.createElement('button');
  btnDrive.textContent = '☁️ Drive';
  btnDrive.style.cssText = 'background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px';
  btnDrive.onclick = function(){ exportarADrive(); document.getElementById('backup-banner').remove(); };
  var span = document.createElement('span');
  span.textContent = '💾 Recordatorio: hacé un backup de tus datos para no perderlos.';
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
  btns.appendChild(btnExp); btns.appendChild(btnDrive); btns.appendChild(btnCer);
  banner.appendChild(span); banner.appendChild(btns);
  document.body.appendChild(banner);
}, 1500);
// PRESUPUESTOS helpers =====================================
function defPrecios(){
  const items={};
  ['Central Zpro','Bateria 12V 7Ah','Cargador','Fuente/Transformador','UPS','Sirena exterior'].forEach(function(k){ items[k]={cant:1,precio:0}; });
  ['Puerta','Ventana','PuertaVentana','Boton','Vibracion','Agua','Interruptor s/neutro','Interruptor router','Rele','Luz'].forEach(function(s){ items[s]={cant:0,precio:0}; });
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
  const matK=['Central Zpro','Bateria 12V 7Ah','Cargador','Fuente/Transformador','UPS','Sirena exterior'];
  const moK=['Hs. instalacion','Hs. configuracion'];
  const adK=['Cableado (ml)','Cajas de paso','Gabinete/caja estanca','Tornilleria y fijaciones','Traslado/viaticos'];
  const SENSOR_ITEMS=['Puerta','Ventana','PuertaVentana','Boton','Vibracion','Agua','Interruptor s/neutro','Interruptor router','Rele','Luz'];
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

var _saveTimer=null;

function trackEstadoPres(id, nuevoEstado){
  var p = DB.presupuestos.find(function(x){return x.id===id;});
  if(!p) return;
  var prev = p.estado;
  if(!p.historial) p.historial = [];
  p.historial.push({fecha:today(), de:prev, a:nuevoEstado});
  updPres(id, 'estado', nuevoEstado);
}

function updPres(id,campo,valor){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p) return;
  p[campo]=valor;
  // Debounce save - wait 800ms after last change
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function(){ save(); _saveTimer=null; }, 800);
}

function updatePrecio(id,key,field,valor){
  const p=DB.presupuestos.find(function(x){return x.id===id;});
  if(!p||!p.precios) return;
  if(!p.precios[key]) p.precios[key]={cant:0,precio:0};
  p.precios[key][field]=parseFloat(valor)||0;
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function(){ save(); _saveTimer=null; }, 800);
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
  const SENSOR_ITEMS=['Puerta','Ventana','PuertaVentana','Boton','Vibracion','Agua','Interruptor s/neutro','Interruptor router','Rele','Luz'];
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
      fila('Central Zpro','Central Zpro')+
      fila('Bateria 12V 7Ah','Bateria 12V 7Ah')+fila('Cargador','Cargador')+
      fila('Fuente/Transformador','Fuente/Transformador')+
      fila('UPS','UPS')+fila('Sirena exterior','Sirena exterior')
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
      '<div class="fg" style="margin:0"><label>Estado</label>'+
      '<select style="padding:6px 9px;border:1px solid var(--border);border-radius:var(--r);font-size:12px;width:100%"'+
      ' data-pid="'+id+'" data-campo="estado"'+
      ' onchange="trackEstadoPres('+id+',this.value)">'+
      ['Borrador','Enviado','Aprobado','Rechazado'].map(function(o){return '<option'+(o===p.estado?' selected':'')+'>'+o+'</option>';}).join('')+
      '</select></div>'+
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
  , function(){
    // Force save before closing
    if(_saveTimer){ clearTimeout(_saveTimer); _saveTimer=null; }
    save();
    renderPresupuestos();
    return true;
  });
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


