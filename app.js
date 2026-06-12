// ═══════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════
const K = {
    rubros:'f_r_v2_2', bancos:'f_bancos_v2_4', tarjetas:'f_tarjetas_v2_4',
    servicios:'f_servicios_v2_4', corrientes:'f_corrientes_v2_4',
    transferencias:'f_transferencias_v3', cuotas:'f_cuotas_v3', historico:'f_historico_v3',
    cuentasUSD:'f_cuentasUSD_v3', tarjetasUSD:'f_tarjetasUSD_v3',
    serviciosUSD:'f_serviciosUSD_v3', corrientesUSD:'f_corrientesUSD_v3',
    tipoCambio:'f_tipoCambio_v3',
    instrumentos:'f_instrumentos_v1',
    acciones:'f_acciones_v1'
};
let listaRubros        = leer(K.rubros)        || ["Carnicería / Verdulería","Supermercado / Almacén","Gastos Auto / Combustible"];
let listaBancos        = leer(K.bancos)        || [];
let listaTarjetas      = leer(K.tarjetas)      || [];
let listaServicios     = leer(K.servicios)     || [];
let listaCorrientes    = leer(K.corrientes)    || [];
let listaTransferencias= leer(K.transferencias)|| [];
let listaCuotas        = leer(K.cuotas)        || [];
let historicoMeses     = leer(K.historico)     || [];
let listaCuentasUSD    = leer(K.cuentasUSD)    || [];
let listaTarjetasUSD   = leer(K.tarjetasUSD)   || [];
let listaServiciosUSD  = leer(K.serviciosUSD)  || [];
let listaCorrientesUSD = leer(K.corrientesUSD) || [];
let tipoCambio         = leer(K.tipoCambio)    || 1200;
let listaInstrumentos  = leer(K.instrumentos)  || [];
let listaAcciones      = leer(K.acciones)      || [];
let listaPresupRubros  = leer('f_presup_rubros_v1') || {};
let tabActivo = null;
let filtroCorrientes = '';
function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } }
function guardar() {
    try {
        localStorage.setItem(K.rubros,         JSON.stringify(listaRubros));
        localStorage.setItem(K.bancos,         JSON.stringify(listaBancos));
        localStorage.setItem(K.tarjetas,       JSON.stringify(listaTarjetas));
        localStorage.setItem(K.servicios,      JSON.stringify(listaServicios));
        localStorage.setItem(K.corrientes,     JSON.stringify(listaCorrientes));
        localStorage.setItem(K.transferencias, JSON.stringify(listaTransferencias));
        localStorage.setItem(K.cuotas,         JSON.stringify(listaCuotas));
        localStorage.setItem(K.historico,      JSON.stringify(historicoMeses));
        localStorage.setItem(K.cuentasUSD,     JSON.stringify(listaCuentasUSD));
        localStorage.setItem(K.tarjetasUSD,    JSON.stringify(listaTarjetasUSD));
        localStorage.setItem(K.serviciosUSD,   JSON.stringify(listaServiciosUSD));
        localStorage.setItem(K.corrientesUSD,  JSON.stringify(listaCorrientesUSD));
        localStorage.setItem(K.tipoCambio,     JSON.stringify(tipoCambio));
        localStorage.setItem(K.instrumentos,   JSON.stringify(listaInstrumentos));
        localStorage.setItem(K.acciones,       JSON.stringify(listaAcciones));
        localStorage.setItem('f_presup_rubros_v1', JSON.stringify(listaPresupRubros));
    } catch(e) {
        if(e.name==='QuotaExceededError'||e.code===22||e.code===1014) {
            alert('⚠️ Almacenamiento local lleno. Exportá un backup ahora y considerá eliminar meses históricos antiguos.');
        } else { console.error('Error al guardar:', e); }
    }
}

