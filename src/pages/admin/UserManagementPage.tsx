// src/pages/admin/UserManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UserRole, userRoles } from '@/components/auth/AuthContext'; // Assuming UserRole enum/type and userRoles array are defined here
import { User } from '@supabase/supabase-js';

// Define a more specific type for profile data we expect
interface Profile extends Record<string, any> {
  id: string;
  full_name?: string | null;
  email?: string | null; // Assuming email might be stored or joined from auth.users
  role: UserRole;
  status: 'pending_activation' | 'active' | 'disabled' | 'rejected';
  created_at: string;
  updated_at: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users from auth.users and join with profiles
      // Adjust the select query based on your actual Supabase schema and needs
      const { data, error: fetchError } = await supabase
        .from('profiles') // Assuming your profiles table is named 'profiles'
        .select(`
          id,
          full_name,
          role,
          status,
          created_at,
          updated_at,
          user:users (email) 
        `);

      if (fetchError) throw fetchError;

      // Transform data if necessary, e.g., to flatten the joined user email
      const transformedData = data?.map(p => ({
        ...p,
        email: (p.user as any)?.email || 'N/A', // Adjust based on actual structure
      })) || [];

      setUsers(transformedData as Profile[]); // Cast if confident in transformation
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('无法加载用户列表: ' + err.message);
      toast({ title: '错误', description: '加载用户列表失败。', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      toast({ title: '成功', description: '用户角色已更新。' });
      fetchUsers(); // Refresh users list
    } catch (err: any) {
      console.error('Error updating role:', err);
      toast({ title: '错误', description: `更新角色失败: ${err.message}`, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: Profile['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      toast({ title: '成功', description: '用户状态已更新。' });
      fetchUsers(); // Refresh users list
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({ title: '错误', description: `更新状态失败: ${err.message}`, variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-4">正在加载用户数据...</div>;
  if (error) return <div className="p-4 text-red-600">错误: {error}</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">用户管理</h1>
        {/* Add User button can be implemented later */}
        {/* <Button>添加用户</Button> */}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  没有找到用户。
                </TableCell>
              </TableRow>
            )}
            {users.map((userProfile) => (
              <TableRow key={userProfile.id}>
                <TableCell className="font-medium truncate max-w-xs">{userProfile.id}</TableCell>
                <TableCell>{userProfile.full_name || 'N/A'}</TableCell>
                <TableCell>{userProfile.email || 'N/A'}</TableCell>
                <TableCell>
                  <Select
                    value={userProfile.role}
                    onValueChange={(value) => handleRoleChange(userProfile.id, value as UserRole)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={userProfile.status}
                    onValueChange={(value) => handleStatusChange(userProfile.id, value as Profile['status'])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_activation">待激活</SelectItem>
                      <SelectItem value="active">已激活</SelectItem>
                      <SelectItem value="disabled">已禁用</SelectItem>
                      <SelectItem value="rejected">已拒绝</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(userProfile.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {/* Future actions like Edit Details, Delete User can be added here */}
                  {/* <Button variant="outline" size="sm" className="mr-2">编辑</Button> */}
                  {/* <Button variant="destructive" size="sm">删除</Button> */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagementPage;