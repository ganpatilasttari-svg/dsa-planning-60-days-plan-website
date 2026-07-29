import { useEffect, useState } from 'react'
import { Plus, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Bell, BellOff, Trash2, X, Brain, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { WeakTopic } from '../types'
import NotificationToast from '../components/NotificationToast'
import DayNightIcon from '../components/DayNightIcon'

export default function WeakTopics() {
  const [topics, setTopics] = useState<WeakTopic[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newTopic, setNewTopic] = useState({ topic_name: '', topic_category: 'DSA', notes: '', severity: 'medium' })

  useEffect(() => { loadTopics() }, [])

  const loadTopics = async () => {
    const { data } = await supabase.from('weak_topics').select('*').order('created_at', { ascending: false })
    setTopics(data || [])
  }

  const addTopic = async () => {
    if (!newTopic.topic_name.trim()) return
    await supabase.from('weak_topics').insert({ ...newTopic, reminder_enabled: true })
    setNewTopic({ topic_name: '', topic_category: 'DSA', notes: '', severity: 'medium' })
    setShowModal(false); loadTopics()
  }

  const toggleReminder = async (t: WeakTopic) => {
    await supabase.from('weak_topics').update({ reminder_enabled: !t.reminder_enabled }).eq('id', t.id); loadTopics()
  }
  const resolveTopic = async (t: WeakTopic) => {
    await supabase.from('weak_topics').update({ resolved: !t.resolved }).eq('id', t.id); loadTopics()
  }
  const deleteTopic = async (id: string) => {
    await supabase.from('weak_topics').delete().eq('id', id); loadTopics()
  }

  const activeTopics = topics.filter(t => !t.resolved)
  const resolvedTopics = topics.filter(t => t.resolved)
  const severityColor = (s: string) => s === 'high' ? 'var(--red-bright)' : s === 'medium' ? 'var(--amber-bright)' : 'var(--text-tertiary)'

  return (
    <>
      <NotificationToast />
      <div className="topbar">
        <div className="topbar-title">Weak Topics</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Weak Topic
          </button>
          <DayNightIcon />
        </div>
      </div>

      <div className="content-area">
        <div className="section-subtitle">
          Mark topics you find difficult. You will get periodic reminders to review them.
          These are revisited on Day 49 and Day 54-55.
        </div>

        <div className="section-title">
          <AlertCircle size={18} style={{ color: 'var(--pink-bright)' }} /> Active ({activeTopics.length})
        </div>

        {activeTopics.length > 0 ? (
          <div className="question-list mb-6">
            {activeTopics.map(t => (
              <div key={t.id} className="weak-topic-item">
                <AlertCircle size={18} color={severityColor(t.severity)} />
                <div className="flex-1">
                  <div className="font-700">{t.topic_name}</div>
                  {t.notes && <div className="text-sm text-tertiary">{t.notes}</div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{t.topic_category}</span>
                    <span className={`badge ${t.severity === 'high' ? 'badge-hard' : t.severity === 'medium' ? 'badge-medium' : 'badge-easy'}`}>{t.severity}</span>
                    {t.reminder_enabled && <span className="badge badge-purple"><Bell size={10} /> Reminders On</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleReminder(t)} title="Toggle reminders">
                    {t.reminder_enabled ? <BellOff size={14} /> : <Bell size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => resolveTopic(t)} title="Mark resolved">
                    <CheckCircle size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteTopic(t.id)} title="Delete">
                    <Trash2 size={14} color="var(--red-bright)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state mb-6">
            <Brain size={32} className="empty-state-icon" />
            <div className="empty-state-text">No active weak topics. Add one when you get stuck on something.</div>
          </div>
        )}

        {resolvedTopics.length > 0 && (
          <>
            <div className="section-title">
              <CheckCircle size={18} style={{ color: 'var(--green-bright)' }} /> Resolved ({resolvedTopics.length})
            </div>
            <div className="question-list">
              {resolvedTopics.map(t => (
                <div key={t.id} className="weak-topic-item" style={{ opacity: 0.6 }}>
                  <CheckCircle size={18} color="var(--green-bright)" />
                  <div className="flex-1">
                    <div className="font-700">{t.topic_name}</div>
                    {t.notes && <div className="text-sm text-tertiary">{t.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => resolveTopic(t)} title="Mark as active">
                      <AlertCircle size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteTopic(t.id)}>
                      <Trash2 size={14} color="var(--red-bright)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Weak Topic</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="input-label">Topic Name</label>
                <input className="input" placeholder="e.g., Dynamic Programming on Strings"
                  value={newTopic.topic_name} onChange={e => setNewTopic({ ...newTopic, topic_name: e.target.value })} autoFocus />
              </div>
              <div className="form-group">
                <label className="input-label">Category</label>
                <select className="input" value={newTopic.topic_category} onChange={e => setNewTopic({ ...newTopic, topic_category: e.target.value })}>
                  <option value="DSA">DSA</option><option value="System Design">System Design</option>
                  <option value="OOP">OOP</option><option value="OS">OS</option><option value="DBMS">DBMS</option>
                  <option value="CN">Computer Networks</option><option value="SQL">SQL</option>
                  <option value="LLD">LLD</option><option value="HLD">HLD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Notes (optional)</label>
                <textarea className="input" placeholder="What specifically is difficult?"
                  value={newTopic.notes} onChange={e => setNewTopic({ ...newTopic, notes: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="input-label">Severity</label>
                <select className="input" value={newTopic.severity} onChange={e => setNewTopic({ ...newTopic, severity: e.target.value })}>
                  <option value="low">Low — minor confusion</option>
                  <option value="medium">Medium — needs focused review</option>
                  <option value="high">High — critical weakness</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addTopic}><Plus size={14} /> Add Topic</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
