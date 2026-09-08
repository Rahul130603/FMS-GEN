import { useEffect, useState } from 'react';
import api from './api';
import { UserOption } from './types';
import { useAuth } from '../../context/AuthContext';

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  useEffect(() => {
    api.get('/users').then((r: any) => {
      if (Array.isArray(r?.data)) {
        setUsers(r.data);
      }
    }).catch(() => {});
  }, [user]);
  return users;
}
