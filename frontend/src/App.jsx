import React, { useState } from 'react'
import axios from 'axios'

export default function App() {
  const currentYear = new Date().getFullYear()
  const [form, setForm] = useState({
    town: 'ANG MO KIO',
    flat_type: '4 ROOM',
    remaining_lease_years: 70,
    target_year: currentYear
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const update = (k, v) => {
    setForm(prev => {
      let updated = { ...prev, [k]: v }

      // Dynamically adjust target_year if remaining lease is updated
      if (k === 'remaining_lease_years') {
        const maxTargetYear = currentYear + v - 1
        if (updated.target_year > maxTargetYear) {
          updated.target_year = maxTargetYear
        }
      }

      return updated
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await axios.post('/api/predict', form)
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Prediction failed. Ensure backend is running and model exists.')
    } finally {
      setLoading(false)
    }
  }

  const maxTargetYear = currentYear + form.remaining_lease_years - 1

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: 24 }}>🏢 HDB Price Insight</h1>
        <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 32 }}>
          Estimate resale price now and project it to a future year.
        </p>

        <form onSubmit={submit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Town</label>
              <select value={form.town} onChange={e => update('town', e.target.value)} style={inputStyle}>
                {['ANG MO KIO','BEDOK','BISHAN','BUKIT BATOK','BUKIT MERAH','CHOA CHU KANG','GEYLANG','HOUGANG','JURONG EAST','JURONG WEST','KALLANG/WHAMPOA','MARINE PARADE','PASIR RIS','PUNGGOL','QUEENSTOWN','SEMBAWANG','SENGKANG','SERANGOON','TAMPINES','TOA PAYOH','WOODLANDS','YISHUN'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Flat Type</label>
              <select value={form.flat_type} onChange={e => update('flat_type', e.target.value)} style={inputStyle}>
                {['1 ROOM','2 ROOM','3 ROOM','4 ROOM','5 ROOM','EXECUTIVE','MULTI-GENERATION'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Remaining Lease (years)</label>
              <input
                type="number"
                value={form.remaining_lease_years}
                onChange={e => update('remaining_lease_years', Number(e.target.value))}
                required min="1"
                max="99"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target Year (max: {maxTargetYear})</label>
              <input
                type="number"
                value={form.target_year}
                onChange={e => update('target_year', Number(e.target.value))}
                required
                min={currentYear}
                max={maxTargetYear}
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Predicting...' : 'Predict Price'}
          </button>
        </form>

        {error && <p style={{ color: '#e74c3c', marginTop: 20, textAlign: 'center' }}>{error}</p>}

        {result && (
          <div style={{ marginTop: 32, padding: 24, borderRadius: 16, background: 'linear-gradient(135deg, #f9f9f9, #eef2f7)', boxShadow: '0 6px 16px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: 16 }}>Results</h2>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div style={cardStyle}>
                <div style={{ color: '#7f8c8d', marginBottom: 4 }}>Estimated Price (Now)</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#27ae60' }}>
                  ${Number(result.predicted_price_now).toLocaleString()}
                </div>
              </div>

              {result.predicted_price_target_year !== null && (
                <div style={cardStyle}>
                  <div style={{ color: '#7f8c8d', marginBottom: 4 }}>Projected Price in {form.target_year} ({result.years_into_future} yrs)</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#2980b9' }}>
                    ${Number(result.predicted_price_target_year).toLocaleString()}
                  </div>
                  <div style={{ color: '#34495e', marginTop: 4 }}>
                    Change: {result.price_change_pct > 0 ? '+' : ''}{result.price_change_pct}%
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: '#7f8c8d', marginTop: 20 }}>
              Projection is computed by reducing the remaining lease by the number of years into the future and re‑predicting with the same model.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
const labelStyle = { fontWeight: 500, color: '#34495e', marginBottom: 4, display: 'block' }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 16, outline: 'none' }
const buttonStyle = { padding: '12px 20px', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 16, background: '#2980b9', color: '#fff', cursor: 'pointer', transition: '0.2s' }
const cardStyle = { flex: '1 1 250px', background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }
