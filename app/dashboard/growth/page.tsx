"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { GrowthOverview, GrowthReferral, GrowthShare, GrowthDevice, GrowthDeviceEvent } from "@/types/api";

export default function GrowthPage() {
  const [overview, setOverview] = useState<GrowthOverview | null>(null);
  const [referrals, setReferrals] = useState<GrowthReferral[]>([]);
  const [shares, setShares] = useState<GrowthShare[]>([]);
  const [devices, setDevices] = useState<GrowthDevice[]>([]);
  const [events, setEvents] = useState<GrowthDeviceEvent[]>([]);
  const [coupon, setCoupon] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [o, r, s, d, e, c] = await Promise.all([
        api.get("/admin/growth/overview").then((res) => res.data).catch(() => null),
        api.get("/admin/growth/referrals").then((res) => res.data).catch(() => []),
        api.get("/admin/growth/shares").then((res) => res.data).catch(() => []),
        api.get("/admin/growth/devices").then((res) => res.data).catch(() => []),
        api.get("/admin/growth/device-events").then((res) => res.data).catch(() => []),
        api.get("/admin/growth/coupon").then((res) => res.data).catch(() => ({ code: "" })),
      ]);
      if (o) setOverview(o);
      setReferrals(Array.isArray(r) ? r : []);
      setShares(Array.isArray(s) ? s : []);
      setDevices(Array.isArray(d) ? d : []);
      setEvents(Array.isArray(e) ? e : []);
      setCoupon(c?.code ?? "");
      setCouponInput(c?.code ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveCoupon = async () => {
    setSavingCoupon(true);
    setMsg(null);
    try {
      await api.put("/admin/growth/coupon", { code: couponInput.trim() });
      setCoupon(couponInput.trim());
      setMsg("Coupon updated");
    } catch (e: any) {
      setMsg(e?.response?.data?.detail ?? "Failed to save coupon");
    } finally {
      setSavingCoupon(false);
    }
  };

  const unlinkDevice = async (uid: string) => {
    if (!confirm(`Unlink device for ${uid}? User will be forced to re-login.`)) return;
    try {
      await api.post(`/admin/growth/devices/${uid}/unlink`);
      setMsg(`Device unlinked for ${uid}`);
      fetchAll();
    } catch (e: any) {
      setMsg(e?.response?.data?.detail ?? "Unlink failed");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading growth data...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Growth — Referral, Share, Coupon, Devices</h1>
      {msg && <div className="bg-slate-800 text-slate-200 px-4 py-2 rounded">{msg}</div>}

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded">
            <p className="text-slate-400 text-xs">Referral codes</p>
            <p className="text-white text-xl font-bold">{overview.total_referral_codes}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded">
            <p className="text-slate-400 text-xs">Shares</p>
            <p className="text-white text-xl font-bold">{overview.total_shares}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded">
            <p className="text-slate-400 text-xs">Referral rewards paid</p>
            <p className="text-white text-xl font-bold">₹{overview.total_referral_rewards_paid}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded">
            <p className="text-slate-400 text-xs">Share rewards paid</p>
            <p className="text-white text-xl font-bold">₹{overview.total_share_rewards_paid}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded space-y-3">
        <h2 className="text-white font-semibold">Offline Coupon (single global code)</h2>
        <p className="text-slate-400 text-xs">Any student entering this exact code at checkout gets free access (accessType offline-comp). Previous code stops working immediately.</p>
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="e.g. VASTAVIKOFFLINE2025"
            className="flex-1 bg-slate-900 text-white px-3 py-2 rounded text-sm"
          />
          <button
            onClick={saveCoupon}
            disabled={savingCoupon}
            className="bg-orange-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {savingCoupon ? "..." : "Save"}
          </button>
        </div>
        <p className="text-slate-500 text-xs">Current: {coupon || "(empty — no coupon active)"}</p>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h2 className="text-white font-semibold mb-3">Referrals ({referrals.length}) — ₹{overview?.referral_reward_inr ?? 25} × {overview?.referral_reward_cap ?? 3} cap</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Rewarded</th>
                <th className="text-left p-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.code} className="border-t border-slate-700">
                  <td className="p-2 font-mono text-white">{r.code}</td>
                  <td className="p-2 text-slate-300">{r.user_name} ({r.user_email})</td>
                  <td className="p-2 text-green-400">{r.rewarded_count} / {overview?.referral_reward_cap ?? 3}</td>
                  <td className="p-2 text-yellow-400">{r.pending_count}</td>
                </tr>
              ))}
              {referrals.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No referrals yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h2 className="text-white font-semibold mb-3">Shares ({shares.length}) — ₹{overview?.share_reward_inr ?? 10} × {overview?.share_reward_cap ?? 2} cap</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left p-2">Token</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((s) => (
                <tr key={s.token} className="border-t border-slate-700">
                  <td className="p-2 font-mono text-white">{s.token}</td>
                  <td className="p-2 text-slate-300">{s.user_name}</td>
                  <td className="p-2 text-slate-300">{s.status}</td>
                  <td className="p-2 text-slate-300">{s.clicks}</td>
                </tr>
              ))}
              {shares.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No shares yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h2 className="text-white font-semibold mb-3">Devices ({devices.length}) — one active per account</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Device</th>
                <th className="text-left p-2">Platform</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.uid} className="border-t border-slate-700">
                  <td className="p-2 text-slate-300">{d.user_name} ({d.user_email})</td>
                  <td className="p-2 font-mono text-white">{d.active_device_id ?? "-"}</td>
                  <td className="p-2 text-slate-300">{d.active_platform ?? "-"}</td>
                  <td className="p-2">
                    <button onClick={() => unlinkDevice(d.uid)} className="text-red-400 hover:text-red-300">Unlink</button>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No devices bound</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h2 className="text-white font-semibold mb-3">Device Events (last 200)</h2>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400 sticky top-0 bg-slate-800">
              <tr>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Event</th>
                <th className="text-left p-2">Device</th>
                <th className="text-left p-2">Flagged</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-t border-slate-700">
                  <td className="p-2 text-slate-400">{new Date(e.ts).toLocaleString()}</td>
                  <td className="p-2 text-slate-300">{e.uid.slice(0, 8)}</td>
                  <td className="p-2 text-slate-300">{e.event}</td>
                  <td className="p-2 font-mono text-slate-300">{e.device_id.slice(0, 12)}</td>
                  <td className="p-2">{e.flagged ? <span className="text-red-400">yes</span> : "no"}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No events</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
