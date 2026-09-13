import { Compass, Printer, RefreshCw, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import { Badge, Card } from "../components/ui";
import { FullReport } from "../types";
import { API, authH, fmt, fmtDate } from "../utils/helpers";

export default function ReportsSection({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
    const [report, setReport] = useState<FullReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const params = new URLSearchParams();
              if (from) params.set("from", from);
              if (to) params.set("to", to);
              const r = await fetch(`${API}/admin/reports/full?${params}`, { headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              setReport(await r.json());
            } catch (e: unknown) {
              onToast(e instanceof Error ? e.message : "Could not generate report", "error");
            }
            setLoading(false);

          }, [from, to]);
    useEffect(() => { load(); }, [load]);
    const handlePrint = () => window.print();
    const handleExportCSV = () => {
        if (!report) return;
        const data = [
            ...(report?.tourBookings || []).map(b => ({
                Type: "Tour + Vehicle",
                Reference: b.dummyReference,
                Customer: typeof b.userId === "object" ? b.userId.name : String(b.userId),
                Item: b.tourTitle,
                Date: b.travelDate?.split("T")[0] || "",
                Amount: b.totalPrice,
                Status: b.status
            })),
            ...(report?.hotelBookings || []).map(b => ({
                Type: "Hotel",
                Reference: b.dummyReference,
                Customer: typeof b.userId === "object" ? b.userId.name : String(b.userId),
                Item: typeof b.hotelId === "object" ? b.hotelId.name : String(b.hotelId),
                Date: b.checkInDate?.split("T")[0] || "",
                Amount: b.totalPrice,
                Status: b.status
            }))
        ];
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `tourgenie_report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
    <div className="space-y-6">
      { }
      <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
        <div><h1 className="font-serif text-4xl text-ink-900">Reports</h1><p className="text-ink-800/50 text-sm">Complete business report - vehicles, bookings & income</p></div>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold block mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold block mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }} className="px-4 py-2.5 rounded-xl bg-sand-100 text-ink-800/60 text-sm font-medium hover:bg-sand-200 transition-colors">Clear</button>
          )}
          <button onClick={handleExportCSV} disabled={loading || !report}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sand-100 text-ink-900 text-sm font-semibold hover:bg-sand-200 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" />Export CSV
          </button>
          <button onClick={handlePrint} disabled={loading || !report}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50">
            <Printer className="w-4 h-4" />Print / Save PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-800/40"><RefreshCw className="w-6 h-6 animate-spin mr-3" />Generating report...</div>
      ) : !report ? (
        <p className="text-center text-ink-800/40 text-sm py-20">Could not load report data.</p>
      ) : (
        <div id="report-print-area" className="space-y-6">
          { }
          <Card className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-sunset-400 to-sunset-600 flex items-center justify-center shadow-lg shrink-0">
                  <Compass className="w-5 h-5 text-ink-900" />
                </div>
                <div>
                  <div className="font-serif text-2xl text-ink-900">TourGenie - Business Report</div>
                  <div className="text-xs text-ink-800/50">
                    {report.range.from || report.range.to
                      ? `${report.range.from ? fmtDate(report.range.from) : "Start"} - ${report.range.to ? fmtDate(report.range.to) : "Now"}`
                      : "All-time"}
                    {" - Generated "}{new Date(report.generatedAt).toLocaleString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          { }
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Total Income</div><div className="font-serif text-2xl text-ink-900">{fmt(report.totals.totalIncome)}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Hotel Income</div><div className="font-serif text-2xl text-ink-900">{fmt(report.totals.hotelIncome)}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Tour + Vehicle Income</div><div className="font-serif text-2xl text-ink-900">{fmt(report.totals.tourIncome)}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Total Users</div><div className="font-serif text-2xl text-ink-900">{report.totals.totalUsers}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Hotel Bookings</div><div className="font-serif text-2xl text-ink-900">{report.totals.totalHotelBookings}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Tour Bookings</div><div className="font-serif text-2xl text-ink-900">{report.totals.totalTourBookings}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Fleet Size</div><div className="font-serif text-2xl text-ink-900">{report.totals.totalVehicles}</div></Card>
            <Card className="p-5"><div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-1">Active Vehicles</div><div className="font-serif text-2xl text-ink-900">{report.totals.activeVehicles}</div></Card>
          </div>

          { }
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200"><h2 className="font-serif text-xl text-ink-900">Vehicle Allocation</h2><p className="text-xs text-ink-800/50">Bookings and revenue generated per vehicle</p></div>
            {report.vehicleAllocation.length === 0 ? (
              <p className="text-center text-ink-800/40 text-sm py-10">No vehicle bookings in this range</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                    <tr><th className="px-5 py-3 text-left font-semibold">Vehicle</th><th className="px-5 py-3 text-left font-semibold">Type</th><th className="px-5 py-3 text-left font-semibold">Bookings</th><th className="px-5 py-3 text-left font-semibold">Revenue</th></tr>
                  </thead>
                  <tbody>
              {(!report?.vehicleAllocation?.length) ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (report?.vehicleAllocation || []).map(v => (
                      <tr key={v._id || 'fallback'} className="border-t border-sand-200">
                        <td className="px-5 py-3 font-medium text-ink-900">{v.vehicleName}</td>
                        <td className="px-5 py-3"><Badge status={v.vehicleType} /></td>
                        <td className="px-5 py-3">{v.bookingsCount}</td>
                        <td className="px-5 py-3">{fmt(v.revenue)}</td>
                      </tr>
                    ))}
              </tbody>
                </table>
              </div>
            )}
          </Card>

          { }
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200"><h2 className="font-serif text-xl text-ink-900">Tour Package Bookings ({report.tourBookings.length})</h2></div>
            {report.tourBookings.length === 0 ? (
              <p className="text-center text-ink-800/40 text-sm py-10">No tour bookings in this range</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                    <tr><th className="px-5 py-3 text-left font-semibold">Reference</th><th className="px-5 py-3 text-left font-semibold">Customer</th><th className="px-5 py-3 text-left font-semibold">Tour</th><th className="px-5 py-3 text-left font-semibold">Vehicle</th><th className="px-5 py-3 text-left font-semibold">Travel Date</th><th className="px-5 py-3 text-left font-semibold">Total</th><th className="px-5 py-3 text-left font-semibold">Status</th></tr>
                  </thead>
                  <tbody>
              {(!report?.tourBookings?.length) ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (report?.tourBookings || []).map(b => (
                      <tr key={b._id || b.id || 'fallback'} className="border-t border-sand-200">
                        <td className="px-5 py-3 font-mono text-xs">{b.dummyReference}</td>
                        <td className="px-5 py-3">{typeof b.userId === "object" ? b.userId.name : "-"}</td>
                        <td className="px-5 py-3">{b.tourTitle}</td>
                        <td className="px-5 py-3">{b.vehicleName || "Self-drive"}</td>
                        <td className="px-5 py-3">{fmtDate(b.travelDate)}</td>
                        <td className="px-5 py-3">{fmt(b.totalPrice)}</td>
                        <td className="px-5 py-3"><Badge status={b.status} /></td>
                      </tr>
                    ))}
              </tbody>
                </table>
              </div>
            )}
          </Card>

          { }
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200"><h2 className="font-serif text-xl text-ink-900">Hotel Bookings ({report.hotelBookings.length})</h2></div>
            {report.hotelBookings.length === 0 ? (
              <p className="text-center text-ink-800/40 text-sm py-10">No hotel bookings in this range</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                    <tr><th className="px-5 py-3 text-left font-semibold">Reference</th><th className="px-5 py-3 text-left font-semibold">Guest</th><th className="px-5 py-3 text-left font-semibold">Hotel</th><th className="px-5 py-3 text-left font-semibold">Check-in</th><th className="px-5 py-3 text-left font-semibold">Check-out</th><th className="px-5 py-3 text-left font-semibold">Total</th><th className="px-5 py-3 text-left font-semibold">Status</th></tr>
                  </thead>
                  <tbody>
              {(!report?.hotelBookings?.length) ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (report?.hotelBookings || []).map(b => (
                      <tr key={b._id || b.id || 'fallback'} className="border-t border-sand-200">
                        <td className="px-5 py-3 font-mono text-xs">{b.dummyReference}</td>
                        <td className="px-5 py-3">{typeof b.userId === "object" ? b.userId.name : "-"}</td>
                        <td className="px-5 py-3">{typeof b.hotelId === "object" ? b.hotelId.name : "-"}</td>
                        <td className="px-5 py-3">{fmtDate(b.checkInDate)}</td>
                        <td className="px-5 py-3">{fmtDate(b.checkOutDate)}</td>
                        <td className="px-5 py-3">{fmt(b.totalPrice)}</td>
                        <td className="px-5 py-3"><Badge status={b.status} /></td>
                      </tr>
                    ))}
              </tbody>
                </table>
              </div>
            )}
          </Card>

          { }
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200"><h2 className="font-serif text-xl text-ink-900">Fleet Snapshot ({report.vehicles.length})</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                  <tr><th className="px-5 py-3 text-left font-semibold">Vehicle</th><th className="px-5 py-3 text-left font-semibold">Type</th><th className="px-5 py-3 text-left font-semibold">Capacity</th><th className="px-5 py-3 text-left font-semibold">Price/Day</th><th className="px-5 py-3 text-left font-semibold">Status</th></tr>
                </thead>
                <tbody>
              {(!report?.vehicles?.length) ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (report?.vehicles || []).map(v => (
                    <tr key={v._id || 'fallback'} className="border-t border-sand-200">
                      <td className="px-5 py-3 font-medium text-ink-900">{v.name}</td>
                      <td className="px-5 py-3"><Badge status={v.type} /></td>
                      <td className="px-5 py-3">{v.capacity}</td>
                      <td className="px-5 py-3">{fmt(v.pricePerDay)}</td>
                      <td className="px-5 py-3">{v.isActive ? "Available" : "Unavailable"}</td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
    );
}
