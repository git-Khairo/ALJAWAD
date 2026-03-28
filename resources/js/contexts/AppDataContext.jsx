import { createContext, useContext, useState, useEffect } from 'react';
import { mockApplications, mockUsers, mockCampaigns, mockTransactions, mockSessions } from '@/data/mockData';

const AppDataContext = createContext(null);

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const [applications, setApplications] = useState(() => {
    const s = localStorage.getItem('applications');
    return s ? JSON.parse(s) : mockApplications;
  });
  const [users, setUsers] = useState(() => {
    const s = localStorage.getItem('appUsers');
    return s ? JSON.parse(s) : mockUsers;
  });
  const [transactions, setTransactions] = useState(() => {
    const s = localStorage.getItem('transactions');
    return s ? JSON.parse(s) : mockTransactions;
  });
  const [sessions, setSessions] = useState(() => {
    const s = localStorage.getItem('sessions');
    return s ? JSON.parse(s) : mockSessions;
  });
  const [campaigns] = useState(mockCampaigns);

  useEffect(() => { localStorage.setItem('applications', JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem('appUsers', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('sessions', JSON.stringify(sessions)); }, [sessions]);

  const updateApplicationStatus = (id, status) => {
    setApplications((p) => p.map((a) => a.id === id ? { ...a, status } : a));
  };

  const addNote = (appId, note) => {
    setApplications((p) => p.map((a) => a.id === appId ? { ...a, notes: note } : a));
  };

  const addSession = (session) => {
    setSessions((p) => [...p, { ...session, id: String(Date.now()), attendees: [] }]);
  };

  const addTransaction = (txn) => {
    setTransactions((p) => [...p, { ...txn, id: String(Date.now()), date: new Date().toISOString() }]);
  };

  const updateUserTags = (userId, tags) => {
    setUsers((p) => p.map((u) => u.id === userId ? { ...u, tags } : u));
  };

  const updateUserNotes = (userId, notes) => {
    setUsers((p) => p.map((u) => u.id === userId ? { ...u, notes } : u));
  };

  const updateUserRole = (userId, role) => {
    setUsers((p) => p.map((u) => u.id === userId ? { ...u, role } : u));
  };

  return (
    <AppDataContext.Provider value={{
      applications, users, campaigns, transactions, sessions,
      updateApplicationStatus, addNote,
      addSession, addTransaction,
      updateUserTags, updateUserNotes, updateUserRole,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
