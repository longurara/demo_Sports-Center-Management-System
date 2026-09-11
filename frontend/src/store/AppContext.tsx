/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { initialData } from '../mock/data';
import type { AppData, Notification, Subscription, User } from '../types';

type Collection = keyof AppData;
type Item<K extends Collection> = AppData[K][number];

interface AppContextValue {
  data: AppData;
  currentUser: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  add: <K extends Collection>(key: K, item: Omit<Item<K>, 'id'>) => Item<K>;
  update: <K extends Collection>(key: K, id: string, patch: Partial<Item<K>>) => void;
  remove: <K extends Collection>(key: K, id: string) => void;
  log: (action: string, entity: string, entityId: string, detail: string) => void;
  notify: (userId: string, title: string, content: string) => void;
  // helpers
  userById: (id?: string) => User | undefined;
  nameOf: (id?: string) => string;
  activeSubscription: (memberId: string) => Subscription | undefined;
  membershipStatus: (memberId: string) => 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NONE';
  myNotifications: () => Notification[];
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let seq = Number(sessionStorage.getItem('sc_seq') ?? 1000);
export const nextId = (prefix = 'id') => { sessionStorage.setItem('sc_seq', String(++seq)); return `${prefix}${seq}`; };

// Prototype: giữ dữ liệu giả lập trong sessionStorage để F5 không mất trạng thái khi demo.
const DATA_KEY = 'sc_data_v6'; // đổi version khi thay đổi cấu trúc mock data
const load = <T,>(key: string, fallback: T): T => {
  try { const v = sessionStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load(DATA_KEY, initialData));
  const [currentUser, setCurrentUser] = useState<User | null>(() => load('sc_user', null));
  useEffect(() => { sessionStorage.setItem(DATA_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { if (currentUser) sessionStorage.setItem('sc_user', JSON.stringify(currentUser)); else sessionStorage.removeItem('sc_user'); }, [currentUser]);

  const login = useCallback((email: string) => {
    const u = data.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.status === 'LOCKED') return false;
    setCurrentUser(u);
    return true;
  }, [data.users]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const add = useCallback(<K extends Collection>(key: K, item: Omit<Item<K>, 'id'>) => {
    const full = { ...item, id: nextId(key.slice(0, 2)) } as Item<K>;
    setData((prev) => ({ ...prev, [key]: [...(prev[key] as Item<K>[]), full] }));
    return full;
  }, []);

  const update = useCallback(<K extends Collection>(key: K, id: string, patch: Partial<Item<K>>) => {
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] as Item<K>[]).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }, []);

  const remove = useCallback(<K extends Collection>(key: K, id: string) => {
    setData((prev) => ({ ...prev, [key]: (prev[key] as Item<K>[]).filter((x) => x.id !== id) }));
  }, []);

  const log = useCallback((action: string, entity: string, entityId: string, detail: string) => {
    setData((prev) => ({
      ...prev,
      auditLogs: [
        { id: nextId('a'), userId: currentUser?.id ?? 'system', action, entity, entityId, detail, createdAt: dayjs().format('YYYY-MM-DD HH:mm') },
        ...prev.auditLogs,
      ],
    }));
  }, [currentUser]);

  const notify = useCallback((userId: string, title: string, content: string) => {
    setData((prev) => ({
      ...prev,
      notifications: [
        { id: nextId('n'), userId, title, content, read: false, createdAt: dayjs().format('YYYY-MM-DD HH:mm') },
        ...prev.notifications,
      ],
    }));
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const userById = (id?: string) => data.users.find((u) => u.id === id);
    const nameOf = (id?: string) => userById(id)?.fullName ?? (id === 'system' ? 'Hệ thống' : '—');
    const activeSubscription = (memberId: string) =>
      data.subscriptions
        .filter((s) => s.memberId === memberId && s.status === 'ACTIVE')
        .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
    const membershipStatus = (memberId: string) => {
      const s = activeSubscription(memberId);
      if (!s) return data.subscriptions.some((x) => x.memberId === memberId) ? 'EXPIRED' : 'NONE';
      const days = dayjs(s.endDate).diff(dayjs(), 'day');
      if (days < 0) return 'EXPIRED';
      if (days <= 7) return 'EXPIRING';
      return 'ACTIVE';
    };
    const myNotifications = () => data.notifications.filter((n) => n.userId === currentUser?.id);
    return {
      data, currentUser, login, logout, add, update, remove, log, notify,
      userById, nameOf, activeSubscription, membershipStatus, myNotifications,
      resetData: () => { sessionStorage.removeItem(DATA_KEY); sessionStorage.removeItem('sc_seq'); setData(initialData); },
    };
  }, [data, currentUser, login, logout, add, update, remove, log, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const fmtMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
export const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
