import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, Plan } from '@/context/AuthContext';
import { LogIn, LogOut, Crown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PlanBadge: React.FC<{ plan: Plan }> = ({ plan }) => {
  let colorClass = '';
  let text = '';
  let Icon = User;

  switch (plan) {
    case 'guest':
      colorClass = 'bg-gray-200 text-gray-800';
      text = 'Guest';
      Icon = User;
      break;
    case 'free':
      colorClass = 'bg-blue-100 text-blue-800';
      text = 'Free User';
      Icon = User;
      break;
    case 'paid':
      colorClass = 'bg-yellow-100 text-yellow-800';
      text = 'Paid Pro';
      Icon = Crown;
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      <Icon className="w-4 h-4 mr-1" />
      {text}
    </span>
  );
};

const Header: React.FC = () => {
  const { user, plan, signIn, signOut, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <header className="border-b bg-background sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-3xl font-extrabold text-primary">qrush</h1>
        
        <div className="flex items-center space-x-4">
          {user && <PlanBadge plan={plan} />}

          {!user ? (
            <Button variant="default" onClick={signIn} className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90">
              <LogIn className="w-4 h-4 mr-2" /> Sign In / Up
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center border-input bg-background hover:bg-accent hover:text-accent-foreground">
                  <User className="w-4 h-4 mr-2" /> {user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;