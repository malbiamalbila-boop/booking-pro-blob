
"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false }) as any;

type Vehicle = { id: string; display_name: string; plate: string; color?: string };
type Customer = { id: string; full_name: string; phone?: string };
type Booking = { id: string; vehicle_id: string; customer_id?: string; starts_at: string; ends_at: string; status: string; price_bam?: string; display_name: string; full_name?: string; };
type Doc = { id: string; kind: string; file_key: string; mime_type: string; size_bytes: number; uploaded_at: string };
type EventItem = { id: string; title: string; start: string | Date; end: string | Date; source?: string };

export default function Page(){
  const [tab, setTab] = useState<"dashboard"|"calendar"|"vehicles"|"customers">("calendar");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [msg, setMsg] = useState<string>(""); 
  const [form, setForm] = useState<any>({ vehicle_id:"", starts_at:"", ends_at:"", full_name:"", phone:"", price_bam:"", notes:"" });
  const [range, setRange] = useState<{start?: Date,end?: Date}>({});
  const [upload, setUpload] = useState<{customer_id?:string, kind:'passport'|'id'|'driver_license'|'other', file?:File}>({ kind: 'driver_license' });

  const loadVehicles = async ()=> setVehicles(await fetch("/api/vehicles").then(r=>r.json()));
  const loadBookings = async ()=> { const qs=new URLSearchParams(); if(range.start) qs.set("from", range.start.toISOString()); if(range.end) qs.set("to", range.end.toISOString()); const res=await fetch("/api/bookings?"+qs.toString()); setBookings(await res.json()); };
  const loadCustomers = async ()=> setCustomers(await fetch("/api/customers").then(r=>r.json()));
  const loadDocs = async (customerId?: string)=> { if(!customerId) return setDocs([]); const res=await fetch("/api/documents?customer_id="+customerId); setDocs(await res.json()); };

  useEffect(()=>{ loadVehicles(); loadCustomers(); },[]);
  useEffect(()=>{ loadBookings(); },[range.start?.toISOString(), range.end?.toISOString()]);

  // External ICS
  const [externalEvents, setExternalEvents] = useState<EventItem[]>([]);
  const refreshGoogle = async () => { try{ const ev=await fetch("/api/google-events").then(r=>r.json()); setExternalEvents(ev.map((e:any)=>({id:e.id,title:e.title,start:e.start,end:e.end,source:"google"}))); }catch{} };
  useEffect(()=>{ if (tab === "calendar") refreshGoogle(); }, [tab]);

  const calEvents = useMemo(()=> { const local:EventItem[] = bookings.map(b=>({ id:b.id, title:`${b.display_name}${b.full_name?" · "+b.full_name:""}`, start:b.starts_at, end:b.ends_at, source:"local" })); return [...local, ...externalEvents]; }, [bookings, externalEvents]);

  async function addVehicle(){ const display_name=prompt("Bilens namn/etikett")||""; const plate=prompt("Registreringsnummer")||""; const color=prompt("Färg (valfritt)")||""; if(!display_name||!plate) return; await fetch("/api/vehicles",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({display_name,plate,color:color||null})}); await loadVehicles(); }
  async function createBooking(e:any){ e.preventDefault(); setMsg(""); let customer_id:string|undefined=undefined; if(form.full_name){ const c=await fetch("/api/customers",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({full_name:form.full_name, phone:form.phone})}).then(r=>r.json()); customer_id=c.id; } const res=await fetch("/api/bookings",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ vehicle_id:form.vehicle_id, customer_id, starts_at:form.starts_at, ends_at:form.ends_at, price_bam: form.price_bam?Number(form.price_bam):null, notes: form.notes||null })}); if(res.status===201){ setForm((f:any)=>({...f, starts_at:"", ends_at:"", full_name:"", phone:"", price_bam:"", notes:"" })); setMsg("✅ Bokning skapad."); await loadBookings(); setTab("calendar"); } else { const data=await res.json(); setMsg("❌ "+(data?.error||"Kunde inte skapa bokning")); } }

  async function doUpload(){
    if (!upload.customer_id || !upload.file) { alert("Välj kund och fil"); return; }
    const fd = new FormData();
    fd.append("file", upload.file);
    fd.append("entity", "customer");
    fd.append("entity_id", upload.customer_id);
    fd.append("kind", upload.kind);

    const up = await fetch("/api/uploads/put", { method: "POST", body: fd });
    if (!up.ok) { alert("Uppladdning misslyckades"); return; }
    const { file_key, mime, size } = await up.json();

    await fetch("/api/documents", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ customer_id: upload.customer_id, kind: upload.kind, file_key, mime_type: mime, size_bytes: size })
    });
    await loadDocs(upload.customer_id);
    alert("✅ Uppladdad");
  }

  return (<>
    <div className="tabs">
      {["dashboard","calendar","vehicles","customers"].map(t=> <button key={t} className={`tab ${tab===t?'tab-active':''}`} onClick={()=>setTab(t as any)}>{t}</button>)}
    </div>

    {tab==="calendar" && (<div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Kalender</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={refreshGoogle}>↻ Hämta Google-ICS</button>
          <a className="btn" href="/api/ics">⬇︎ Export ICS</a>
        </div>
      </div>
      <FullCalendar plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin]} initialView="timeGridWeek" headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }} height="auto" events={calEvents} datesSet={(arg:any)=> setRange({start:arg.start, end:arg.end})} />
    </div>)}

    {tab==="vehicles" && (<div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Bilar</h2>
        <button className="btn" onClick={addVehicle}>+ Lägg till bil</button>
      </div>
      <table className="table"><thead><tr><th>Namn</th><th>Regnr</th><th>Färg</th></tr></thead><tbody>
        {vehicles.map(v=> (<tr key={v.id}><td>{v.display_name}</td><td>{v.plate}</td><td>{v.color||"-"}</td></tr>))}
      </tbody></table>
    </div>)}

    {tab==="customers" && (<div className="grid2">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Ny bokning</h2>
        <form className="grid md:grid-cols-3 gap-2" onSubmit={createBooking}>
          <select className="select" value={form.vehicle_id} onChange={e=>setForm((f:any)=>({...f, vehicle_id:e.target.value}))}>
            <option value="">Välj bil</option>
            {vehicles.map(v=> <option key={v.id} value={v.id}>{v.display_name}</option>)}
          </select>
          <input className="input" type="datetime-local" value={form.starts_at} onChange={e=>setForm((f:any)=>({...f, starts_at:e.target.value}))} required />
          <input className="input" type="datetime-local" value={form.ends_at} onChange={e=>setForm((f:any)=>({...f, ends_at:e.target.value}))} required />
          <input className="input" placeholder="Kundnamn (valfritt)" value={form.full_name} onChange={e=>setForm((f:any)=>({...f, full_name:e.target.value}))} />
          <input className="input" placeholder="Telefon (valfritt)" value={form.phone} onChange={e=>setForm((f:any)=>({...f, phone:e.target.value}))} />
          <input className="input" placeholder="Pris (BAM)" value={form.price_bam||""} onChange={e=>setForm((f:any)=>({...f, price_bam:e.target.value}))} />
          <input className="input md:col-span-2" placeholder="Anteckningar" value={form.notes||""} onChange={e=>setForm((f:any)=>({...f, notes:e.target.value}))} />
          <button className="btn" type="submit">Spara</button>
        </form>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">ID-dokument (kund)</h2>
        <div className="grid md:grid-cols-3 gap-2 mb-2">
          <select className="select" value={upload.customer_id||""} onChange={e=>{ setUpload(u=>({...u, customer_id:e.target.value})); loadDocs(e.target.value); }}>
            <option value="">Välj kund</option>
            {customers.map(c=> <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <select className="select" value={upload.kind} onChange={e=>setUpload(u=>({...u, kind: e.target.value as any}))}>
            <option value="driver_license">Körkort</option>
            <option value="passport">Pass</option>
            <option value="id">ID-kort</option>
            <option value="other">Annat</option>
          </select>
          <input className="file:btn input" type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=> setUpload(u=>({...u, file: e.target.files?.[0]}))} />
          <button className="btn" onClick={doUpload}>Ladda upp</button>
        </div>
        <table className="table">
          <thead><tr><th>Typ</th><th>MIME</th><th>Storlek</th><th>Datum</th><th></th></tr></thead>
          <tbody>
            {docs.map(d=> (
              <tr key={d.id}>
                <td>{d.kind}</td>
                <td>{d.mime_type}</td>
                <td>{Math.round(d.size_bytes/1024)} KB</td>
                <td>{new Date(d.uploaded_at).toLocaleString()}</td>
                <td><a className="btn" href={`/api/documents/${d.id}/download`}>Hämta</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>)}

    {tab==="dashboard" && (<div className="grid2">
      <div className="card"><h2 className="text-lg font-semibold mb-2">Snabb statistik</h2><div className="text-sm opacity-80">Bilar: {vehicles.length} · Kunder: {customers.length} · Bokningar (intervall): {bookings.length}</div></div>
      <div className="card"><h2 className="text-lg font-semibold mb-2">Snabb åtgärd</h2><button className="btn mr-2" onClick={()=>setTab("vehicles")}>+ Lägg till bil</button><button className="btn" onClick={()=>setTab("calendar")}>Öppna kalender</button></div>
    </div>)}
  </>);
}
