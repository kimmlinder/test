import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Shield,
  Loader2,
  Search,
  Phone,
  Calendar,
} from 'lucide-react';

interface UserWithRole {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
  email?: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
      }

      toast({
        title: hasRole ? "Admin role removed" : "Admin role granted",
        description: "User roles updated successfully.",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.phone?.toLowerCase().includes(searchLower) ||
      u.id.toLowerCase().includes(searchLower)
    );
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/member" replace />;
  }

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight">
            Manage Users
          </h1>
        </div>
        <p className="text-muted-foreground font-body text-sm md:text-base">
          View and manage all registered user accounts ({users.length} total)
        </p>
      </motion.div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-xl font-medium mb-2">No users found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'No users have registered yet'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4"
        >
          {filteredUsers.map((u, index) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.03 }}
              className="bg-card border border-border rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-border">
                      <AvatarImage src={u.avatar_url || ''} alt={u.full_name || 'User'} />
                      <AvatarFallback className="text-sm md:text-lg bg-primary/10 text-primary">
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base md:text-lg font-medium">
                          {u.full_name || 'Unnamed User'}
                        </h3>
                        {u.roles.map(role => (
                          <span
                            key={role}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              role === 'admin' 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground font-mono">
                        ID: {u.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                    {u.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant={u.roles.includes('admin') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleAdminRole(u.id, u.roles.includes('admin'))}
                    disabled={u.id === user.id}
                    className="gap-2 shrink-0 w-full sm:w-auto"
                  >
                    <Shield className="h-4 w-4" />
                    {u.roles.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AdminLayout>
  );
}
