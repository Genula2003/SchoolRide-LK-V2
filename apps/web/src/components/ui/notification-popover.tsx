'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, ShieldCheck, Bus, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatSriLankanTime } from '@/lib/utils';

export function NotificationPopover() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
      const countRes = await api.get('/notifications/unread-count');
      setUnreadCount(countRes.count);
    } catch {
      // not logged in or network error
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST':
      case 'BOOKING_ACCEPTED':
        return <Bus className="h-4 w-4 text-primary" />;
      case 'RIDE_STARTED':
      case 'CHILD_PICKED_UP':
      case 'CHILD_DROPPED_OFF':
        return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
      case 'VERIFICATION_APPROVED':
        return <CheckCheck className="h-4 w-4 text-emerald-600" />;
      case 'VERIFICATION_REJECTED':
      case 'COMPLAINT_UPDATE':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="relative rounded-lg p-2 text-foreground/80 hover:bg-muted/60 transition-colors focus:outline-none cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content asChild sideOffset={8} align="end">
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card p-0 shadow-floating focus:outline-none"
              >
                <div className="flex items-center justify-between border-b border-border/60 p-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start gap-3 rounded-lg transition-colors ${
                          !notif.read ? 'bg-primary/5' : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="mt-0.5 rounded-md p-1.5 bg-card border border-border/60 shadow-subtle shrink-0">
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                            {formatSriLankanTime(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}
