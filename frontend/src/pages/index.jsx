"use client";
import { useState, useEffect, useCallback } from "react";
import { MetricCard } from "../components/MetricCard";
import { CampaignTable } from "../components/CampaignTable";
import { api } from "../lib/api";

const PERIODS = [
  { label: "Hoy", value: "today" },
  { label: "7 días", value: "last_7d" },
  { label: "14 días", value: "last_14d" },
  { label: "30 días", value: "last_30d" },
];

export default function Dashboard() {
  const [period, setPeriod]               = useState("last_7d");
  const [campaigns, setCampaigns]         = useState([]);
  const [optimizerResult, setOptimizer]   = useState(null);
  const [financeResult, setFinance]       = useState(null);
  const [scriptResult, setScripts]        = useState(null);
  const [loading, setLoading]             = useState({});
  const [tab, setTab]                     = useState("campaigns"); // campaigns | optimizer | finance | scripts

  // Finance form state
  const [ventasMes, setVentasMes]         = useState("");
  const [gastoMeta, setGastoMeta]         = useState("");
  const [otrosGastos, setOtrosGastos]     = useState("");

  // Script form state
  const [scriptProducto, setScriptProducto] = useState("PDF de IA Rentable");
  const [scriptNicho, setScriptNicho]     = useState("emprendedores que quieren monetizar IA");
  const [scriptFormato, setScriptFormato] = useState("video_reels");

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const fetchCampaigns = useCallback(async () => {
    setLoad("campaigns", true);
    try {
      const res = await api.getCampaigns(period);
      setCampaigns(res.data || []);
    } catch (e) { alert("Error: " + e.message); }
    setLoad("campaigns", false);
  }, [period]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function runOptimizer() {
    setLoad("optimizer", true);
    try {
      const res = await api.runOptimizer(period);
      setOptimizer(res);
      setCampaigns(res.campaigns || []);
    } catch (e) { alert("Error: " + e.message); }
    setLoad("optimizer", false);
  }

  async function runFinance() {
    if (!ventasMes || !gastoMeta) return alert("Completá ventas y gasto Meta");
    setLoad("finance", true);
    try {
      const res = await api.runFinance({
        ventas_mes: parseInt(ventasMes),
        gasto_meta_mes: parseFloat(gastoMeta),
        otros_gastos_extra: parseFloat(otrosGastos || 0),
      });
      setFinance(res);
    } catch (e) { alert("Error: " + e.message); }
    setLoad("finance", false);
  }

  async function generateScripts() {
    setLoad("scripts", true);
    try {
      const res = await api.generateScripts({
        producto: scriptProducto,
        nicho: scriptNicho,
        num_scripts: 3,
        formato: scriptFormato,
      });
      setScripts(res);
    } catch (e) { alert("Error: " + e.message); }
    setLoad("scripts", false);
  }

  // Calcular métricas totales de campañas
  const totals = campaigns.reduce((acc, c) => {
    const ins = c.insights || {};
    acc.spend += ins.spend || 0;
    acc.purchases += ins.purchases || 0;
    acc.clicks += ins.clicks || 0;
    acc.revenue += ins.revenue || 0;
    return acc;
  }, { spend: 0, purchases: 0, clicks: 0, revenue: 0 });

  const totalCPA = totals.purchases > 0 ? (totals.spend / totals.purchases).toFixed(2) : null;
  const totalROAS = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : null;

  const TAB_BTN = (t, label) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">M</div>
          <span className="font-bold text-lg">MetaDash</span>
          <span className="text-xs text-gray-500 ml-2">Sky Eleven</span>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.value ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Gasto Total" value={`$${totals.spend.toFixed(2)}`} icon="💸" color="blue" sub="Meta Ads" />
          <MetricCard label="Compras" value={totals.purchases} icon="🛒" color="green" sub={`${period}`} />
          <MetricCard label="CPA" value={totalCPA ? `$${totalCPA}` : "—"} icon="🎯" color={totalCPA && parseFloat(totalCPA) < 10 ? "green" : "yellow"} sub="costo por compra" />
          <MetricCard label="ROAS" value={totalROAS ? `${totalROAS}x` : "—"} icon="📈" color={totalROAS && parseFloat(totalROAS) > 2 ? "green" : "red"} sub="retorno sobre gasto" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-1">
          <button className={TAB_BTN("campaigns")} onClick={() => setTab("campaigns")}>📊 Campañas</button>
          <button className={TAB_BTN("optimizer")} onClick={() => setTab("optimizer")}>🤖 Agente Optimizer</button>
          <button className={TAB_BTN("finance")} onClick={() => setTab("finance")}>💰 Agente Finanzas</button>
          <button className={TAB_BTN("scripts")} onClick={() => setTab("scripts")}>✍️ Agente Guiones</button>
        </div>

        {/* TAB: Campañas */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300">Campañas activas — {period}</h2>
              <button
                onClick={fetchCampaigns}
                disabled={loading.campaigns}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              >
                {loading.campaigns ? "Cargando..." : "🔄 Actualizar"}
              </button>
            </div>
            <CampaignTable campaigns={campaigns} onRefresh={fetchCampaigns} />
          </div>
        )}

        {/* TAB: Optimizer */}
        {tab === "optimizer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">🤖 Agente Optimizer</h2>
                <p className="text-xs text-gray-400 mt-1">Analiza todas tus campañas y te dice qué pausar, escalar o duplicar</p>
              </div>
              <button
                onClick={runOptimizer}
                disabled={loading.optimizer}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {loading.optimizer ? "Analizando..." : "⚡ Analizar ahora"}
              </button>
            </div>
            {optimizerResult && (
              <>
                <div className="rounded-xl border border-indigo-700 bg-indigo-950/30 p-5">
                  <h3 className="text-sm font-semibold text-indigo-300 mb-3">📋 Análisis estratégico de Claude</h3>
                  <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">{optimizerResult.ai_analysis}</p>
                </div>
                <CampaignTable campaigns={optimizerResult.campaigns || []} onRefresh={fetchCampaigns} />
              </>
            )}
            {!optimizerResult && (
              <div className="text-center py-16 text-gray-500">Hacé click en "Analizar ahora" para que el agente revise tus campañas</div>
            )}
          </div>
        )}

        {/* TAB: Finance */}
        {tab === "finance" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">💰 Agente Finanzas</h2>
              <p className="text-xs text-gray-400 mt-1">Calculá tu margen real y cuánto podés gastar en Meta esta semana</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ventas del mes</label>
                <input
                  type="number"
                  value={ventasMes}
                  onChange={e => setVentasMes(e.target.value)}
                  placeholder="Ej: 45"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gasto Meta este mes ($)</label>
                <input
                  type="number"
                  value={gastoMeta}
                  onChange={e => setGastoMeta(e.target.value)}
                  placeholder="Ej: 120.50"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Otros gastos extra ($)</label>
                <input
                  type="number"
                  value={otrosGastos}
                  onChange={e => setOtrosGastos(e.target.value)}
                  placeholder="Ej: 0"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={runFinance}
              disabled={loading.finance}
              className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-sm font-medium disabled:opacity-50"
            >
              {loading.finance ? "Calculando..." : "💰 Calcular margen"}
            </button>

            {financeResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Revenue bruto" value={`$${financeResult.metrics.revenue_bruto}`} icon="💵" color="green" />
                  <MetricCard label="Ganancia neta" value={`$${financeResult.metrics.ganancia_neta}`} icon="✅" color={financeResult.metrics.ganancia_neta > 0 ? "green" : "red"} />
                  <MetricCard label="Margen" value={`${financeResult.metrics.margen_porcentaje}%`} icon="📊" color={financeResult.metrics.margen_porcentaje > 30 ? "green" : "yellow"} />
                  <MetricCard label="Disponible para test" value={`$${financeResult.metrics.disponible_para_test}`} icon="🧪" color="purple" sub="nuevas campañas" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="CPA máx. aceptable" value={`$${financeResult.metrics.cpa_max_aceptable}`} icon="🎯" color="yellow" sub="para 40% margen" />
                  <MetricCard label="Break even" value={`${financeResult.metrics.break_even_ventas} ventas`} icon="⚖️" color="blue" sub="para cubrir costos" />
                  <MetricCard label="Costos fijos" value={`$${financeResult.metrics.costos_fijos}`} icon="🔒" color="blue" sub="mensual" />
                  <MetricCard label="Días recupero" value={`${financeResult.metrics.dias_recupero_inversion}d`} icon="⏱️" color="purple" sub="retorno inversión Meta" />
                </div>
                <div className="rounded-xl border border-green-700 bg-green-950/20 p-5">
                  <h3 className="text-sm font-semibold text-green-300 mb-3">🤖 Recomendación del agente</h3>
                  <p className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">{financeResult.advice}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Scripts */}
        {tab === "scripts" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">✍️ Agente Guiones</h2>
              <p className="text-xs text-gray-400 mt-1">Genera guiones nuevos basados en los ads que están funcionando</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Producto</label>
                <input
                  value={scriptProducto}
                  onChange={e => setScriptProducto(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nicho / Audiencia</label>
                <input
                  value={scriptNicho}
                  onChange={e => setScriptNicho(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Formato</label>
                <select
                  value={scriptFormato}
                  onChange={e => setScriptFormato(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="video_reels">Video Reels (30-45s)</option>
                  <option value="carrusel">Carrusel</option>
                  <option value="imagen_estatica">Imagen estática</option>
                </select>
              </div>
            </div>
            <button
              onClick={generateScripts}
              disabled={loading.scripts}
              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm font-medium disabled:opacity-50"
            >
              {loading.scripts ? "Generando..." : "✍️ Generar guiones"}
            </button>

            {scriptResult && (
              <div className="rounded-xl border border-purple-700 bg-purple-950/20 p-5">
                {scriptResult.winners_used.length > 0 && (
                  <p className="text-xs text-purple-400 mb-3">
                    📊 Basado en ads ganadores: {scriptResult.winners_used.join(", ")}
                  </p>
                )}
                <pre className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">{scriptResult.scripts}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
