import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Pencil } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  ten_nhan_vien: z.string().min(2, 'Tên nhân viên phải có ít nhất 2 ký tự'),
  username: z.string().min(3, 'Username phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  mode: 'add' | 'edit';
  user?: {
    id: string;
    email: string;
    ten_nhan_vien: string;
    username: string;
  };
  onSuccess: () => void;
  currentUserId?: string;
}

export function UserFormDialog({ mode, user, onSuccess, currentUserId }: UserFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || '',
      ten_nhan_vien: user?.ten_nhan_vien || '',
      username: user?.username || '',
      password: '',
    },
  });

  const isSelfEdit = mode === 'edit' && user && currentUserId && user.id === currentUserId;

  React.useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        ten_nhan_vien: user.ten_nhan_vien,
        username: user.username,
        password: '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (mode === 'add') {
        // Check if username already exists
        const { data: existingUser } = await supabase
          .from('staff')
          .select('username')
          .eq('username', data.username)
          .single();

        if (existingUser) {
          toast({
            title: 'Lỗi',
            description: 'Username đã tồn tại',
            variant: 'destructive',
          });
          return;
        }

        // Create new user
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password!,
          options: {
            data: {
              ten_nhan_vien: data.ten_nhan_vien,
              username: data.username,
            },
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: 'Thành công',
          description: 'Đã tạo tài khoản mới',
        });
      } else {
        // Update existing user
        const { error: updateError } = await supabase
          .from('staff')
          .update({
            email: data.email,
            ten_nhan_vien: data.ten_nhan_vien,
            username: data.username,
          })
          .eq('id', user!.id);

        if (updateError) throw updateError;

        // Nếu là self-edit và có password, đổi mật khẩu
        if (isSelfEdit && data.password) {
          const { error: updatePasswordError } = await supabase.auth.updateUser({ password: data.password });
          if (updatePasswordError) throw updatePasswordError;
        }

        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin người dùng',
        });
      }

      setOpen(false);
      onSuccess();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'add' ? 'default' : 'outline'} size={mode === 'add' ? 'default' : 'sm'}>
          {mode === 'add' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Sửa
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Thêm người dùng mới' : 'Sửa thông tin người dùng'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Điền thông tin để tạo tài khoản mới'
              : 'Cập nhật thông tin người dùng'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ten_nhan_vien"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhân viên</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                (mode === 'add' || isSelfEdit) ? (
                  <FormItem>
                    <FormLabel>
                      {mode === 'add' ? 'Mật khẩu' : 'Mật khẩu mới (để trống nếu không muốn thay đổi)'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) : null
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Tạo tài khoản' : 'Cập nhật'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 