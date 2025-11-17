import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Users, UserPlus, Pencil, Trash2, Search } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  username: string;
  role: "Administrador" | "Vendedor";
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      fullName: "Juan Pérez",
      username: "jperez",
      role: "Administrador",
    },
    {
      id: "2",
      fullName: "María García",
      username: "mgarcia",
      role: "Vendedor",
    },
    {
      id: "3",
      fullName: "Carlos López",
      username: "clopez",
      role: "Vendedor",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "Vendedor" as "Administrador" | "Vendedor",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        username: user.username,
        password: "",
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        role: "Vendedor",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.username || (!editingUser && !formData.password)) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    const existingUser = users.find(
      (u) => u.username === formData.username && u.id !== editingUser?.id
    );

    if (existingUser) {
      toast({
        title: "Error",
        description: "Ya existe un usuario con ese nombre de usuario",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, fullName: formData.fullName, username: formData.username, role: formData.role }
            : u
        )
      );
      toast({
        title: "Usuario actualizado",
        description: `El usuario ${formData.fullName} ha sido actualizado correctamente`,
      });
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        fullName: formData.fullName,
        username: formData.username,
        role: formData.role,
      };
      setUsers([...users, newUser]);
      toast({
        title: "Usuario creado",
        description: `El usuario ${formData.fullName} ha sido creado correctamente`,
      });
    }

    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingUserId) {
      const user = users.find((u) => u.id === deletingUserId);
      setUsers(users.filter((u) => u.id !== deletingUserId));
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${user?.fullName} ha sido eliminado correctamente`,
      });
    }
    setDeleteDialogOpen(false);
    setDeletingUserId(null);
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted flex flex-col">
      <div className="flex flex-1">
        <Sidebar activeSection="administrar-usuarios" />
        
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="lg:ml-0 ml-14">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Administrar Usuarios</h1>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                  Gestiona los usuarios del sistema
                </p>
              </div>

              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => handleOpenDialog()} 
                    className="gap-2 h-11 px-6"
                  >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser
                        ? "Modifica los datos del usuario"
                        : "Complete los datos para crear un nuevo usuario"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre Completo *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          placeholder="Ej: Juan Pérez"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Usuario *</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                          }
                          placeholder="Ej: jperez"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Contraseña {editingUser ? "(dejar en blanco para mantener)" : "*"}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: "Administrador" | "Vendedor") =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                            <SelectItem value="Vendedor">Vendedor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full sm:w-auto">
                        {editingUser ? "Actualizar" : "Crear Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === "Administrador" ? "default" : "secondary"}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
              </div>

              <footer className="text-center text-sm text-muted-foreground py-6 mt-8">
                <p>© 2024 La Espiga - Sistema de Gestión de Inventario</p>
              </footer>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsers;