// ═══════════════════════════════════════════
//  FORMATO
// ═══════════════════════════════════════════
function fmt(n)    { return '$ '   + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtN(n)   { return Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtUSD(n) { return 'USD ' + (Math.round(n*100)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtARS(n) { return '$ '   + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function clon(x)   { return JSON.parse(JSON.stringify(x)); }
const PALETA_RUBROS = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
function colorRubro(r) { const i = listaRubros.indexOf(r); return i>=0 ? PALETA_RUBROS[i % PALETA_RUBROS.length] : '#94a3b8'; }

function parseNum(str) {
    const s=String(str).trim();
    if(s.includes(',')&&s.includes('.')) return s.lastIndexOf(',')>s.lastIndexOf('.')?parseFloat(s.replace(/\./g,'').replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0;
    if(s.includes(',')){ const p=s.split(','); return p[p.length-1].length<=2?parseFloat(s.replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0; }
    if(s.includes('.')){ const p=s.split('.'); return p[p.length-1].length<=2?parseFloat(s)||0:parseFloat(s.replace(/\./g,''))||0; }
    return parseFloat(s)||0;
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    renderContenido();
    setTimeout(modalVencimientos, 400);
});

// ═══════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════
function renderTabs() {
    const bar = document.getElementById('tabs-bar');
    bar.innerHTML = '';
    const mkTab = (label, activo, onclick, estilo) => {
        const t = document.createElement('div');
        t.className = 'tab' + (activo ? ' activo' : '');
        if (activo && estilo) t.style.cssText = estilo;
        t.innerHTML = label;
        t.onclick = onclick;
        bar.appendChild(t);
    };
    mkTab('<span>📊 Mes Actual</span>',  tabActivo===null,       ()=>{ tabActivo=null;       renderTabs(); renderContenido(); });
    mkTab('<span>💵 Dólares</span>',     tabActivo==='dolares',  ()=>{ tabActivo='dolares';  renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#15803d;border-color:#86efac;');
    mkTab('<span>📈 Reportes</span>',    tabActivo==='reportes',    ()=>{ tabActivo='reportes';    renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#166534;border-color:#86efac;');
    mkTab('<span>📊 Inversiones</span>', tabActivo==='inversiones', ()=>{ tabActivo='inversiones'; renderTabs(); renderContenido(); }, 'background:#fef9c3;color:#854d0e;border-color:#fde047;');
    [...historicoMeses].reverse().forEach(mes => {
        const t = document.createElement('div');
        t.className = 'tab historico' + (tabActivo===mes.id ? ' activo' : '');
        t.innerHTML = `<span>🗂 ${mes.nombre}</span><span class="tab-x">✕</span>`;
        t.onclick = e => {
            if (e.target.classList.contains('tab-x')) {
                if (confirm(`¿Eliminar "${mes.nombre}"?`)) {
                    historicoMeses = historicoMeses.filter(m=>m.id!==mes.id);
                    if (tabActivo===mes.id) tabActivo = null;
                    guardar(); renderTabs(); renderContenido();
                }
                return;
            }
            tabActivo = mes.id; renderTabs(); renderContenido();
        };
        bar.appendChild(t);
    });
}

function renderContenido() {
    const app = document.getElementById('app-content');
    app.innerHTML = '';
    if      (tabActivo===null)       { app.appendChild(buildMesActual()); bindMesActual(); render(); }
    else if (tabActivo==='dolares')  { app.appendChild(buildDolares());   bindDolares();   renderDolares(); actualizarTCDolares(); }
    else if (tabActivo==='reportes')    { app.appendChild(buildReportes()); }
    else if (tabActivo==='inversiones') { app.appendChild(buildInversiones()); bindInversiones(); actualizarInversiones(); }
    else {
        const mes = historicoMeses.find(m=>m.id===tabActivo);
        if (mes) app.appendChild(buildHistorico(mes));
    }
}

// ═══════════════════════════════════════════
//  HELPERS DOM
// ═══════════════════════════════════════════
function el(tag, cls) { const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function addOpt(sel, val, txt, selected=false) { const o=el('option'); o.value=val; o.innerText=txt; if(selected) o.selected=true; sel.appendChild(o); }
function fila(tds) { const tr=el('tr'); tds.forEach(td=>tr.appendChild(td)); return tr; }
function tdHTML(html, cls) { const td=el('td',cls); td.innerHTML=html; return td; }
function tdTxt(txt, cls)   { const td=el('td',cls); td.style.fontSize='12px'; td.innerText=txt; return td; }
function setTxt(id,v) { const e=document.getElementById(id); if(e) e.innerText=v; }
function tdBtn(label, fn, cls='no-print') { const td=el('td','tc '+(cls||'')); const b=el('button','btn-del'); b.innerText=label; b.onclick=fn; td.appendChild(b); return td; }
function vGet(id) { return document.getElementById(id)?.value?.trim()||''; }
function nGet(id) { return parseFloat(document.getElementById(id)?.value)||0; }
function medioNom(id) {
    const b=listaBancos.find(x=>x.id===id); if(b) return '🏦 '+b.nombre;
    const t=listaTarjetas.find(x=>x.id===id); if(t) return '💳 '+t.nombre;
    return '—';
}
function esCuentaLiq(id) {
    const b=listaBancos.find(x=>x.id===id);
    return b ? (b.autoDescontar===true) : false;
}
function inpNum(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr';
    let last=Math.round(val);
    inp.value=fmtN(last);
    inp.addEventListener('focus', ()=>{ inp.value=last; });
    inp.addEventListener('change', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        last=v; onChange(v); inp.value=fmtN(v);
    });
    inp.addEventListener('blur', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        if(v!==last){ last=v; onChange(v); }
        inp.value=fmtN(last);
    });
    inp._setVal=v=>{ last=Math.round(v); if(document.activeElement!==inp) inp.value=fmtN(last); };
    return inp;
}
function inpNumUSD(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr';
    let last=Math.round(val*100)/100;
    inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    inp.addEventListener('focus', ()=>{ inp.value=last; });
    inp.addEventListener('change', e=>{
        const v=Math.round(parseNum(e.target.value)*100)/100;
        last=v; onChange(v);
        inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    });
    inp.addEventListener('blur', e=>{
        const v=Math.round(parseNum(e.target.value)*100)/100;
        if(v!==last){ last=v; onChange(v); }
        inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    });
    inp._setVal=v=>{ last=Math.round(v*100)/100; if(document.activeElement!==inp) inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
    return inp;
}
function tdInpNum(val, onChange, cls) { const td=el('td',cls); td.appendChild(inpNum(val,onChange)); return td; }
function tdInpDate(val, onChange) { const td=el('td'); const i=el('input'); i.type='date'; i.className='inp'; i.value=val||''; i.onchange=e=>onChange(e.target.value); td.appendChild(i); return td; }
function selMediosPesos(selId, onChange) {
    const sel=el('select'); sel.className='inp';
    listaBancos.forEach(b=>addOpt(sel,b.id,'🏦 '+b.nombre,b.id===selId));
    listaTarjetas.forEach(t=>addOpt(sel,t.id,'💳 '+t.nombre,t.id===selId));
    sel.onchange=e=>onChange(e.target.value);
    return sel;
}

// ═══════════════════════════════════════════
//  HTML MES ACTUAL
// ═══════════════════════════════════════════
function buildMesActual() {
    const d = document.createElement('div');
    d.innerHTML = `
    <div class="container">
      <header class="no-print">
        <div>
          <h2 style="margin:0;font-size:20px;">Gestión Financiera y Control de Gastos</h2>
          <p class="version-tag">v3.4.0</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-mes"   id="btn-nuevo-mes">🔄 Abrir Nuevo Mes</button>
          <button class="btn btn-blue"  id="btn-exportar">💾 Exportar</button>
          <button class="btn btn-green" id="btn-importar-trigger">📥 Importar</button>
          <input type="file" id="input-backup" accept=".json" style="display:none;">
          <button class="btn no-print"  id="btn-drive-up"   style="background:#4285f4;color:white;">☁️ Drive</button>
          <button class="btn no-print"  id="btn-drive-down" style="background:#4285f4;color:white;">📂 Drive</button>
          <button class="btn btn-dark"  onclick="window.print()">🖨️ PDF</button>
        </div>
      </header>
      <div class="grid-dashboard">
        <div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco Disponible</h4><p id="d-bancos" style="color:#0284c7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Total Deuda Tarjetas</h4><p id="d-tarjetas" style="color:#a855f7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado / Pagado</h4><p id="d-pagado" style="color:#10b981;">$ 0</p></div>
        <div class="card-bal" id="card-pend" style="border-left:5px solid #ef4444;"><h4>Fijos Pendientes</h4><p id="d-pendiente" style="color:#ef4444;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #f59e0b;"><h4>Saldo Proyectado</h4><p id="d-proyectado" style="color:#f59e0b;">$ 0</p><small id="d-proyectado-sub" style="font-size:10px;color:#94a3b8;"></small></div>
      </div>
      <div class="grid-principal">
        <div>
          <div class="panel panel-bancos no-print">
            <h3 class="panel-title">🏦 Cuentas Bancarias / Efectivo</h3>
            <div class="form-block">
              <form id="form-banco">
                <div class="form-group"><label>Nombre</label><input type="text" id="banco-nombre" required placeholder="Ej. Galicia, MercadoPago"></div>
                <div class="form-group"><label>Saldo ($)</label><input type="number" id="banco-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-blue">Añadir Cuenta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:30%" class="tr">Saldo ($)</th><th style="width:20%" class="tc">Auto⬇</th><th style="width:10%" class="no-print"></th></tr></thead><tbody id="t-bancos"></tbody></table>
          </div>
          <div class="panel panel-tarjetas no-print">
            <h3 class="panel-title">💳 Tarjetas de Crédito</h3>
            <div class="form-block">
              <form id="form-tarjeta">
                <div class="form-group"><label>Nombre</label><input type="text" id="tarjeta-nombre" required placeholder="Ej. Visa Galicia"></div>
                <div class="form-group"><label>Saldo base ($)</label><input type="number" id="tarjeta-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-purple">Registrar Tarjeta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:55%">Tarjeta</th><th style="width:35%" class="tr">Consumo ($)</th><th style="width:10%" class="no-print"></th></tr></thead><tbody id="t-tarjetas"></tbody></table>
          </div>
          <div class="panel panel-transf no-print">
            <h3 class="panel-title">↔️ Transferencias entre Cuentas</h3>
            <div class="form-block">
              <form id="form-transf">
                <div class="form-row"><div><label>Origen</label><select id="transf-origen" required></select></div><div><label>Destino</label><select id="transf-destino" required></select></div></div>
                <div class="form-row"><div><label>Monto ($)</label><input type="number" id="transf-monto" required placeholder="0" step="1"></div><div><label>Fecha</label><input type="date" id="transf-fecha" required></div></div>
                <button type="submit" class="btn btn-add btn-amber">Registrar Transferencia</button>
              </form>
            </div>
            <table><thead><tr><th style="width:18%">Fecha</th><th style="width:30%">Origen</th><th style="width:30%">Destino</th><th style="width:17%" class="tr">Monto</th><th style="width:5%" class="no-print"></th></tr></thead><tbody id="t-transf"></tbody></table>
          </div>
          <div class="panel no-print" style="border-top:4px solid #6366f1;">
            <h3 class="panel-title">💳 Compras en Cuotas</h3>
            <div class="form-block">
              <form id="form-cuota">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="cuota-desc" required placeholder="Ej. TV Samsung"></div>
                  <div><label>Monto Total ($)</label><input type="number" id="cuota-total" required placeholder="0" step="1"></div>
                  <div><label>Cant. Cuotas</label><input type="number" id="cuota-cant" required placeholder="12" min="2" step="1"></div>
                </div>
                <div class="form-row">
                  <div><label>Medio de Pago</label><select id="cuota-medio" required></select></div>
                  <div style="display:flex;align-items:flex-end;"><div id="cuota-preview" style="font-size:12px;color:#6366f1;font-weight:bold;padding:9px 0;"></div></div>
                </div>
                <button type="submit" class="btn btn-add" style="background:#6366f1;">Registrar Compra en Cuotas</button>
              </form>
            </div>
            <table><thead><tr><th style="width:35%">Descripción</th><th style="width:20%" class="tr">Cuota ($)</th><th style="width:20%" class="tc">Progreso</th><th style="width:18%" class="tr">Resto ($)</th><th style="width:7%" class="no-print"></th></tr></thead><tbody id="t-cuotas"></tbody></table>
          </div>
          <div class="panel panel-rubros no-print">
            <h3 class="panel-title">⚙️ Rubros de Gasto Corriente</h3>
            <div class="form-block">
              <form id="form-rubro" style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">
                <input type="text" id="rubro-nombre" required placeholder="Ej. Carnicería">
                <button type="submit" class="btn" style="background:#64748b;color:white;">Crear Rubro</button>
              </form>
            </div>
            <div id="rubros-lista" class="rubros-wrap"></div>
            <div id="rubros-presup-wrap" style="margin-top:14px;"></div>
          </div>
        </div>
        <div>
          <div class="panel panel-servicios">
            <h3 class="panel-title">📋 Servicios y Vencimientos Fijos</h3>
            <div class="form-block no-print">
              <form id="form-servicio">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="srv-nombre" required placeholder="Ej. Luz, Internet"></div>
                  <div><label>Presupuesto ($)</label><input type="number" id="srv-presupuesto" required placeholder="0" step="1"></div>
                  <div><label>Vto.</label><input type="date" id="srv-vto" required></div>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                  <div><label>Clase</label><select id="srv-clase" required><option value="M">M — Mío</option><option value="O">O — Oma</option><option value="X">X — Otros</option></select></div>
                  <div style="flex:3"><label>Nota (opcional)</label><input type="text" id="srv-nota" placeholder="Ej. Contrato N° 1234, renovación anual"></div>
                </div>
                <button type="submit" class="btn btn-add btn-indigo">Configurar Servicio Fijo</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:18%">Servicio</th><th style="width:6%" class="tc">Clase</th><th style="width:12%" class="tc">Vto.</th>
              <th style="width:10%" class="tr">Presup.</th><th style="width:10%" class="tr">Pagado</th>
              <th style="width:11%" class="tc">F.Pago</th><th style="width:14%">Medio</th>
              <th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th>
            </tr></thead><tbody id="t-servicios"></tbody></table>
          </div>
          <div class="panel panel-corrientes">
            <h3 class="panel-title">🛍️ Gastos Corrientes / Caja Diaria</h3>
            <div class="form-block no-print">
              <form id="form-corriente">
                <div class="form-row">
                  <div style="flex:1.5"><label>Rubro</label><select id="corr-rubro" required></select></div>
                  <div style="flex:2"><label>Detalle</label><input type="text" id="corr-detalle" required placeholder="Ej. Nafta YPF"></div>
                  <div><label>Monto ($)</label><input type="number" id="corr-monto" required placeholder="0" step="1"></div>
                  <div><label>Pagar con</label><select id="corr-medio" required></select></div>
                </div>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
                  <div><label>Clase</label><select id="corr-clase" style="padding:7px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;">
                    <option value="M">M — Mío</option>
                    <option value="O">O — Oma</option>
                    <option value="X">X — Otros</option>
                  </select></div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="corr-es-ingreso" style="width:16px;height:16px;accent-color:#10b981;cursor:pointer;">
                    <label for="corr-es-ingreso" style="font-size:13px;color:#334155;text-transform:none;font-weight:bold;cursor:pointer;">Es un ingreso</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-add btn-green">Asentar Gasto Corriente</button>
              </form>
            </div>
            <div class="no-print" style="margin-bottom:10px;display:flex;gap:8px;align-items:center;">
              <input type="text" id="filtro-corrientes" placeholder="🔍 Buscar por rubro o detalle..." style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;" oninput="filtroCorrientes=this.value.toLowerCase();render();">
              <button class="btn" style="background:#f1f5f9;color:#334155;padding:7px 12px;font-size:12px;" onclick="filtroCorrientes='';document.getElementById('filtro-corrientes').value='';render();">✕</button>
            </div>
            <div id="wrap-corrientes"></div>
          </div>
        </div>
      </div>
    </div>`;
    return d;
}

function bindMesActual() {
    const g = id => document.getElementById(id);
    g('form-banco')?.addEventListener('submit', altaBanco);
    g('form-tarjeta')?.addEventListener('submit', altaTarjeta);
    g('form-servicio')?.addEventListener('submit', altaServicio);
    g('form-corriente')?.addEventListener('submit', altaCorriente);
    g('form-transf')?.addEventListener('submit', altaTransferencia);
    g('form-cuota')?.addEventListener('submit', altaCuota);
    g('form-rubro')?.addEventListener('submit', altaRubro);
    g('input-backup')?.addEventListener('change', importar);
    g('btn-exportar')?.addEventListener('click', exportar);
    g('btn-importar-trigger')?.addEventListener('click', ()=>g('input-backup')?.click());
    g('btn-nuevo-mes')?.addEventListener('click', nuevoMes);
    g('btn-drive-up')?.addEventListener('click', driveSubir);
    g('btn-drive-down')?.addEventListener('click', driveRestaurar);
    g('cuota-total')?.addEventListener('input', previewCuota);
    g('cuota-cant')?.addEventListener('input', previewCuota);
}

// ═══════════════════════════════════════════
//  RENDER MES ACTUAL
// ═══════════════════════════════════════════
function render() {
    const tB=document.getElementById('t-bancos'); if(!tB) return;
    const tT=document.getElementById('t-tarjetas'), tS=document.getElementById('t-servicios');
    const tTr=document.getElementById('t-transf'), rL=document.getElementById('rubros-lista');
    const sRubro=document.getElementById('corr-rubro'), sMedio=document.getElementById('corr-medio');
    const sOrig=document.getElementById('transf-origen'), sDest=document.getElementById('transf-destino');
    const sMedCuota=document.getElementById('cuota-medio');
    tB.innerHTML=''; tT.innerHTML=''; tS.innerHTML=''; tTr.innerHTML=''; rL.innerHTML='';
    [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) s.innerHTML=''; });
    listaBancos.forEach(b=>{ [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) addOpt(s,b.id,'🏦 '+b.nombre); }); });
    listaTarjetas.forEach(t=>{ [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) addOpt(s,t.id,'💳 '+t.nombre); }); });
    if(sRubro){ sRubro.innerHTML=''; [...listaRubros].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>addOpt(sRubro,r,r)); }
    listaRubros.forEach(r=>{
        const b=el('div','rubro-badge'); 
        const col=colorRubro(r);
        b.style.cssText='border-left:4px solid '+col+';background:'+col+'18;';
        b.innerHTML=`<span style="color:${col};font-weight:bold;">${r}</span>`;
        const x=el('button'); x.type='button'; x.innerText='✕'; x.onclick=()=>elimRubro(r);
        b.appendChild(x); rL.appendChild(b);
    });
    // Bancos
    listaBancos.forEach(b=>{
        const tdT=el('td','tc'); const tog=el('input'); tog.type='checkbox'; tog.checked=b.autoDescontar||false;
        tog.style.cssText='width:16px;height:16px;cursor:pointer;accent-color:#4f46e5;';
        tog.onchange=e=>{ b.autoDescontar=e.target.checked; guardar(); };
        tdT.appendChild(tog);
        const inpB = inpNum(b.saldo, v=>{ b.saldo=v; guardar(); calcDash(); });
        inpB.id = 'saldo-b-'+b.id;
        const tdSB = el('td','tr'); tdSB.appendChild(inpB);
        tB.appendChild(fila([tdHTML(`<b>${b.nombre}</b>`), tdSB, tdT, tdBtn('✕',()=>elimBanco(b.id))]));
    });
    if(!listaBancos.length) tB.innerHTML='<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin cuentas.</td></tr>';
    // Tarjetas
    listaTarjetas.forEach(t=>{
        const inp=inpNum(t.saldo,v=>{ t.saldo=v; guardar(); calcDash(); }); inp.id='saldo-t-'+t.id;
        const tdS=el('td','tr'); tdS.appendChild(inp);
        tT.appendChild(fila([tdHTML(`<b>${t.nombre}</b>`),tdS,tdBtn('✕',()=>elimTarjeta(t.id))]));
    });
    if(!listaTarjetas.length) tT.innerHTML='<tr><td colspan="3" class="tc" style="color:#94a3b8;padding:12px;">Sin tarjetas.</td></tr>';
    // Transferencias
    if(!listaTransferencias.length) { tTr.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>'; }
    else { [...listaTransferencias].reverse().forEach(t=>{
        const tdM=el('td','tr'); tdM.style.cssText='font-weight:bold;color:#f59e0b;'; tdM.innerText=fmt(t.monto);
        tTr.appendChild(fila([tdTxt(t.fecha||'—'),tdTxt(t.origenNombre),tdTxt(t.destinoNombre),tdM,tdBtn('✕',()=>elimTransferencia(t.id))]));
    }); }
    // Servicios (ordenados)
    [...listaServicios].sort((a,b)=>{ const est=s=>s.pagado>=s.presupuesto&&s.presupuesto>0?2:s.pagado>0?1:0; return est(a)!==est(b)?est(a)-est(b):a.nombre.localeCompare(b.nombre,'es'); }).forEach(s=>{
        const selCl=el('select'); selCl.className='inp';
        ['M','O','X'].forEach(op=>{ const o=el('option'); o.value=op; o.innerText=op; if((s.clase||'M')===op) o.selected=true; selCl.appendChild(o); });
        selCl.onchange=e=>{ s.clase=e.target.value; guardar(); };
        const tdCl=el('td','tc'); tdCl.appendChild(selCl);
        const estSpan=el('span'); estSpan.id='est-'+s.id; estSpan.style.cssText='font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;';
        const tdEst=el('td','tc'); tdEst.appendChild(estSpan);
        const tdPag=el('td','tr');
        const inpPag=inpNum(s.pagado, v=>{
            const diff=v-s.pagado;
            if(diff!==0){
                const bk=listaBancos.find(b=>b.id===s.medioPagoId);
                const tk=listaTarjetas.find(t=>t.id===s.medioPagoId);
                if(bk) bk.saldo-=diff;
                else if(tk) tk.saldo+=diff;
            }
            s.pagado=v; guardar(); calcDash();
        });
        tdPag.appendChild(inpPag);
        const tr=el('tr');
        const tdNom=el('td'); tdNom.style.maxWidth='0'; tdNom.style.overflow='hidden'; tdNom.style.textOverflow='ellipsis'; tdNom.style.whiteSpace='nowrap';
        const nomSpan2=el('span'); nomSpan2.style.fontWeight='bold'; nomSpan2.innerText=s.nombre;
        const notaEdit=el('input'); notaEdit.type='text'; notaEdit.className='inp'; notaEdit.style.cssText='margin-top:3px;font-size:11px;color:#854d0e;background:#fefce8;border-color:#fde68a;display:'+(s.nota||document.activeElement===notaEdit?'block':'none')+';';
        notaEdit.placeholder='Nota...'; notaEdit.value=s.nota||'';
        notaEdit.onchange=e=>{ s.nota=e.target.value.trim(); guardar(); };
        notaEdit.onfocus=()=>{ notaEdit.style.display='block'; };
        const noteBtn=el('span'); noteBtn.innerText=s.nota?'📝':'＋'; noteBtn.style.cssText='font-size:10px;cursor:pointer;color:#94a3b8;margin-left:5px;';
        noteBtn.title='Agregar/editar nota'; noteBtn.onclick=()=>{ notaEdit.style.display=notaEdit.style.display==='none'?'block':'none'; if(notaEdit.style.display==='block') notaEdit.focus(); };
        tdNom.appendChild(nomSpan2); tdNom.appendChild(noteBtn); tdNom.appendChild(notaEdit);
        [tdNom, tdCl, tdInpDate(s.fVto,v=>{ s.fVto=v; guardar(); }),
         tdInpNum(s.presupuesto,v=>{ s.presupuesto=v; guardar(); calcDash(); },'tr'),
         tdPag, tdInpDate(s.fPago,v=>{ s.fPago=v; guardar(); }),
         (()=>{ const td=el('td'); td.appendChild(selMediosPesos(s.medioPagoId,v=>{ s.medioPagoId=v; guardar(); calcDash(); })); return td; })(),
         tdEst,
         (()=>{ const td=el('td','tc no-print'); td.style.whiteSpace='nowrap';
                const bDup=el('button','btn'); bDup.style.cssText='background:#f1f5f9;color:#334155;padding:3px 7px;font-size:11px;margin-right:3px;'; bDup.innerText='\u29c9'; bDup.title='Duplicar servicio';
                bDup.onclick=()=>{ const copia=Object.assign({},clon(s),{id:'s_'+Date.now(),nombre:s.nombre+' (copia)',pagado:0,fPago:''}); listaServicios.push(copia); guardar(); render(); };
                const bDel=el('button','btn-del'); bDel.innerText='\u2715'; bDel.onclick=()=>elimServicio(s.id);
                td.appendChild(bDup); td.appendChild(bDel); return td; })()
        ].forEach(td=>tr.appendChild(td));
        tS.appendChild(tr);
    });
    if(!listaServicios.length) tS.innerHTML='<tr><td colspan="9" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios.</td></tr>';
    renderCuotas();
    // Corrientes
    const wC=document.getElementById('wrap-corrientes');
    if(wC){
        wC.innerHTML='';
        const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;';
        const thead=el('thead'); thead.innerHTML='<tr><th style="width:6%" class="tc">Clase</th><th style="width:18%">Rubro</th><th style="width:23%">Detalle</th><th style="width:15%">Medio</th><th style="width:12%;text-align:center;">F. Pago</th><th style="width:14%;text-align:right;">Monto ($)</th><th style="width:6%" class="no-print"></th></tr>';
        const tbody=el('tbody');
        if(!listaCorrientes.length) { tbody.innerHTML='<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin egresos corrientes.</td></tr>'; }
        else { listaCorrientes.filter(c=>!filtroCorrientes||(c.rubro+' '+c.detalle).toLowerCase().includes(filtroCorrientes)).forEach(c=>{
            const selR=el('select'); selR.className='inp'; listaRubros.forEach(r=>addOpt(selR,r,r,r===c.rubro)); selR.onchange=e=>{ c.rubro=e.target.value; guardar(); };
            const inpD=el('input'); inpD.type='text'; inpD.className='inp'; inpD.value=c.detalle; inpD.onchange=e=>{ c.detalle=e.target.value.trim(); guardar(); };
            const inpFP=el('input'); inpFP.type='date'; inpFP.className='inp'; inpFP.value=c.fechaPago||'';
            inpFP.onchange=e=>{
                const prev=c.fechaPago, next=e.target.value, factor=c.esIngreso?1:-1;
                if(!prev&&next&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.monto*factor; }
                if(prev&&!next&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo-=c.monto*factor; }
                c.fechaPago=next; guardar(); render();
            };
            const inpM=inpNum(c.monto,v=>{
                const diff=v-c.monto;
                if(c.fechaPago&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.esIngreso?diff:-diff; }
                c.monto=v; guardar(); calcDash();
            });
            inpM.style.cssText='font-weight:bold;color:'+(c.esIngreso?'#0284c7':'#10b981')+';';
            const claseColor={'M':'#0284c7','O':'#a855f7','X':'#64748b'};
            const cc=claseColor[c.clase||'M'];
            const selCl=el('select'); selCl.className='inp'; selCl.style.cssText='padding:3px 4px;font-size:11px;font-weight:bold;color:'+cc+';border-color:'+cc+'44;background:'+cc+'11;';
            ['M','O','X'].forEach(op=>{ const o=el('option'); o.value=op; o.innerText=op; if((c.clase||'M')===op) o.selected=true; selCl.appendChild(o); });
            selCl.onchange=e=>{ c.clase=e.target.value; const nc=claseColor[c.clase]; selCl.style.cssText='padding:3px 4px;font-size:11px;font-weight:bold;color:'+nc+';border-color:'+nc+'44;background:'+nc+'11;'; guardar(); };
            const tdCl=el('td','tc'); tdCl.appendChild(selCl);
            const tdR=el('td'); tdR.appendChild(selR);
            const tdD=el('td'); tdD.appendChild(inpD);
            const tdM=el('td'); tdM.style.color='#64748b'; tdM.innerText=(c.esIngreso?'⬆ ':'')+medioNom(c.medioPagoId);
            const tdFP=el('td','tc'); tdFP.appendChild(inpFP);
            const tdMon=el('td','tr'); tdMon.appendChild(inpM);
            const tdX=el('td','tc no-print'); const bX=el('button','btn-del'); bX.innerText='✕'; bX.onclick=()=>elimCorriente(c.id); tdX.appendChild(bX);
            const tr=el('tr'); [tdCl,tdR,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td)); tbody.appendChild(tr);
        }); }
        tbl.appendChild(thead); tbl.appendChild(tbody); wC.appendChild(tbl);
    }
    calcDash();
    renderPresupRubros();
}

// ─────────────────────────────────────────────────────────────────
//  PRESUPUESTO POR RUBRO
// ─────────────────────────────────────────────────────────────────
function renderPresupRubros() {
    const wrap = document.getElementById('rubros-presup-wrap'); if(!wrap) return;
    if(!listaRubros.length){ wrap.innerHTML=''; return; }
    // Calcular gastado este mes por rubro (corrientes sin filtro)
    const gastado = {};
    listaCorrientes.filter(c=>c.fechaPago&&!c.esIngreso).forEach(c=>{ gastado[c.rubro]=(gastado[c.rubro]||0)+c.monto; });
    let html = '<div style="font-size:10px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Presupuesto mensual por rubro</div>';
    listaRubros.forEach(r=>{
        const pres = listaPresupRubros[r]||0;
        const gast = gastado[r]||0;
        const pct = pres>0 ? Math.min(100,Math.round(gast/pres*100)) : 0;
        const col = colorRubro(r);
        const alerta = pres>0 && gast>=pres;
        const bg = alerta ? '#fef2f2' : '#f8fafc';
        const barColor = alerta ? '#ef4444' : col;
        html += '<div style="background:'+bg+';border-radius:6px;padding:8px 10px;margin-bottom:6px;border:1px solid '+(alerta?'#fca5a5':'#e2e8f0')+';">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
        html += '<span style="font-size:12px;font-weight:bold;color:'+col+';">'+r+'</span>';
        html += '<div style="display:flex;align-items:center;gap:6px;">';
        html += '<span style="font-size:11px;color:#64748b;">'+fmt(gast)+(pres>0?' / '+fmt(pres):'')+'</span>';
        if(alerta) html += '<span style="font-size:10px;font-weight:bold;padding:1px 6px;border-radius:4px;background:#fee2e2;color:#b91c1c;">SUPERADO</span>';
        html += '</div></div>';
        if(pres>0){ html += '<div style="background:#e2e8f0;border-radius:3px;height:6px;"><div style="background:'+barColor+';height:6px;border-radius:3px;width:'+pct+'%;transition:width 0.3s;"></div></div>'; }
        html += '<div style="display:flex;align-items:center;gap:4px;margin-top:5px;">';
        html += '<span style="font-size:10px;color:#94a3b8;">Ppto. $</span>';
        html += '<input type="number" min="0" step="1" value="'+(pres||'')+'" placeholder="Sin límite" ';
        html += 'style="width:110px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;" ';
        html += 'data-rubro="'+r.replace(/"/g,'&quot;')+'" onchange="actualizarPresupRubro(this)" onblur="actualizarPresupRubro(this)">';
        html += '</div></div>';
    });
    wrap.innerHTML = html;
}
function actualizarPresupRubro(inp) {
    const r = inp.getAttribute('data-rubro');
    const v = parseFloat(inp.value)||0;
    if(v>0) listaPresupRubros[r]=v; else delete listaPresupRubros[r];
    guardar(); renderPresupRubros();
}

// ═══════════════════════════════════════════
//  DASHBOARD PESOS
// ═══════════════════════════════════════════
function calcDash() {
    const mDeb={}; listaBancos.forEach(b=>mDeb[b.id]=0); listaTarjetas.forEach(t=>mDeb[t.id]=0);
    let totalPag=0, fijosPend=0;
    listaServicios.forEach(s=>{
        if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined){ mDeb[s.medioPagoId]+=Math.round(s.pagado); totalPag+=Math.round(s.pagado); }
        if(s.presupuesto>s.pagado) fijosPend+=Math.round(s.presupuesto-s.pagado);
        const sp=document.getElementById('est-'+s.id);
        if(sp){
            if(s.pagado>=s.presupuesto&&s.presupuesto>0){sp.innerText='PAGADO';sp.style.background='#e6f4ea';sp.style.color='#137333';}
            else if(s.pagado>0){sp.innerText='PARCIAL';sp.style.background='#fef7e0';sp.style.color='#b06000';}
            else{sp.innerText='PENDIENTE';sp.style.background='#fce8e6';sp.style.color='#c5221f';}
        }
    });
    listaCorrientes.forEach(c=>{
        if(c.fechaPago){
            if(!c.esIngreso){ totalPag+=Math.round(c.monto); if(mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=Math.round(c.monto); }
            else { if(mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]-=Math.round(c.monto); }
        }
    });
    let sumaBancos=0;
    listaBancos.forEach(b=>{
        b.saldo=Math.round(b.saldo); sumaBancos+=b.saldo;
        const inpB=document.getElementById('saldo-b-'+b.id);
        if(inpB){ if(inpB._setVal) inpB._setVal(b.saldo); else if(document.activeElement!==inpB) inpB.value=fmtN(b.saldo); }
    });
    let sumaTarjetas=0;
    listaTarjetas.forEach(t=>{
        t.saldo=Math.round(t.saldo);
        const total=t.saldo+(mDeb[t.id]||0); sumaTarjetas+=total;
        const inp=document.getElementById('saldo-t-'+t.id);
        if(inp){ if(inp._setVal) inp._setVal(total); else if(document.activeElement!==inp) inp.value=fmtN(total); }
    });
    setTxt('d-bancos',   fmt(sumaBancos));
    setTxt('d-tarjetas', fmt(sumaTarjetas));
    setTxt('d-pagado',   fmt(Math.round(totalPag)));
    setTxt('d-pendiente',fmt(Math.round(fijosPend)));
    const cp=document.getElementById('card-pend'); if(cp) cp.style.borderLeftColor=fijosPend>0?'#ef4444':'#10b981';
    // Saldo proyectado: bancos disponibles - fijos pendientes - corrientes sin fecha (gastos)
    const corrSinFecha = listaCorrientes.filter(c=>!c.fechaPago&&!c.esIngreso).reduce((a,c)=>a+c.monto,0);
    const saldoProyectado = sumaBancos - fijosPend - corrSinFecha;
    setTxt('d-proyectado', fmt(saldoProyectado));
    const dp = document.getElementById('d-proyectado');
    if(dp) dp.style.color = saldoProyectado >= 0 ? '#f59e0b' : '#ef4444';
    const dps = document.getElementById('d-proyectado-sub');
    if(dps) dps.innerText = 'Banco ' + fmt(sumaBancos) + ' − Pend. ' + fmt(fijosPend + corrSinFecha);
}

// ═══════════════════════════════════════════
//  ALTAS PESOS
// ═══════════════════════════════════════════
function altaBanco(e) { e.preventDefault(); listaBancos.push({id:'b_'+Date.now(),nombre:vGet('banco-nombre'),saldo:nGet('banco-saldo'),autoDescontar:false}); guardar(); e.target.reset(); render(); }
function altaTarjeta(e) { e.preventDefault(); listaTarjetas.push({id:'t_'+Date.now(),nombre:vGet('tarjeta-nombre'),saldo:nGet('tarjeta-saldo')}); guardar(); e.target.reset(); render(); }
function altaServicio(e) {
    e.preventDefault();
    const medioId=(listaTarjetas[0]?.id)||(listaBancos.find(b=>!b.autoDescontar)?.id)||(listaBancos[0]?.id)||'';
    listaServicios.push({id:'s_'+Date.now(),nombre:vGet('srv-nombre'),presupuesto:nGet('srv-presupuesto'),pagado:0,fVto:vGet('srv-vto'),fPago:'',medioPagoId:medioId,clase:vGet('srv-clase')||'M',nota:vGet('srv-nota')||''});
    guardar(); e.target.reset(); render();
}
function altaCorriente(e) {
    e.preventDefault();
    const medioId=vGet('corr-medio'); if(!medioId){alert('Configure un medio de pago.'); return;}
    const monto=nGet('corr-monto'), esIngreso=document.getElementById('corr-es-ingreso')?.checked||false;
    const clase=vGet('corr-clase')||'M';
    listaCorrientes.push({id:'c_'+Date.now(),rubro:vGet('corr-rubro'),detalle:vGet('corr-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso,clase});
    const chk=document.getElementById('corr-es-ingreso'); if(chk) chk.checked=false;
    guardar(); e.target.reset(); render();
}
function altaTransferencia(e) {
    e.preventDefault();
    const origenId=vGet('transf-origen'), destinoId=vGet('transf-destino'), monto=nGet('transf-monto'), fecha=vGet('transf-fecha');
    if(origenId===destinoId){alert('Origen y destino no pueden ser iguales.');return;}
    if(monto<=0){alert('Monto mayor a cero.');return;}
    const orig=listaBancos.find(b=>b.id===origenId)||listaTarjetas.find(t=>t.id===origenId);
    const dest=listaBancos.find(b=>b.id===destinoId)||listaTarjetas.find(t=>t.id===destinoId);
    if(orig) orig.saldo-=monto; if(dest) dest.saldo+=monto;
    listaTransferencias.push({id:'tr_'+Date.now(),origenId,destinoId,monto,fecha,origenNombre:orig?.nombre||'?',destinoNombre:dest?.nombre||'?'});
    guardar(); e.target.reset(); render();
}
function altaRubro(e) {
    e.preventDefault(); const nombre=vGet('rubro-nombre');
    if(!nombre||listaRubros.includes(nombre)) return;
    listaRubros.push(nombre); guardar(); document.getElementById('rubro-nombre').value=''; render();
}
function previewCuota() {
    const total=parseFloat(document.getElementById('cuota-total')?.value)||0, cant=parseInt(document.getElementById('cuota-cant')?.value)||0;
    const prev=document.getElementById('cuota-preview'); if(prev) prev.innerText=(total>0&&cant>0)?'Cuota: '+fmt(Math.ceil(total/cant))+'/mes':'';
}
function altaCuota(e) {
    e.preventDefault();
    const desc=vGet('cuota-desc'), total=nGet('cuota-total'), cant=parseInt(document.getElementById('cuota-cant')?.value)||0, medioId=vGet('cuota-medio');
    if(!desc||total<=0||cant<2){alert('Completá todos los campos.');return;}
    const montoCuota=Math.ceil(total/cant);
    const cuota={id:'cuota_'+Date.now(),descripcion:desc,montoTotal:total,totalCuotas:cant,montoCuota,medioPagoId:medioId,cuotaActual:1};
    listaCuotas.push(cuota);
    listaServicios.push({id:'s_cuota_'+cuota.id+'_1',nombre:desc+' (1/'+cant+')',presupuesto:montoCuota,pagado:0,fVto:'',fPago:'',medioPagoId:medioId,clase:'M',esCuota:true,cuotaId:cuota.id});
    guardar(); e.target.reset(); document.getElementById('cuota-preview').innerText=''; render();
}
function renderCuotas() {
    const tC=document.getElementById('t-cuotas'); if(!tC) return;
    const sM=document.getElementById('cuota-medio');
    if(sM&&!sM.options.length){ listaBancos.forEach(b=>addOpt(sM,b.id,'🏦 '+b.nombre)); listaTarjetas.forEach(t=>addOpt(sM,t.id,'💳 '+t.nombre)); }
    tC.innerHTML='';
    if(!listaCuotas.length){ tC.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin cuotas.</td></tr>'; return; }
    listaCuotas.forEach(c=>{
        const resto=c.montoCuota*(c.totalCuotas-c.cuotaActual), pct=Math.round((c.cuotaActual/c.totalCuotas)*100);
        const tr=el('tr');
        tr.innerHTML=`<td style="font-size:12px;"><b>${c.descripcion}</b></td><td class="tr" style="font-size:12px;font-weight:bold;color:#6366f1;">${fmt(c.montoCuota)}</td>
            <td class="tc" style="font-size:11px;"><div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;margin-bottom:3px;"><div style="background:#6366f1;height:8px;border-radius:4px;width:${pct}%;"></div></div>${c.cuotaActual}/${c.totalCuotas}</td>
            <td class="tr" style="font-size:12px;color:#64748b;">${fmt(resto)}</td><td class="tc no-print"></td>`;
        const btn=el('button','btn-del'); btn.innerText='✕'; btn.onclick=()=>elimCuota(c.id); tr.lastElementChild.appendChild(btn);
        tC.appendChild(tr);
    });
}

// ═══════════════════════════════════════════
//  ELIMINACIONES PESOS
// ═══════════════════════════════════════════
function elimBanco(id)   { if(confirm('¿Remover esta cuenta?')) { listaBancos=listaBancos.filter(b=>b.id!==id); guardar(); render(); } }
function elimTarjeta(id) { if(confirm('¿Remover esta tarjeta?')){ listaTarjetas=listaTarjetas.filter(t=>t.id!==id); guardar(); render(); } }
function elimServicio(id){ listaServicios=listaServicios.filter(s=>s.id!==id); guardar(); render(); }
function elimCuota(id)   { if(!confirm('¿Eliminar esta cuota?')) return; listaCuotas=listaCuotas.filter(c=>c.id!==id); listaServicios=listaServicios.filter(s=>s.cuotaId!==id); guardar(); render(); }
function elimRubro(r)    { if(listaCorrientes.some(c=>c.rubro===r)){alert('Rubro en uso.');return;} listaRubros=listaRubros.filter(x=>x!==r); guardar(); render(); }
function elimCorriente(id) {
    const c=listaCorrientes.find(x=>x.id===id);
    if(c&&c.fechaPago&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.esIngreso?-c.monto:c.monto; }
    listaCorrientes=listaCorrientes.filter(x=>x.id!==id); guardar(); render();
}
function elimTransferencia(id) {
    const t=listaTransferencias.find(x=>x.id===id);
    if(t){ const o=listaBancos.find(b=>b.id===t.origenId)||listaTarjetas.find(x=>x.id===t.origenId); const d=listaBancos.find(b=>b.id===t.destinoId)||listaTarjetas.find(x=>x.id===t.destinoId); if(o) o.saldo+=t.monto; if(d) d.saldo-=t.monto; }
    listaTransferencias=listaTransferencias.filter(x=>x.id!==id); guardar(); render();
}

// ═══════════════════════════════════════════
//  NUEVO MES
// ═══════════════════════════════════════════
function nombreMes() { return new Date().toLocaleString('es-AR',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase()); }
function nuevoMes() {
    const nombre=nombreMes(), sufijo=historicoMeses.some(m=>m.nombre===nombre)?' ('+Date.now()+')':'';
    if(!confirm(`🔄 ¿Abrir nuevo período mensual?\n→ Se archivará "${nombre+sufijo}"\n→ Bancos/tarjetas se ajustan\n→ Servicios fijos se conservan sin pagos\n→ Caja diaria y transferencias se vacían`)) return;
    historicoMeses.push({id:'mes_'+Date.now(),nombre:nombre+sufijo,fechaCierre:new Date().toISOString(),
        datos:{listaBancos:clon(listaBancos),listaTarjetas:clon(listaTarjetas),listaServicios:clon(listaServicios),
               listaCorrientes:clon(listaCorrientes),listaTransferencias:clon(listaTransferencias),
               listaRubros:clon(listaRubros),listaCuotas:clon(listaCuotas),
               listaCuentasUSD:clon(listaCuentasUSD),listaTarjetasUSD:clon(listaTarjetasUSD),
               listaServiciosUSD:clon(listaServiciosUSD),listaCorrientesUSD:clon(listaCorrientesUSD),tipoCambio}});
    // Ajustar tarjetas pesos (bancos ya tienen sus saldos actualizados)
    const mDeb={}; listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(c.fechaPago&&mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    listaTarjetas.forEach(t=>{ t.saldo=Math.round(t.saldo+(mDeb[t.id]||0)); });
    // Limpiar pesos
    listaServicios.forEach(s=>{ s.pagado=0; s.fPago=''; });
    listaCorrientes=listaCorrientes.filter(c=>!c.fechaPago);
    listaTransferencias=[];
    // Generar cuotas
    listaCuotas.forEach(c=>{ if(c.cuotaActual<c.totalCuotas){ c.cuotaActual++; listaServicios.push({id:'s_cuota_'+c.id+'_'+c.cuotaActual,nombre:c.descripcion+' ('+c.cuotaActual+'/'+c.totalCuotas+')',presupuesto:c.montoCuota,pagado:0,fVto:'',fPago:'',medioPagoId:c.medioPagoId,clase:'M',esCuota:true,cuotaId:c.id}); } });
    listaCuotas=listaCuotas.filter(c=>c.cuotaActual<c.totalCuotas);
    // Ajustar tarjetas USD
    const mDU={}; listaTarjetasUSD.forEach(t=>mDU[t.id]=0);
    listaServiciosUSD.forEach(s=>{ if(s.pagado>0&&mDU[s.medioPagoId]!==undefined) mDU[s.medioPagoId]+=s.pagado; });
    listaCorrientesUSD.forEach(c=>{ if(mDU[c.medioPagoId]!==undefined) mDU[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    listaTarjetasUSD.forEach(t=>{ t.saldo=Math.round((t.saldo+(mDU[t.id]||0))*100)/100; });
    // Limpiar USD
    listaServiciosUSD.forEach(s=>{ s.pagado=0; s.fPago=''; });
    listaCorrientesUSD=[];
    guardar(); renderTabs(); renderContenido();
    alert('✅ Mes "'+nombre+sufijo+'" archivado. Nuevo período abierto.');
}

// ═══════════════════════════════════════════
//  BACKUP
// ═══════════════════════════════════════════
function exportar() {
    const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
    const data={listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros};
    const lnk=document.createElement('a'); lnk.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data));
    lnk.download='backup_finanzas_'+ts+'.json'; document.body.appendChild(lnk); lnk.click(); lnk.remove();
}
function cargarDatos(res) {
    listaBancos         = res.listaBancos         || [];
    listaTarjetas       = res.listaTarjetas       || [];
    listaServicios      = res.listaServicios      || [];
    listaCorrientes     = res.listaCorrientes     || [];
    listaRubros         = res.listaRubros         || [];
    listaTransferencias = res.listaTransferencias || [];
    listaCuotas         = res.listaCuotas         || [];
    historicoMeses      = res.historicoMeses      || [];
    listaCuentasUSD     = res.listaCuentasUSD     || [];
    listaTarjetasUSD    = res.listaTarjetasUSD    || [];
    listaServiciosUSD   = res.listaServiciosUSD   || [];
    listaCorrientesUSD  = res.listaCorrientesUSD  || [];
    tipoCambio          = res.tipoCambio          || 1200;
    listaInstrumentos   = res.listaInstrumentos   || [];
    listaAcciones       = res.listaAcciones       || [];
    if(res.listaPresupRubros) listaPresupRubros = res.listaPresupRubros;
}
function importar(event) {
    const file=event.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=e=>{ try { const res=JSON.parse(e.target.result); if(!res.listaBancos){alert('Backup inválido.');return;} cargarDatos(res); guardar(); renderTabs(); renderContenido(); alert('Backup importado correctamente.'); } catch(err){ alert('Error: '+err.message); } };
    r.readAsText(file); event.target.value='';
}

// ═══════════════════════════════════════════
//  MODAL VENCIMIENTOS
// ═══════════════════════════════════════════
function esFeriado(f) {
    const mm=String(f.getMonth()+1).padStart(2,'0'), dd=String(f.getDate()).padStart(2,'0'), cl=mm+'-'+dd;
    if(['01-01','03-24','04-02','05-01','05-25','06-20','07-09','10-12','11-20','12-08','12-25'].includes(cl)) return true;
    const ss=calcPascua(f.getFullYear()), fD=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return cl===fD(ss.jue)||cl===fD(ss.vie);
}
function calcPascua(y) {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mes=Math.floor((h+l-7*m+114)/31)-1,dia=(h+l-7*m+114)%31+1;
    const p=new Date(y,mes,dia); const jue=new Date(p); jue.setDate(p.getDate()-3); const vie=new Date(p); vie.setDate(p.getDate()-2); return {jue,vie};
}
function esHabil(d) { const dw=d.getDay(); return dw!==0&&dw!==6&&!esFeriado(d); }
function proximosHabiles(desde,n) { const dias=[]; const cur=new Date(desde); cur.setHours(0,0,0,0); while(dias.length<n){ cur.setDate(cur.getDate()+1); if(esHabil(cur)) dias.push(new Date(cur)); } return dias; }
function modalVencimientos() {
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const habiles=proximosHabiles(hoy,5), limite=habiles[habiles.length-1];
    const proximos=listaServicios.filter(s=>{ if(!s.fVto) return false; if(s.pagado>=s.presupuesto&&s.presupuesto>0) return false; const v=new Date(s.fVto+'T00:00:00'); return v>=hoy&&v<=limite; });
    // Cuotas por terminar: 1 o 2 cuotas restantes
    const cuotasTerminando = listaCuotas.filter(c=>(c.totalCuotas-c.cuotaActual)<=2);
    if(!proximos.length && !cuotasTerminando.length) return;
    const fmtF=d=>d.toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});
    const conDias2=proximos.map(s=>{ const v=new Date(s.fVto+'T00:00:00'); let dh=0; const cur=new Date(hoy); while(cur<v){cur.setDate(cur.getDate()+1);if(esHabil(cur))dh++;} return {...s,vtoDate:v,diasH:dh}; }).sort((a,b)=>a.vtoDate-b.vtoDate);
    let itemsHtml='';
    if(proximos.length){
        itemsHtml += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Vencimientos próximos</div>';
        itemsHtml += conDias2.map(s=>{ const urg=s.diasH<=2, lbl=s.diasH===0?'¡Hoy!':s.diasH===1?'1 día hábil':s.diasH+' días hábiles'; const pend=s.presupuesto>0?fmt(s.presupuesto-s.pagado):'—'; const sub=s.pagado>0?'Pago parcial · Resta '+pend:'Pendiente · '+pend; return '<div class="vto-item '+(urg?'urgente':'proximo')+'"><div><div class="vto-nombre">'+s.nombre+'</div><div class="vto-sub">'+sub+'</div></div><div class="vto-fecha"><div class="vto-dias">'+lbl+'</div><div class="vto-txt">'+fmtF(s.vtoDate)+'</div></div></div>'; }).join('');
    }
    if(cuotasTerminando.length){
        itemsHtml += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin:'+(proximos.length?'16px':'0')+'px 0 8px;">⚡ Cuotas por terminar</div>';
        itemsHtml += cuotasTerminando.map(c=>{ const rest=c.totalCuotas-c.cuotaActual; const lbl=rest===0?'Última cuota':rest===1?'Quedan 2 cuotas':'Quedan '+rest+' cuotas'; return '<div class="vto-item proximo"><div><div class="vto-nombre">'+c.descripcion+'</div><div class="vto-sub">'+fmt(c.montoCuota)+'/mes · Cuota '+c.cuotaActual+' de '+c.totalCuotas+'</div></div><div class="vto-fecha"><div class="vto-dias" style="background:#f3e8ff;color:#7c3aed;">'+lbl+'</div></div></div>'; }).join('');
    }
    const ov=el('div','modal-overlay no-print'); ov.id='modal-vto';
    const titulo = proximos.length && cuotasTerminando.length ? 'Vencimientos y cuotas próximas' : proximos.length ? 'Vencimientos en los próximos 5 días hábiles' : 'Cuotas por terminar';
    ov.innerHTML='<div class="modal-box"><div class="modal-header"><span style="font-size:20px;">⚠️</span><h3>'+titulo+'</h3></div><div class="modal-body">'+itemsHtml+'</div><div class="modal-footer"><button class="btn btn-dark" onclick="document.getElementById(\'modal-vto\').remove()">Entendido</button></div></div>';
    document.body.appendChild(ov);
}

// ═══════════════════════════════════════════
//  DÓLARES
// ═══════════════════════════════════════════
function buildDolares() {
    const d=document.createElement('div');
    d.innerHTML=`
    <div class="container">
      <header class="no-print" style="border-bottom:3px solid #16a34a;">
        <div><h2 style="margin:0;font-size:20px;">💵 Gestión en Dólares</h2><p class="version-tag" style="color:#16a34a;">Cuentas, tarjetas y operatoria en USD</p></div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div id="dol-tc-badge" style="font-size:13px;font-weight:bold;color:#15803d;padding:8px 14px;background:#f0fdf4;border-radius:6px;border:2px solid #86efac;">USD Oficial: cargando...</div>
          <button class="btn no-print" id="btn-dol-actualizar" style="background:#16a34a;color:white;">🔄 Actualizar TC</button>
        </div>
      </header>
      <div class="grid-dashboard" style="margin-top:20px;">
        <div class="card-bal" style="border-left:5px solid #16a34a;"><h4>USD Disponibles</h4><p id="usd-disp" style="color:#16a34a;">USD 0</p><small id="usd-disp-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>USD a Pagar (tarjetas)</h4><p id="usd-pagar" style="color:#a855f7;">USD 0</p><small id="usd-pagar-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-bal" style="border-left:5px solid #f59e0b;"><h4>Balance USD</h4><p id="usd-bal" style="color:#f59e0b;">USD 0</p><small id="usd-bal-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-comp" style="border-left:5px solid #94a3b8;"><h4>USD a Comprar</h4><p id="usd-comp" style="color:#94a3b8;">—</p><small id="usd-comp-ars" style="color:#64748b;font-size:12px;"></small></div>
      </div>
      <div class="grid-principal">
        <div>
          <div class="panel no-print" style="border-top:4px solid #16a34a;">
            <h3 class="panel-title">🏦 Cuentas en USD</h3>
            <div class="form-block">
              <form id="form-cusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="cusd-nombre" required placeholder="Ej. Billetera USD"></div>
                <div class="form-group"><label>Saldo (USD)</label><input type="number" id="cusd-saldo" required value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#16a34a;">Añadir Cuenta USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:28%" class="tr">Saldo (USD)</th><th style="width:27%" class="tr">En pesos</th><th style="width:5%"></th></tr></thead><tbody id="t-cusd"></tbody></table>
          </div>
          <div class="panel no-print" style="border-top:4px solid #a855f7;">
            <h3 class="panel-title">💳 Tarjetas en USD</h3>
            <div class="form-block">
              <form id="form-tusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="tusd-nombre" required placeholder="Ej. Visa Santander USD"></div>
                <div class="form-group"><label>Saldo base (USD)</label><input type="number" id="tusd-saldo" required value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#a855f7;">Registrar Tarjeta USD</button>
              </form>
            </div>
            <div id="t-tusd"></div>
          </div>
        </div>
        <div>
          <div class="panel" style="border-top:4px solid #4f46e5;">
            <h3 class="panel-title">📋 Servicios Fijos en USD</h3>
            <div class="form-block no-print">
              <form id="form-susd">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="susd-nombre" required placeholder="Ej. Netflix, AWS"></div>
                  <div><label>Monto (USD)</label><input type="number" id="susd-presupuesto" required placeholder="0" step="0.01"></div>
                  <div><label>Vto.</label><input type="date" id="susd-vto" required></div>
                </div>
                <button type="submit" class="btn btn-add" style="background:#4f46e5;">Configurar Servicio USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:22%">Servicio</th><th style="width:13%" class="tc">Vto.</th><th style="width:12%" class="tr">Presup.</th><th style="width:12%" class="tr">Pagado</th><th style="width:12%" class="tc">F.Pago</th><th style="width:15%">Medio</th><th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th></tr></thead><tbody id="t-susd"></tbody></table>
          </div>
          <div class="panel" style="border-top:4px solid #10b981;">
            <h3 class="panel-title">🛍️ Gastos Corrientes en USD</h3>
            <div class="form-block no-print">
              <form id="form-ccusd">
                <div class="form-row">
                  <div style="flex:1.5"><label>Rubro</label><select id="ccusd-rubro" required></select></div>
                  <div style="flex:2"><label>Detalle</label><input type="text" id="ccusd-detalle" required placeholder="Ej. Amazon"></div>
                  <div><label>Monto (USD)</label><input type="number" id="ccusd-monto" required placeholder="0" step="0.01"></div>
                  <div><label>Pagar con</label><select id="ccusd-medio" required></select></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <input type="checkbox" id="ccusd-ingreso" style="width:16px;height:16px;accent-color:#10b981;cursor:pointer;">
                  <label for="ccusd-ingreso" style="font-size:13px;color:#334155;text-transform:none;font-weight:bold;cursor:pointer;">Es un ingreso</label>
                </div>
                <button type="submit" class="btn btn-add" style="background:#10b981;">Asentar Gasto en USD</button>
              </form>
            </div>
            <div id="wrap-ccusd"></div>
          </div>
        </div>
      </div>
    </div>`;
    return d;
}

function bindDolares() {
    const g=id=>document.getElementById(id);
    g('form-cusd')?.addEventListener('submit', altaCuentaUSD);
    g('form-tusd')?.addEventListener('submit', altaTarjetaUSD);
    g('form-susd')?.addEventListener('submit', altaServicioUSD);
    g('form-ccusd')?.addEventListener('submit', altaCorrienteUSD);
    g('btn-dol-actualizar')?.addEventListener('click', actualizarTCDolares);

}

function calcMDU() {
    const mDU={};
    listaTarjetasUSD.forEach(t=>mDU[t.id]=0);
    listaCuentasUSD.forEach(c=>mDU[c.id]=0);
    listaServiciosUSD.forEach(s=>{ if(s.pagado>0&&mDU[s.medioPagoId]!==undefined) mDU[s.medioPagoId]+=s.pagado; });
    listaCorrientesUSD.forEach(c=>{ if(mDU[c.medioPagoId]!==undefined) mDU[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    return mDU;
}

async function actualizarTCDolares() {
    const btn = document.getElementById('btn-dol-actualizar');
    if(btn){ btn.disabled=true; btn.innerText='⏳ Actualizando...'; }
    try {
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await res.json();
        tipoCambio = data.oficial.value_sell;
        guardar();
        const badge = document.getElementById('dol-tc-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(tipoCambio) + ' (venta)';
        calcDashUSD();
    } catch(e) {
        const badge = document.getElementById('dol-tc-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(tipoCambio) + ' (guardado)';
    }
    if(btn){ btn.disabled=false; btn.innerText='🔄 Actualizar TC'; }
}

function calcDashUSD() {
    const mDU=calcMDU(), tc=tipoCambio;
    const totalDisp=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0);
    const totalTarj=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU[t.id]||0)),0);
    const balance=totalDisp-totalTarj;
    setTxt('usd-disp',      fmtUSD(totalDisp));
    setTxt('usd-disp-ars',  fmtARS(totalDisp*tc));
    setTxt('usd-pagar',     fmtUSD(totalTarj));
    setTxt('usd-pagar-ars', fmtARS(totalTarj*tc));
    setTxt('usd-bal',       fmtUSD(balance));
    setTxt('usd-bal-ars',   fmtARS(Math.abs(balance)*tc));
    const dBal=document.getElementById('usd-bal'), cBal=document.getElementById('card-usd-bal');
    const dComp=document.getElementById('usd-comp'), dCA=document.getElementById('usd-comp-ars'), cComp=document.getElementById('card-usd-comp');
    if(dBal) dBal.style.color=balance>=0?'#16a34a':'#ef4444';
    if(cBal) cBal.style.borderLeftColor=balance>=0?'#16a34a':'#ef4444';
    if(balance<0){ const f=Math.abs(balance); if(dComp){dComp.innerText=fmtUSD(f);dComp.style.color='#ef4444';} if(dCA) dCA.innerText=fmtARS(f*tc); if(cComp) cComp.style.borderLeftColor='#ef4444'; }
    else { if(dComp){dComp.innerText='—';dComp.style.color='#94a3b8';} if(dCA) dCA.innerText=''; if(cComp) cComp.style.borderLeftColor='#94a3b8'; }
    // Actualizar consumo en tabla tarjetas sin reconstruir
    const rowsTU=document.querySelectorAll('#t-tusd tr');
    listaTarjetasUSD.forEach((t,i)=>{ if(rowsTU[i]){ const tds=rowsTU[i].querySelectorAll('td'); const consumo=mDU[t.id]||0; if(tds[2]) tds[2].innerText=consumo>0?fmtUSD(consumo):'—'; if(tds[3]) tds[3].innerText=fmtARS((t.saldo+consumo)*tc); } });
    // Actualizar estado servicios USD
    listaServiciosUSD.forEach(s=>{ const sp=document.getElementById('estu-'+s.id); if(sp){ if(s.pagado>=s.presupuesto&&s.presupuesto>0){sp.innerText='PAGADO';sp.style.background='#e6f4ea';sp.style.color='#137333';} else if(s.pagado>0){sp.innerText='PARCIAL';sp.style.background='#fef7e0';sp.style.color='#b06000';} else{sp.innerText='PENDIENTE';sp.style.background='#fce8e6';sp.style.color='#c5221f';} } });
}

function renderDolares() {
    const tCU=document.getElementById('t-cusd'), tTU=document.getElementById('t-tusd'), tSU=document.getElementById('t-susd');
    if(!tCU) return;
    tCU.innerHTML=''; tTU.innerHTML=''; tSU.innerHTML='';
    const selR=document.getElementById('ccusd-rubro'), selM=document.getElementById('ccusd-medio');
    if(selR){ selR.innerHTML=''; listaRubros.forEach(r=>addOpt(selR,r,r)); }
    if(selM){ selM.innerHTML=''; listaTarjetasUSD.forEach(t=>addOpt(selM,t.id,'💳 '+t.nombre)); listaCuentasUSD.forEach(c=>addOpt(selM,c.id,'🏦 '+c.nombre)); }
    const mDU=calcMDU();
    // Cuentas USD
    let totCU=0;
    listaCuentasUSD.forEach(c=>{ totCU+=c.saldo;
        const inp=inpNumUSD(c.saldo,v=>{ c.saldo=v; guardar(); calcDashUSD(); }); inp.style.color='#16a34a'; inp.style.fontWeight='bold';
        const tdS=el('td','tr'); tdS.appendChild(inp);
        const tdA=el('td','tr'); tdA.style.cssText='color:#64748b;font-size:12px;'; tdA.innerText=fmtARS(c.saldo*tipoCambio);
        tCU.appendChild(fila([tdHTML(`<b>${c.nombre}</b>`),tdS,tdA,tdBtn('✕',()=>elimCuentaUSD(c.id))]));
    });
    if(listaCuentasUSD.length){ const trT=el('tr'); trT.style.background='#f8fafc'; trT.innerHTML=`<td><b>Total</b></td><td class="tr" style="color:#16a34a;font-weight:bold;">${fmtUSD(totCU)}</td><td class="tr" style="font-weight:bold;">${fmtARS(totCU*tipoCambio)}</td><td></td>`; tCU.appendChild(trT); }
    else tCU.innerHTML='<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin cuentas USD.</td></tr>';
    // Tarjetas USD - cards
    let totTU=0;
    if(!listaTarjetasUSD.length){ tTU.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;">Sin tarjetas USD.</p>'; }
    else {
        listaTarjetasUSD.forEach(function(t){
            const consumo=mDU[t.id]||0, total=t.saldo+consumo; totTU+=total;
            const card=el('div'); card.style.cssText='border:1px solid #e2e8f0;border-left:4px solid #a855f7;border-radius:6px;padding:12px;margin-bottom:8px;background:white;';
            const row1=el('div'); row1.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
            const nom=el('span'); nom.style.cssText='font-weight:bold;color:#1e293b;font-size:14px;'; nom.innerText=t.nombre;
            const btnX=el('button','btn-del'); btnX.innerText='\u2715'; btnX.onclick=function(){ elimTarjetaUSD(t.id); };
            row1.appendChild(nom); row1.appendChild(btnX);
            const mkC=function(label,node,color){ const c=el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 10px;'; const l=el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; l.innerText=label; const v=el('div'); v.style.cssText='font-size:15px;font-weight:bold;color:'+(color||'#1e293b')+';'; if(typeof node==='string') v.innerText=node; else v.appendChild(node); c.appendChild(l); c.appendChild(v); return c; };
            const inp=inpNumUSD(t.saldo,function(v){ t.saldo=v; guardar(); calcDashUSD(); });
            inp.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:15px;font-weight:bold;color:#a855f7;background:white;text-align:right;';
            const row2=el('div'); row2.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;';
            row2.appendChild(mkC('Saldo Base',inp,'#a855f7'));
            row2.appendChild(mkC('Consumo Mes',consumo>0?fmtUSD(consumo):'\u2014','#6366f1'));
            const cP=el('div'); cP.style.cssText='background:#f0f9ff;border-radius:4px;padding:6px 10px;'; const lP=el('div'); lP.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; lP.innerText='En Pesos'; const vP=el('div'); vP.style.cssText='font-size:15px;font-weight:bold;color:#0284c7;'; vP.innerText=fmtARS(total*tipoCambio); cP.appendChild(lP); cP.appendChild(vP);
            card.appendChild(row1); card.appendChild(row2); card.appendChild(cP); tTU.appendChild(card);
        });
        const tot=el('div'); tot.style.cssText='background:#f8fafc;border-radius:6px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:4px;';
        tot.innerHTML='<span style="font-weight:bold;color:#1e293b;">Total</span><div style="text-align:right;"><div style="font-weight:bold;color:#a855f7;font-size:15px;">'+fmtUSD(totTU)+'</div><div style="font-size:13px;color:#0284c7;">'+fmtARS(totTU*tipoCambio)+'</div></div>';
        tTU.appendChild(tot);
    }
    // Servicios USD
    [...listaServiciosUSD].sort((a,b)=>{ const est=s=>s.pagado>=s.presupuesto&&s.presupuesto>0?2:s.pagado>0?1:0; return est(a)!==est(b)?est(a)-est(b):a.nombre.localeCompare(b.nombre,'es'); }).forEach(s=>{
        const medSel=el('select'); medSel.className='inp';
        listaTarjetasUSD.forEach(t=>addOpt(medSel,t.id,'💳 '+t.nombre,t.id===s.medioPagoId));
        listaCuentasUSD.forEach(c=>addOpt(medSel,c.id,'🏦 '+c.nombre,c.id===s.medioPagoId));
        medSel.onchange=e=>{ s.medioPagoId=e.target.value; guardar(); calcDashUSD(); };
        const estSpan=el('span'); estSpan.id='estu-'+s.id; estSpan.style.cssText='font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;';
        const tdEst=el('td','tc'); tdEst.appendChild(estSpan);
        const tr=el('tr');
        [tdHTML(`<b>${s.nombre}</b>`), tdInpDate(s.fVto,v=>{ s.fVto=v; guardar(); }),
         (()=>{ const td=el('td','tr'); td.appendChild(inpNumUSD(s.presupuesto,v=>{ s.presupuesto=v; guardar(); calcDashUSD(); })); return td; })(),
         (()=>{ const td=el('td','tr');
            td.appendChild(inpNumUSD(s.pagado,v=>{
                const diff=v-s.pagado;
                if(diff!==0){ const tk=listaTarjetasUSD.find(t=>t.id===s.medioPagoId), ck=listaCuentasUSD.find(c=>c.id===s.medioPagoId); if(tk) tk.saldo+=diff; else if(ck) ck.saldo-=diff; }
                s.pagado=v; guardar(); calcDashUSD();
            })); return td; })(),
         tdInpDate(s.fPago,v=>{ s.fPago=v; guardar(); }),
         (()=>{ const td=el('td'); td.appendChild(medSel); return td; })(),
         tdEst, tdBtn('✕',()=>elimServicioUSD(s.id))
        ].forEach(td=>tr.appendChild(td));
        tSU.appendChild(tr);
    });
    if(!listaServiciosUSD.length) tSU.innerHTML='<tr><td colspan="8" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios USD.</td></tr>';
    // Corrientes USD
    const wCU=document.getElementById('wrap-ccusd');
    if(wCU){
        wCU.innerHTML='';
        const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;';
        const thead=el('thead'); thead.innerHTML='<tr><th style="width:20%">Rubro</th><th style="width:27%">Detalle</th><th style="width:17%">Medio</th><th style="width:13%;text-align:center;">F. Pago</th><th style="width:15%;text-align:right;">Monto (USD)</th><th style="width:8%" class="no-print"></th></tr>';
        const tbody=el('tbody');
        if(!listaCorrientesUSD.length){ tbody.innerHTML='<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin gastos corrientes en USD.</td></tr>'; }
        else { listaCorrientesUSD.forEach(c=>{
            const medio=listaTarjetasUSD.find(t=>t.id===c.medioPagoId)||listaCuentasUSD.find(x=>x.id===c.medioPagoId);
            const mNom=(c.esIngreso?'⬆ ':'')+((medio?(listaTarjetasUSD.find(t=>t.id===c.medioPagoId)?'💳 ':'🏦 ')+medio.nombre:'Desconocido'));
            const selR2=el('select'); selR2.className='inp'; listaRubros.forEach(r=>addOpt(selR2,r,r,r===c.rubro)); selR2.onchange=e=>{ c.rubro=e.target.value; guardar(); };
            const inpD=el('input'); inpD.type='text'; inpD.className='inp'; inpD.value=c.detalle; inpD.onchange=e=>{ c.detalle=e.target.value.trim(); guardar(); };
            const inpFP=el('input'); inpFP.type='date'; inpFP.className='inp'; inpFP.value=c.fechaPago||'';
            inpFP.onchange=e=>{ c.fechaPago=e.target.value; guardar(); calcDashUSD(); };
            const inpM=inpNumUSD(c.monto,v=>{ c.monto=v; guardar(); calcDashUSD(); });
            inpM.style.cssText='font-weight:bold;color:'+(c.esIngreso?'#0284c7':'#10b981')+';';
            const tdR2=el('td'); tdR2.appendChild(selR2);
            const tdD=el('td'); tdD.appendChild(inpD);
            const tdM=el('td'); tdM.style.color='#64748b'; tdM.innerText=mNom;
            const tdFP=el('td','tc'); tdFP.appendChild(inpFP);
            const tdMon=el('td','tr'); tdMon.appendChild(inpM);
            const tdX=el('td','tc no-print'); const bX=el('button','btn-del'); bX.innerText='✕'; bX.onclick=()=>elimCorrienteUSD(c.id); tdX.appendChild(bX);
            const tr=el('tr'); [tdR2,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td)); tbody.appendChild(tr);
        }); }
        tbl.appendChild(thead); tbl.appendChild(tbody); wCU.appendChild(tbl);
    }
    calcDashUSD();
}

// ALTAS USD
function altaCuentaUSD(e)    { e.preventDefault(); listaCuentasUSD.push({id:'cu_'+Date.now(),nombre:vGet('cusd-nombre'),saldo:parseFloat(document.getElementById('cusd-saldo').value)||0}); guardar(); e.target.reset(); renderDolares(); }
function altaTarjetaUSD(e)   { e.preventDefault(); listaTarjetasUSD.push({id:'tu_'+Date.now(),nombre:vGet('tusd-nombre'),saldo:parseFloat(document.getElementById('tusd-saldo').value)||0}); guardar(); e.target.reset(); renderDolares(); }
function altaServicioUSD(e)  { e.preventDefault(); const mId=listaTarjetasUSD[0]?.id||listaCuentasUSD[0]?.id||''; listaServiciosUSD.push({id:'su_'+Date.now(),nombre:vGet('susd-nombre'),presupuesto:parseFloat(document.getElementById('susd-presupuesto').value)||0,pagado:0,fVto:vGet('susd-vto'),fPago:'',medioPagoId:mId}); guardar(); e.target.reset(); renderDolares(); }
function altaCorrienteUSD(e) {
    e.preventDefault();
    const medioId=document.getElementById('ccusd-medio').value; if(!medioId){alert('Configure un medio de pago USD.');return;}
    const monto=parseFloat(document.getElementById('ccusd-monto').value)||0, esIngreso=document.getElementById('ccusd-ingreso')?.checked||false;
    listaCorrientesUSD.push({id:'cc_'+Date.now(),rubro:document.getElementById('ccusd-rubro').value,detalle:vGet('ccusd-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso});
    const chk=document.getElementById('ccusd-ingreso'); if(chk) chk.checked=false;
    guardar(); e.target.reset(); renderDolares();
}
// ELIMINACIONES USD
function elimCuentaUSD(id)    { if(confirm('¿Remover cuenta USD?'))  { listaCuentasUSD=listaCuentasUSD.filter(c=>c.id!==id);       guardar(); renderDolares(); } }
function elimTarjetaUSD(id)   { if(confirm('¿Remover tarjeta USD?')) { listaTarjetasUSD=listaTarjetasUSD.filter(t=>t.id!==id);     guardar(); renderDolares(); } }
function elimServicioUSD(id)  { listaServiciosUSD=listaServiciosUSD.filter(s=>s.id!==id);                                          guardar(); renderDolares(); }
function elimCorrienteUSD(id) { listaCorrientesUSD=listaCorrientesUSD.filter(x=>x.id!==id);                                       guardar(); renderDolares(); }


function dibujarTorta(canvasId, leyId, items, fmtVal, coloresFijos) {
    const total = items.reduce(function(a,i){ return a+i.valor; }, 0);
    if (!total) return;
    const paleta = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
    // Si hay colores fijos, no ordenar (mantener orden del caller); si no, ordenar por valor desc
    const itemsOrd = coloresFijos ? items : items.slice().sort(function(a,b){ return b.valor-a.valor; });
    setTimeout(function(){
        const tw = document.getElementById(canvasId); if(!tw) return;
        const cv = el('canvas'); cv.width=300; cv.height=300; tw.appendChild(cv);
        const ctx = cv.getContext('2d'); const cx=150,cy=150,r=120,ri=60; let ang=-Math.PI/2;
        itemsOrd.forEach(function(it,i){
            const pct=it.valor/total, a2=ang+pct*2*Math.PI, col=coloresFijos?coloresFijos[i]:paleta[i%paleta.length];
            ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,a2); ctx.closePath();
            ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
            if(pct>0.05){ const ma=ang+(a2-ang)/2;
                ctx.fillStyle='white'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
                ctx.fillText((pct*100).toFixed(0)+'%', cx+(r*0.68)*Math.cos(ma), cy+(r*0.68)*Math.sin(ma)); }
            ang=a2;
        });
        ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI); ctx.fillStyle='white'; ctx.fill();
        ctx.fillStyle='#1e293b'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('Total',cx,cy-10); ctx.fillStyle='#4f46e5'; ctx.fillText(fmtVal(total),cx,cy+10);
        const ley = document.getElementById(leyId);
        if(ley){ ley.innerHTML=''; itemsOrd.forEach(function(it,i){
            const d=el('div'); d.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px;';
            d.innerHTML='<div style="width:12px;height:12px;border-radius:3px;background:'+(coloresFijos?coloresFijos[i]:paleta[i%paleta.length])+';flex-shrink:0;"></div>';
            const span1=el('span'); span1.style.cssText='font-size:12px;font-weight:bold;color:#1e293b;'; span1.innerText=it.label;
            const span2=el('span'); span2.style.cssText='font-size:11px;color:#64748b;'; span2.innerText=fmtVal(it.valor)+' · '+(it.valor/total*100).toFixed(1)+'%';
            d.appendChild(span1); d.appendChild(span2); ley.appendChild(d);
        }); }
    },50);
}

function mkTortaDoble(id1, ley1, tit1, id2, ley2, tit2, color1, color2) {
    const d = el('div');
    d.style.cssText = 'background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid '+color1+';padding:20px;margin-bottom:16px;';
    d.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">' +
            '<div>' +
                '<h4 style="margin:0 0 14px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 '+tit1+'</h4>' +
                '<div style="display:flex;align-items:flex-start;gap:16px;">' +
                    '<div id="'+id1+'"></div>' +
                    '<div id="'+ley1+'" style="max-height:240px;overflow-y:auto;flex:1;min-width:0;"></div>' +
                '</div>' +
            '</div>' +
            '<div style="border-left:1px solid #e2e8f0;padding-left:24px;">' +
                '<h4 style="margin:0 0 14px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 '+tit2+'</h4>' +
                '<div style="display:flex;align-items:flex-start;gap:16px;">' +
                    '<div id="'+id2+'"></div>' +
                    '<div id="'+ley2+'" style="max-height:240px;overflow-y:auto;flex:1;min-width:0;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    return d;
}

function mkTortaDiv(canvasId, leyId, titulo, color) {
    const d = el('div');
    d.style.cssText = 'background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid '+color+';padding:20px;margin-bottom:16px;';
    d.innerHTML = '<h4 style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 '+titulo+'</h4><div style="display:flex;align-items:flex-start;justify-content:center;gap:32px;flex-wrap:wrap;"><div id="'+canvasId+'"></div><div id="'+leyId+'" style="max-height:320px;overflow-y:auto;"></div></div>';
    return d;
}
// ═══════════════════════════════════════════
//  REPORTES
// ═══════════════════════════════════════════
function buildReportes() {
    const wrap=el('div','container'); wrap.style.paddingTop='20px';
    const hdr=el('div'); hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #4f46e5;';
    hdr.innerHTML=`<div><h2 style="margin:0;font-size:22px;color:#1e293b;">📈 Reportes Financieros</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p></div><button onclick="window.print()" class="btn btn-dark no-print" style="font-size:12px;padding:8px 14px;">🖨️ Imprimir</button>`;
    wrap.appendChild(hdr);

    // ── REPORTE 1 ──────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#4f46e5;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 1 · Resumen del Mes Actual</h3>');

    // Bancos
    let totB=0; listaBancos.forEach(b=>totB+=b.saldo);
    let cB=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #0284c7;padding:16px;margin-bottom:0px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🏦 Cuentas Bancarias</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Cuenta</th><th style="padding:6px;text-align:right;">Saldo Disponible</th></tr>`;
    listaBancos.forEach(b=>{ cB+=`<tr><td style="padding:5px 6px;font-weight:bold;">${b.nombre}</td><td style="padding:5px 6px;text-align:right;color:#0284c7;font-weight:bold;">${fmt(b.saldo)}</td></tr>`; });
    cB+=`<tr style="background:#f8fafc;font-weight:bold;"><td style="padding:6px;">TOTAL</td><td style="padding:6px;text-align:right;color:#0284c7;">${fmt(totB)}</td></tr></table></div>`;

    // Tarjetas
    const mDeb={}; listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(c.fechaPago&&mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    let totT=0;
    let cT=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">💳 Tarjetas de Crédito</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Tarjeta</th><th style="padding:6px;text-align:right;">Saldo base</th><th style="padding:6px;text-align:right;">Consumo mes</th><th style="padding:6px;text-align:right;">Total deuda</th></tr>`;
    listaTarjetas.forEach(t=>{ const c=mDeb[t.id]||0,tot=t.saldo+c; totT+=tot; cT+=`<tr><td style="padding:5px 6px;font-weight:bold;">${t.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmt(t.saldo)}</td><td style="padding:5px 6px;text-align:right;color:#a855f7;">${fmt(c)}</td><td style="padding:5px 6px;text-align:right;font-weight:bold;color:#a855f7;">${fmt(tot)}</td></tr>`; });
    cT+=`<tr style="background:#f8fafc;font-weight:bold;"><td colspan="3" style="padding:6px;">TOTAL DEUDA</td><td style="padding:6px;text-align:right;color:#a855f7;">${fmt(totT)}</td></tr></table></div>`;

    const g1=el('div'); g1.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:16px;';
    g1.innerHTML=cB+cT; wrap.appendChild(g1);

    // Servicios fijos
    let totPres=0,totPag=0,totPend=0;
    listaServicios.forEach(s=>{ totPres+=s.presupuesto; totPag+=s.pagado; if(s.presupuesto>s.pagado) totPend+=(s.presupuesto-s.pagado); });
    let tSrv=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos del Mes</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
    listaServicios.forEach((s,ri)=>{
        const pend=Math.max(0,s.presupuesto-s.pagado), cc={'M':'#0284c7','O':'#a855f7','X':'#64748b'}[s.clase||'M'];
        let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
        tSrv+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${s.clase||'M'}</span></td><td style="padding:5px 6px;text-align:right;">${fmt(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pend)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`;
    });
    tSrv+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td></td><td style="text-align:right;">${fmt(totPres)}</td><td style="text-align:right;color:#10b981;">${fmt(totPag)}</td><td style="text-align:right;color:#ef4444;">${fmt(totPend)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tSrv);

    // Por clase
    const clases=[{k:'M',label:'M — Mío',color:'#0284c7'},{k:'O',label:'O — Oma',color:'#a855f7'},{k:'X',label:'X — Otros',color:'#64748b'}];
    let tCl=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Servicios Fijos por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:right;">%</th></tr>`;
    clases.forEach(cl=>{ const sc=listaServicios.filter(s=>(s.clase||'M')===cl.k); const p=sc.reduce((a,s)=>a+s.presupuesto,0),pg=sc.reduce((a,s)=>a+s.pagado,0),pe=sc.reduce((a,s)=>a+Math.max(0,s.presupuesto-s.pagado),0),pct=totPres>0?((p/totPres)*100).toFixed(1):'0.0';
        tCl+=`<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;"><span style="font-weight:bold;padding:2px 8px;border-radius:4px;background:${cl.color}22;color:${cl.color};">${cl.label}</span></td><td style="padding:5px 6px;text-align:right;font-weight:bold;">${fmt(p)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(pg)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pe)}</td><td style="padding:5px 6px;text-align:right;">${pct}%</td></tr>`; });
    tCl+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${fmt(totPres)}</td><td style="text-align:right;color:#10b981;">${fmt(totPag)}</td><td style="text-align:right;color:#ef4444;">${fmt(totPend)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tCl);

    // Gráficos dobles pesos
    const srvConPres = listaServicios.filter(function(s){ return s.presupuesto>0; });

    const porR={},porRSF={};
    const esPagoTarjeta = r => r && r.toLowerCase().includes('tarjeta');
    listaCorrientes.filter(c=>c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{ porR[c.rubro]=(porR[c.rubro]||0)+c.monto; });
    listaCorrientes.filter(c=>!c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{ porRSF[c.rubro]=(porRSF[c.rubro]||0)+c.monto; });
    const totCorr=Object.values(porR).reduce((a,b)=>a+b,0);
    const todosR=new Set([...Object.keys(porR),...Object.keys(porRSF)]);
    // Tabla corrientes con clase
    const claseColorMap={'M':'#0284c7','O':'#a855f7','X':'#64748b'};
    // Calcular porR con clase
    const porRConClase={};
    listaCorrientes.filter(c=>c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{
        if(!porRConClase[c.rubro]) porRConClase[c.rubro]={monto:0,clase:c.clase||'M'};
        porRConClase[c.rubro].monto+=c.monto;
    });
    let tCorr=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🛍️ Gastos Corrientes por Rubro</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:left;">Rubro</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Sin confirmar</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
    [...todosR].sort().forEach(r=>{
        const pg=porR[r]||0,sf=porRSF[r]||0,pct=totCorr>0?((pg/totCorr)*100).toFixed(1):'0.0',col=colorRubro(r);
        const clase=(porRConClase[r]&&porRConClase[r].clase)||'M';
        const cc=claseColorMap[clase];
        tCorr+=`<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${clase}</span></td>
            <td style="padding:5px 6px;"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0;display:inline-block;"></span><b style="color:${col};">${r}</b></span></td>
            <td style="padding:5px 6px;text-align:right;color:#10b981;font-weight:bold;">${fmt(pg)}</td>
            <td style="padding:5px 6px;text-align:right;color:#94a3b8;">${fmt(sf)}</td>
            <td style="padding:5px 6px;text-align:right;">${pct}%</td>
        </tr>`; });
    tCorr+=`<tr style="background:#f8fafc;font-weight:bold;"><td></td><td>TOTAL</td><td style="text-align:right;color:#10b981;">${fmt(totCorr)}</td><td style="text-align:right;color:#94a3b8;">${fmt(Object.values(porRSF).reduce((a,b)=>a+b,0))}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tCorr);

    // Subtotales corrientes por clase
    const clases3=['M','O','X'], claseLabels={'M':'M — Mío','O':'O — Oma','X':'X — Otros'};
    let tClaseCorr=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Gastos Corrientes por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
    clases3.forEach(function(cl){
        const total=listaCorrientes.filter(c=>c.fechaPago&&(c.clase||'M')===cl&&!esPagoTarjeta(c.rubro)).reduce((a,c)=>a+c.monto,0);
        const pct=totCorr>0?((total/totCorr)*100).toFixed(1):'0.0';
        const cc=claseColorMap[cl];
        tClaseCorr+=`<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;"><span style="font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${claseLabels[cl]}</span></td><td style="padding:5px 6px;text-align:right;font-weight:bold;">${fmt(total)}</td><td style="padding:5px 6px;text-align:right;">${pct}%</td></tr>`;
    });
    tClaseCorr+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;color:#10b981;">${fmt(totCorr)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tClaseCorr);

    // Card doble: servicios fijos + corrientes pesos
    const itemsCorrPesos = Object.entries(porR).map(function(e){ return {label:e[0],valor:e[1]}; });
    if(srvConPres.length>0 || itemsCorrPesos.length>0){
        const divDoble = mkTortaDoble(
            'torta-srv','torta-srv-ley','Servicios Fijos · Presupuesto',
            'torta-corr','torta-corr-ley','Gastos Corrientes · por Rubro',
            '#4f46e5','#10b981'
        );
        wrap.appendChild(divDoble);
        if(srvConPres.length>0)
            dibujarTorta('torta-srv','torta-srv-ley', srvConPres.map(function(s){ return {label:s.nombre,valor:s.presupuesto}; }), fmt);
        if(itemsCorrPesos.length>0){
            const colsCorrPesos = itemsCorrPesos.map(function(it){ return colorRubro(it.label); });
            dibujarTorta('torta-corr','torta-corr-ley', itemsCorrPesos, fmt, colsCorrPesos);
        }
    }


    // ── SECCIÓN DÓLARES ────────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#16a34a;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Resumen en Dólares · Mes Actual</h3>');
    if(listaCuentasUSD.length>0||listaTarjetasUSD.length>0||listaServiciosUSD.length>0){
        const mDU2=calcMDU(), tc=tipoCambio;
        const tD=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0), tTU=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU2[t.id]||0)),0), bal=tD-tTU;
        const gU=el('div'); gU.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px;';
        gU.innerHTML=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #16a34a;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD Disponibles</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#16a34a;">${fmtUSD(tD)}</p><small style="color:#64748b;">${fmtARS(tD*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #a855f7;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Pagar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#a855f7;">${fmtUSD(tTU)}</p><small style="color:#64748b;">${fmtARS(tTU*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal>=0?'#16a34a':'#ef4444'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">Balance USD</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal>=0?'#16a34a':'#ef4444'};">${fmtUSD(bal)}</p><small style="color:#64748b;">${fmtARS(Math.abs(bal)*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal<0?'#ef4444':'#94a3b8'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Comprar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal<0?'#ef4444':'#94a3b8'};">${bal<0?fmtUSD(Math.abs(bal)):'—'}</p><small style="color:#64748b;">${bal<0?fmtARS(Math.abs(bal)*tc):''}</small></div>`;
        wrap.appendChild(gU);
        if(listaServiciosUSD.length>0){
            let tSU=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos en USD · TC ${fmtARS(tc)}</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pend. (USD)</th><th style="padding:6px;text-align:right;">Pend. (ARS)</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
            let tpU=0,pgU=0,peU=0;
            listaServiciosUSD.forEach((s,ri)=>{ const pe=Math.max(0,s.presupuesto-s.pagado); tpU+=s.presupuesto; pgU+=s.pagado; peU+=pe; let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
                tSU+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmtUSD(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmtUSD(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmtUSD(pe)}</td><td style="padding:5px 6px;text-align:right;color:#64748b;">${fmtARS(pe*tc)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`; });
            tSU+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${fmtUSD(tpU)}</td><td style="text-align:right;color:#10b981;">${fmtUSD(pgU)}</td><td style="text-align:right;color:#ef4444;">${fmtUSD(peU)}</td><td style="text-align:right;">${fmtARS(peU*tc)}</td><td></td></tr></table></div>`;
            wrap.insertAdjacentHTML('beforeend',tSU);
        }
        // Card doble USD: servicios fijos + corrientes
        const srvUSDConPres = listaServiciosUSD.filter(function(s){ return s.presupuesto>0; });
        const porRubroUSD = {};
        listaCorrientesUSD.filter(function(c){ return !c.esIngreso; }).forEach(function(c){ porRubroUSD[c.rubro]=(porRubroUSD[c.rubro]||0)+c.monto; });
        const itemsCorrUSD = Object.entries(porRubroUSD).map(function(e){ return {label:e[0],valor:e[1]}; });
        if(srvUSDConPres.length>0 || itemsCorrUSD.length>0){
            const divDobleUSD = mkTortaDoble(
                'torta-srv-usd','torta-srv-usd-ley','Servicios Fijos USD · Presupuesto',
                'torta-corr-usd','torta-corr-usd-ley','Gastos Corrientes USD · por Rubro',
                '#4f46e5','#10b981'
            );
            wrap.appendChild(divDobleUSD);
            if(srvUSDConPres.length>0)
                dibujarTorta('torta-srv-usd','torta-srv-usd-ley', srvUSDConPres.map(function(s){ return {label:s.nombre,valor:s.presupuesto}; }), fmtUSD);
            if(itemsCorrUSD.length>0){
                const colsCorrUSD = itemsCorrUSD.map(function(it){ return colorRubro(it.label); });
                dibujarTorta('torta-corr-usd','torta-corr-usd-ley', itemsCorrUSD, fmtUSD, colsCorrUSD);
            }
        }

    } else { wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos en dólares para este mes.</div>'); }

    // ── REPORTE 2: ACUMULADO 12 MESES ─────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#f59e0b;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 2 · Análisis por Rubro · Últimos 12 Meses</h3>');
    const ultimos12=[...historicoMeses].slice(-12);
    const mesesData=ultimos12.map(m=>({nombre:m.nombre,datos:m.datos}));
    mesesData.push({nombre:'Mes Actual',datos:{listaCorrientes,listaRubros}});
    const todosRub2=new Set(); mesesData.forEach(m=>(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>todosRub2.add(c.rubro)));
    const rubrosArr=[...todosRub2].sort();
    if(!rubrosArr.length){ wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;">Sin datos históricos aún.</div>'); }
    else {
        let t2=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:7px 8px;text-align:left;color:white;">Rubro</th>`;
        mesesData.forEach(m=>{ t2+=`<th style="padding:7px 8px;text-align:right;color:white;">${m.nombre.replace(' de ',' ')}</th>`; });
        t2+=`<th style="padding:7px 8px;text-align:right;color:#f59e0b;">TOTAL</th></tr></thead><tbody>`;
        const totMes=new Array(mesesData.length).fill(0); let totGen=0;
        rubrosArr.forEach((rub,ri)=>{ let totR=0; t2+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};"><td style="padding:5px 8px;font-weight:bold;color:#334155;">${rub}</td>`;
            mesesData.forEach((m,mi)=>{ const s=(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0); totMes[mi]+=s; totR+=s; t2+=`<td style="padding:5px 8px;text-align:right;color:${s>0?'#10b981':'#94a3b8'};font-weight:${s>0?'bold':'normal'};">${s>0?fmt(s):'—'}</td>`; });
            totGen+=totR; t2+=`<td style="padding:5px 8px;text-align:right;font-weight:bold;color:#f59e0b;">${fmt(totR)}</td></tr>`; });
        t2+=`<tr style="background:#f1f5f9;font-weight:bold;"><td style="padding:7px 8px;color:#1e293b;">TOTAL MES</td>`;
        totMes.forEach(t=>{ t2+=`<td style="padding:7px 8px;text-align:right;color:#4f46e5;">${fmt(t)}</td>`; });
        t2+=`<td style="padding:7px 8px;text-align:right;color:#f59e0b;">${fmt(totGen)}</td></tr></tbody></table></div>`;
        wrap.insertAdjacentHTML('beforeend',t2);
        const topR=[...rubrosArr].map(r=>({rubro:r,total:mesesData.reduce((a,m)=>a+(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===r&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((b,c)=>b+c.monto,0),0)})).sort((a,b)=>b.total-a.total);
        const totAc=topR.reduce((a,r)=>a+r.total,0);
        let res=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Participación por Rubro (acumulado)</h4>`;
        topR.forEach(r=>{ const pct=totAc>0?(r.total/totAc*100).toFixed(1):0; res+=`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:bold;color:#334155;">${r.rubro}</span><span style="color:#64748b;">${fmt(r.total)} · ${pct}%</span></div><div style="background:#e2e8f0;border-radius:4px;height:10px;"><div style="background:linear-gradient(90deg,#f59e0b,#f97316);height:10px;border-radius:4px;width:${Math.round(pct)}%;"></div></div></div>`; });
        res+=`<div style="font-size:12px;color:#64748b;text-align:right;margin-top:8px;font-weight:bold;">Total acumulado: ${fmt(totAc)}</div></div>`;
        wrap.insertAdjacentHTML('beforeend',res);
    }
    return wrap;
}

// ═══════════════════════════════════════════
//  VISTA HISTÓRICA
// ═══════════════════════════════════════════
function buildHistorico(mes) {
    const db=mes.datos, wrap=el('div');
    const banner=el('div','hist-banner no-print'); banner.innerHTML=`<span style="font-size:20px;">🗂</span><div><strong>Período Cerrado: ${mes.nombre}</strong><div style="font-size:11px;margin-top:2px;">Vista de sólo lectura</div></div>`; wrap.appendChild(banner);
    let sB=0,sT=0,tP=0,fP=0;
    db.listaBancos.forEach(b=>sB+=b.saldo); db.listaTarjetas.forEach(t=>sT+=t.saldo);
    db.listaServicios.forEach(s=>{ tP+=s.pagado; if(s.presupuesto>s.pagado) fP+=(s.presupuesto-s.pagado); });
    db.listaCorrientes.forEach(c=>tP+=c.monto);
    const cont=el('div','container'); cont.style.paddingTop='15px';
    cont.innerHTML=`<div class="grid-dashboard"><div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco (Cierre)</h4><p style="color:#0284c7;">${fmt(sB)}</p></div><div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Deuda Tarjetas (Cierre)</h4><p style="color:#a855f7;">${fmt(sT)}</p></div><div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado</h4><p style="color:#10b981;">${fmt(tP)}</p></div><div class="card-bal" style="border-left:5px solid ${fP>0?'#ef4444':'#10b981'};"><h4>Fijos Pendientes al Cierre</h4><p style="color:${fP>0?'#ef4444':'#10b981'};">${fmt(fP)}</p></div></div>`;
    const gp=el('div','grid-principal');
    const left=el('div'); left.innerHTML=roSimple('🏦 Bancos al Cierre','panel-bancos',['Cuenta','Saldo'],db.listaBancos.map(b=>[b.nombre,fmt(b.saldo)]))+roSimple('💳 Tarjetas al Cierre','panel-tarjetas',['Tarjeta','Deuda'],db.listaTarjetas.map(t=>[t.nombre,fmt(t.saldo)]))+roTransf(db);
    const right=el('div'); right.innerHTML=roServicios(db)+roCorrientes(db);
    gp.appendChild(left); gp.appendChild(right); cont.appendChild(gp); wrap.appendChild(cont);
    return wrap;
}
function roSimple(titulo,cls,headers,rows) {
    const ths=headers.map(h=>`<th>${h}</th>`).join('');
    const trs=!rows.length?`<tr><td colspan="${headers.length}" class="tc" style="color:#94a3b8;padding:12px;">Sin datos</td></tr>`:rows.map(r=>`<tr>${r.map((c,i)=>`<td class="ro-cell${i>0?' ro-money':''}">${c}</td>`).join('')}</tr>`).join('');
    return `<div class="panel ${cls}"><h3 class="panel-title">${titulo}</h3><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}
function roTransf(db) {
    const trs=!(db.listaTransferencias||[]).length?'<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>':db.listaTransferencias.map(t=>`<tr><td class="ro-cell ro-muted">${t.fecha||'—'}</td><td class="ro-cell ro-muted">${t.origenNombre}</td><td class="ro-cell ro-muted">${t.destinoNombre}</td><td class="ro-cell ro-money" style="color:#f59e0b;">${fmt(t.monto)}</td></tr>`).join('');
    return `<div class="panel panel-transf"><h3 class="panel-title">↔️ Transferencias</h3><table><thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th class="tr">Monto</th></tr></thead><tbody>${trs}</tbody></table></div>`;
}
function roServicios(db) {
    const mNom=id=>{ const b=(db.listaBancos||[]).find(x=>x.id===id); const t=(db.listaTarjetas||[]).find(x=>x.id===id); return b?'🏦 '+b.nombre:t?'💳 '+t.nombre:'—'; };
    const rows=db.listaServicios.map(s=>{ let ec='#c5221f',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';et='PAGADO';} else if(s.pagado>0){ec='#b06000';et='PARCIAL';} return `<tr><td class="ro-cell"><b>${s.nombre}</b></td><td class="ro-cell ro-muted">${s.fVto||'—'}</td><td class="ro-cell ro-money">${fmt(s.presupuesto)}</td><td class="ro-cell ro-money">${fmt(s.pagado)}</td><td class="ro-cell ro-muted tc">${s.fPago||'—'}</td><td class="ro-cell ro-muted">${mNom(s.medioPagoId)}</td><td class="tc"><span style="font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;background:${ec}22;color:${ec}">${et}</span></td></tr>`; }).join()||'<tr><td colspan="7" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios</td></tr>';
    return `<div class="panel panel-servicios"><h3 class="panel-title">📋 Servicios Fijos</h3><table><thead><tr><th style="width:22%">Servicio</th><th style="width:13%">Vto.</th><th style="width:12%" class="tr">Presup.</th><th style="width:12%" class="tr">Pagado</th><th style="width:12%" class="tc">F.Pago</th><th style="width:18%">Medio</th><th style="width:11%" class="tc">Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function roCorrientes(db) {
    const mNom=id=>{ const b=(db.listaBancos||[]).find(x=>x.id===id); const t=(db.listaTarjetas||[]).find(x=>x.id===id); return b?'🏦 '+b.nombre:t?'💳 '+t.nombre:'—'; };
    const rows=!db.listaCorrientes.length?'<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin egresos.</td></tr>':db.listaCorrientes.map(c=>`<tr><td class="ro-cell">${c.rubro}</td><td class="ro-cell">${c.detalle}</td><td class="ro-cell ro-muted">${mNom(c.medioPagoId)}</td><td class="ro-cell ro-muted tc">${c.fechaPago||'—'}</td><td class="ro-cell ro-green tr">${fmt(c.monto)}</td></tr>`).join('');
    return `<div class="panel panel-corrientes"><h3 class="panel-title">🛍️ Gastos Corrientes</h3><table><thead><tr><th style="width:22%">Rubro</th><th style="width:28%">Detalle</th><th style="width:23%">Medio</th><th style="width:12%" class="tc">F.Pago</th><th style="width:15%" class="tr">Monto</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}


// ═══════════════════════════════════════════
//  INVERSIONES
// ═══════════════════════════════════════════
let _cotizaciones = {};
let _dolarOficial = 0;

function buildInversiones() {
    const d = document.createElement('div');
    const hdrStyle = 'border-bottom:3px solid #d97706;';
    d.innerHTML = '<div class="container">' +
      '<header class="no-print" style="' + hdrStyle + '">' +
        '<div><h2 style="margin:0;font-size:20px;">📊 Inversiones</h2>' +
        '<p class="version-tag" style="color:#d97706;">Portfolio personal</p></div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<div id="inv-dolar-badge" style="font-size:12px;color:#64748b;padding:6px 10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">Cargando dólar...</div>' +
          '<button class="btn no-print" id="btn-inv-actualizar" style="background:#d97706;color:white;">🔄 Actualizar cotizaciones</button>' +
        '</div>' +
      '</header>' +
      '<div class="grid-dashboard" style="margin-top:20px;">' +
        '<div class="card-bal" style="border-left:5px solid #d97706;"><h4>Total Portfolio (ARS)</h4><p id="inv-total-ars" style="color:#d97706;">$ 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #16a34a;"><h4>Total Portfolio (USD)</h4><p id="inv-total-usd" style="color:#16a34a;">USD 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Instrumentos Manuales</h4><p id="inv-total-manual" style="color:#0284c7;">$ 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #6366f1;"><h4>Acciones</h4><p id="inv-total-acciones" style="color:#6366f1;">$ 0</p></div>' +
      '</div>' +
      '<div class="grid-principal">' +
        '<div>' +
          '<div class="panel no-print" style="border-top:4px solid #0284c7;">' +
            '<h3 class="panel-title">🏦 Instrumentos Manuales</h3>' +
            '<div class="form-block"><form id="form-instrumento">' +
              '<div class="form-row">' +
                '<div style="flex:2"><label>Nombre</label><input type="text" id="inst-nombre" required placeholder="Ej. Super Ahorro Santander"></div>' +
                '<div><label>Moneda</label><select id="inst-moneda"><option value="ARS">$ Pesos</option><option value="USD">USD Dólares</option></select></div>' +
                '<div><label>Monto</label><input type="number" id="inst-monto" required value="0" step="0.01"></div>' +
                '<div><label>Vencimiento</label><input type="date" id="inst-vto"></div>' +
              '</div>' +
              '<button type="submit" class="btn btn-add btn-blue">Agregar Instrumento</button>' +
            '</form></div>' +
            '<div id="t-instrumentos"></div>' +
          '</div>' +
          '<div class="panel no-print" style="border-top:4px solid #6366f1;">' +
            '<h3 class="panel-title">📈 Acciones</h3>' +
            '<div class="form-block"><form id="form-accion">' +
              '<div class="form-row">' +
                '<div><label>Ticker (con .BA)</label><input type="text" id="acc-ticker" required placeholder="YPFD.BA" style="text-transform:uppercase;" title="Incluir sufijo .BA para acciones argentinas"></div>' +
                '<div style="flex:2"><label>Descripción</label><input type="text" id="acc-desc" required placeholder="Ej. YPF Derecho"></div>' +
                '<div><label>Cantidad</label><input type="number" id="acc-cant" required value="1" step="1" min="1"></div>' +
              '</div>' +
              '<button type="submit" class="btn btn-add" style="background:#6366f1;">Agregar Acción</button>' +
            '</form></div>' +
            '<div id="t-acciones"></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:20px;margin-bottom:16px;">' +
            '<h3 class="panel-title">Cotización histórica · 30 días</h3>' +
            '<div id="inv-charts-wrap" style="display:flex;flex-direction:column;gap:20px;">' +
              '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0;">Cargando datos...</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    return d;
}

function bindInversiones() {
    document.getElementById('form-instrumento')?.addEventListener('submit', altaInstrumento);
    document.getElementById('form-accion')?.addEventListener('submit', altaAccion);
    document.getElementById('btn-inv-actualizar')?.addEventListener('click', actualizarInversiones);
    document.getElementById('acc-ticker')?.addEventListener('input', function(e) { e.target.value = e.target.value.toUpperCase(); });
}

function altaInstrumento(e) {
    e.preventDefault();
    const moneda = document.getElementById('inst-moneda').value;
    const monto = parseFloat(document.getElementById('inst-monto').value) || 0;
    listaInstrumentos.push({id:'inst_'+Date.now(), nombre:vGet('inst-nombre'), moneda, monto, vto:vGet('inst-vto')});
    guardar(); e.target.reset(); renderInstrumentos(); calcDashInv();
}
function altaAccion(e) {
    e.preventDefault();
    const ticker = vGet('acc-ticker').toUpperCase();
    if(listaAcciones.find(function(a){ return a.ticker===ticker; })){ alert('Ese ticker ya está agregado.'); return; }
    listaAcciones.push({id:'acc_'+Date.now(), ticker, desc:vGet('acc-desc'), cant:parseInt(document.getElementById('acc-cant').value)||1});
    guardar(); e.target.reset(); actualizarInversiones();
}
function elimInstrumento(id) { listaInstrumentos=listaInstrumentos.filter(function(x){ return x.id!==id; }); guardar(); renderInstrumentos(); calcDashInv(); }
function elimAccion(id)      { listaAcciones=listaAcciones.filter(function(x){ return x.id!==id; });         guardar(); renderAcciones(); calcDashInv(); }

function renderInstrumentos() {
    const wrap = document.getElementById('t-instrumentos'); if(!wrap) return;
    wrap.innerHTML = '';
    if(!listaInstrumentos.length){
        wrap.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;font-size:13px;">Sin instrumentos.</p>';
        return;
    }
    const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
    listaInstrumentos.forEach(function(inst) {
        const moneda = inst.moneda || 'ARS';
        const montoARS = moneda === 'USD' ? inst.monto * tc : inst.monto;
        const montoStr = moneda === 'USD' ? fmtUSD(inst.monto) : fmt(inst.monto);
        const monedaColor = moneda === 'USD' ? '#15803d' : '#1d4ed8';
        const monedaBg    = moneda === 'USD' ? '#dcfce7' : '#dbeafe';
        const vtoStr = inst.vto ? new Date(inst.vto+'T00:00:00').toLocaleDateString('es-AR') : '—';
        const borderColor = moneda === 'USD' ? '#16a34a' : '#0284c7';

        const card = el('div');
        card.style.cssText = 'border:1px solid #e2e8f0;border-left:4px solid '+borderColor+';border-radius:6px;padding:12px;margin-bottom:8px;background:white;';

        // Fila 1: nombre + badge moneda + botón eliminar
        const row1 = el('div');
        row1.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
        const izq = el('div'); izq.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const nomSpan = el('span'); nomSpan.style.cssText='font-weight:bold;color:#1e293b;font-size:14px;'; nomSpan.innerText=inst.nombre;
        const badge = el('span'); badge.style.cssText='font-size:10px;font-weight:bold;padding:2px 7px;border-radius:4px;background:'+monedaBg+';color:'+monedaColor+';'; badge.innerText=moneda;
        izq.appendChild(nomSpan); izq.appendChild(badge);
        const btnX = el('button','btn-del'); btnX.innerText='✕'; btnX.onclick=function(){ elimInstrumento(inst.id); };
        row1.appendChild(izq); row1.appendChild(btnX);

        // Fila 2: monto editable + en pesos + vencimiento
        const row2 = el('div');
        row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:center;';

        const mkCell = function(label, contenido) {
            const c = el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
            const l = el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; l.innerText=label;
            c.appendChild(l); c.appendChild(contenido); return c;
        };

        // Monto editable
        let inpMonto;
        if(moneda === 'USD'){
            inpMonto = inpNumUSD(inst.monto, function(v){ inst.monto=v; guardar(); renderInstrumentos(); calcDashInv(); });
            inpMonto.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:'+monedaColor+';background:white;text-align:right;';
        } else {
            inpMonto = inpNum(inst.monto, function(v){ inst.monto=v; guardar(); renderInstrumentos(); calcDashInv(); });
            inpMonto.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:'+monedaColor+';background:white;text-align:right;';
        }

        const vEnPesos = el('div'); vEnPesos.style.cssText='font-size:14px;font-weight:bold;color:#0284c7;'; vEnPesos.innerText=moneda==='USD'?fmt(montoARS):'—';
        const vVto = el('div'); vVto.style.cssText='font-size:13px;font-weight:bold;color:#334155;'; vVto.innerText=vtoStr;

        row2.appendChild(mkCell(moneda==='USD'?'Monto (USD)':'Monto ($)', inpMonto));
        row2.appendChild(mkCell('En pesos', vEnPesos));
        row2.appendChild(mkCell('Vencimiento', vVto));

        card.appendChild(row1); card.appendChild(row2);
        wrap.appendChild(card);
    });
}

function renderAcciones() {
    const wrap = document.getElementById('t-acciones'); if(!wrap) return;
    wrap.innerHTML = '';
    if(!listaAcciones.length){
        wrap.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;font-size:13px;">Sin acciones. Agregá un ticker para empezar.</p>';
        return;
    }
    listaAcciones.forEach(function(a) {
        const cot = _cotizaciones[a.ticker] || {};
        const precio = cot.precio || 0, variacion = cot.variacion || 0;
        const esLocal = a.ticker.toUpperCase().endsWith('.BA');
        const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
        // Valuación siempre en pesos para el dashboard
        const valuacionARS = esLocal ? precio * a.cant : precio * a.cant * tc;
        const varColor = variacion > 0 ? '#16a34a' : variacion < 0 ? '#ef4444' : '#64748b';
        const varStr = (variacion > 0 ? '+' : '') + variacion.toFixed(2) + '%';
        const varBg = variacion > 0 ? '#dcfce7' : variacion < 0 ? '#fee2e2' : '#f1f5f9';

        const card = el('div');
        card.style.cssText = 'border:1px solid #e2e8f0;border-left:4px solid #6366f1;border-radius:6px;padding:12px;margin-bottom:8px;background:white;';

        // Fila 1: ticker + descripción + botón eliminar
        const row1 = el('div');
        row1.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
        const tickerSpan = el('span');
        tickerSpan.style.cssText = 'font-weight:bold;color:#6366f1;font-size:15px;';
        tickerSpan.innerText = a.ticker;
        const descSpan = el('span');
        descSpan.style.cssText = 'font-size:12px;color:#64748b;margin-left:10px;';
        descSpan.innerText = a.desc;
        const izq = el('div'); izq.appendChild(tickerSpan); izq.appendChild(descSpan);
        const btnX = el('button','btn-del'); btnX.innerText='✕'; btnX.onclick=function(){ elimAccion(a.id); };
        row1.appendChild(izq); row1.appendChild(btnX);

        // Fila 2: cantidad editable + precio + variación + valuación
        const row2 = el('div');
        row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;';

        const mkCell = function(label, valor, color) {
            const c = el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
            const l = el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; l.innerText=label;
            const v = el('div'); v.style.cssText='font-size:14px;font-weight:bold;color:'+(color||'#1e293b')+';'; v.innerText=valor;
            c.appendChild(l); c.appendChild(v); return c;
        };

        // Celda cantidad: editable
        const celdaCant = el('div'); celdaCant.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
        const lCant = el('div'); lCant.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; lCant.innerText='Cantidad';
        const inpCant = el('input'); inpCant.type='number'; inpCant.value=a.cant; inpCant.min='1';
        inpCant.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:#1e293b;background:white;text-align:center;';
        inpCant.onchange = function(e){ a.cant=parseInt(e.target.value)||1; guardar(); renderAcciones(); calcDashInv(); };
        celdaCant.appendChild(lCant); celdaCant.appendChild(inpCant);

        const celdaVar = el('div'); celdaVar.style.cssText='background:'+varBg+';border-radius:4px;padding:6px 8px;';
        const lVar = el('div'); lVar.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; lVar.innerText='Variación';
        const vVar = el('div'); vVar.style.cssText='font-size:14px;font-weight:bold;color:'+varColor+';'; vVar.innerText=precio?varStr:'—';
        celdaVar.appendChild(lVar); celdaVar.appendChild(vVar);

        row2.appendChild(celdaCant);
        const precioStr = precio ? (esLocal ? fmt(precio) : fmtUSD(precio)) : 'Actualizando...';
        const valStr    = valuacionARS ? fmt(valuacionARS) + (esLocal ? '' : ' ≈') : '—';
        row2.appendChild(mkCell('Precio', precioStr, '#1e293b'));
        row2.appendChild(celdaVar);
        row2.appendChild(mkCell('Valuación (ARS)', valStr, '#6366f1'));

        card.appendChild(row1); card.appendChild(row2);
        wrap.appendChild(card);
    });
}

function calcDashInv() {
    const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
    const totalManual = listaInstrumentos.reduce(function(a,i){
        return a + ((i.moneda==='USD') ? i.monto*tc : i.monto);
    }, 0);
    const totalAcc = listaAcciones.reduce(function(a,ac){
        const p=(_cotizaciones[ac.ticker]||{}).precio||0;
        const esL=ac.ticker.toUpperCase().endsWith('.BA');
        const tc2=_dolarOficial>0?_dolarOficial:tipoCambio;
        return a+(esL?p*ac.cant:p*ac.cant*tc2);
    }, 0);
    const totalARS = totalManual + totalAcc;
    const totalUSD = _dolarOficial > 0 ? totalARS / _dolarOficial : 0;
    setTxt('inv-total-ars',     fmt(totalARS));
    setTxt('inv-total-usd',     fmtUSD(totalUSD));
    setTxt('inv-total-manual',  fmt(totalManual));
    setTxt('inv-total-acciones',fmt(totalAcc));
}

async function actualizarInversiones() {
    const btn = document.getElementById('btn-inv-actualizar');
    if(btn){ btn.disabled=true; btn.innerText='⏳ Actualizando...'; }

    // 1. Dólar oficial
    try {
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await res.json();
        _dolarOficial = data.oficial.value_sell;
        const badge = document.getElementById('inv-dolar-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(_dolarOficial) + ' (venta)';
    } catch(e) { console.warn('Error dólar:', e); }

    // 2. Cotizaciones vía Yahoo Finance + allorigins proxy
    for(let i=0; i<listaAcciones.length; i++) {
        const acc = listaAcciones[i];
        try {
            const url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+acc.ticker+'?interval=1d&range=30d';
            const proxy = 'https://corsproxy.io/?' + url;
            const res = await fetch(proxy);
            const data = await res.json();
            if(!data.chart || !data.chart.result || !data.chart.result[0]) {
                console.warn('Sin datos para '+acc.ticker+'. Error:', data.chart && data.chart.error);
                continue;
            }
            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            const historia = [];
            for(let j=0; j<timestamps.length; j++) {
                if(closes[j] != null) {
                    const fecha = new Date(timestamps[j]*1000).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'});
                    historia.push({fecha: fecha, cierre: closes[j]});
                }
            }

            const precio = meta.regularMarketPrice || closes.filter(function(c){ return c!=null; }).pop() || 0;
            const prevClose = meta.chartPreviousClose || 0;
            const variacion = prevClose > 0 ? ((precio - prevClose) / prevClose) * 100 : 0;

            _cotizaciones[acc.ticker] = {precio: precio, variacion: variacion, historia: historia};
        } catch(e) { console.warn('Error cotización '+acc.ticker+':', e); }
    }

    renderInstrumentos();
    renderAcciones();
    calcDashInv();
    renderGraficosInv();

    if(btn){ btn.disabled=false; btn.innerText='🔄 Actualizar cotizaciones'; }
}

function renderGraficosInv() {
    const wrap = document.getElementById('inv-charts-wrap'); if(!wrap) return;
    wrap.innerHTML = '';

    if(!listaAcciones.length){
        wrap.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0;">Agregá acciones para ver los gráficos.</p>';
        return;
    }

    listaAcciones.forEach(function(acc, ai) {
        const cot = _cotizaciones[acc.ticker];
        if(!cot || !cot.historia.length) return;

        const hist = cot.historia;
        const div = el('div'); div.style.marginBottom = '24px';

        const titulo = el('h4'); titulo.style.cssText='font-size:12px;font-weight:bold;color:#1e293b;margin:0 0 12px;';
        titulo.innerText = acc.ticker + ' — ' + acc.desc;
        div.appendChild(titulo);

        const selDiv = el('div'); selDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
        const modos = ['Precio','Total ARS','Total USD'];
        const canvasId = 'chart-'+acc.ticker.replace('.','_')+'-'+ai;

        modos.forEach(function(m, mi) {
            const btn = el('button'); btn.className='btn';
            btn.style.cssText = 'font-size:11px;padding:4px 10px;' + (mi===0?'background:#6366f1;color:white;':'background:#f1f5f9;color:#334155;');
            btn.innerText = m;
            btn.onclick = function() {
                for(let k=0; k<selDiv.children.length; k++) selDiv.children[k].style.cssText='font-size:11px;padding:4px 10px;background:'+(k===mi?'#6366f1;color:white;':'#f1f5f9;color:#334155;');
                dibujarLineaInv(canvasId, hist, acc, mi, _dolarOficial);
            };
            selDiv.appendChild(btn);
        });

        const cvEl = el('canvas'); cvEl.id = canvasId; cvEl.style.cssText='width:100%;height:180px;';
        div.appendChild(selDiv); div.appendChild(cvEl);
        wrap.appendChild(div);

        setTimeout(function(){ dibujarLineaInv(canvasId, hist, acc, 0, _dolarOficial); }, 80*ai);
    });
}

function dibujarLineaInv(canvasId, hist, acc, modo, dolarOficial) {
    const cv = document.getElementById(canvasId); if(!cv) return;
    const W = cv.offsetWidth || 400, H = 180;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const valores = hist.map(function(h) {
        if(modo===0) return h.cierre;
        if(modo===1) return h.cierre * acc.cant;
        return dolarOficial > 0 ? (h.cierre * acc.cant / dolarOficial) : 0;
    });
    const fmtEje = modo===2 ? fmtUSD : fmt;
    const col = modo===0 ? '#6366f1' : modo===1 ? '#d97706' : '#16a34a';

    const minV = Math.min.apply(null, valores), maxV = Math.max.apply(null, valores);
    const rng = maxV - minV || 1;
    const pad = {t:20, r:10, b:30, l:75};
    const W2 = W - pad.l - pad.r, H2 = H - pad.t - pad.b;

    function xPos(i) { return pad.l + i * (W2 / (valores.length-1 || 1)); }
    function yPos(v) { return pad.t + H2 - (v-minV)/rng*H2; }

    // Área
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(valores[0]));
    valores.forEach(function(v,i){ if(i>0) ctx.lineTo(xPos(i), yPos(v)); });
    ctx.lineTo(xPos(valores.length-1), H-pad.b);
    ctx.lineTo(xPos(0), H-pad.b);
    ctx.closePath();
    ctx.fillStyle = col+'22'; ctx.fill();

    // Línea
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(valores[0]));
    valores.forEach(function(v,i){ if(i>0) ctx.lineTo(xPos(i), yPos(v)); });
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();

    // Eje Y - solo min y max con fondo blanco
    [minV, maxV].forEach(function(v) {
        const y = yPos(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y);
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();
        const label = fmtEje(v);
        ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';
        const tw3 = ctx.measureText(label).width + 8;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(pad.l+4, y-19, tw3, 17);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(label, pad.l+6, y-6);
    });
    // Eje X
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(hist.length/5));
    hist.forEach(function(h, i) { if(i%step===0 || i===hist.length-1) ctx.fillText(h.fecha, xPos(i), H-pad.b+16); });
    // Punto final con caja
    const lastX = xPos(valores.length-1), lastY = yPos(valores[valores.length-1]);
    ctx.beginPath(); ctx.arc(lastX, lastY, 5, 0, 2*Math.PI); ctx.fillStyle=col; ctx.fill();
    const lastLabel = fmtEje(valores[valores.length-1]);
    ctx.font = 'bold 13px Arial';
    const tw2 = ctx.measureText(lastLabel).width + 14;
    const bx = Math.min(lastX - tw2/2, W - pad.r - tw2 - 2);
    const by = Math.max(pad.t + 2, lastY - 34);
    ctx.fillStyle = col; ctx.fillRect(bx, by, tw2, 22);
    ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.fillText(lastLabel, bx + tw2/2, by + 16);
}

// ═══════════════════════════════════════════
//  GOOGLE DRIVE
// ═══════════════════════════════════════════
const GDRIVE_CLIENT_ID='1049169592532-is5j1j4s1bmgrc9tsq48slrgul8fbj17.apps.googleusercontent.com';
const GDRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
let gToken=null;

function driveCargarGoogle(cb) {
    if(typeof google!=='undefined'){ cb(); return; }
    const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client';
    s.onload=cb; s.onerror=()=>alert('No se pudo cargar Google. Verificá la conexión.'); document.head.appendChild(s);
}
function driveGetToken(cb) {
    driveCargarGoogle(()=>{
        if(gToken){ cb(gToken); return; }
        const client=google.accounts.oauth2.initTokenClient({
            client_id:GDRIVE_CLIENT_ID, scope:GDRIVE_SCOPE,
            hint:'factory.viking.systems@gmail.com', prompt:'',
            callback:resp=>{
                if(resp.error==='interaction_required'){
                    const c2=google.accounts.oauth2.initTokenClient({client_id:GDRIVE_CLIENT_ID,scope:GDRIVE_SCOPE,hint:'factory.viking.systems@gmail.com',callback:r2=>{ if(r2.error){alert('Error: '+r2.error);return;} gToken=r2.access_token; cb(gToken); }});
                    c2.requestAccessToken(); return;
                }
                if(resp.error){alert('Error Google: '+resp.error);return;}
                gToken=resp.access_token; cb(gToken);
            }
        });
        client.requestAccessToken({prompt:''});
    });
}
function driveSubir() {
    driveGetToken(token=>{
        const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
        const nombre='backup_finanzas_'+ts+'.json';
        const data=JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros});
        const meta=JSON.stringify({name:nombre,parents:['appDataFolder']});
        const form=new FormData();
        form.append('metadata',new Blob([meta],{type:'application/json'}));
        form.append('file',new Blob([data],{type:'application/json'}));
        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token},body:form})
        .then(r=>r.json()).then(f=>{ if(f.id) alert('Backup guardado en Drive: '+nombre); else{alert('Error al subir: '+JSON.stringify(f));gToken=null;} })
        .catch(e=>{alert('Error: '+e.message);gToken=null;});
    });
}
function driveRestaurar() {
    driveGetToken(token=>{
        fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&orderBy=modifiedTime+desc&pageSize=20',{headers:{Authorization:'Bearer '+token}})
        .then(r=>r.json()).then(data=>{
            const arch=(data.files||[]).filter(f=>f.name.startsWith('backup_finanzas_'));
            mostrarModalDrive(arch,token);
        }).catch(e=>{alert('Error al listar Drive: '+e.message);gToken=null;});
    });
}
function mostrarModalDrive(arch,token) {
    document.getElementById('modal-drive')?.remove();
    const ov=el('div'); ov.id='modal-drive';
    ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;';
    const box=el('div'); box.style.cssText='background:white;border-radius:12px;width:480px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;';
    const hdr=el('div'); hdr.style.cssText='background:#1e293b;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;';
    const h3=el('h3'); h3.style.cssText='margin:0;color:white;font-size:15px;'; h3.innerText='☁️ Backups en Google Drive';
    const bX=el('button'); bX.innerText='✕'; bX.style.cssText='background:transparent;border:none;color:white;font-size:18px;cursor:pointer;'; bX.onclick=()=>ov.remove();
    hdr.appendChild(h3); hdr.appendChild(bX);
    const body=el('div'); body.style.cssText='padding:20px;max-height:50vh;overflow-y:auto;';
    if(!arch.length){ body.innerHTML='<p style="color:#64748b;text-align:center;padding:20px;">Sin backups en Drive. Usá ☁️ Subir para crear el primero.</p>'; }
    else { arch.forEach(f=>{
        const item=el('div'); item.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:8px;cursor:pointer;';
        item.onmouseover=()=>item.style.background='#f1f5f9'; item.onmouseout=()=>item.style.background='';
        const fecha=new Date(f.modifiedTime).toLocaleString('es-AR');
        const lft=el('div'); lft.innerHTML=`<div style="font-size:13px;font-weight:bold;color:#1e293b;">${f.name}</div><div style="font-size:11px;color:#64748b;">${fecha}</div>`;
        const btn=el('span'); btn.innerText='Restaurar →'; btn.style.cssText='font-size:11px;color:#4285f4;font-weight:bold;';
        item.appendChild(lft); item.appendChild(btn); item.onclick=()=>driveCargar(f.id,f.name,token,ov); body.appendChild(item);
    }); }
    const foot=el('div'); foot.style.cssText='padding:16px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;';
    const bC=el('button','btn'); bC.style.cssText='background:#e2e8f0;color:#334155;'; bC.innerText='Cancelar'; bC.onclick=()=>ov.remove(); foot.appendChild(bC);
    box.appendChild(hdr); box.appendChild(body); box.appendChild(foot); ov.appendChild(box); document.body.appendChild(ov);
}
function driveCargar(id,nombre,token,modal) {
    if(!confirm('Restaurar "'+nombre+'"? Se reemplazarán todos los datos.')) return;
    modal.remove();
    fetch('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{headers:{Authorization:'Bearer '+token}})
    .then(r=>r.json()).then(res=>{
        if(!res.listaBancos){alert('Backup inválido.');return;}
        cargarDatos(res); guardar(); renderTabs(); renderContenido();
        alert('Backup restaurado: '+nombre);
    }).catch(e=>alert('Error al descargar: '+e.message));
}

// ═══════════════════════════════════════════
//  SERVICE WORKER
// ═══════════════════════════════════════════
if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
        navigator.serviceWorker.register('./sw.js').then(reg=>{
            console.log('SW:', reg.scope);
            reg.addEventListener('updatefound', ()=>{
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', ()=>{
                    if(newWorker.state==='installed' && navigator.serviceWorker.controller){
                        const banner = document.createElement('div');
                        banner.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:12px 20px;border-radius:8px;z-index:9999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-size:13px;';
                        banner.innerHTML='🆕 Nueva versión disponible. <button onclick="window.location.reload()" style="background:#4f46e5;color:white;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-weight:bold;font-size:12px;">Actualizar</button>';
                        document.body.appendChild(banner);
                    }
                });
            });
        }).catch(e=>console.log('SW error:',e));
    });
}
