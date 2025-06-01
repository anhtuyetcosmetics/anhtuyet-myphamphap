import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  ten_nhan_vien: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  username: z.string().min(3, 'Username phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [initial, setInitial] = React.useState<{ ten_nhan_vien: string; username: string } | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ten_nhan_vien: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      supabase
        .from('staff')
        .select('ten_nhan_vien, username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setInitial({ ten_nhan_vien: data.ten_nhan_vien, username: data.username });
            form.reset({
              ten_nhan_vien: data.ten_nhan_vien,
              username: data.username,
              password: '',
              confirmPassword: '',
            });
          }
        });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      // Update staff info
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          ten_nhan_vien: data.ten_nhan_vien,
          username: data.username,
        })
        .eq('id', user!.id);
      if (updateError) throw updateError;

      // Update password if provided
      if (data.password) {
        const { error: passError } = await supabase.auth.updateUser({ password: data.password });
        if (passError) throw passError;
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin cá nhân',
      });
      form.reset({
        ten_nhan_vien: data.ten_nhan_vien,
        username: data.username,
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !initial) return null;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Hồ sơ cá nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Tên nhân viên</label>
            <Input {...form.register('ten_nhan_vien')} />
            {form.formState.errors.ten_nhan_vien && (
              <p className="text-sm text-red-500">{form.formState.errors.ten_nhan_vien.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Username</label>
            <Input {...form.register('username')} />
            {form.formState.errors.username && (
              <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Mật khẩu mới</label>
            <Input type="password" {...form.register('password')} autoComplete="new-password" />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">Xác nhận mật khẩu mới</label>
            <Input type="password" {...form.register('confirmPassword')} autoComplete="new-password" />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cập nhật'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 