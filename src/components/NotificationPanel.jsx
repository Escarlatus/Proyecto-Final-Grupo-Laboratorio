import React, { useState, useEffect } from 'react'
import { Bell, Check, Trash2, ExternalLink, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/react'
import { useSupabase } from '../hooks/useSupabase'
import { cn } from '../lib/utils'

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useUser()
  const supabase = useSupabase()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (!error) setNotifications(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user?.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 10))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'system_notifications',
        filter: `user_id=eq.${user?.id}`
      }, fetchNotifications)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const markAsRead = async (id) => {
    await supabase
      .from('system_notifications')
      .update({ is_read: true })
      .eq('notification_id', id)
  }

  const markAllAsRead = async () => {
    await supabase
      .from('system_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  const deleteNotification = async (id) => {
    await supabase
      .from('system_notifications')
      .delete()
      .eq('notification_id', id)
    setNotifications(prev => prev.filter(n => n.notification_id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notificaciones
        </h3>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[10px] uppercase tracking-wider font-bold text-primary hover:text-blue-700 transition-colors"
          >
            Marcar todo leído
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No tienes notificaciones aún</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <div 
                key={n.notification_id} 
                className={cn(
                  "p-4 transition-colors relative group",
                  !n.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                    !n.is_read ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-transparent"
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {n.link && (
                          <Link 
                            to={n.link} 
                            onClick={() => { markAsRead(n.notification_id); onClose(); }}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-primary transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <button 
                          onClick={() => deleteNotification(n.notification_id)}
                          className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={onClose}
          className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Cerrar panel
        </button>
      </div>
    </div>
  )
}
