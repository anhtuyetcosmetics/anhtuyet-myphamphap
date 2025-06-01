import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash, Shield, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserFormDialog } from './UserFormDialog';

interface Staff {
  id: string;
  email: string;
  ten_nhan_vien: string;
  username: string;
  role: string;
  created_at: string;
}

export const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Chỉ cho phép admin truy cập
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (user) {
      supabase
        .from('staff')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.role === 'admin');
        });
    }
  }, [user]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const { data } = await supabase
      .from('staff')
      .select('id, email, ten_nhan_vien, username, role, created_at')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleChangeRole = async (id: string, newRole: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('staff')
      .update({ role: newRole })
      .eq('id', id);
    setUpdating(null);
    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật role', variant: 'destructive' });
    } else {
      setUsers(users => users.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast({ title: 'Thành công', description: 'Đã cập nhật quyền user.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    setUpdating(id);
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    setUpdating(null);
    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa user', variant: 'destructive' });
    } else {
      setUsers(users => users.filter(u => u.id !== id));
      toast({ title: 'Thành công', description: 'Đã xóa user.' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Shield className="h-8 w-8 mr-2 text-yellow-500" />
        <span>Bạn không có quyền truy cập trang này.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem, phân quyền và xóa tài khoản nhân viên.</p>
        </div>
        <UserFormDialog mode="add" onSuccess={fetchUsers} currentUserId={user?.id} />
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.ten_nhan_vien}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        <span className={u.role === 'admin' ? 'text-red-600 font-bold' : ''}>{u.role}</span>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <UserFormDialog
                            mode="edit"
                            user={u}
                            onSuccess={fetchUsers}
                            currentUserId={user?.id}
                          />
                          {u.role === 'admin' ? (
                            <Button size="sm" variant="outline" disabled={updating === u.id} onClick={() => handleChangeRole(u.id, 'user')}>
                              {updating === u.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Bỏ admin'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={updating === u.id} onClick={() => handleChangeRole(u.id, 'admin')}>
                              {updating === u.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Set admin'}
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" disabled={updating === u.id} onClick={() => handleDelete(u.id)}>
                            {updating === u.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 