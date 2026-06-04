import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const DAYS_HDR = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function parseVal(val: string): [number, number, number] {
  if (!val) { const t = new Date(); return [t.getFullYear(), t.getMonth()+1, t.getDate()]; }
  return val.split("-").map(Number) as [number,number,number];
}

function toDisplay(val: string) {
  if (!val) return "Pilih tanggal";
  const [y,m,d] = val.split("-");
  return `${d}/${m}/${y}`;
}

function fromParts(y:number,m:number,d:number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function daysInMonth(y:number,m:number) { return new Date(y,m,0).getDate(); }
function firstDay(y:number,m:number) { return new Date(y,m-1,1).getDay(); }

const CUR = new Date().getFullYear();
const YEARS = Array.from({length: CUR+20-2000+1},(_,i)=>2000+i);

export function DatePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"day"|"month"|"year">("day");
  const [navY, setNavY] = useState(() => parseVal(value)[0]);
  const [navM, setNavM] = useState(() => parseVal(value)[1]);
  const [selY, selM, selD] = parseVal(value);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "year" && yearRef.current) {
      const el = yearRef.current.querySelector("[data-sel=true]") as HTMLElement;
      el?.scrollIntoView({ block:"center", behavior:"instant" });
    }
  }, [view]);

  const close = () => { setOpen(false); setView("day"); };

  const pickDay = (d:number) => { onChange(fromParts(navY,navM,d)); close(); };
  const pickMonth = (m:number) => { setNavM(m); setView("day"); };
  const pickYear = (y:number) => { setNavY(y); setView("day"); };

  const prevM = () => navM===1 ? (setNavM(12),setNavY(y=>y-1)) : setNavM(m=>m-1);
  const nextM = () => navM===12 ? (setNavM(1),setNavY(y=>y+1)) : setNavM(m=>m+1);

  const total = daysInMonth(navY,navM);
  const fd    = firstDay(navY,navM);

  return (
    <Popover open={open} onOpenChange={o=>{ setOpen(o); if(!o) setView("day"); }}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(
          "w-full h-10 flex items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-left hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
          !value && "text-muted-foreground", className
        )}>
          <span>{toDisplay(value)}</span>
          <CalendarIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0 overflow-hidden" align="start">

        {/* ── YEAR VIEW ── */}
        {view==="year" && (
          <div className="p-3">
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Pilih Tahun</p>
            <div ref={yearRef} className="grid grid-cols-3 gap-1 max-h-56 overflow-y-auto pr-1">
              {YEARS.map(y=>(
                <button key={y} data-sel={y===navY}
                  onClick={()=>pickYear(y)}
                  className={cn(
                    "rounded-md py-2 text-sm font-medium transition-colors hover:bg-accent",
                    y===navY && "bg-primary text-primary-foreground",
                    y===CUR && y!==navY && "text-primary font-bold"
                  )}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view==="month" && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button onClick={()=>setNavY(y=>y-1)} className="p-1 rounded hover:bg-accent"><ChevronLeft className="size-4"/></button>
              <button onClick={()=>setView("year")} className="text-sm font-semibold hover:bg-accent rounded px-2 py-1">
                {navY}
              </button>
              <button onClick={()=>setNavY(y=>y+1)} className="p-1 rounded hover:bg-accent"><ChevronRight className="size-4"/></button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((name,i)=>{
                const m=i+1;
                const isSel = m===navM && navY===selY;
                const isCurMo = m===new Date().getMonth()+1 && navY===CUR;
                return (
                  <button key={m} onClick={()=>pickMonth(m)}
                    className={cn(
                      "rounded-md py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                      isSel && "bg-primary text-primary-foreground",
                      isCurMo && !isSel && "text-primary font-bold border border-primary/30"
                    )}>
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {view==="day" && (
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevM} className="p-1 rounded hover:bg-accent"><ChevronLeft className="size-4"/></button>
              <div className="flex items-center">
                <button onClick={()=>setView("month")}
                  className="text-sm font-semibold hover:bg-accent rounded px-1 py-0.5 transition-colors">
                  {MONTHS[navM-1]}
                </button>
                <button onClick={()=>setView("year")}
                  className="text-sm font-semibold hover:bg-accent rounded px-1 py-0.5 transition-colors">
                  {navY}
                </button>
              </div>
              <button onClick={nextM} className="p-1 rounded hover:bg-accent"><ChevronRight className="size-4"/></button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_HDR.map(d=>(
                <div key={d} className="text-center text-[10px] text-muted-foreground py-0.5">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({length:fd}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:total},(_,i)=>i+1).map(d=>{
                const isSel = d===selD && navM===selM && navY===selY;
                const isToday = d===new Date().getDate() && navM===new Date().getMonth()+1 && navY===CUR;
                return (
                  <button key={d} onClick={()=>pickDay(d)}
                    className={cn(
                      "h-8 w-full rounded-md text-sm transition-colors hover:bg-accent",
                      isSel && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isToday && !isSel && "font-bold text-primary border border-primary/30"
                    )}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-3 py-2">
          <button onClick={()=>{
            const t=new Date();
            onChange(fromParts(t.getFullYear(),t.getMonth()+1,t.getDate()));
            setNavY(t.getFullYear()); setNavM(t.getMonth()+1);
            close();
          }} className="w-full text-xs text-primary hover:underline py-0.5">
            Hari ini
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
